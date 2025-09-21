<template>
  <div>
    <br>
    <!-- <label for="range-year" class="year-selection-label">Year Selection</label> -->
    <b-form-input id="range-year" v-model="selectedYear" type="range" min="2013" max="2022"></b-form-input>

    <div class="slider-labels">
      <span v-for="year in years" :key="year" class="slider-label">{{ year }}</span>
    </div>

    <!-- <div class="mt-2">Selected Year: {{ selectedYear }}</div> -->
  </div>
</template>

<script>
export default {
  name: 'YearSlider',
  props: {
  },
  data() {
    return {
      years: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022],
    };
  },
  mounted() {
  },
  methods: {
  },
  computed: {
    selectedYear: {
      get() {
        return this.$store.getters.selectedYear;
      },
      set(val) {
        this.$store.commit('changeSelectedYear', val);
      },
    },
  },
  watch: {
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.year-selection-label {
  font-weight: bold;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  padding: 30 10px;
  margin-top: -10px;
}

.slider-label {
  font-size: 14px;
  position: relative;
  top: 5px;
}

.slider-label::before {
  content: ''; /* Empty content for the tick */
  display: block; /* Block-level element */
  width: 2px; /* Tick width */
  height: 10px; /* Tick height */
  background-color: black; /* Tick color */
  margin: 0 auto; /* Center the tick */
  margin-bottom: 10px;
  position: relative;
  top: 5px; /* Adjust to position the tick under the label */
}
</style>
