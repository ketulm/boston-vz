<template>
  <div class="mapvis--container">
    <div class="mapvis" ref="mapvis">
      <div class="mapvis--title subtitle" v-if="numBoxSelectedIncidents > 0">
        {{ numBoxSelectedIncidents }} incidents
      </div>
      <svg
        class="mapvis--svg"
        ref="mapSvg"
        :height="height"
        :width="width - rightClip"
      ></svg>
      <canvas
        class="mapvis--canvas"
        ref="mapCanvas"
        :height="height"
        :width="width - rightClip"
      ></canvas>
      <svg
        class="mapvis--canvas__selection mapvis--canvas__selectionsvg"
        ref="mapSvgSelection"
        :height="height"
        :width="width - rightClip"
      ></svg>
      <canvas
        class="mapvis--canvas__selection"
        ref="mapCanvasSelection"
        :height="height"
        :width="width - rightClip"
      ></canvas>
    </div>
    <div class="sumvis--container">
      <heatmap
        :allIncidents="allIncidents"
        :boxSelectedIncidents="boxSelectedIncidents"
        :incidentType="incidentType"
        @selected="updateSelection"
      >
      </heatmap>
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
            <a href="https://data.boston.gov/dataset/vision-zero-crash-records"
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
            involving pedestrian or bicycle can be focused on. Using the
            calendar chart, incidents that occure at certain hour, in certain
            month, or at certain hour across all years can be highlighted in the
            map view.
          </p>
          <br />
        </article>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from "d3";
import d3hexgrid from "d3-hexgrid";
import topojson from "topojson";
import simpleheat from "simpleheat";
import Heatmap from "@/components/Heatmap.vue";
import Stackedbar from "@/components/Stackedbar";

export default {
  name: "GeoHeatmap",
  components: { Heatmap, Stackedbar },
  props: [
    "neighborhoods",
    "stations",
    "allIncidents",
    "allSummary",
    "year",
    "month",
    "incidentType"
  ],
  data() {
    return {
      height: 900,
      width: 1000,
      rightClip: 220,

      heatmapData: undefined,

      projection: undefined,
      path: undefined,

      incidents: undefined,
      quadtree: undefined,

      boxSelectedIncidents: [],
      numBoxSelectedIncidents: 0,

      hover: {
        x: 0,
        y: 0,
        r: 10
      },

      refreshing: false,

      selectedIncidents: []
    };
  },
  computed: {
    yearRange() {
      if (this.allSummary && this.allSummary.yearly) {
        return `from ${this.allSummary.yearly[0].name} to ${
          this.allSummary.yearly[this.allSummary.yearly.length - 1].name
        }`;
      }
      return "from 2015 to 2020";
    }
  },
  watch: {
    neighborhoods() {
      this.createMapVis();
    },
    stations() {
      //this.updateStations();
    },
    allIncidents() {
      this.convertData();
      this.processAndFilterData();
    },
    incidentType() {
      this.processAndFilterData();
      this.selectedIncidents = [];
      this.updateSelectionSvg();
      this.updateSelectionCanvas();
      this.updateHeatMap();
    },
    year() {
      this.updateHeatMap();
    },
    month() {
      this.updateHeatMap();
    },
    hover: {
      deep: true,
      handler() {
        this.moveHoverBox();
        this.updateHoverSelection();
      }
    },
    heatmapData() {
      this.updateHoverSelection();
    }
  },
  methods: {
    createMapVis() {
      this.projection = d3
        .geoMercator()
        .precision(0.1)
        .translate([this.width / 2, this.height / 2])
        .fitExtent(
          [
            [0, 0],
            [this.width, this.height]
          ],
          this.neighborhoods
        );
      this.path = d3.geoPath().projection(this.projection);
      let mapLayer = d3.select(this.$refs.mapSvg);
      mapLayer
        .append("g")
        .selectAll(".boundary")
        .data(this.neighborhoods.features)
        .enter()
        .append("path")
        .attr("class", "boundary")
        .attr("d", this.path)
        .attr("stroke", "#fff")
        .attr("stroke-width", ".2")
        .attr("stroke-opacity", ".8")
        .style("fill", "#222") //"#abc")
        .attr("title", d => d.properties.NEIGHBORHOOD);

      let hoverbox = mapLayer
        .append("rect")
        .attr("class", "hoverbox")
        .style("transform", `translate(0,0)`)
        .style("height", 0)
        .style("width", 0)
        .style("stroke", "none")
        .style("fill", "#ccc")
        .attr("x", 0)
        .attr("y", 0)
        .attr("opacity", 0.05);

      let $view = this;
      d3.select(this.$refs.mapCanvasSelection)
        .on("mousemove", function() {
          hoverbox.attr("visibility", "visible");
          [$view.hover.x, $view.hover.y] = d3.mouse(this);
        })
        .on("mouseout", function() {
          hoverbox.attr("visibility", "hidden");
        });
    },
    updateStations() {
      let mapLayer = d3.select(this.$refs.mapSvg);
      mapLayer
        .append("g")
        .selectAll(".station")
        .data(this.stations.features)
        .enter()
        .append("path")
        .attr("class", "station")
        .attr("d", this.path)
        .style("stroke", "none")
        .style("fill", "#ccc")
        .attr("opacity", 0.05);
    },
    convertData() {
      // convert coordinates
      this.allIncidents.forEach(d => {
        [d.x, d.y] = this.projection([d.long, d.lat]);
      });
    },
    processAndFilterData() {
      // filter data
      let filtered = this.allIncidents.filter(d => {
        return (
          (d.mode_type == this.incidentType || this.incidentType == "*") &&
          d.id < this.year * 100 + this.month
        );
      });
      // transform data for heatmap input
      this.heatmapData = filtered.map(d => [d.x, d.y, 1]);
      // create a quadtree
      this.quadtree = d3
        .quadtree()
        .x(d => d.x)
        .y(d => d.y);
      this.quadtree.addAll(filtered);
      this.incidents = filtered;
    },
    updateHeatMap() {
      this.$refs.mapvis.classList.remove("mapvis__visible");
      this.processAndFilterData();
      let heat = simpleheat(this.$refs.mapCanvas);
      heat.data(this.heatmapData);
      heat.radius(1.5, 2);
      heat.gradient({
        1: d3.interpolateGreys(0.3),
        0.5: d3.interpolateGreys(0.5),
        0: d3.interpolateGreys(1)
      });
      heat.draw(0.05);
      if (!this.$refs.mapvis.classList.contains("mapvis__visible")) {
        this.$refs.mapvis.classList.add("mapvis__visible");
      }
    },

    updateSelection({ selected, type }) {
      this.selectedIncidents = selected.map(d => [d.x, d.y, 1]);
      if (type == "single") {
        this.updateSelectionSvg();
        this.updateSelectionCanvas();
      } else {
        d3.select(this.$refs.mapSvgSelection)
          .selectAll("*")
          .remove();
        this.updateSelectionCanvas();
      }
    },
    updateSelectionSvg() {
      let svg = d3.select(this.$refs.mapSvgSelection);
      svg.selectAll("*").remove();
      let circles = svg
        .selectAll(".selected--incident")
        .data(this.selectedIncidents)
        .enter()
        .append("circle")
        .attr("class", "selected--incident")
        .attr("cx", d => d[0])
        .attr("cy", d => d[1])
        .attr("r", 4)
        .attr("stroke", "#111")
        .attr("stroke-width", "1")
        .style("fill", "#288be4")
        .style("opacity", 1);
    },
    updateSelectionCanvas() {
      let heat = simpleheat(this.$refs.mapCanvasSelection);
      heat.data(this.selectedIncidents);
      heat.radius(3, 0);
      heat.gradient({
        1: d3.interpolateBlues(0.75),
        0: d3.interpolateBlues(1)
      });
      heat.draw(0.05);
    },
    updateHoverSelection() {
      let r = this.hover.r;
      let [x0, y0] = [this.hover.x - r, this.hover.y - r];
      let [x3, y3] = [this.hover.x, this.hover.y];
      let points = [];
      this.quadtree.visit((node, x1, y1, x2, y2) => {
        if (!node.length) {
          do {
            var { x, y } = node.data;
            let selected = x >= x0 && x < x3 && y >= y0 && y < y3;
            if (selected) points.push(node.data);
          } while ((node = node.next));
        }
        return x1 >= x3 || y1 >= y3 || x2 < x0 || y2 < y0;
      });
      this.$set(this, "boxSelectedIncidents", points);
      this.numBoxSelectedIncidents = points && points.length;
    },
    moveHoverBox() {
      let mapLayer = d3.select(this.$refs.mapSvg);
      let { x, y, r } = this.hover;
      let r2 = this.hover.r / 2;
      mapLayer
        .select(".hoverbox")
        .attr("class", "hoverbox")
        .style(
          "transform",
          `translate(${this.hover.x - r}px,${this.hover.y - r}px)`
        )
        .style("height", this.hover.r)
        .style("width", this.hover.r)
        .style("stroke", "#fff")
        .style("storke-opacity", 1)
        .style("fill", "#288BE4") //#ccc
        .attr("opacity", 0.5);
    },
    updateLegend() {}
  }
};
</script>

<style lang="scss" scoped>
.mapvis {
  &--container {
    display: flex;
    justify-content: space-around;
    flex: 1;
  }

  display: inline-block;
  position: relative;
  opacity: 0;
  transition: opacity 1s;

  &__visible {
    opacity: 1;
  }

  &--svg {
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  &--canvas,
  &--canvas__selection {
    position: absolute;
    left: 0;
    z-index: 100;
  }
  &--canvas__selection {
    z-index: 110;
  }
  &--canvas__selectionsvg {
    z-index: 109;
  }
  &--title {
    position: absolute;
    left: 20px;
    top: 40px;
    z-index: 200;
    font-weight: 100;
  }
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
    padding-top: 50px;
    margin-left: 30px;
  }
  &--description {
    padding-top: 10px;
    padding-left: 6px;
    padding-right: 160px;
    text-align: justify;
    overflow: auto;
  }
}
</style>
