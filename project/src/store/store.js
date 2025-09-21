import Vue from 'vue';
import Vuex from 'vuex';
import * as d3 from 'd3';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    selectedYear: 2013,
    selectedYearRange: {
      startYear: 2013,
      endYear: 2022,
    },
    selectedStates: [],
    personaleIncome: [],
    baDegreeOrHigher: [],
    amsScore: [],
    amsScore_1: [],
    amsScore_2: [],
    feature2013: [],
    feature2014: [],
    feature2015: [],
    feature2016: [],
    feature2017: [],
    feature2018: [],
    feature2019: [],
    feature2020: [],
    feature2021: [],
    feature2022: [],

    amsScore_1_feature2013: [],
    amsScore_1_feature2014: [],
    amsScore_1_feature2015: [],
    amsScore_1_feature2016: [],
    amsScore_1_feature2017: [],
    amsScore_1_feature2018: [],
    amsScore_1_feature2019: [],
    amsScore_1_feature2020: [],
    amsScore_1_feature2021: [],
    amsScore_1_feature2022: [],

    amsScore_2_feature2013: [],
    amsScore_2_feature2014: [],
    amsScore_2_feature2015: [],
    amsScore_2_feature2016: [],
    amsScore_2_feature2017: [],
    amsScore_2_feature2018: [],
    amsScore_2_feature2019: [],
    amsScore_2_feature2020: [],
    amsScore_2_feature2021: [],
    amsScore_2_feature2022: [],

    // selectedFeature: null,
  },
  mutations: {
    changeSelectedYear (state, year) {
      state.selectedYear = year;
    },
    changeSelectedState(state, val) {
      state.selectedStates.push(val);
    },
    changeSelectedYearRange(state, val) {
      state.selectedYearRange.startYear = val.startYear;
      state.selectedYearRange.endYear = val.endYear;
    },
    // changeSelectedFeature(state, feat) {
    //   state.selectedFeature = feat;
    // },   
  },
  getters: {
    selectedYear: (state) => state.selectedYear,
    selectedStates: (state) => state.selectedStates,
    selectedYearRange: (state) => state.selectedYearRange,
    personaleIncome (state) {
      let result = [];
      for (let i = 0; i < state.personaleIncome.length; i++) {
        if (state.selectedYear in state.personaleIncome[i]) {
          result.push({
            state: state.personaleIncome[i].State,
            value: +state.personaleIncome[i][state.selectedYear]
          })
        }
      }
      return result;
    },
    baDegreeOrHigher (state) {
      let result = [];
      for (let i = 0; i < state.baDegreeOrHigher.length; i++) {
        if (state.selectedYear in state.baDegreeOrHigher[i]) {
          result.push({
            state: state.baDegreeOrHigher[i].State,
            value: state.baDegreeOrHigher[i][state.selectedYear]
          })
        }
      }
      return result;
    },
    amsScore(state) {
      let year = state.selectedYear;
      
      let result = [];
      for (let i = 0; i < state.amsScore.length; i++) {
        // console.log(+state.amsScore[i][year.toString()].split(",")[1].trim()) 
        result.push({
          year: state.selectedYear,
          value: +state.amsScore[i][year.toString()].split(",")[1].trim(),
          pid: state.amsScore[i][year.toString()].split(",")[0].replace("[", ""),
        })
      }
      return result;
    },
    amsScore_1(state) {
      let year = state.selectedYear;

      let result = [];
      for (let i = 0; i < state.amsScore_1.length; i++) {

        result.push({
          year: state.selectedYear,
          value: +state.amsScore_1[i][year.toString()].split(",")[1].trim(),
          pid: state.amsScore_1[i][year.toString()].split(",")[0].replace("[", ""),
        })
      }
      return result;
    },
    amsScore_2(state) {
      let year = state.selectedYear;

      let result = [];
      for (let i = 0; i < state.amsScore_2.length; i++) {

        result.push({
          year: state.selectedYear,
          value: +state.amsScore_2[i][year.toString()].split(",")[1].trim(),
          pid: state.amsScore_2[i][year.toString()].split(",")[0].replace("[", ""),
        })
      }
      return result;
    },
    amsScoreByYear: (state) => (year) => {
      let result = [];
      for (let i = 0; i < state.amsScore.length; i++) {
        result.push({
          year: year,
          value: +state.amsScore[i][year.toString()].split(",")[1].trim(),
          pid: state.amsScore[i][year.toString()].split(",")[0].replace("[", ""),
        })
      }
      return result;
    },
    detailedScore(state) {
      let year = state.selectedYear;
      let result = [];
      for (let i = 0; i < state.amsScore.length; i++) {
        let arr = JSON.parse(state.amsScore[i][year.toString()]);
        result.push({
          year: state.selectedYear,
          total: arr[1],
          value: arr[2],
          pid: state.amsScore[i][year.toString()].split(",")[0].replace("[", ""),
        })
      }
      
      return result;
    },
    detailedScore_1(state) {
      let year = state.selectedYear;
      let result = [];
      for (let i = 0; i < state.amsScore_1.length; i++) {
        let arr = JSON.parse(state.amsScore_1[i][year.toString()]);
        result.push({
          year: state.selectedYear,
          total: arr[1],
          value: arr[2],
          pid: state.amsScore_1[i][year.toString()].split(",")[0].replace("[", ""),
        })
      }

      return result;
    },
    detailedScore_2(state) {
      let year = state.selectedYear;
      let result = [];
      for (let i = 0; i < state.amsScore_2.length; i++) {
        let arr = JSON.parse(state.amsScore_2[i][year.toString()]);
        result.push({
          year: state.selectedYear,
          total: arr[1],
          value: arr[2],
          pid: state.amsScore_2[i][year.toString()].split(",")[0].replace("[", ""),
        })
      }

      return result;
    },
    yearlyScore(state) {
      return state.amsScore;
    },
    //this can be optimized
    fullFeature(state) {
      let year = state.selectedYear.toString();
      var featureData = null;
      switch (year) {
        case '2013':
          featureData = state.feature2013;
          break;
        case '2014':
          featureData = state.feature2014;
          break;
        case '2015':
          featureData = state.feature2015;
          break;
        case '2016':
          featureData = state.feature2016;
          break;
        case '2017':
          featureData = state.feature2017;
          break;
        case '2018':
          featureData = state.feature2018;
          break;
        case '2019':
          featureData = state.feature2019;
          break;
        case '2020':
          featureData = state.feature2020;
          break;
        case '2021':
          featureData = state.feature2021;
          break;
        case '2022':
          featureData = state.feature2022;
          break;
        default:
        // code block
      }

      let result = [];
      for (let i = 0; i < featureData.length; i++) {
        let jsonString = featureData[i][year].replace(/'/g, '"');
        result.push({
          year: state.selectedYear,
          value: JSON.parse(jsonString),
          pid: featureData[i][''],
        })
      }
      return result;
    },
    amsScore_1_fullFeature(state) {
      let year = state.selectedYear.toString();
      var featureData = null;
      switch (year) {
        case '2013':
          featureData = state.amsScore_1_feature2013;
          break;
        case '2014':
          featureData = state.amsScore_1_feature2014;
          break;
        case '2015':
          featureData = state.amsScore_1_feature2015;
          break;
        case '2016':
          featureData = state.amsScore_1_feature2016;
          break;
        case '2017':
          featureData = state.amsScore_1_feature2017;
          break;
        case '2018':
          featureData = state.amsScore_1_feature2018;
          break;
        case '2019':
          featureData = state.amsScore_1_feature2019;
          break;
        case '2020':
          featureData = state.amsScore_1_feature2020;
          break;
        case '2021':
          featureData = state.amsScore_1_feature2021;
          break;
        case '2022':
          featureData = state.amsScore_1_feature2022;
          break;
        default:
        // code block
      }

      let result = [];
      for (let i = 0; i < featureData.length; i++) {
        let jsonString = featureData[i][year].replace(/'/g, '"');
        result.push({
          year: state.selectedYear,
          value: JSON.parse(jsonString),
          pid: featureData[i][''],
        })
      }
      return result;
    },
    amsScore_2_fullFeature(state) {
      let year = state.selectedYear.toString();
      var featureData = null;
      switch (year) {
        case '2013':
          featureData = state.amsScore_2_feature2013;
          break;
        case '2014':
          featureData = state.amsScore_2_feature2014;
          break;
        case '2015':
          featureData = state.amsScore_2_feature2015;
          break;
        case '2016':
          featureData = state.amsScore_2_feature2016;
          break;
        case '2017':
          featureData = state.amsScore_2_feature2017;
          break;
        case '2018':
          featureData = state.amsScore_2_feature2018;
          break;
        case '2019':
          featureData = state.amsScore_2_feature2019;
          break;
        case '2020':
          featureData = state.amsScore_2_feature2020;
          break;
        case '2021':
          featureData = state.amsScore_2_feature2021;
          break;
        case '2022':
          featureData = state.amsScore_2_feature2022;
          break;
        default:
          
      }

      let result = [];
      for (let i = 0; i < featureData.length; i++) {
        let jsonString = featureData[i][year].replace(/'/g, '"');
        result.push({
          year: state.selectedYear,
          value: JSON.parse(jsonString),
          pid: featureData[i][''],
        })
      }
      return result;
    },
  },
  actions: {
    async loadData({state}) {
      // const data = await d3.csv('./yearly_score.csv');
      // state.amsScore = data;

      d3.csv('./usa_personal-income-by-state_2006-2019.csv').then((data) => { 
        state.personaleIncome = data;
      })

      d3.csv('./usa_ba-degree-or-higher_2006-2019.csv').then((data) => { 
        state.baDegreeOrHigher = data;
      })

      d3.csv('./yearly_score.csv').then((data) => {
        state.amsScore = data;
      })

      d3.csv('./yearly_score_1.csv').then((data) => {
        state.amsScore_1 = data;
      })

      d3.csv('./yearly_score_2.csv').then((data) => {
        state.amsScore_2 = data;
      })

      d3.csv('./mygroup2013.csv').then((data) => {
        state.feature2013 = data;
      })
      d3.csv('./mygroup2014.csv').then((data) => {
        state.feature2014 = data;
      })
      d3.csv('./mygroup2015.csv').then((data) => {
        state.feature2015 = data;
      })
      d3.csv('./mygroup2016.csv').then((data) => {
        state.feature2016 = data;
      })
      d3.csv('./mygroup2017.csv').then((data) => {
        state.feature2017 = data;
      })
      d3.csv('./mygroup2018.csv').then((data) => {
        state.feature2018 = data;
      })
      d3.csv('./mygroup2019.csv').then((data) => {
        state.feature2019 = data;
      })
      d3.csv('./mygroup2020.csv').then((data) => {
        state.feature2020 = data;
      })
      d3.csv('./mygroup2021.csv').then((data) => {
        state.feature2021 = data;
      })
      d3.csv('./mygroup2022.csv').then((data) => {
        state.feature2022 = data;
      })

      d3.csv('./mygroup2013_1.csv').then((data) => {
        state.amsScore_1_feature2013 = data;
      })
      d3.csv('./mygroup2014_1.csv').then((data) => {
        state.amsScore_1_feature2014 = data;
      })
      d3.csv('./mygroup2015_1.csv').then((data) => {
        state.amsScore_1_feature2015 = data;
      })
      d3.csv('./mygroup2016_1.csv').then((data) => {
        state.amsScore_1_feature2016 = data;
      })
      d3.csv('./mygroup2017_1.csv').then((data) => {
        state.amsScore_1_feature2017 = data;
      })
      d3.csv('./mygroup2018_1.csv').then((data) => {
        state.amsScore_1_feature2018 = data;
      })
      d3.csv('./mygroup2019_1.csv').then((data) => {
        state.amsScore_1_feature2019 = data;
      })
      d3.csv('./mygroup2020_1.csv').then((data) => {
        state.amsScore_1_feature2020 = data;
      })
      d3.csv('./mygroup2021_1.csv').then((data) => {
        state.amsScore_1_feature2021 = data;
      })
      d3.csv('./mygroup2022_1.csv').then((data) => {
        state.amsScore_1_feature2022 = data;
      })

      d3.csv('./mygroup2013_2.csv').then((data) => {
        state.amsScore_2_feature2013 = data;
      })
      d3.csv('./mygroup2014_2.csv').then((data) => {
        state.amsScore_2_feature2014 = data;
      })
      d3.csv('./mygroup2015_2.csv').then((data) => {
        state.amsScore_2_feature2015 = data;
      })
      d3.csv('./mygroup2016_2.csv').then((data) => {
        state.amsScore_2_feature2016 = data;
      })
      d3.csv('./mygroup2017_2.csv').then((data) => {
        state.amsScore_2_feature2017 = data;
      })
      d3.csv('./mygroup2018_2.csv').then((data) => {
        state.amsScore_2_feature2018 = data;
      })
      d3.csv('./mygroup2019_2.csv').then((data) => {
        state.amsScore_2_feature2019 = data;
      })
      d3.csv('./mygroup2020_2.csv').then((data) => {
        state.amsScore_2_feature2020 = data;
      })
      d3.csv('./mygroup2021_2.csv').then((data) => {
        state.amsScore_2_feature2021 = data;
      })
      d3.csv('./mygroup2022_2.csv').then((data) => {
        state.amsScore_2_feature2022 = data;
      })
    },
  }
})

export default store;
