<template>
  <div class="donutchart--container">
    <div class="donutchart--title"></div>
    <svg
      class="donutchart"
      ref="donutchart"
      :height="height"
      :width="width"
    ></svg>
  </div>
</template>

<script>
import { HOURS, MONTHS } from "@/data/constants";
import utils from "@/utils";
import * as d3 from "d3";
export default {
  name: "Donutchart",
  props: ["chartData", "selected", "width", "height", "title"],
  data() {
    return {
      margin: {
        bottom: 10,
        top: 10,
        left: 10,
        right: 10
      },
      donutdata: undefined
    };
  },
  watch: {
    chartData: {
      deep: true,
      handler() {
        this.updateDonutChart();
      }
    }
  },
  methods: {
    updateDonutChart() {
      let svg = d3.select(this.$refs.donutchart);
      let chartG = svg
        .append("g")
        .attr("transform", `translate(${this.width / 2}, ${this.height / 2})`);

      let pieFunction = d3
        .pie()
        .sort(null)
        .value(function(d) {
          return d.total;
        });
      let piedata = pieFunction(this.chartData.totals);

      let nyears = this.chartData.totals.length;

      let r = this.height / 2;
      let arc = d3
        .arc()
        .innerRadius(r * 0.5)
        .outerRadius(r * 0.7);
      let outerArc = d3
        .arc()
        .innerRadius(r * 0.9)
        .outerRadius(r * 0.9);

      chartG
        .selectAll(".donutchart--slices")
        .data(piedata)
        .enter()
        .append("path")
        .attr("class", "donutchart--slices")
        .attr("d", arc)
        .attr("stroke", "none")
        .attr("opacity", 0.7)
        .attr("fill", (d, i) => utils.scaleColor(i / nyears));
    }
  }
};
</script>

<style></style>
