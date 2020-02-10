<template>
  <div id="app">
    <header class="header">
      <h1 class="title">
        Boston Traffic Incidents
        <span class="subtitle">{{ yearsTitle }}</span>
      </h1>
      <nav class="header--navigation is-right" v-if="isLoading != true">
        <b-field>
          <b-radio-button
            size="is-small"
            v-model="incidentType"
            native-value="*"
            title="Show all incident types"
          >
            <span>All</span>
          </b-radio-button>

          <b-radio-button
            size="is-small"
            v-model="incidentType"
            native-value="mv"
            title="Show incidents involving motor vehicles"
          >
            <b-icon icon="car" pack="mdi" size="is-small"></b-icon>
            <span>Motor vehicle</span>
          </b-radio-button>

          <b-radio-button
            size="is-small"
            v-model="incidentType"
            native-value="bike"
            title="Show incidents involving bikes"
          >
            <b-icon icon="bike" pack="mdi" size="is-small"></b-icon>
            <span>Bike</span>
          </b-radio-button>
          <b-radio-button
            size="is-small"
            v-model="incidentType"
            native-value="ped"
            title="Show incidents involving pedestrians"
          >
            <b-icon icon="walk" pack="mdi" size="is-small"></b-icon>
            <span>Pedestrian</span>
          </b-radio-button>
        </b-field>
      </nav>
    </header>
    <section class="vis" v-show="isLoading != true">
      <geo-heatmap
        :neighborhoods="neighborhoods"
        :stations="stations"
        :allIncidents="incidents"
        :allSummary="incidentsSummary"
        :year="year"
        :month="month"
        :incidentType="incidentType"
      ></geo-heatmap>
    </section>
    <div class="app--footer">&copy; 2020 Ketul Mavani</div>
  </div>
</template>

<script>
// import HelloWorld from "@/components/HelloWorld.vue";
import axios from "axios";
import * as resources from "@/data/resources";
import GeoHeatmap from "@/views/GeoHeatmap.vue";
// import { toggleSpinner } from "@/utils";

export default {
  name: "home",
  components: { GeoHeatmap },
  data() {
    return {
      isLoading: true,

      neighborhoods: undefined,
      stations: undefined,
      incidents: undefined,
      incidentsSummary: {
        yearly: undefined,
        monthly: undefined,
        hourly: undefined
      },

      incidentType: "*",

      animate: false,
      years: [],
      year: 2015,
      month: 1,

      updateInterval: undefined
    };
  },
  async beforeMount() {
    let response;

    response = await axios.get(resources.NEIGHBORHOODS);
    this.neighborhoods = Object.freeze(response.data);
    console.log("Retrieved Neighborhoods");

    response = await axios.get(resources.POLICE_STATIONS);
    this.stations = Object.freeze(response.data);

    response = await axios.get(resources.VISION_ZERO);
    let years = new Set();
    let summary = {};
    response.data.data.forEach(d => {
      years.add(d.year);
      d.id = d.year * 100 + d.month;
      d.lat = +d.lat;
      d.long = +d.long;
      summary[d.year] || (summary[d.year] = { year: d.year, total: 0 });
      summary[d.year][d.mode_type] = (summary[d.year][d.mode_type] || 0) + 1;
      summary[d.year]["total"] = (summary[d.year]["total"] || 0) + 1;
    });
    this.incidents = Object.freeze(response.data.data);
    this.years.push(...years);
    this.years.sort();
    this.year = this.years[0];
    this.incidentsSummary.yearly = Object.values(summary).map(s => ({
      name: s.year,
      ...s
    }));
    this.incidentsSummary.yearly.columns = ["mv", "bike", "ped"];
    this.incidentsSummary.yearly.titles = {
      mv: "Motor Vehicle",
      bike: "Bike",
      ped: "Pedestrian"
    };
    console.log("Retrieved Incidents Data");

    if (this.animate) {
      this.updateInterval = setInterval(() => {
        this.updateMap();
      }, 400);
    } else {
      this.year = this.years[this.years.length - 1];
      this.month = 12;
    }

    this.isLoading = false;
  },
  watch: {},
  computed: {
    yearsTitle() {
      if (this.years.length == 0) return "";
      let first = this.years[0];
      let last = this.years[this.years.length - 1];
      return `${first} to ${last}`;
    }
  },
  methods: {
    updateMap() {
      if (this.year == 2019 && this.month == 12) {
        clearInterval(this.updateInterval);
        this.updateInterval = undefined;
        return;
      }
      if (this.month == 12) {
        this.year = this.year + 1;
        this.month = 1;
      } else {
        this.month++;
      }
    }
  }
};
</script>

<style lang="scss">
html {
  overflow-x: auto !important;
  overflow-y: auto !important;
}
body {
  font-family: "Montserrat", "Arial", sans-serif;
}
#app {
  font-family: "Montserrat", "Arial", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #aaa;
  padding: 1rem;
}
.vis {
  display: flex;
  flex: 1;
  font-weight: 100;
  margin-top: 40px;
}
.header {
  position: fixed;
  left: 0;
  top: 0;
  height: 40px;
  display: flex;
  justify-content: space-between;
  flex: 1;
  padding: 1.5rem;
  width: 100%;
  &--navigation {
    opacity: 0.75;
  }
}
.app--footer {
  position: fixed;
  right: 0.75rem;
  bottom: 0.5rem;
  opacity: 0.4;
}
</style>
