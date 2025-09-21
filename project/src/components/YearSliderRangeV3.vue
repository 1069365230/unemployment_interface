<template>
    <div class="slider-wrapper"> 
        <div ref="yearPicker" class="year-picker"></div>
    </div>
</template>

<script>
import * as d3 from 'd3';


export default {
  name: 'YearSlider',
  props: {
  },
  data() {
    return {
        highlightColor: "#c4c2b5",
        boundaryColor: "#7f7b75",
        startYear: 2015,
        endYear: 2018,
        x: null,
        // highlight: null,

    };
  },
  mounted() {
    const years = d3.range(2013, 2023);
    const height = 60;
    // const boxWidth = 60;
    
    const spacing = 0; // no spacing

    // const wrapperWidth = this.$refs.yearPicker.parentElement.offsetWidth;
    const wrapperWidth = 2110;
    const boxWidth = wrapperWidth / years.length ;
    const boxHeight = height ;

    const svg = d3.select(this.$refs.yearPicker)
        .append('svg')
        .attr('width', wrapperWidth)
        .attr('height', height);

    const x = d3.scalePoint()
        .domain(years)
        .range([0, wrapperWidth])
        .padding(1);

    this.x = x;

     // Year boxes
    this.boxes = svg.selectAll('.year-box')
        .data(years)
        .enter()
        .append('rect')
        .attr('class', 'year-box')
        .attr('x', (d, i) => i * (boxWidth + spacing))
        .attr('y', height / 2 - boxHeight / 2)
        .attr('width', boxWidth)
        .attr('height', boxHeight)
        .attr('rx', 3)
        .attr('fill', '#f2f2f2')
        .attr('cursor', 'pointer')
        .on('click', this.handleYearClick)
        .on('mouseover', function() {
            d3.select(this)
                .attr('fill', '#d9d9d9') 
                .style('stroke-alignment', 'inner')
                .attr('stroke-width', 3)
                .attr('stroke', "white"); // Change border color on hover
      
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('fill', '#f2f2f2') // Reset color when hover ends
                .attr('stroke', this.highlightColor); // Reset border color
      
        });
        
    
   // Year labels
    svg.selectAll('.year-label')
        .data(years)
        .enter()
        .append('text')
        .attr('x', (d, i) => i * (boxWidth + spacing) + boxWidth / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'middle')
        .attr('font-size', 15)
        .attr('font-family', 'Helvetica, Arial, sans-serif')
        .attr('pointer-events', 'none')
        .attr('font-weight', 'bold')
        .text(d => d);

    this.updateHighlight();
  },
  methods: {
    handleYearClick(event, year) {
      const years = [this.startYear, this.endYear].sort((a, b) => a - b);

      if (year < years[0] || year > years[1]) {
        // Expand selection to include year
        if (Math.abs(year - years[0]) < Math.abs(year - years[1])) {
          this.startYear = year;
        } else {
          this.endYear = year;
        }
      } else {
        // Reset selection to a single year
        this.startYear = year;
        this.endYear = year;
      }

      // Ensure correct order
      if (this.startYear > this.endYear) {
        const temp = this.startYear;
        this.startYear = this.endYear;
        this.endYear = temp;
      }

      this.updateHighlight();
      this.$store.commit('changeSelectedYearRange', {
        startYear: this.startYear,
        endYear: this.endYear,
      });
    },
    updateHighlight() {

        const xStart = this.x(this.startYear);
        const xEnd = this.x(this.endYear);
        if (!xStart || !xEnd) return;
        
        const svg = d3.select(this.$refs.yearPicker).select('svg');

        svg.selectAll('.year-label')
            .style('text-decoration', (d) => {
                if (d === this.startYear || d === this.endYear) {
                    return 'underline';
                }
                return 'none';
            });

        svg.selectAll('.year-box')
            .style('fill', (d) => {
                if (d > this.startYear && d < this.endYear) {
                    return this.highlightColor; // Blue for the start and end year
                }
                if (d === this.startYear || d === this.endYear) {
                    return this.boundaryColor; // Blue for the start and end year
                }
            });

    // Highlight the boxes individually
        this.boxes
            .attr('fill', d => (d >= this.startYear && d <= this.endYear ? this.highlightColor : '#f2f2f2'))
            // .attr('stroke', d => (d >= this.startYear && d <= this.endYear ? '#0066cc' : '#999'))
            // .attr('stroke-width', d => (d >= this.startYear && d <= this.endYear ? 2 : 1));
        
  }
  },
  computed: {
    selectedYearRange: {
      get() {
        return [this.startYear, this.endYear];
      },
      set([start, end]) {
        this.startYear = start;
        this.endYear = end;
        this.updateHighlight();
        this.$store.commit('changeSelectedYearRange', {startYear: start, endYear: end});
      },
    },
  },
  watch: {
    // startYear(val) {
    //   this.updateSliderBackground();
    //   if (val > this.endYear) this.endYear = val;
    //   this.$store.commit('changeSelectedYearRange', { startYear: this.startYear, endYear: this.endYear });
      
    // },
    // endYear(val) {
    //   this.updateSliderBackground();
    //   if (val < this.startYear) this.startYear = val;
    //   this.$store.commit('changeSelectedYearRange', { startYear: this.startYear, endYear: this.endYear });
    // },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>


.slider-wrapper {
  position: relative;
  width: 100%;
  height: 50px;
}

text {
  font-family: Helvetica, Arial, sans-serif;
}


</style>
