<template>
  <div class="heatmap" ref="heatmap">
    <div class="heatmap--vis">
      <div class="heatmap--svg-container is-flex">
        <svg
          class="heatmap--svg"
          ref="heatmapSvg"
          :height="chartHeight"
          :width="chartWidth"
        ></svg>
        <barchart
          type="months"
          :vertical="false"
          :margin="margin"
          :chartData="stats.month"
          :barHeight="barHeight"
          :barWidth="cellHeight"
          :chartHeight="chartWidth"
          :selected="selected"
        >
        </barchart>
        <div
          class="selection--subtitle has-text-right"
          :style="{ 'padding-right': margin.right + 'px' }"
        >
          <span v-show="selected.incidents > 0">
            {{ selected.incidents }} incidents selected
          </span>
        </div>
      </div>
      <div class="heatmap--right-container">
        <barchart
          type="hours"
          :vertical="true"
          :margin="margin"
          :chartData="stats.hour"
          :barHeight="cellHeight"
          :barWidth="barHeight"
          :chartHeight="chartHeight"
          :selected="selected"
        >
        </barchart>
        <svg
          class="heatmap--legendsvg"
          ref="heatmapLegend"
          :height="chartHeight"
          :width="legendWidth + legendMargin.left"
        ></svg>
      </div>
    </div>
    <div class="sumvis--summary">
      <stackedbar
        :chartData="allSummary.yearly"
        :width="170"
        :height="220"
        title="All"
      >
      </stackedbar>
      <article class="sumvis--description is-half">
        <p>
          Vision Zero is a multi-national initiative that aims to eliminate
          serious or fatal traffic incidents by 2030. This visualization shows
          all the serious incidents that occurred in Boston, MA
          {{ yearRange }} using the data provided by
          <a
            href="https://data.boston.gov/dataset/vision-zero-crash-records"
            target="_blank"
            >data.boston.gov</a
          >.
        </p>
        <br />
        <p>
          This interactive visualization capability shows geographic and
          temporal hotspots where many of these incidents occur.
        </p>
        <br />
        <p>
          Using the incident type filter, places where serious incidents
          involving pedestrian or bicycle can be focused on. Using the calendar
          chart, incidents that occure at certain hour, in certain month, or at
          certain hour across all years can be highlighted in the map view.
        </p>
        <br />
      </article>
    </div>
  </div>
</template>

<script>
import { HOURS, MONTHS } from "@/data/constants";
import utils from "@/utils";
import * as d3 from "d3";
import Barchart from "@/components/Barchart";
import Stackedbar from "@/components/Stackedbar";
export default {
  name: "heatmap",
  props: ["allIncidents", "boxSelectedIncidents", "incidentType", "allSummary"],
  components: { Barchart, Stackedbar },
  data() {
    return {
      cellWidth: 13,
      cellHeight: 13,
      barHeight: 25,

      margin: {
        bottom: 2,
        top: 50,
        left: 50,
        right: 5
      },

      legendWidth: 60,
      legendMargin: {
        top: 60,
        left: 8
      },

      chart: {
        sizeScale: undefined
      },

      incidents: undefined,
      nested: undefined,

      years: [],
      months: MONTHS,
      hours: HOURS,

      stats: {
        year: {
          min: Infinity,
          max: -Infinity,
          totals: undefined
        },
        month: {
          min: Infinity,
          max: -Infinity,
          totals: undefined
        },
        hour: {
          min: Infinity,
          max: -Infinity,
          totals: undefined
        }
      },

      selected: {
        hour: undefined,
        month: undefined,
        year: undefined,
        type: undefined,
        incidents: undefined
      }
    };
  },
  watch: {
    allIncidents() {
      this.filterAndProcessIncidents();
      this.years.push(...this.nested.map(d => d.key));
      this.clearChart();
      this.updateChart();
    },
    incidentType() {
      this.selected.hour = undefined;
      this.selected.month = undefined;
      this.selected.year = undefined;
      this.selected.type = undefined;
      this.selected.incidents = 0;
      this.filterAndProcessIncidents();
      this.clearChart();
      this.updateChart();
    },
    boxSelectedIncidents() {
      //this.showBoxSelectedIncidents();
    }
  },
  computed: {
    height() {
      return this.cellHeight * this.hours.length;
    },
    chartHeight() {
      return this.height + this.margin.top + this.margin.bottom;
    },
    width() {
      return this.years.length * this.months.length * this.cellWidth;
    },
    chartWidth() {
      return this.width + this.margin.left + this.margin.right;
    },
    legendHeight() {
      return this.cellHeight * 1.5;
    },
    yearRange() {
      if (this.allSummary && this.allSummary.yearly) {
        return `from ${this.allSummary.yearly[0].name} to ${
          this.allSummary.yearly[this.allSummary.yearly.length - 1].name
        }`;
      }
      return "from 2015 to 2020";
    }
  },
  methods: {
    clearChart() {
      d3.select(this.$refs.heatmapSvg)
        .selectAll("*")
        .remove();
      d3.select(this.$refs.heatmapLegend)
        .selectAll("*")
        .remove();

      this.$refs.heatmap.classList.remove("heatmap__visible");
    },
    filterAndProcessIncidents() {
      let filtered = this.allIncidents.filter(d => {
        return d.mode_type == this.incidentType || this.incidentType == "*";
      });

      this.nested = d3
        .nest()
        .key(d => d.year)
        .key(d => d.month)
        .sortKeys((a, b) => a - b)
        .key(d => d.hour)
        .sortKeys((a, b) => a - b)
        .entries(filtered);

      this.nested.forEach(year => {
        let ytotal = 0;
        year.values.forEach(month => {
          let mtotal = 0;
          month.values.forEach(hour => {
            let htotal = hour.values.length;
            this.stats.hour.min = Math.min(htotal, this.stats.hour.min);
            this.stats.hour.max = Math.max(htotal, this.stats.hour.max);
            hour.total = htotal;
            mtotal = mtotal + htotal;
          });
          month.total = mtotal;
          ytotal = ytotal + mtotal;
          this.stats.month.min = Math.min(mtotal, this.stats.month.min);
          this.stats.month.max = Math.max(mtotal, this.stats.month.max);
        });
        year.total = ytotal;
        this.stats.year.min = Math.min(ytotal, this.stats.year.min);
        this.stats.year.max = Math.max(ytotal, this.stats.year.max);
      });
      this.incidents = filtered;

      // compute total by hours
      let totalByHour = HOURS.map((h, i) => ({
        key: h,
        hour: i,
        class: `hour-total hour-${i}`,
        total: 0
      }));

      // compute total by month
      let totalsByMonth = this.nested.map(year => {
        return year.values.map(month => {
          let monthKey = MONTHS[+month.key];

          month.values.forEach(hour => {
            totalByHour[+hour.key].total += hour.total;
          });

          return {
            year: year.key,
            month: month.key,
            key: `${monthKey} ${year.key}`,
            class: `month-total month-${month.key} year-${year.key}`,
            total: month.total
          };
        });
      });

      // compute total by years
      let totalsByYear = this.nested.map(year => ({
        year: year.key,
        key: `${year.key}`,
        class: `year-total year-${year.key}`,
        total: year.total
      }));

      // update stats
      this.$set(this.stats.year, "totals", totalsByYear.flat());
      this.$set(this.stats.month, "totals", totalsByMonth.flat());
      this.$set(this.stats.hour, "totals", totalByHour.flat());
    },
    selectByHour(hr) {
      this.selected.year = undefined;
      this.selected.month = undefined;
      this.selected.hour = hr;
      this.selected.type = "hour";
      let selected = [];
      this.nested.forEach(year => {
        year.values.forEach(month => {
          month.values.forEach(hour => {
            if (hour.key == hr) {
              selected.push(...hour.values);
            }
          });
        });
      });
      this.selected.incidents = selected.length;
      this.$emit("selected", { selected, type: "hour" });
    },
    selectByMonth(year, month) {
      this.selected.year = year;
      this.selected.month = +month.key;
      this.selected.hour = undefined;
      this.selected.type = "month";
      let selected = [];
      month.values.forEach(hour => {
        selected.push(...hour.values);
      });
      this.selected.incidents = selected.length;
      this.$emit("selected", { selected, type: "month" });
    },
    createScale() {
      this.chart.sizeScale = d3
        .scaleSqrt()
        .domain([0, this.stats.hour.max])
        .range([0, (this.cellWidth - 1) * 0.5]);
    },
    updateChart() {
      // size scale
      let $view = this;
      this.createScale();
      let svg = d3.select(this.$refs.heatmapSvg);
      let chartG = svg
        .append("g")
        .attr("class", "heatmap--chart")
        .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
      let yearLabelsG = svg
        .append("g")
        .attr("class", "heatmap--year-labels labels");
      let hourLabelsG = svg
        .append("g")
        .attr("transform", `translate(0,${this.margin.top})`)
        .attr("class", "heatmap--hour-labels labels")
        .selectAll("text")
        .data(this.hours)
        .enter()
        .append("text")
        .attr("height", this.cellHeight)
        .attr("width", this.cellWidth)
        .attr("class", "heatmap--hour-label labels")
        .attr("alignment-baseline", "middle")
        .style("text-anchor", "end")
        .attr("transform", (d, i) => {
          let x = this.margin.left - 6;
          let y = this.cellHeight * (i + 1) - this.cellHeight / 2.0;
          return `translate(${x},${y})`;
        })
        .style("font-weight", "100")
        .style("font-size", "12px")
        .style("text-align", "left")
        .style("fill", "#aaa")
        .text(d => d)
        .on("click", function(d, i) {
          chartG.selectAll(".hour__selected").classed("hour__selected", false);
          chartG.selectAll(`.hour-${i}`).classed("hour__selected", true);
          svg.selectAll(".label__selected").classed("label__selected", false);
          d3.select(this).classed("label__selected", true);
          $view.selectByHour(i);
        });

      let yearColumnCenter = (12 * this.cellWidth) / 2;

      // three level nesting, year -> month -> hour
      this.nested.forEach((year, y) => {
        let yx = y * 12 * this.cellWidth;
        let ygroup = chartG
          .append("g")
          .attr("class", d => `year year-${year.key}`)
          .attr("class", "year")
          .attr("transform", `translate(${yx},0)`);
        ygroup
          .append("text")
          .attr("class", "heatmap--year-label label")
          .attr("transform", `translate(${yearColumnCenter},-38)`)
          .style("font-weight", "100")
          .style("font-size", "16px")
          .style("text-align", "center")
          .style("fill", "#aaa")
          .attr("alignment-baseline", "middle")
          .style("text-anchor", "middle")
          .text(year.key)
          .append("title")
          .text(`${year.total} incidents in year ${year.key}`);
        ygroup
          .append("rect")
          .attr("class", "heatmap--column-sep")
          .attr("transform", `translate(${yearColumnCenter * 2},-20)`)
          .attr("width", ".25")
          .attr("height", this.height + 20)
          .style("fill", "#aaa")
          .style("opacity", 0.9);

        year.values.forEach((month, m) => {
          let mx = m * this.cellWidth;
          let mgroup = ygroup
            .append("g")
            .attr("class", d => `month month-${month.key}`)
            .attr("transform", `translate(${mx},0)`);
          mgroup
            .append("text")
            .attr("class", "heatmap--month-label label")
            .attr("transform", `translate(${this.cellWidth / 2},${-10})`)
            .style("font-weight", "100")
            .style("font-size", "11px")
            .attr("alignment-baseline", "middle")
            .style("text-anchor", "middle")
            .style("fill", "#aaa")
            .text(month.key)
            .on("click", function(d, i) {
              chartG
                .selectAll(".hour__selected")
                .classed("hour__selected", false);
              mgroup.selectAll(`.hour`).classed("hour__selected", true);
              svg
                .selectAll(".label__selected")
                .classed("label__selected", false);
              d3.select(this).classed("label__selected", true);
              $view.selectByMonth(year.key, month);
            });

          month.values.forEach((hour, h) => {
            let hourKey = +hour.key;
            let total = hour.values.length;
            let p = Math.max(0.3, total / this.stats.hour.max);
            //let clr = d3.color(d3.interpolateGreys(1 - p)).hex();
            let clr = utils.scaleColor(p);
            // let clr = d3.color(d3.interpolateOranges(1 - p)).hex();
            let rsize = this.chart.sizeScale(total);
            mgroup
              .append("circle")
              .attr("class", d => `hour hour-${hour.key}`)
              .attr("cx", this.cellWidth / 2.0)
              .attr("cy", hourKey * this.cellHeight + this.cellHeight / 2)
              .attr("r", rsize)
              .attr("fill", clr)
              .attr("opacity", 0.6)
              .attr("stroke", "none")
              .on("mouseover", function(d, i) {
                d3.select(this).classed("hour__hovered", true);
              })
              .on("mouseout", function(d, i) {
                d3.select(this).classed("hour__hovered", false);
              })
              .on("click", function(d, i) {
                svg
                  .selectAll(".label__selected")
                  .classed("label__selected", false);
                svg
                  .selectAll(".hour__selected")
                  .classed("hour__selected", false);
                d3.select(this).classed("hour__selected", true);
                $view.$emit("selected", {
                  selected: hour.values,
                  type: "single"
                });
                $view.selected.type = "single";
                $view.selected.incidents = hour.values.length;
              })
              .append("title")
              .text(
                `${total} incidents at ${this.hours[hour.key]} in ${
                  this.months[month.key]
                } ${year.key}`
              );
          });
        });
      });
      this.updateLegend();

      if (!this.$refs.heatmap.classList.contains("heatmap__visible")) {
        this.$refs.heatmap.classList.add("heatmap__visible");
      }
    },

    showBoxSelectedIncidents() {
      this.createScale();
      let nested = d3
        .nest()
        .key(d => d.year)
        .key(d => d.month)
        .sortKeys((a, b) => a - b)
        .key(d => d.hour)
        .sortKeys((a, b) => a - b)
        .entries(this.boxSelectedIncidents);

      // size scale
      let svg = d3.select(this.$refs.heatmapSvg);
      svg.select(".heatmap--selected").remove();
      let selectionG = svg
        .append("g")
        .attr("class", "heatmap--selected")
        .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

      let clr = "hsl(348, 100%, 61%)";
      // three level nesting, year -> month -> hour
      nested.forEach((year, y) => {
        let yx = y * 12 * this.cellWidth;
        let ygroup = selectionG
          .append("g")
          .attr("class", d => `year year-${year.key}`)
          .attr("class", "year")
          .attr("transform", `translate(${yx},0)`);
        year.values.forEach((month, m) => {
          let mx = m * this.cellWidth;
          let mgroup = ygroup
            .append("g")
            .attr("class", d => `month month-${month.key}`)
            .attr("transform", `translate(${mx},0)`);
          month.values.forEach((hour, h) => {
            let hourKey = +hour.key;
            let total = hour.values.length;
            let p = Math.max(0.3, total / this.stats.hour.max);
            let rsize = this.chart.sizeScale(total);
            mgroup
              .append("circle")
              .attr("class", d => `hour hour-${hour.key}`)
              .attr("cx", this.cellWidth / 2.0)
              .attr("cy", hourKey * this.cellHeight + this.cellHeight / 2)
              .attr("r", rsize)
              .attr("fill", clr)
              .attr("opacity", 1)
              .attr("stroke", clr)
              .append("title")
              .text(
                `${total} incidents at ${this.hours[h]} in ${this.months[m]} ${year.key}`
              );
          });
        });
      });
    },

    updateLegend() {
      let ticks = d3
        .scaleLinear()
        .domain([0, this.stats.hour.max])
        .nice()
        .ticks(5);

      if (ticks[0] < 5) ticks[0] = this.stats.hour.min;

      let svg = d3.select(this.$refs.heatmapLegend);

      let leftMargin = this.legendMargin.left;
      let topMargin = this.legendMargin.top + this.cellHeight * 2.25;
      let rowHeight = this.cellHeight * 1.25;

      let title = svg
        .append("text")
        .attr("class", d => `legendTitle`)
        .attr("x", leftMargin)
        .attr("y", (d, i) => this.legendMargin.top)
        .style("font-weight", "100")
        .style("font-size", "11px")
        .attr("alignment-baseline", "middle")
        .style("text-anchor", "left")
        .style("fill", "#aaa")
        .text("");
      title
        .append("tspan")
        .attr("x", leftMargin)
        .attr("y", (d, i) => this.legendMargin.top)
        .text("# of");
      title
        .append("tspan")
        .attr("x", leftMargin)
        .attr("y", (d, i) => this.legendMargin.top + this.cellHeight)
        .text("Incidents");

      let g = svg.append("g");
      g.selectAll(".legendDots")
        .data(ticks)
        .enter()
        .append("circle")
        .attr("class", d => `legendDots legend-${d}`)
        .attr("cx", leftMargin + 10)
        .attr("cy", (d, i) => topMargin + rowHeight * i)
        .attr("r", d => this.chart.sizeScale(d))
        .attr("fill", d =>
          utils.scaleColor(Math.max(0.3, d / this.stats.hour.max))
        )
        .attr("opacity", 0.6)
        .attr("stroke", "none");
      g.selectAll(".legendLabels")
        .data(ticks)
        .enter()
        .append("text")
        .attr("class", d => `legendLabels legend-${d}`)
        .attr("x", leftMargin + 10 + this.cellWidth)
        .attr("y", (d, i) => topMargin + rowHeight * i)
        .style("font-weight", "100")
        .style("font-size", "11px")
        .attr("alignment-baseline", "middle")
        .style("text-anchor", "left")
        .style("fill", "#aaa")
        .attr("opacity", 0.6)
        .text(d => d);
    }
  }
};
</script>

<style lang="scss">
.heatmap {
  display: flex;
  flex-direction: column;
  flex: 0;
  flex-wrap: nowrap;

  opacity: 0;
  transition: opacity 1s;
  margin-top: 35px;

  &__visible {
    opacity: 1;
  }
  &--hour-label,
  &--month-label {
    cursor: pointer;
    user-select: none;
  }
  &--year-label {
    user-select: none;
  }
  &--svg-container {
    flex-direction: column;
  }
  &--right-container {
    flex-wrap: nowrap;
    min-width: 120px;
  }
  &--vis {
    display: flex;
    flex-direction: row;
    flex: 0;
    flex-wrap: nowrap;
    justify-content: center;
  }
}
.hour {
  cursor: pointer;
  &__selected,
  &__hovered {
    stroke: #288be4;
    stroke-width: 1.75;
    opacity: 1;
  }
}
.label__selected {
  fill: #288be4 !important;
}
.selection--subtitle {
  padding-top: 1rem;
  height: 40px;
}
.sumvis {
  &--container {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  &--summary {
    display: flex;
    flex-direction: row;
    padding-top: 30px;
    margin-left: 30px;
  }
  &--description {
    padding-left: 6px;
    padding-right: 100px;
    text-align: justify;
    overflow: auto;
  }
}
</style>
