<template>
  <div class="stackedbar--container">
    <div class="stackedbar--title"></div>
    <svg
      class="stackedbar"
      ref="stackedbar"
      :height="chartHeight"
      :width="chartWidth"
    ></svg>
  </div>
</template>

<script>
import { HOURS, MONTHS } from "@/data/constants";
import utils from "@/utils";
import * as d3 from "d3";
export default {
  name: "stackedbar",
  props: ["chartData", "selected", "width", "height", "title"],
  data() {
    return {
      margin: {
        bottom: 30,
        top: 10,
        left: 10,
        right: 10
      }
    };
  },
  computed: {
    chartHeight() {
      return +this.height + this.margin.top + this.margin.bottom;
    },
    chartWidth() {
      return +this.width + this.margin.left + this.margin.right;
    }
  },
  watch: {
    chartData: {
      deep: true,
      handler() {
        this.updateBarChart();
        console.log(this.chartData);
      }
    }
  },
  methods: {
    updateBarChart() {
      let svg = d3.select(this.$refs.stackedbar);

      let chartG = svg
        .append("g")
        .attr(
          "transform",
          `translate(${this.margin.left}, ${this.margin.top})`
        );

      let series = d3
        .stack()
        .keys(this.chartData.columns)(this.chartData)
        .map(d => (d.forEach(v => (v.key = d.key)), d));

      let x = d3
        .scaleBand()
        .domain(this.chartData.map(d => d.name))
        .range([this.margin.left, this.width - this.margin.right])
        .padding(0.1);

      let y = d3
        .scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
        .rangeRound([this.height - this.margin.bottom, this.margin.top]);
      let color = d3
        .scaleOrdinal()
        .range([
          utils.scaleColor(0.3),
          utils.scaleColor(0.4),
          utils.scaleColor(0.5)
        ])
        .domain(this.chartData.columns);

      let bars = chartG
        .append("g")
        .selectAll("g")
        .data(series);
      bars
        .join("g")
        .attr("stroke", d => color(d.key))
        .attr("stroke-width", ".5")
        .attr("fill", d => color(d.key))
        .attr("opacity", 0.5)
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", (d, i) => x(d.data.name))
        .attr("y", (d, i) => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", x.bandwidth())
        .append("title")
        .text(d => {
          console.log(d);
          let n = d[1] - d[0];
          let title = this.chartData.titles[d.key];
          return `${n} ${title} incidents in ${d.data.name}`;
        });

      let xAxis = svg
        .append("g")
        .attr(
          "transform",
          `translate(${this.margin.left},${this.height - this.margin.top})`
        )
        .call(d3.axisBottom(x).tickSizeOuter(0));
      xAxis.selectAll("line").remove();
      xAxis.selectAll("path").remove();
      xAxis
        .selectAll("text")
        .attr("alignment-baseline", "middle")
        .style("text-anchor", "end")
        .style("font-size", "14px")
        .style("font-family", "Montserrat")
        .style("font-weight", "100")
        .attr("dy", "-7px")
        .style("user-select", "none")
        .attr("transform", "rotate(-90)");

      let barLabels = chartG
        .append("g")
        .selectAll(".bar--label")
        .data(this.chartData)
        .enter()
        .append("text")
        .attr("class", "bar--label")
        .attr("y", d => y(d.total) - 10)
        .attr("x", d => x(d.name))
        .style("font-size", "12px")
        .style("font-family", "Montserrat")
        .style("font-weight", "100")
        .attr("fill", utils.scaleColor(0.7))
        .attr("opacity", 0.5)
        .text(d => d.total);
    },

    updateBarChartH() {
      let svg = d3.select(this.$refs.stackedbar);

      let chartG = svg
        .append("g")
        .attr(
          "transform",
          `translate(${this.margin.left}, ${this.margin.top})`
        );

      let series = d3
        .stack()
        .keys(this.chartData.columns)(this.chartData)
        .map(d => (d.forEach(v => (v.key = d.key)), d));

      let x = d3
        .scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))])
        .rangeRound([this.width - this.margin.left, this.margin.right]);

      let y = d3
        .scaleBand()
        .domain(this.chartData.map(d => d.name))
        .range([this.margin.top, this.height - this.margin.bottom])
        .padding(0.1);

      var color = d3
        .scaleOrdinal()
        .range([
          utils.scaleColor(0.3),
          utils.scaleColor(0.4),
          utils.scaleColor(0.5)
        ])
        .domain(this.chartData.columns);

      chartG
        .append("g")
        .selectAll("g")
        .data(series)
        .join("g")
        .attr("stroke", d => color(d.key))
        .attr("stroke-width", ".5")
        .attr("fill", d => color(d.key))
        .attr("opacity", 0.5)
        .selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", (d, i) => x(d[1]))
        .attr("y", (d, i) => y(d.data.name))
        .attr("width", d => x(d[0]) - x(d[1]))
        .attr("height", y.bandwidth())
        .append("title")
        .text(d => `${d.data.name} ${d.key}`);

      let xAxis = svg
        .append("g")
        .attr(
          "transform",
          `translate(${this.margin.left},${this.height - this.margin.top})`
        )
        .call(d3.axisLeft(y).tickSizeOuter(0));
      xAxis.selectAll("line").remove();
      xAxis.selectAll("path").remove();
      xAxis
        .selectAll("text")
        .attr("alignment-baseline", "middle")
        .style("text-anchor", "end")
        .style("font-size", "14px")
        .style("font-family", "Montserrat")
        .style("font-weight", "100")
        .attr("dy", "-7px")
        .style("user-select", "none")
        .attr("transform", "rotate(-90)");
    }
  }
};
</script>

<style></style>
