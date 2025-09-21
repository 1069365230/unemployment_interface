<template>
  <div class="vis-component" ref="chart">
    <br>

    <div class="content-wrapper">
      
      
      <div class="setting-box">
        <div class="bin-checkboxes">
          <b>Detail Level:</b>
          <div>
            <input type="radio" id="bin1" value="10" name="bins" checked>
            <label for="bin1">High</label>
          </div>

          <div>
            <input type="radio" id="bin2" value="30" name="bins">
            <label for="bin2">Medium</label>
          </div>

          <div>
            <input type="radio" id="bin3" value="50" name="bins">
            <label for="bin3">Low</label>
          </div>
          
          
        </div>

        <div class="toggle-container">

          <div class="dropdown-wrapper">
            <label for="yearDropdown">Select Year:</label>
            <select id="yearDropdown" class="styled-select">
              <option value="2013">2013</option>
              <option value="2014">2014</option>
              <option value="2015">2015</option>
              <option value="2016">2016</option>
              <option value="2017">2017</option>
              <option value="2018">2018</option>
              <option value="2019">2019</option>
              <option value="2020">2020</option>
              <option value="2021">2021</option>
              <option value="2022">2022</option>
            </select>
          </div>
          
          <button id="overlayToggle" class="toggle-btn">Current Overlay: OFF</button>
          <br>
          
          <div class="legend">
            <div class="legend-item">
              <span class="legend-color" style="background-color: #7f7b75;"></span>
              <span class="legend-label">BaseData</span>
            </div>
            
            <div class="legend-item">
              <span class="legend-color" style="background-color: red;"></span>
              <span class="legend-label">Average</span>
            </div>

            <div class="legend-item">
              <span class="legend-color" style="background-color: #2d427194;"></span>
              <span class="legend-label">Overlay</span>
            </div>

            
          </div>
        
        </div>
        

        <svg id="main-svg" :width="2110" :height="550">
            <g class="chart-group" ref="chartGroup">
            <g class="axis axis-x" ref="axisX"></g>
            <g class="axis axis-y" ref="axisY"></g>
            <g class="bars-group" ref="barsGroup"></g>
            </g>
        
        </svg>
      </div>
        

        

    </div>

  </div>
</template>

<script>

import * as d3 from 'd3';
import {normalize} from './d3ComponentUltils';
import dragIcon from '@/assets/icon/drag_indicator.svg';

export default {
  name: 'FlexBar',
  props: {
  },
  data() {
    return {
      numberOfCharts: 0, 
      totalChartWidth: 0,
      chartWidth: 0, 
      chartHeight: 0,
      
      translateY: 40,
      svgWidth: 0,
      svgHeight: 500,
      svgPadding: {
        top: 25, right: 20, bottom: 30, left: 40,
      },
      ypadding: 60,
      canvas: null,

      originalColors: {},
      selectedGroups: {},
      paddingBetweenCharts: 20,
      initialBins: 10,
      overlayEnabled: false,
    }
  },
  mounted() {
    this.drawChart(); 
  },
  methods: {
    sizeSetup() {
      if (this.$refs.chart) this.svgWidth = this.$refs.chart.clientWidth;
      console.log("client", this.$refs.chart.clientWidth)
      this.chartWidth = this.$refs.chart.clientWidth + 200;
      this.chartHeight = this.svgHeight - this.svgPadding.top - this.svgPadding.bottom;

      
      d3.select(this.$refs.chartGroup)
        .attr('transform', `translate(${this.svgPadding.left},${this.svgPadding.top})`);

      //tooltip is for the mouse over 
      this.canvas = d3.select("#main-svg");
      this.canvas.append("g")
        .attr("class", "tooltip-layer");

    },
    drawChart() {

      this.sizeSetup();

      this.clearChart();

      let startYear = this.selectedYearRange.startYear;
      let endYear = this.selectedYearRange.endYear;

      let selectedRange = Object.keys(this.datasets)
        .filter(year => +year >= startYear && +year <= endYear)
        .reduce((result, year) => {
        
          result[year] = this.datasets[year];
          return result;
        }, {});
        
      // var overlaydata = this.amsScore2022;
      const selectedYear = d3.select("#yearDropdown").property("value");
      const selectedDataset = this.datasets[selectedYear];

      let lastPos = this.drawBars(selectedRange, selectedDataset);
      
      this.handleOverlay(lastPos);
      this.listeningBinChange(selectedRange, selectedDataset);
      this.drawLabels();
      this.enableDrag();
      
    },
    clearChart() {
      //reset bins
      d3.select('#bin1').property('checked', true);

      d3.select(".axislables").remove();
      d3.select(".background").remove();
      //reset charts
      d3.select(this.$refs.barsGroup).selectAll("*").remove();
    },
    drawLabels(){
      //clear out old lables
      d3.selectAll(".axislables").remove();

      //need to clear with all classes
      this.canvas.append("text")
        .attr("class", "axislables")
        .attr("x", 0)
        .attr("y", 25)
        .attr("font-size", "18px")
        .text("Number");

      this.canvas.append("text")
        .attr("class", "axislables")
        .attr("x", 0)
        .attr("y", 45)
        .attr("font-size", "18px")
        .text("of Individuals");

      this.canvas.append("text")
        .attr("class", "axislables")
        .attr("x", this.totalChartWidth)
        .attr("y", 550)
        .attr("font-size", "18px")
        .text("Score");
    },
    enableDrag(){
        const chartWidth = this.chartWidth / this.numberOfCharts;
        
        const drag = d3.drag()
        .on('drag', (event) => {
            const dx = event.dx;
            let transform = d3.select('.overlay').attr('transform');
            let translateX = 0;

            if (transform) {
                const translateMatch = transform.match(/translate\(([^,]+),([^)]+)\)/);
                
                if (translateMatch) {
                    translateX = parseFloat(translateMatch[1]) + dx;
                }
            }

            //console.log("current", translateMatch)
            
            d3.select('.overlay')
                .attr('transform', `translate(${translateX},0)`);
        })
        .on('end', () => {
            
            let transform = d3.select('.overlay').attr('transform');
            var currentx = 0;
            if(transform){
                const translateMatch = transform.match(/translate\(([^,]+),([^)]+)\)/);
                if (translateMatch) {
                    currentx = parseFloat(translateMatch[1]);
                }
                
            }
            
            const snaptolerance = chartWidth / 2;
            let block = -chartWidth - 20;

            for (let i = 0; i< this.numberOfCharts - 1; i++) {
                if(Math.abs(currentx) >= i * Math.abs(block) + snaptolerance) {
                    d3.select('.overlay').transition().duration(500).attr('transform', `translate(${(i+1) * block}, 0)`);
                    
                }
            }
            
           
            if (Math.abs(currentx) < snaptolerance) {
                d3.select('.overlay').transition().duration(500).attr('transform', `translate(0, 0)`);
            } 
  

        });

        this.canvas.call(drag);
    },
    drawHistogram({ binnum, data, xpos, classname, color, opacity, overlaydata, barsGroup}){
            let opacityLine = 1;
            //changed here
            const x = d3.scaleLinear()
                .domain([0, 100])
                .range([0, this.chartWidth / this.numberOfCharts]);

            const histogram = d3.histogram()
                .value(d => d.value )
                .domain(x.domain())
                .thresholds(x.ticks(binnum));

            var bins = histogram(data);

            //this here updates the bin for overlay
            if(overlaydata && !data){
                bins = histogram(overlaydata);
                opacityLine = 0.3;
            }
            
            const yQuantity = d3.scaleLinear()
                .range([this.chartHeight, 0])
                .domain([0, 130]);

            const totalCount = d3.sum(bins, d => d.length);

            if(d3.select("."+classname).empty()){
                barsGroup.append("g").attr("class", classname); 
            }

            // Clear any existing bars and axes before drawing new ones
            let bargroup = d3.select("."+classname);
            bargroup.selectAll("*").remove();

            // Draw the x-axis
            bargroup.append("g")
                .attr("transform", `translate(${xpos},${this.chartHeight + this.translateY})`)
                .call(d3.axisBottom(x).tickFormat(d => d))
                .selectAll("text") 
                .style("font-size", "12px");

            // Draw the y-axis
            let yAxis = d3.selectAll(".yaxis");
            if (yAxis.empty()) {
                yAxis = bargroup.append("g")
                  .attr("transform", `translate(${0},${this.translateY})`)  
                  .attr("class", "yaxis");
            }
            // Draw the grid here
            yAxis.call(
              d3.axisLeft(yQuantity)
              .tickSize(-this.totalChartWidth) // Set this to the inner width of your chart
              .tickFormat(d => d)     // Keep default formatting or customize as needed
            )
            .selectAll(".tick")
            .each(function(d) {
              if (d === 0) {
                 d3.select(this).select("line").attr("stroke", "#f2f2f2");
              }
              else{
                d3.select(this).select("line").attr("stroke", "#c4c2b5");
              }
            });
            bins.forEach((d, i) => { d.binIndex = i });
            
            // Draw the bars
            bargroup
                .selectAll("rect")
                .data(bins)
                .enter()
                .append("rect")
                .attr("class", (d, i) => `bin-group bin-${i}`)
                .attr("x", xpos)
                .attr("transform", d => `translate(${x(d.x0)},${yQuantity(d.length) + this.translateY})`)
                .attr("width", d => x(d.x1) - x(d.x0) - 1)
                .attr("height", d => this.chartHeight - yQuantity(d.length))
                .style("fill", color)
                .style("opacity", opacity)
                .on("mouseenter", function(event, d) {
                  const hoveredBinIndex = d.binIndex;

                  //highlighting here
                  d3.selectAll(`.bin-group`)
                    .style("fill", function(binD) {
                      return binD.binIndex === d.binIndex ? color : "#d3d3d3";
                    });
                  let tooltipLayer = d3.select(".tooltip-layer")

                  let tooltipGroup = tooltipLayer.select(".tooltip-group");
                  if (tooltipGroup.empty()) {
                    tooltipLayer.append("g").attr("class", "tooltip-group");
                  }

                  d3.selectAll(".bin-group")
                    .each(function(binData) {
                      if (binData.binIndex === hoveredBinIndex) {
                        const binWidth = x(binData.x1) - x(binData.x0);
                        const parent = d3.select(this.parentNode); // This is the .group-[year]
                        const chartX = +d3.select(this).attr("x") || 0;
                        const barX = x(binData.x0);
                        //translateY = 40
                        const barY = yQuantity(binData.length) + 40; // or yPercentage if scale is switched
                        const chartY = +d3.select(this).attr("y") || 0;

                        // has to increasing padding because the smaller the bars, it flickers
                        const posX = chartX + barX + 2 * binWidth + 23;
                        const posY = chartY + barY + 30;
                        
                        //tooltip text
                        const textEl = tooltipGroup.append("text")
                          .attr("x", posX)
                          .attr("y", posY) 
                          .attr("text-anchor", "start") //could be center aligned: middle
                          .attr("font-size", "12.5px")
                          .attr("font-weight", "bold")
                          .attr("fill", "#0C1232");

                        const count = binData.length;
                        const rangeStart = (binData.x0 * 100).toFixed(0); 
                        const rangeEnd = (binData.x1 * 100).toFixed(0);

                        // First line: Count
                        textEl.append("tspan")
                          .attr("x", posX)
                          .attr("dy", "0em")
                          .text(`Count: ${count}`);

                        // Second line: Range
                        textEl.append("tspan")
                          .attr("x", posX)
                          .attr("dy", "1.2em")
                          .text(`From: ${rangeStart} to ${rangeEnd}`);

                        textEl.append("tspan")
                          .attr("x", posX)
                          .attr("dy", "1.2em")
                          .text(`Percentage: ${(count/totalCount * 100).toFixed(2)}%`);

                        textEl.append("tspan")
                          .attr("x", posX)
                          .attr("dy", "1.2em")
                          .text(`(People in Total: ${totalCount})`);


                        const bbox = textEl.node().getBBox();

                        tooltipGroup.insert("rect", "text")
                          .attr("x", bbox.x)
                          .attr("y", bbox.y - 2)
                          .attr("width", bbox.width + 8)
                          .attr("height", bbox.height + 6)
                          .attr("rx", 3)
                          .attr("ry", 4)
                          .attr("fill", "#d3d3d3")
                          .attr("stroke", "white")
                          .attr("stroke-width", 0.5)
                          .attr("opacity", 0.9)
                          .attr("class", "tooltipbox");

                        parent.select(".tooltipbox").raise();
                      }
                    });
                })
                .on("mouseout", function() {
                  d3.selectAll(`.bin-group`).style("fill", color);

                  d3.selectAll(".tooltip-group").selectAll("text").remove();
                  
                  d3.selectAll(".tooltipbox").remove();
                });

                //this is shit code 
                if(overlaydata && !data){
                  d3.selectAll(".bin-group")
                    .on("mouseenter", null)
                    .on("mouseout", null);
                }

                const dataset = data || overlaydata;
                const avgScore = d3.mean(dataset, d => d.value);
                
                // Draw vertical red line for average score
                bargroup.append("line")
                    .attr("x1", xpos + x(avgScore))
                    .attr("x2", xpos + x(avgScore))
                    .attr("y1", this.translateY)
                    .attr("y2", this.chartHeight + this.translateY)
                    .attr("stroke-opacity", opacityLine)
                    .attr("stroke", "red")
                    .attr("stroke-width", 2)
                    .attr("class", "average-line");

                   // Draw label for average score at the top of the red line
                bargroup.append("text")
                    .attr("x", xpos + x(avgScore))
                    .attr("y", this.translateY - 5) // Position slightly above the top of the chart
                    .attr("text-anchor", "middle")
                    .attr("font-size", "15px")
                    .attr("font-weight", "bold")
                    .attr("fill", "red")
                    .text(`${(avgScore).toFixed(2)}`)
                    .attr("class", "average-label");
    },
    drawBars(datasets, overlaydata) {
        const selectedBin = d3.select('.bin-checkboxes input[type="radio"]:checked').property('value');
        let binCount = +selectedBin;

        this.numberOfCharts = Object.entries(datasets).length + 1;

        // const chartWidth = this.svgWidth - this.svgPadding.left - this.svgPadding.right;
        this.totalChartWidth = (this.chartWidth / this.numberOfCharts) * Object.keys(datasets).length 
                      + (Object.keys(datasets).length - 1) * this.paddingBetweenCharts;
        
        //initialization
        let chartpos = 0;

        for (let [year, data] of Object.entries(datasets)) {
            this.drawHistogram({
              binnum: binCount,
              data,
              xpos: chartpos,
              classname: "group-" + year,
              color: "#7f7b75",
              opacity: 1,
              overlaydata,
              barsGroup: d3.select(this.$refs.barsGroup),
            });

            d3.select(".group-" + year)
              .append("text")
              .attr("x", chartpos + this.chartWidth / this.numberOfCharts / 2 - 4)
              .attr("y", 19)
              .text(year)
              .attr("font-size", "17px");

            chartpos = chartpos + this.chartWidth / this.numberOfCharts + this.paddingBetweenCharts;
        }
        return chartpos;
    },
    listeningBinChange(datasets, overlaydata){
      //updating with bin numbers
        d3.selectAll('.bin-checkboxes input[type="radio"]').on('change', () => {
          const selectedBin = d3.select('.bin-checkboxes input[type="radio"]:checked').property('value');
          let binCount = +selectedBin;

          //redrawn here (after udating the bins): 
            let chartpos = 0;
            for (let [year, data] of Object.entries(datasets)) {
              this.drawHistogram({
                binnum: binCount,
                data,
                xpos: chartpos,
                classname: "group-" + year,
                color: "#7f7b75",
                opacity: 1,
                overlaydata,
                barsGroup: d3.select(this.$refs.barsGroup),
            });

            d3.select(".group-" + year)
            .append("text")
            .attr("x", chartpos + this.chartWidth / this.numberOfCharts / 2 - 4)
            .attr("y", 19)
            .text(year)
            .attr("font-size", "17px");

            chartpos = chartpos + this.chartWidth / this.numberOfCharts + this.paddingBetweenCharts;
          }

          // this.drawOverlay(binCount, chartpos, overlaydata)
        })
      
    },
    drawOverlay(bincount, lastPos, overlaydata) {
        const selectedYear = d3.select("#yearDropdown").property("value");

      //draw the overlay data here
        this.drawHistogram({
          binnum: bincount,
          data: false,
          xpos: lastPos - this.chartWidth/this.numberOfCharts - this.paddingBetweenCharts,
          classname: "overlay",
          color: "#2d4371",
          opacity: 0.3,
          overlaydata,
          barsGroup: d3.select(this.$refs.barsGroup),  
        });

        d3.select(".overlay")
          .append("rect")
          .attr("x", lastPos - this.chartWidth/this.numberOfCharts- 20)
          .attr("y", -30)
          .attr("width", this.chartWidth/this.numberOfCharts)
          .attr("height", this.chartHeight + 70)
          .attr("fill", "transparent");

        d3.select(".overlay").append("image")
          .attr("href", dragIcon)
          .attr("x", lastPos - this.chartWidth/this.numberOfCharts/2 - this.paddingBetweenCharts - 55)
          .attr("y", -26)
          .attr("width", 24)
          .attr("height", 24);

        // overlay text need?
        d3.select(".overlay").append("text")
          .attr("x", lastPos - this.chartWidth/this.numberOfCharts/2 - this.paddingBetweenCharts - 4)
          .attr("y", 3)
          .attr("fill", "#004aad")
          .text(selectedYear)
          .attr("font-size", "18px");
            
        d3.select(".overlay").append("text")
          .attr("x", lastPos - this.chartWidth/this.numberOfCharts/2 - this.paddingBetweenCharts - 33)
          .attr("y", -13)
          .attr("fill", "#004aad")
          .text("Overlay Year")
          .attr("font-size", "15px");

    },
    handleOverlay(lastPos) {
      
      let self = this;  
      d3.select("#overlayToggle").on("click", ()=> {

        const selectedYear = d3.select("#yearDropdown").property("value");
        const selectedDataset = this.datasets[selectedYear];

        let startYear = this.selectedYearRange.startYear;
        let endYear = this.selectedYearRange.endYear;

        let selectedRange = Object.keys(this.datasets)
          .filter(year => +year >= startYear && +year <= endYear)
          .reduce((result, year) => {
          
            result[year] = this.datasets[year];
            return result;
          }, {});

        const selectedBin = d3.select('.bin-checkboxes input[type="radio"]:checked').property('value');
        // console.log("clicked?")
        // console.log(selectedYear)
        let binCount = +selectedBin;
        this.overlayEnabled = !this.overlayEnabled;
        const button = d3.select("#overlayToggle");
        
        button.text(this.overlayEnabled ? "Current Overlay: ON" : "Current Overlay: OFF");

        if (this.overlayEnabled) {
          button.classed("active", true);

          // Remove mouse events
          d3.selectAll(".bin-group")
            .on("mouseenter", null)
            .on("mouseout", null);
          // Clear tooltips if still visible
          d3.selectAll(".tooltip-group").selectAll("*").remove();
          d3.selectAll(".tooltipbox").remove();

          // turnon the color 
          // button.classed("active", true);
          // Draw overlay
          //problem here
          self.drawOverlay(binCount, lastPos, selectedDataset);
        } else {
          // Rebind mouse events
          console.log("rebind")
          self.drawBars(selectedRange, selectedDataset);
          d3.selectAll(".overlay").remove();
          
          button.classed("active", false);
        }
      });
    },
    handleBarClick(val) {
      this.$store.commit('changeSelectedState', val);
    }
  },
  computed: {
    datasets() {
    const years = ['2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022'];
    return years.reduce((acc, year) => ({
      ...acc,
      [year]: normalize(this.$store.getters.amsScoreByYear(year))
    }), {});
    },
    selectedYearRange() {
      return this.$store.getters.selectedYearRange;
    },
    amsScore:{
      get() {
        return this.$store.getters.amsScore;
      }
    },
    fullFeature:{
      get() {
        return this.$store.getters.fullFeature;
      }
    },
    personaleIncome: {
      get() {
        return this.$store.getters.personaleIncome;
      }
    },
    amsScore2013() {
      return this.$store.getters.amsScoreByYear("2013");
    },
    amsScore2014() {
      return this.$store.getters.amsScoreByYear("2014");
    },
    amsScore2015() {
      return this.$store.getters.amsScoreByYear("2015");
    },
    amsScore2016() {
      return this.$store.getters.amsScoreByYear("2016");
    },
    amsScore2017() {
      return this.$store.getters.amsScoreByYear("2017");
    },
    amsScore2018() {
      return this.$store.getters.amsScoreByYear("2018");
    },
    amsScore2019() {
      return this.$store.getters.amsScoreByYear("2019");
    },
    amsScore2020() {
      return this.$store.getters.amsScoreByYear("2020");
    },
    amsScore2021() {
      return this.$store.getters.amsScoreByYear("2021");
    },
    amsScore2022() {
      return this.$store.getters.amsScoreByYear("2022");
    },
  },
  watch: {
    
    selectedYearRange: {
      handler() {
        this.drawChart();
      },
      deep: true,
    },
  },
}
</script>

<style>
.overlay {
  cursor: grab;
}
.overlay:active {
  cursor: grabbing;
}


.vis-component {
  display: flex;
}

.bar:hover {
  fill: lightblue;
}


label {
  text-align: left; 
  display: inline-block; 
}

.setting-box {
  width: 2110px; 
  background-color: #f2f2f2; 
  padding: 10px 15px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* Align all children to the left */
  gap: 10px; /* Optional: adds spacing between elements */
  padding: 10px;
}

.checkbox-container {
  display: flex; 
  align-items: flex-start;
}

.checkbox-container label {
  margin-top: 10px;
  line-height: 1.2;
  margin-left: 3px; /* Space between checkbox and label */
}


.radio_button {
  margin-top: 3.5px;
  margin-right: 9px; 
}

.category_label {
  display: block;
  font-weight: bold;
  text-align: left; 
  text-transform: capitalize;
}

.content-wrapper{
  display: flex;
  flex-direction: column;
}

.bin-checkboxes {
  display: flex;
  align-items: center; /* Vertically align checkboxes and labels */
  gap: 30px; /* Add some space between each checkbox */
}

.toggle-container {
  display: flex;
  align-items: center; /* Vertically align checkboxes and labels */
  gap: 30px; /* Add some space between each checkbox */
}

.bin-checkboxes input[type="radio"] {
  display: none; /* Hide the default radio button */
}

.bin-checkboxes label {
  position: relative;
  padding-top: 9px;
  padding-left: 30px; /* Space for the custom checkbox */
  cursor: pointer;
  user-select: none; /* Prevent text selection on label click */
}

.bin-checkboxes label::before {
  content: '';
  position: absolute;
  left: 0;
  top: 60%;
  transform: translateY(-50%);
  width: 20px; /* Size of the custom checkbox */
  height: 20px;
  border: 2px solid #7f7b75; /* Border color */
  background-color: #fff; /* Background color */
  border-radius: 4px; /* Rounded corners */
}

.bin-checkboxes input[type="radio"]:checked + label::before {
  content: '✔'; /* Checkmark character */
  color: white; /* Checkmark color */
  background-color: #7f7b75; /* Background color when checked */
  text-align: center;
  line-height: 20px; /* Center the checkmark */
  font-size: 18px; /* Size of the checkmark */
}

#overlayToggle {
  position: relative;
  z-index: 1;
  width: 60%;
  padding-left: 10px; 
  padding-right: 10px; 
  height: 30px; /* Adjust the height if necessary */
  font-size: 14px; /* Adjust font size if needed */
  border-radius: 5px; 
  background-color: #c4c2b5; 
  color: #ffffff !important;
  border: none;
  font-weight: bold;
  overflow: hidden; /* Keep overlay inside button */
  transition: background-color 0.3s ease;
}

#overlayToggle::after {
  content: "";
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(45, 67, 113, 0.3); /* Or any overlay color */
  transform: translateY(-100%);
  transition: transform 0.3s ease;
  pointer-events: none; /* Keep button clickable */
  z-index: 2;
}


#overlayToggle:hover::after {
  transform: translateY(0%);
}

.toggle-btn:hover {
  background-color: #2d427194 !important;
}

button.toggle-btn.active {
  background-color: #2d427194 !important;
  color: #e0e4f1 !important;
}

#overlayToggle.active:hover {
  transform: translateY(0%);
}

#overlayToggle.active::after {
  transform: translateY(0%);
}


.toggle-btn.active:hover {
  transform: translateY(0%);
  /* background-color: #2d4371 !important; */
}

.dropdown-wrapper {
  display: flex;
  font-family: Arial, sans-serif;
  margin: 10px 0;
}

.dropdown-wrapper label {
  min-width: 120px;
  margin-right: 30px;
}

label {
  margin-right: 8px;
  font-weight: bold;
  color: #0C1232;
  white-space: nowrap;
}

.styled-select {
  padding: 6px 12px;
  font-size: 14px;
  min-width: 80px; 
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #f9f9f9;
  color: #333;
  appearance: none; /* Removes native dropdown styling in most browsers */
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='5'%3E%3Cpath fill='%23666' d='M0 0l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 10px 5px;
  cursor: pointer;
}

.styled-select:focus {
  border-color: #6666ff;
  outline: none;
  background-color: #fff;
}

#legend {
  font-family: Arial, sans-serif;
  font-size: 12px;
  margin: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 2px;
  margin-right: 8px;
  display: inline-block;
}

.legend-label {
  color: #333;
}

</style>
