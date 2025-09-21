<template>
  <div id="app">
    <div class="container-fluid" >
      <div class="row" style="height: 600px;">
        <div class="col-md-12 scale-half">
          <component1/>
          <br>
          <component2/>
        </div> 
      </div>
      
      <br>
      <br>
      <br>
      <br>
      <div class="row" style="height: 900px;">
        <div class="col-md-12 scale-half-second">
          <div class="p-2 custom-col-9-5">
            <component3 />
          </div>
          <div class="p-2">
            <component4 />
          </div>
          
        </div>
      </div>
<!-- 
      <div class="row">
        <div class="p-2 col-md-12">
            <component5 />
          </div>
      </div> -->
      

    </div>
  </div>
</template>

<script>
//histo
import component1 from './components/YearSliderRangeV3.vue';
import component2 from './components/History.vue';

// dots 
import component3 from './components/YearSlider.vue';
import component4 from './components/ScatterplotV2.vue';

//individual
// import component5 from './components/SliderV2.vue';
export default {
  name: 'App',
  components: {
    component1, component2, component3, component4,  
    // component5
  },
  mounted() {
    this.$store.dispatch('loadData');
  },
}
</script>
 
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 20px;
}

.scale-half {
  transform: scale(0.87);
  transform-origin: top left;
  display: inline-block; /* prevent collapsing */
}

.scale-half-second {
  transform: scale(0.87);
  transform-origin: top left;
}

.custom-col-9-5 {
  flex: 0 0 79.17%;
  max-width: 79.17%;
}
</style>
