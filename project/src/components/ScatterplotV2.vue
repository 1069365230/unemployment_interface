<template>
  <div class="vis-component" ref="chart">
    <br>
    <div class="content-wrapper">
      
      <div class="sidebar">
        <div class="legende_filter">
          <div v-for="(options, category) in filterOptions" :key="category">
            <label class="category_label">{{ category }}</label>
              <div v-for="option in options" :key="option" class="checkbox-container">
                <input 
                type="checkbox" 
                :name="category" 
                :value="category+option" 
                class="radio_button" 
                :checked="isSelected(category, option)" 
                @click="toggleSelection(category, option)"/>

                <label :for="option" >{{ option }}</label>
              </div>
          </div>
      </div>
        
    </div>

    
      <div class="scatter-wrapper">
            <svg id="main-svg" :width="svgWidth" :height="svgHeight">
                <g class="chart-group" ref="chartGroup">
                <g class="axis axis-x" ref="axisX"></g>

                <g class="axis axis-y" ref="axisY"></g>
                <g ref="axisYMe"></g>
                <g ref="axisYPDM1"></g>
                <g ref="axisYPDM2"></g>

                <g class="bars-group-2" ref="barsGroup"></g>
                </g>
            </svg>

            <button
                :class="['toggle-switch-btn', { active: currentMode === 'density' }]"
                @click="toggleDensity"
                >
                {{ currentMode === 'density' ? 'Density: ON' : 'Density: OFF' }}
            </button>
        </div>

        <div class="bar-wrapper">
            <svg id="second-svg" :width=800 :height="svgHeight">

            </svg>
        </div>

      
      </div>
    </div>

</template>

<script>

import * as d3 from 'd3';
import { fillPidsPerCategory, findcommonpids, linkProfileCard, normalize, computeDensityPositions} from './d3ComponentUltils';
// import { profile } from 'console';

export default {
  name: 'BarChart',
  props: {
  },
  data() {
    return {
      svgWidth: 0,
      svgHeight: 800,
      chartWidth: 0,
      svgPadding: {
        top: 0, right: 20, bottom: 30, left: 40,
      },
      ypadding: 60,
      originalColors: {},
      originalColors_1: {},
      originalColors_2: {},
      profile: {
        pid: "",
        gender: "",
        citizenship: "",
        age: "",
        skill: "",
        impairment: "",
        occupation: "",
        dutycare: "",
        pool: 0,
      },
      filterOptions: {
        gender: ['male', 'female'],
        dutycare: ['Yes', 'No'],
        age: ['15-29', '30-44', '45-59', '60-74', '75-100'],
        skill: ['not stated', 'Compulsory', 'Apprenticeship', 'high school', 'university'],
        impairment: ['Yes', 'No'],
        citizenship: ['AT', 'EU', 'Non-EU'],
        occupation: ['agriculture', 'production', 'service', 'other'],
        
      },
      selectedGroups: {
        gender: [],
        citizenship: [],
        age: [],
        skill: [],
        impairment: [],
        occupation: [],
        dutycare: [],
      },
      currentMode: "default",
      shouldAnimate: false,
      filterbuttonClick: false,
      densityMode: false,
      selectedDots: [],
      normalizedDetailedScore: [],
      individualScore: 0,
      features: [
        { id: "feature_zero", value: 0, name: "Gender"},
        { id: "feature_one", value: 0, name: "Citizenship"},
        { id: "feature_two", value: 0, name: "Age"},
        { id: "feature_three", value: 0, name: "Education Lvl."},
        { id: "feature_four", value: 0, name: "Impairment"},
        { id: "feature_five", value: 0, name: "Occupation"},
        { id: "feature_six", value: 0, name: "Dutycare"}
      ],
    }
  },
  mounted() {
    this.drawChart(); 
  },
  methods: {
    isSelected(category, option) {
      // return this.selectedGroups[category] === option;
      return this.selectedGroups[category]?.includes(option);
    },    
    toggleSelection(category, option) {
      if (!Array.isArray(this.selectedGroups[category])) {
        // Initialize as an empty array if not already
        this.$set(this.selectedGroups, category, []);
      }

      const index = this.selectedGroups[category].indexOf(option);

      if (index > -1) {
        // Deselect: remove option from array
        this.selectedGroups[category].splice(index, 1);
      } else {
        // Select: add option to array
        this.selectedGroups[category].push(option);
      }

      this.filterbuttonClick = true;
      this.filteredDotsRedraw();
    },
    toggleDensity() {
        this.currentMode = this.currentMode === 'default' ? 'density' : 'default';
        this.filterbuttonClick = false;
        this.shouldAnimate = true; 
        
        this.filteredDotsRedraw();  // Redraw with the new mode
        
    },
    filteredDotsRedraw(){
        //remove warning messages
        d3.select(".warning").remove();
        d3.select(".warning_1").remove();
        d3.select(".warning_2").remove();

        const datasets = [this.fullFeature, this.fullFeature_pdm1, this.fullFeature_pdm2];
        
        let allpdms = fillPidsPerCategory(datasets, this.filterOptions, this.selectedGroups);
        
        //find intersection between all the lists for all different pdms
        let intersection_me = findcommonpids(Object.values(allpdms[0]));
        let intersection_1 = findcommonpids(Object.values(allpdms[1]));
        let intersection_2 = findcommonpids(Object.values(allpdms[2]));
        
        let filteredDataArray = [];
        const config = [
            { name: "Me", data: normalize(this.amsScore), intersection: intersection_me, warningClass: "warning" },
            { name: "PDM1", data: normalize(this.amsScore_1), intersection: intersection_1, warningClass: "warning_1" },
            { name: "PDM2", data: normalize(this.amsScore_2), intersection: intersection_2, warningClass: "warning_2" },
        ];

        config.forEach(({ name, data, intersection, warningClass }) => {
            //need to convert to string, intersection & data have different pid type
            const filteredData = data.filter(d => intersection.map(String).includes(d.pid));
            filteredDataArray.push(filteredData);

            if (intersection.length === 0) {
              const barsGroup = d3.select(this.$refs.barsGroup);

              barsGroup
                .append("text")
                .attr("class", warningClass)
                .attr("x", this.xScale(name) + this.xScale.bandwidth() / 2 - 60)
                .attr("y", 23)
                .attr("fill", "orange")
                .text("(Note: no user found)");
            }
        });
        //redrawfiltered data
        this.drawScatterPlot(filteredDataArray[0], filteredDataArray[1], filteredDataArray[2], this.currentMode)
    },
    sizeSetup() {
      if (this.$refs.chart) {
        this.svgWidth = (this.$refs.chart.clientWidth * 0.8);
        this.chartWidth = this.svgWidth - this.svgPadding.left - this.svgPadding.right;
      }

      d3.select(this.$refs.chartGroup).attr('transform', `translate(${this.svgPadding.left},${this.svgPadding.top})`);
    },
    reset() {
      this.shouldAnimate = false;
      this.filterbuttonClick = false;
      this.currentMode = 'default';

      this.selectedGroups = {
        gender: "",
        citizenship: "",
        age: "",
        skill: "",
        impairment: "",
        occupation: "",
        dutycare: "",
      };
    },
    drawChart() {
      this.sizeSetup();
      this.reset();

      this.drawXAxis();
      this.drawYAxis();
      
      this.createNoise();
      this.drawScatterPlot(normalize(this.amsScore), normalize(this.amsScore_1), normalize(this.amsScore_2));
      this.drawBars();
        
    },
    createNoise(){
      
      // const elderlydPids = this.fullFeature_pdm2
      //   .filter(item => item.value[2] > 60)
      //   .map(item => item.pid);


      if(this.amsScore_2[0].year === '2017'){
        
        this.amsScore_2.forEach(item => {
          item.value += 1;
          // if(elderlydPids.includes(item.pid)){
          //   item.value += 1;
          // }
        });
      } 
    },
    drawXAxis() {
      d3.select(this.$refs.axisX)
        .attr('transform', `translate( 0, ${this.svgHeight - this.svgPadding.top - this.svgPadding.bottom} )`)
        .call(d3.axisBottom(this.xScale))
        .selectAll('text')
        .style("font-size", "18px")
        .attr('y', 0)
        .attr('x', 12)
        .attr('dy', '.80em')
        .attr('transform', 'translate(12, 12)')
        .style('text-anchor', 'end');

      d3.select(this.$refs.axisX)
        .selectAll('text')
        .filter(function(d) { return d === "Me"; })
        .style("text-decoration", "underline")
        .style("font-weight", "bold"); 

    },
    drawYAxis() {
        //have to draw 3 axis 
        const axisConfigs = [
            { key: "Me", ref: this.$refs.axisYMe, class: "yaxisMe" },
            { key: "PDM1", ref: this.$refs.axisYPDM1, class: "yaxisPDM1" },
            { key: "PDM2", ref: this.$refs.axisYPDM2, class: "yaxisPDM2" }
        ];

        axisConfigs.forEach(({ key, ref, class: className }) => {
            const xPos = this.xScale(key) + this.xScale.bandwidth() / 2;
            
            d3.select(ref)
            .attr("class", className)
            .attr("transform", `translate(${xPos}, 9)`)
            .call(d3.axisLeft(this.yScale).tickFormat(d => d * 100))
            .selectAll('text')
            .style("font-size", "15px");
        });
      
      let scoreText = d3.select(".score-text"); // Check if the "Score" text already exists
      if (scoreText.empty()) {
        d3.select(this.$refs.axisY)
        .append('text')
        // .attr('transform', 'rotate(-90)')
        .attr('y', 6.5)
        .attr('x', 42)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'end') 
        .attr('fill', 'black')
        .attr('class', "score-text")
        .style("font-weight", "bold")
        .text("Score");
      }
    },
    drawScatterPlot(amsScoreMe, amsScorePDM1, amsScorePDM2, mode = 'default') {
      const barsGroup = d3.select(this.$refs.barsGroup);

      this.drawBackground(barsGroup);

      // Draw dots for each category
      let yScale = d3.scaleLinear()
        .domain([0, 101.3])
        .rangeRound([this.svgHeight - this.svgPadding.top - this.svgPadding.bottom, 0]);

      //for ME
      this.drawSingleScatter({
        group: barsGroup,
        data: amsScoreMe,
        className: 'dot',
        idPrefix: 'p',
        category: 'Me',
        yScale,
        originalColors: this.originalColors,
        mode,
        animate: this.shouldAnimate,
        fullfeature: this.fullFeature,
        pool: 1,
        filterbuttonClick: this.filterbuttonClick,
      });

      //for PDM1
      this.drawSingleScatter({
        group: barsGroup,
        data: amsScorePDM1,
        className: 'dot_1',
        idPrefix: 'p_1',
        category: 'PDM1',
        yScale,
        originalColors: this.originalColors_1,
        mode,
        animate: this.shouldAnimate,
        fullfeature: this.fullFeature_pdm1,
        pool: 2,
        filterbuttonClick: this.filterbuttonClick,
      });

      //for PDM2
      this.drawSingleScatter({
        group: barsGroup,
        data: amsScorePDM2,
        className: 'dot_2',
        idPrefix: 'p_2',
        category: 'PDM2',
        yScale,
        originalColors: this.originalColors_2,
        mode,
        animate: this.shouldAnimate,
        fullfeature: this.fullFeature_pdm2,
        pool: 3,
        filterbuttonClick: this.filterbuttonClick,
      });

      // If in density mode, draw axis for each category
      if (mode === 'density') {
        this.drawDensityAxes('Me');
        this.drawDensityAxes('PDM1');
        this.drawDensityAxes('PDM2');
      } else {
        this.resetDensityAxes();
      }

    },
    drawBars() {
      let startPos = 0;
      if (d3.select("#second-svg").select(".background-rect").empty()) {
        d3.select("#second-svg").insert("rect", ":first-child")
          .attr("class", "background-rect")
          .attr("x", startPos)
          .attr("y", 5)
          .attr("width", 600)
          .attr("height", 600)
          .attr("fill", "#f7f7f7")
          .attr("stroke", "#ddd")
          .attr("rx", 9)
          .attr("ry", 9);
      }

      const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("padding", "6px")
        .style("pointer-events", "none")
        .style("font-size", "14px")
        .style("border-radius", "4px")
        .style("box-shadow", "0 2px 8px rgba(0,0,0,0.2)");

      const chartWidth = 522;
      const barHeight = 30;

      //gap between the "Individual Score" title to the score distribution bars
      const gap = 83
      const spacing = 30;
      d3.select(".visualizationgroups").remove();
      var barsGroup = d3.select("#second-svg").append("g").attr("class", "visualizationgroups");

      //scale here
      const x = d3.scaleLinear()
        .domain([-0.35, 0.63])
        .range([0, chartWidth]);

      //draw x axis here
      const xAxis = d3.axisBottom(x)
        .ticks(20)
        .tickFormat(d => (d * 100).toFixed(0));

      barsGroup.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(${29.5}, ${(barHeight + spacing) * 7 + gap + spacing})`)
        .call(xAxis);

      const bars = barsGroup.selectAll("rect").data(this.features, d => d.id);
      bars.exit().remove();

      const offset = 30;
      bars.enter()
        .append("rect")
        .merge(bars)
        .attr("class", "bar")
        .attr("x", d => d.value >= 0 ? x(0) + offset : x(d.value) + offset)
        .attr("y", (_, i) => i * (barHeight + spacing) + gap)
        .attr("width", d => Math.abs(x(d.value) - x(0)))
        .attr("height", barHeight - 2)
        .attr("fill", d => (d.value >= 0 ? "green" : "red"))
        .on("mouseover", (event, d) => {
          console.log(d)
          tooltip.transition().duration(200).style("opacity", 0.9);

          tooltip.html(`<strong>${d.name} Feature </strong><br/>Score: ${((d.value * 100).toPrecision(2))}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");

        })
        .on("mouseout", () => {
          tooltip.transition().duration(500).style("opacity", 0);
        });


      const profileLabels = Object.entries(this.profile)
        .filter(([key]) => key !== "pid" && key !== "pool")
        .map(([key, value]) => `${key}: ${value} `);


      barsGroup.selectAll(".bar-label")
        .data(profileLabels)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", x(0) + offset - 5)
        .attr("y", (_, i) => i * (barHeight + spacing) + gap - 8)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "left")
        .text(d => d);

      d3.selectAll(".scorecomposite").remove();

      barsGroup.append("text")
        .attr("class", "scorecomposite")
        .attr("x", 16)
        .attr("y", 38)
        .attr("font-size", "23px")
        .text("Individual Score: " + Number((this.individualScore).toPrecision(2)));

      barsGroup.append("text")
        .attr("class", "scorecomposite")
        .attr("x", 16)
        .attr("y", 498)
        .attr("font-size", "23px")
        .text("Summary: ");

      const positiveFeatures = this.features.filter(f => f.value >= 0);
      const negativeFeatures = this.features.filter(f => f.value < 0);


      let cumilativeNegX = 0;
      let cumilativePosX = 0;

      negativeFeatures.forEach(f => {
        const width = Math.abs(x(f.value) - x(0));

        barsGroup.append("rect")
          .attr("class", "bars")
          .attr("x", x(0) - width + cumilativeNegX + offset)
          .attr("y", (barHeight + spacing) * 7 + gap + 26 + spacing)
          .attr("width", width)
          .attr("height", barHeight - 2)
          .attr("fill", "red")
          .attr("stroke", "white")

        cumilativeNegX -= width;
      });

      positiveFeatures.forEach(f => {
        const width = x(f.value) - x(0);

        barsGroup.append("rect")
          .attr("class", "bars")
          .attr("x", x(0) + cumilativePosX + offset)
          .attr("y", (barHeight + spacing) * 7 + gap + 26 + spacing)
          .attr("width", width)
          .attr("height", barHeight - 2)
          .attr("fill", "green")
          .attr("stroke", "white")

        cumilativePosX += width;
      });


      const negative = negativeFeatures.reduce((sum, val) => sum + val.value, 0);
      const positive = positiveFeatures.reduce((sum, val) => sum + val.value, 0);

      const negOverlay = barsGroup.append("rect")
        .attr("x", x(0) + cumilativeNegX + offset)
        .attr("y", (barHeight + spacing) * 7 + gap + 26 + spacing)
        .attr("width", Math.abs(cumilativeNegX))
        .attr("height", barHeight - 2)
        .attr("fill", "rgba(255, 0, 0, 0.1)")
        .attr("stroke", "none")
        .on("mouseover", (event) => {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`<strong>Total Negative Impact</strong><br/> -${Math.abs(negative * 100).toFixed(0)}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
          negOverlay.attr("fill", "rgba(255, 255, 255, 0.6)");
        })
        .on("mouseout", () => {
          tooltip.transition().duration(500).style("opacity", 0);
          negOverlay.attr("fill", "rgba(255, 0, 0, 0.1)");
        });

      const posOverlay = barsGroup.append("rect")
        .attr("x", x(0) + offset)
        .attr("y", (barHeight + spacing) * 7 + gap + 26 + spacing)
        .attr("width", cumilativePosX)
        .attr("height", barHeight - 2)
        .attr("fill", "rgba(0, 128, 0, 0.1)")
        .attr("stroke", "none")
        .on("mouseover", (event) => {
          tooltip.transition().duration(200).style("opacity", 0.9);
          tooltip.html(`<strong>Total Positive Impact</strong><br/>${(positive * 100).toFixed(0)}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
          posOverlay.attr("fill", "rgba(255, 255, 255, 0.6)");
        })
        .on("mouseout", () => {
          tooltip.transition().duration(500).style("opacity", 0);
          posOverlay.attr("fill", "rgba(0, 128, 0, 0.1)");
        });
    },
    drawSingleScatter({ group, data, className, idPrefix, category, yScale, originalColors, mode, animate, fullfeature, pool}) {
        const defaultX = this.xScale(category) + this.xScale.bandwidth() / 2 ;
        computeDensityPositions(this.xScale, data, category);
        
        // for first initial draw
        const selection = group.selectAll('.' + className)
            .data(data, d => d.pid)
            .join(
                enter => enter.append("circle")
                    .attr("class", className)
                    .attr("r", 6)
                    .attr("fill", d => {
                        // console.log(d)
                        let color = 'black';
                        originalColors[d.pid] = color;
                        return color;
                    })
                    .attr("opacity", 0.15)
                    .attr("id", d => idPrefix + d.pid)
                    .attr("stroke", "none") 
                    .attr("cx", defaultX)
                    .attr("cy", d => yScale(d.value))
                    .on('mouseover', (event) => {
                      // console.log(+d.pid)
                        if (this.currentMode === 'density') {
                            d3.select(event.target)
                                .attr('r', 10) 
                                .style('stroke', 'blue')
                                .style('stroke-width', 5); 
                        }
                    }).on('mouseout', (event, d) => {
                        if (this.currentMode === 'density') {
                          if(!this.selectedDots.includes(+d.pid)){
                            
                            d3.select(event.target)
                                .attr('r', 6) 
                                .style('stroke', 'none')
                                .style('stroke-width', 1)
                                .style('fill', originalColors[d.pid] || 'black'); 

                          }
                        }
                    }).on('click', (event, d) => {
                        if (this.currentMode === 'density') {
                          d3.selectAll("circle").attr("r", 6).style('stroke', 'none')
                          .style('stroke-width', 1).style('fill', originalColors[d.pid] || 'black'); 

                          this.selectedDots.push(+d.pid)
                          d3.select(event.target)
                                .attr('r', 10) 
                                .style('stroke', 'blue')
                                .style('stroke-width', 5); 
                          
                          const selectedEntry = fullfeature.find(entry => entry.pid === d.pid);
                          //more coupling? with this
                          // this.linkProfileCard(selectedEntry, pool, d.value);

                          //d.value is the individual score
                          this.updatingProfile(selectedEntry, pool, d.value);
                          this.drawBars();
                        }
                    }),
                
                update => update,  // just update in-place
                exit => exit.remove()
            );

        // Then transition depending on mode
        if(animate & !this.filterbuttonClick){
            selection.transition()
                .duration(800)
                .attr("cx", d => mode === "default" ? defaultX: d._xDensity)
                .attr("cy", d => yScale(d.value));
        }else{
            selection
                .attr("cx", d => mode === "default" ? defaultX : d._xDensity)
                .attr("cy", d => yScale(d.value));
        }

    },
    drawBackground(refGroup) {
      const boarderHeight = this.svgHeight - this.svgPadding.top - this.svgPadding.bottom;

      let greenbackground = refGroup.select('#greenbackground');
      if (greenbackground.empty()) {
        refGroup.append("rect")
          .attr('id', 'greenbackground')
          .attr("x", 1)
          .attr("y", 6)
          .attr("width", this.chartWidth / 2 + 360)
          .attr("height", 0.4 * boarderHeight)
          .attr("fill", "DarkSeaGreen")
          .attr("opacity", "0.5");
      }

      let yellowbackground = refGroup.select('#yellowbackground');
      if (yellowbackground.empty()) {
        refGroup.append("rect")
          .attr('id', 'yellowbackground')
          .attr("x", 1)
          .attr("y", boarderHeight * 0.4 + 6)
          .attr("width", this.chartWidth / 2 + 360)
          .attr("height", 0.2 * boarderHeight - 3)
          .attr("fill", "SandyBrown")
          .attr("opacity", "0.5");
      }

      let redbackground = refGroup.select('#redbackground');
      if (redbackground.empty()) {
        refGroup.append("rect")
          .attr('id', 'redbackground')
          .attr("x", 1)
          .attr("y", boarderHeight * 0.6 + 3)
          .attr("width", this.chartWidth / 2 + 360)
          .attr("height", 0.4 * boarderHeight - 3)
          .attr("fill", "IndianRed")
          .attr("opacity", "0.5");
      }

    },
    updatingProfile(selectedEntry, pool, individualScore){
      //linking process
      const scoreDataMap = {
        1: this.detailedScore,
        2: this.detailedScore_1,
        3: this.detailedScore_2
      };

      this.individualScore = individualScore;

      let contributions = linkProfileCard(scoreDataMap, this.profile, selectedEntry, pool);

      for (var i = 0; i < this.features.length; i++) {
        this.features[i].value = contributions[i];
      }   

    },
    drawDensityAxes(key) {
        const ref = {
            "Me": this.$refs.axisYMe,
            "PDM1": this.$refs.axisYPDM1,
            "PDM2": this.$refs.axisYPDM2
        }[key];

        const originalX = this.xScale(key) + this.xScale.bandwidth() / 2;
        const shiftedX = originalX - this.xScale.bandwidth() / 2 ;

        d3.select(ref)
            .call(d3.axisLeft(this.yScale).ticks(20).tickFormat(d => Math.round(d * 100)))
            .transition()
            .duration(500)
            .attr("transform", `translate(${shiftedX}, 9)`);
    },
    resetDensityAxes() {
        const axisConfigs = [
            { key: "Me", ref: this.$refs.axisYMe },
            { key: "PDM1", ref: this.$refs.axisYPDM1 },
            { key: "PDM2", ref: this.$refs.axisYPDM2 }
        ];

        axisConfigs.forEach(({ key, ref }) => {
            const xPos = this.xScale(key) + this.xScale.bandwidth() / 2;

            d3.select(ref)
                .call(d3.axisLeft(this.yScale).tickFormat(d => d * 100))
                .transition()
                .duration(500)
                .attr("transform", `translate(${xPos}, 9)`);
        });
    },
    handleBarClick(val) {
      this.$store.commit('changeSelectedState', val);
    }
  },
  computed: {
    amsScore:{
      get() {
        return this.$store.getters.amsScore;
      }
    },
    amsScore_1:{
      get() {
        return this.$store.getters.amsScore_1;
      }
    },
    amsScore_2:{
      get() {
        return this.$store.getters.amsScore_2;
      }
    },
    fullFeature:{
      get() {
        return this.$store.getters.fullFeature;
      }
    },
    fullFeature_pdm1:{
      get() {
        return this.$store.getters.amsScore_1_fullFeature;
      }
    },
    fullFeature_pdm2:{
      get() {
        return this.$store.getters.amsScore_2_fullFeature;
      }
    },
    detailedScore: {
      get() {
        return this.$store.getters.detailedScore;
      }
    },
    detailedScore_1: {
      get() {
        return this.$store.getters.detailedScore_1;
      }
    },
    detailedScore_2: {
      get() {
        return this.$store.getters.detailedScore_2;
      }
    },
    personaleIncome: {
      get() {
        return this.$store.getters.personaleIncome;
      }
    },
    //if you want to change the column width for each dots, change here & the background
    xScale() {
      return d3.scaleBand()
        .domain(["Me", "PDM1", "PDM2"])
        .range([0, (this.svgWidth - this.svgPadding.left - this.svgPadding.right)/2 + 360])
    },
    yScale() {
      return d3.scaleLinear()
        .domain([0, 1])
        .rangeRound([this.svgHeight - this.svgPadding.top - this.svgPadding.bottom - 9, 0])
    },
  },
  watch: {
    personaleIncome: {
      handler() {
        this.drawChart();
      },
      deep: true,
    },
  },
}
</script>

<style>

.vis-component {
  display: flex;
}

.content-wrapper {
  display: flex;
  flex-direction: row;
  align-items: stretch; /* make them all equal height */
}

.sidebar {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  width: 330px;
  padding: 15px;
  padding-top: 18px;
  background-color: #f7f7f7;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  flex-direction: column;
  border-radius: 15px;
}

.legende_filter {
  display: flex;
  flex-wrap: wrap; /* Allow wrapping of categories, important for row */
  gap: 6px;
}

.checkbox-container {
  display: flex; /* Align options horizontally */
  align-items: center; /* Center align items vertically */
  width: 125px;
  margin-bottom: 5px; /* Space between options */
  margin-right: 1px; 
  font-size: 12px;
}

.checkbox-container label {
  margin-top: 10px;
  line-height: 1.2;
  margin-left: 3px; /* Space between checkbox and label */
  font-size: 15px;
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

.scatter-wrapper {
  display: flex;
  flex-direction: column;
  margin-right: 20px; 
  width: 1150px;
  flex: 1
}

.toggle-switch-btn {
  width: 100%; /* smaller overall width */
  padding: 10px 20px;
  background-color: #333;
  color: #fff;
  border: 2px solid #444;
  border-radius: 30px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
  margin-top: 15px;
  margin-left: 20px;
  /* margin-left: 0%; */
}

.toggle-switch-btn::after {
  content: '●';
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: black;
  transition: transform 0.3s ease;
}

.toggle-switch-btn.active::after {
  transform: translate(-120%, -50%);
  color: #48bb78;
}

.checkbox-container label {
  text-transform: capitalize;
}

.profile-info {
  text-align: left; 
  margin-bottom: 16px; 
  text-transform: capitalize;
}

.bar-label {
  text-transform: capitalize;
}

/* abandoned css */

/* .profile-card {
  width: 250px;
  height: 460.2px;
  margin-left: 1013px;
  padding: 16px;
  background-color: #f7f7f7;
  border-top: 1px solid #ddd;
  border-left: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
  border-right: none; 
  border-radius: 9px 0 0 9px;
  display: block;
} */

</style>
