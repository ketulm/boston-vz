<template>
  <svg class="barchart" ref="barchart" :height="height" :width="width"></svg>
</template>

<script>
import { HOURS, MONTHS } from "@/data/constants";
import utils from "@/utils";
import * as d3 from "d3";
export default {
  name: "Barchart",
  props: [
    "margin",
    "chartData",
    "selected",
    "vertical",
    "type",
    "barHeight",
    "barWidth",
    "chartHeight"
  ],
  data() {
    return {
      barsData: undefined,
      min: 1,
      max: 1
    };
  },
  computed: {
    height() {
      return this.vertical ? this.chartHeight : this.barHeight;
    },
    width() {
      return this.vertical ? this.barWidth : this.chartHeight;
    }
  },
  watch: {
    chartData: {
      deep: true,
      handler() {
        if (this.chartData.totals == null) return;
        this.barsData = this.chartData.totals;
        if (this.barsData == null || this.barsData.length == 0) return;

        d3.select(this.$refs.barchart)
          .selectAll("*")
          .remove();
        let t = this.chartData.totals.map(d => d.total);
        this.min = d3.min(t);
        this.max = d3.max(t);
        if (this.type == "months") {
          this.updateBarChartHorizontal();
        } else {
          this.updateBarChartVertical();
        }
      }
    },
    selected: {
      deep: true,
      handler() {
        let svg = d3.select(this.$refs.barchart);
        svg
          .selectAll(".barchart__selected")
          .classed("barchart__selected", false);
        if (this.selected.type == "month") {
          svg
            .selectAll(
              `.month-${this.selected.month}.year-${this.selected.year}`
            )
            .classed("barchart__selected", true);
        }
        if (this.selected.type == "hour") {
          svg
            .selectAll(`.hour-${this.selected.hour}`)
            .classed("barchart__selected", true);
        }
      }
    }
  },
  methods: {
    updateBarChartHorizontal() {
      let svg = d3.select(this.$refs.barchart);
      let chartG = svg.append("g");
      let $view = this;

      chartG.attr("transform", `translate(${this.margin.left}, 0)`);

      chartG
        .append("g")
        .selectAll(".barchart__bars")
        .data(this.barsData)
        .enter()
        .append("rect")
        .attr("class", d => `barchart__bars`)
        .attr("x", (d, i) => i * this.barWidth)
        .attr("y", 0)
        .attr("height", (d, i) => {
          return this.barHeight * (d.total / this.max);
        })
        .attr("width", this.barWidth)
        .attr("stroke", "none")
        .attr("stroke-width", "0")
        .attr("fill", (d, i) => {
          let p = d.total / this.max;
          return utils.scaleColor(0.2);
        })
        .attr("opacity", 0.6)
        .append("title")
        .text(d => `${d.total} incidents, ${d.key}`);
      chartG
        .append("g")
        .selectAll(".barchart__ticks")
        .data(this.barsData)
        .enter()
        .append("rect")
        .attr("class", d => `${d.class} barchart__ticks`)
        .attr("x", (d, i) => i * this.barWidth)
        .attr("y", (d, i) => {
          return this.barHeight * (d.total / this.max) - 1.5;
        })
        .attr("height", 1.5)
        .attr("width", this.barWidth)
        .attr("stroke", "none")
        .attr("stroke-width", "0")
        .attr("fill", (d, i) => {
          let p = d.total / this.max;
          return utils.scaleColor(0.6);
        });
    },
    updateBarChartVertical() {
      let svg = d3.select(this.$refs.barchart);
      let chartG = svg.append("g");
      chartG.attr("transform", `translate(0,${this.margin.top})`);
      chartG
        .append("g")
        .selectAll(".barchart__bars")
        .data(this.barsData)
        .enter()
        .append("rect")
        .attr("class", d => `barchart__bars`)
        .attr("x", 0)
        .attr("y", (d, i) => i * this.barHeight)
        .attr("height", this.barHeight)
        .attr("width", (d, i) => {
          return this.barWidth * (d.total / this.max);
        })
        .attr("stroke", "none")
        .attr("stroke-width", "0")
        .attr("fill", (d, i) => {
          let p = d.total / this.max;
          return utils.scaleColor(0.2);
        })
        .attr("opacity", 0.6)
        .append("title")
        .text(d => `${d.total} incidents at ${d.key}`);
      chartG
        .append("g")
        .selectAll(".barchart__ticks")
        .data(this.barsData)
        .enter()
        .append("rect")
        .attr("class", d => `${d.class} barchart__ticks`)
        .attr("x", (d, i) => {
          return this.barWidth * (d.total / this.max) - 1.5;
        })
        .attr("y", (d, i) => i * this.barHeight)
        .attr("height", this.barHeight)
        .attr("width", 1.5)
        .attr("stroke", "none")
        .attr("stroke-width", "0")
        .attr("fill", (d, i) => {
          let p = d.total / this.max;
          return utils.scaleColor(0.6);
        });
    }
  }
};
</script>

<style lang="scss">
.barchart {
  &__bars:hover {
    opacity: 1;
  }
  &__selected {
    fill: #288be4;
  }
}
</style>
