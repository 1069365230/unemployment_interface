<template>
  <div class="vis-component" ref="chart">
    <br>
   
    <div class="content-wrapper">
      <div class="flex-container">
            <div class="profile-card">

                <div class="profile-info">
                    <h3>Random Dummy</h3>
                    <p>Gender: {{ profile.gender }}</p>
                    <p>Citizenship: {{ profile.citizenship }}</p>
                    <p>Age: {{ profile.age }}</p>
                    <p>Education Level: {{ profile.skill }}</p>
                    <p>Impairment: {{ profile.impairment }}</p>
                    <p>Occupation: {{ profile.occupation }}</p>
                    <p>Dutycare: {{ profile.dutycare }}</p>
                </div>
                <br>
                <br>
                <div class="profile-actions">
                  <button @click="handleButtonClick" class="profile-button">Pick another</button>
                </div>
            </div>
            
            <div id="slidecontainer">
                <svg id="main-svg" :width="svgWidth" :height="svgHeight">
                    <g class="chart-group" ref="chartGroup">
                        <g class="axis axis-x" ref="axisX"></g>
                        <g class="axis axis-y" ref="axisY"></g>
                        <g class="bars-group" ref="barsGroup"></g>
                    </g>  
                </svg>
            </div>
      </div>
      
    </div>

  </div>
</template>

<script>

import * as d3 from 'd3';
//fake profile card (done), button to return default filter setting
//year slider design?

export default {
  name: 'BarChart',
  props: {
  },
  data() {
    return {
      randomnumber: 0,
      svgWidth: 800,
      svgHeight: 650,
      svgPadding: {
        top: 25, right: 20, bottom: 30, left: 40,
      },
      ypadding: 60,
      originalColors: {},
      profile: {
        pid: "",
        gender: "",
        citizenship: "",
        age: "",
        skill: "",
        impairment: "",
        occupation: "",
        dutycare: "",
      },
      ageGroups: [
        { min: 0, max: 14, group: '0-14' },
        { min: 15, max: 29, group: '15-29' },
        { min: 30, max: 44, group: '30-44' },
        { min: 45, max: 59, group: '45-59' },
        { min: 60, max: 74, group: '60-74' },
        { min: 75, max: 100, group: '75-100' }
      ],
      filterOptions: {
        gender: ['male', 'female'],
        citizenship: ['AT', 'EU', 'Non-EU'],
        age: ['0-14', '15-29', '30-44', '45-59', '60-74', '75-100'],
        skill: ['not stated', 'Compulsory', 'Apprenticeship', 'high school', 'university'],
        impairment: ['Yes', 'No'],
        occupation: ['agriculture', 'production', 'service', 'other'],
        dutycare: ['dutycare_Yes', 'dutycare_No']
      },
      scoredistribution: [0, 0, 0, 0, 0, 0, 0],
      individualScore: 0,
      sigmoidDerivative: 0,
      originalContribution: [],
      features: [
        { id: "feature_zero", value: 10, color: "#ff0000", name: "Gender"},
        { id: "feature_one", value: 10, color: "#5200FF", name: "Citizenship"},
        { id: "feature_two", value: 10, color: "#ca5f02", name: "Age"},
        { id: "feature_three", value: 30, color: "#808080", name: "Education Lvl."},
        { id: "feature_four", value: 20, color: "#EB00FF", name: "Impairment"},
        { id: "feature_five", value: 10, color: "#5e9001", name: "Occupation"},
        { id: "feature_six", value: 10, color: "#018290", name: "Dutycare"}
      ],
      selectedGroups: {},
      normalizedScore: [],
      originalScore: 0,
    }
  },
  mounted() {
    this.drawChart(); 
  },
  methods: {
    handleButtonClick() {
      const randomNumber = Math.floor(Math.random() * 301); // Generate an integer between 0 and 300
      this.randomnumber = randomNumber;
      this.linkProfileCard();
      this.drawChart();
    },
    fillPidsPerCategory(){
      let allpids = {};

      for (let key in this.selectedGroups) {
        if(this.selectedGroups[key]) {
          allpids[key] = this.findtest(key, this.selectedGroups[key]);
        } else {
          //if no filter is selecter, then all pid should be in the list
          let nofilter = [];
          this.filterOptions[key].forEach(element => {
            nofilter = nofilter.concat(this.findtest(key, element));
          })
          allpids[key] = nofilter;
        }
      }
      return allpids;
    },
    ageMapping(age){
      //returns this corresponding age group when age is given
      for (let i = 0; i < this.ageGroups.length; i++) {
        if (age >= this.ageGroups[i].min && age <= this.ageGroups[i].max) {
          return this.ageGroups[i].group;
        }
      }

      return "";
    },
    reverseAgeMapping(agegroup){
      let age = this.ageGroups.find(ageGroup => ageGroup.group === agegroup);
      return age ? { min: age.min, max: age.max } : null;

    },


    findtest(feature, val){
      if (val === 'dutycare_Yes' || val === 'dutycare_No'){
        val = val.split('_')[1];
      }

      let similarPid = [];

      switch(feature){
        case 'citizenship':
          this.fullFeature.forEach(element => {
            if (element.value[1] === val){
              similarPid.push(+element.pid);
            }
          });
          break;
        case 'gender':
          this.fullFeature.forEach(element => {
            if (element.value[0] === val){
              similarPid.push(+element.pid);
            }
          });
          break;
        case 'skill':
          this.fullFeature.forEach(element => {
            if (element.value[3] === val){
              similarPid.push(+element.pid);
            }
          });
          break;
        case 'impairment':
          this.fullFeature.forEach(element => {
            if (element.value[4] === val){
              similarPid.push(+element.pid);
            }
          });
          break;
        case 'occupation':
          this.fullFeature.forEach(element => {
            if (element.value[5] === val){
              similarPid.push(+element.pid);
            }
          });
          break;
        case 'dutycare':
          this.fullFeature.forEach(element => {
            if (element.value[6] === val){
              similarPid.push(+element.pid);
            }
          });
          break;
        case 'age':
          //reverseAgeMapping
          var minage = this.reverseAgeMapping(val).min;
          var maxage = this.reverseAgeMapping(val).max;
          
          this.fullFeature.forEach(element => {
            if (minage <= element.value[2] && element.value[2] <= maxage){
              similarPid.push(+element.pid);
            }
          });
          break;
        default:
          //do something
      }
      return similarPid;
    },
    allocateScore(pid){
      
      this.normalizedScore = this.normalize(this.detailedScore)
      let scoredist, total;
      this.detailedScore.forEach(element => {
        
        if(pid === element.pid){
          scoredist = element.value;
          total = element.total;
          
        }
      });
      //found and set the detailed score here
      this.scoredistribution = scoredist;
      this.originalScore = total;
      
      
      this.normalizedScore.forEach(element => {
        
        if(pid === element.pid){
          total = element.total;
        }
      });
      this.individualScore = total;
      console.log("original", this.originalScore)
      console.log("individual", this.individualScore)
    },

    drawChart() {

      const sidebar_width = 250
      if (this.$refs.chart) this.svgWidth = this.$refs.chart.clientWidth - sidebar_width;

      d3.select(this.$refs.chartGroup)
        .attr('transform', `translate(${this.svgPadding.left},${this.svgPadding.top})`);

      d3.selectAll(".slider").on("input", (event) => {
        const sliderID = d3.select(event.target).attr("id");
        this.updateFeatures(sliderID);
      });

      //does not work
      // document.querySelectorAll('.slider').forEach(slider => {
      //   slider.disabled = true;
      // });

      this.linkProfileCard();
      
      this.linkDist();

      this.drawSecondVis();
    },
    // inverseSigmoid(finalScore) {
    // return Math.log(finalScore / (1 - finalScore));
    // },
    // recoverOriginalScores(normalizedContributions) {
      
    //   // Use the inverse sigmoid function to find the sum of features
    //   const sumOfFeatures = this.inverseSigmoid(this.individualScore) - 0.1; // subtract the 0.1 constant

    //   const originalScores = normalizedContributions.map(contribution => (contribution / 100) * sumOfFeatures);  
    //   return originalScores;
    // },
    // calculateFeatureContribution(features) {
      
      
    //   // Calculate the original final score
    //   const finalScore = this.individualScore;
    //   //console.log("normalize", this.normalize(0.1+ features.reduce((acc, x) => acc + x, 0)))

    //   // Sigmoid derivative w.r.t. score: final * (1 - final)
    //   const sigmoidDerivative = finalScore * (1 - finalScore);

    //   // Since each feature affects the score directly, its contribution is proportional to its value
    //   const contributions = features.map(feature => feature * sigmoidDerivative);
    //   this.originalContribution = contributions;
    //   let absContributions = contributions.map(Math.abs);
    //   const totalContribution = absContributions.reduce((acc, x) => acc + x, 0);
    //   const normalizedContributions = absContributions.map(c => (c / totalContribution) * 100);
      
    //   this.sigmoidDerivative = sigmoidDerivative;
    //   return normalizedContributions;
    // },
    linkDist(){
      var pid = this.profile.pid;
      
      this.allocateScore(pid);
      
      
      // var contributions = this.calculateFeatureContribution(this.scoredistribution)
      console.log("score dist", this.scoredistribution)
      // for(var i = 0; i < this.features.length; i++){
      //   this.features[i].value = contributions[i];
      // }

      for(var i = 0; i < this.features.length; i++){
        this.features[i].value = this.scoredistribution[i];
      }
    },
    normalize(yearly_score) {
      // Extract all total values
      // const totals = yearly_score.map(entry => entry.total);

      // Calculate min and max
      // const minVal = Math.min(...totals);
      // const maxVal = Math.max(...totals);
      const minVal = -1.61;
      const maxVal = 0.71;
      const range = maxVal - minVal || 1; // Avoid division by zero

      // Return a new array with normalized totals
      return yearly_score.map(entry => ({
        ...entry,
        total: (entry.total - minVal) / range
      }));
    },
    drawSecondVis() {
        //tooltip here
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

        const chartWidth = 600;
        d3.select(".visualizationgroups").remove();
        var chartGroup = d3.select("#main-svg").append("g")
            .attr("class", "visualizationgroups");

        const barHeight = 30;
        const gap = 59;
        const spacing = 10;
        
        //scale here
        const x = d3.scaleLinear()
          .domain([-1.61, 0.71])
          .range([0, chartWidth]);

        //draw x axis here
        const xAxis = d3.axisBottom(x)
          .ticks(10)        
          .tickFormat(d3.format(".2f")); 


        //bars here
        var canvas = d3.select(".visualizationgroups");
        
        canvas.append("g")
          .attr("class", "x-axis")
          .attr("transform", `translate(${29.5}, ${(barHeight+spacing) * 7 + gap})`)
          .call(xAxis);

        
        const bars = canvas.selectAll("rect").data(this.features, d => d.id);
        bars.exit().remove();
        const offset = 30;
        bars.enter()
          .append("rect")
          .merge(bars)
          .attr("class", "bar")
          .attr("x", d => d.value >= 0 ? x(0) + offset : x(d.value) + offset)
          .attr("y", (_, i) => i * (barHeight + spacing) + gap)
          .attr("width",  d => Math.abs(x(d.value) - x(0)))
          .attr("height", barHeight - 2)
          .attr("fill", d => (d.value >= 0 ? "green" : "red"))
          .on("mouseover", (event, d)=>{
                console.log(d)
                tooltip.transition().duration(200).style("opacity", 0.9);

                tooltip.html(`<strong>${d.name} Feature </strong><br/>Score: ${(d.value)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                    
            })
            .on("mouseout", ()=>{
                tooltip.transition().duration(500).style("opacity", 0);
            });

        //lables here
        // const lables = canvas.selectAll("text").data(this.features);
        // lables.exit().remove();

        // lables.enter()
        //   .append("text")
        //   .attr("class", "labels")
        //   .merge(lables)
        //   .attr("x", 0)
        //   .attr("y", (_, i) => i * (barHeight + spacing) + barHeight / 2 + gap)
        //   .attr("text-anchor", "begin")
        //   .attr("dominant-baseline", "middle")
        //   .attr("fill", "black")
        //   .text(d => d.name);
          
        //draw a background
        if (d3.select("#main-svg").select(".background-rect").empty()) {
          d3.select("#main-svg").insert("rect", ":first-child")
            .attr("class", "background-rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 750)
            .attr("height", 460)
            .attr("fill", "#f7f7f7") 
            .attr("stroke", "#ddd")
            .attr("rx", 9)           
            .attr("ry", 9);          
        }   

        //axis here
        d3.selectAll(".axis").remove(); 
        chartGroup.append("line")
          .attr("class", "axis")
          .attr("x1", x(0) + offset)
          .attr("x2", x(0) + offset)
          .attr("y1",  9 + gap)
          .attr("y2", (barHeight+spacing) * 7 + gap)
          .attr("stroke", "#000")
          .attr("stroke-width", 1);

        d3.selectAll(".scorecomposite").remove(); 
        
        chartGroup.append("text")
            .attr("class", "scorecomposite")
            .attr("x", 16)
            .attr("y", 31)
            .attr("font-size", "20px")
            .text("Original Index Score: " + Number((this.originalScore).toPrecision(2)));

        chartGroup.append("text")
            .attr("class", "scorecomposite")
            .attr("x", 16)
            .attr("y", 42)
            .attr("font-size", "10px")
            .text("(Ranges from -1.61 to 0.71. Calculated by the base score 0.1 + sum of all feature score.)");

        chartGroup.append("text")
            .attr("class", "scorecomposite")
            .attr("x", 16)
            .attr("y", 31 *2.4)
            .attr("font-size", "20px")
            .text("System Ranking Score: " + parseInt(Number((this.individualScore).toPrecision(2) * 100)));
        
        chartGroup.append("text")
            .attr("class", "scorecomposite")
            .attr("x", 16)
            .attr("y", 31 *2.4 + 11)
            .attr("font-size", "10px")
            .text("(Ranges from 0 to 100. Calculated by the ranking of the system)");

        const positiveFeatures = this.features.filter(f => f.value >= 0);
        const negativeFeatures = this.features.filter(f => f.value < 0);
        console.log(positiveFeatures)
        console.log(negativeFeatures)

        let cumilativeNegX = 0;
        let cumilativePosX = 0;

        negativeFeatures.forEach(f => {
          const width = Math.abs(x(f.value) - x(0));

          chartGroup.append("rect")
            .attr("class", "bars")
            .attr("x", x(0) - width + cumilativeNegX + offset)
            .attr("y", (barHeight+spacing) * 7 + gap + 26)
            .attr("width", width)
            .attr("height", barHeight - 2)
            .attr("fill", "red")
            .attr("stroke", "white")
            .on("mouseover", (event)=>{
                console.log(f)
                tooltip.transition().duration(200).style("opacity", 0.9);

                tooltip.html(`<strong>${f.name} Feature </strong><br/>Score: ${(f.value)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                    
            })
            .on("mouseout", ()=>{
                tooltip.transition().duration(500).style("opacity", 0);
            });

            cumilativeNegX -= width;
        });

        positiveFeatures.forEach(f => {
          const width = x(f.value) - x(0);

          chartGroup.append("rect")
            .attr("class", "bars")
            .attr("x", x(0) + cumilativePosX + offset)
            .attr("y", (barHeight+spacing) * 7 + gap + 26)
            .attr("width", width)
            .attr("height", barHeight - 2)
            .attr("fill", "green")
            .attr("stroke", "white")
            .on("mouseover", (event)=>{
                console.log(f)
                tooltip.transition().duration(200).style("opacity", 0.9);

                tooltip.html(`<strong>${f.name} Feature </strong><br/>Score: ${(f.value)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                    
            })
            .on("mouseout", ()=>{
                tooltip.transition().duration(500).style("opacity", 0);
            });

            cumilativePosX += width;
        });
        

    },
    updateFeatures(sliderID) {
      const sliderValue = +d3.select(`#${sliderID}`).property("value");

      //d3.select(`#${sliderID}_value`).text(sliderValue);  // Update slider label

      const featureIndex = this.features.findIndex(f => f.id === sliderID);
      this.features[featureIndex].value = sliderValue;  // Update the feature value
      this.drawBars();  
      this.drawSecondVis();
    },
    linkProfileCard(){
      let person = this.fullFeature[this.randomnumber];
      
      //profile here got linked
      this.profile.pid = person.pid;
      this.profile.gender = person.value[0];
      this.profile.citizenship = person.value[1];
      this.profile.age = person.value[2];
      this.profile.skill = person.value[3];
      this.profile.impairment = person.value[4];
      this.profile.occupation = person.value[5];
      this.profile.dutycare = person.value[6];
      // console.log(this.profile.age)
      this.updateToggled("gender", this.profile.gender);
      this.updateToggled("citizenship", this.profile.citizenship);
      this.updateToggled("age", this.profile.age);
      this.updateToggled("skill", this.profile.skill);
      this.updateToggled("impairment", this.profile.impairment);
      this.updateToggled("occupation", this.profile.occupation);
      this.updateToggled("dutycare", "dutycare_" + this.profile.dutycare);
      
    },
    updateToggled(feature, val){
      if(feature == "age") {
        val = this.ageMapping(val);
      }
      this.$set(this.selectedGroups, feature, val);
    },
    findcommonpids(allpids){
      const sets = allpids.map(list => new Set(list));
      const commonNumbers = sets.reduce((intersection, set) => {
        return new Set([...intersection].filter(x => set.has(x)));
      });
      
      return Array.from(commonNumbers);
    },
    handleBarClick(val) {
      this.$store.commit('changeSelectedState', val);
    }
  },
  computed: {
    selectedYear: {
      get() {
        return 2013;
      },
      set() {
        this.$store.commit('changeSelectedYear', '2013');
      },
    },
    amsScore:{
      get() {
        return this.$store.getters.amsScore;
      }
    },
    detailedScore: {
      get() {
        return this.$store.getters.detailedScore;
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


#slidecontainer {
  display: flex;
  width: 80%;
  height: 100%;
  justify-content: space-between;
}

.slider-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px; /* Space between each slider and label */
}

.slider {
  -webkit-appearance: none;
  appearance: slider-vertical;
  height: 100%;
  width: 30px;
  background: #d3d3d3;
  opacity: 0.7;
}

.slider_1::-webkit-slider-runnable-track {
  background: #ddd;
  height: 50px; /* Adjust this for thickness */
  border-radius: 5px; /* Rounded corners */
}

.slider_1::-moz-range-track {
  background: #ddd;
  height: 50px; /* Adjust this for thickness */
  border-radius: 5px; /* Rounded corners */
}


.slider-label {
  font-family: Arial, sans-serif;
  font-size: 18px;
}

.slider:hover {
  opacity: 1;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 10px;
  height: 36px;
  background: #0454aa;
  cursor: pointer;
}

/* use if negative options */
/* .slider::-webkit-slider-runnable-track {
  background: #f4f4f4;
} */

.slider::-webkit-slider-thumb{
   -webkit-appearance: none; /* Override default look */
    appearance: none;
    cursor: pointer; /* Cursor on hover */
    /* visibility: hidden; */
}

/* does not work... */
#feature_zero::-webkit-slider-thumb {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 15px !important;  /* Set square size */
  height: 15px !important;
  background-color: #888 !important;  /* Set thumb color */
  border-radius: 0 !important;  /* Remove rounding */
  border: 2px solid #555 !important;  /* Optional: Add a border */
}

#feature_zero {
  pointer-events: none;
  background: #f0f0f0;
  accent-color: #ff0000;
}

/* #feature_zero::-webkit-slider-runnable-track {
  background: #ff0000;
  height: 50px; 
  border-radius: 5px; 
} */


#feature_one {
  pointer-events: none;
  accent-color: #5200FF;
}

#feature_one::-moz-range-track {
  background-color: #5200FF;
}

#feature_two {
  pointer-events: none;
  accent-color: #ca5f02;
}

#feature_three {
  pointer-events: none;
  accent-color: #808080;
}

#feature_four {
  pointer-events: none;
  accent-color: #EB00FF;
}

#feature_five {
  pointer-events: none;
  accent-color: #5e9001;
}

#feature_six {
  pointer-events: none;
  accent-color: #018290;
}

.sidebar {
  width: 210px;
  padding: 15px;
  background-color: #f7f7f7;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  flex-direction: column;
  align-items: flex-start;
  border-radius: 15px;
}


label {
  text-align: left; 
  display: inline-block; 
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
  margin-right: 20px; 
}

.flex-container {
  display: flex;
  justify-content: flex-start;
  align-items: center; /* Aligns items vertically in the center */
  gap: 20px; /* Optional: Adds space between the elements */
}

.profile-card {
  width: 350px;
  height: 460px;
  padding: 15px;
  background-color: #f7f7f7;
  border: 1px solid #ddd;
  border-radius: 8px;
  display: block;
  align-self: flex-start;
}

.profile-info {
  text-align: right; 
  margin-bottom: 10px; 
}

</style>
