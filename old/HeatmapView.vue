<template>
  <div class="mapvis">
    <div>{{ year }}</div>
    <svg class="mapvis--svg" ref="mapSvg" :height="height" :width="width"></svg>
    <canvas
      class="mapvis--canvas"
      ref="mapCanvas"
      :height="height"
      :width="width"
    ></canvas>
  </div>
</template>

<script>
import * as d3 from "d3";
import d3hexgrid from "d3-hexgrid";
import topojson from "topojson";
import simpleheat from "simpleheat";

export default {
  components: {},
  props: {
    neighborhoods,
    stations,
    incidents,
    visionZero,
    year
  },
  data() {
    return {
      height: "600",
      width: "600",
      projection: undefined,
      path: undefined
    };
  },
  watch: {
    neighborhoods() {
      this.projection = d3
        .geoMercator()
        .center([42, -71])
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
        .attr("stroke-width", ".1")
        .attr("stroke-opacity", ".9")
        .style("fill", "111") //"#abc")
        .attr("title", d => d.properties.NEIGHBORHOOD);

      mapLayer
        .append("g")
        .selectAll(".station")
        .data(policeStations.features)
        .enter()
        .append("path")
        .attr("class", "station")
        .attr("d", this.path)
        .style("stroke", "none")
        .style("fill", "#ccc")
        .attr("opacity", 0.05);
    },
    incidents() {
      this.incidents.forEach(d => {
        d.coords = projection([d.Long, d.Lat]);
      });
      var month = 1;
      var hour = 0;
      let heat = simpleheat(this.$refs.mapCanvas);

      heat.data(
        this.incidents
          .filter(
            d => d.YEAR == this.year && d.HOUR == hour && d.OFFENSE_CODE > 3000
          )
          .map(d => [...d.coords, 1])
      );
      heat.radius(1, 2.5);
      heat.gradient({
        1: d3.interpolateYlOrRd(0),
        0.5: d3.interpolateYlOrRd(0.5),
        0: d3.interpolateOrRd(1)
      });
      heat.draw(0.05);
    },
    visionZero() {
      this.visionZero.forEach(d => {
        d.coords = projection([+d[9], +d[8]]);
      });
      heat.data(
        this.visionZero
          .filter(d => d.mode_type == "ped" && d.year == this.year)
          .map(d => [...d.coords, 1])
      );
      heat.radius(1.15, 2.5);
      heat.draw(0.05);
    }
  }
};
</script>

<style lang="scss" scoped>
.mapvis .mapvis--svg,
.mapvis .mapvis--canvas {
  position: absolute;
  left: 0;
}

.mapvis--svg {
  background: #202122;
  // background: #f1f1f1;
}
.mapvis .mapvis--canvas {
  background: transparent;
}
</style>
