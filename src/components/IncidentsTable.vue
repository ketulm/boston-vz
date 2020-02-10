<template>
  <div class="incidents" v-if="selectedIncidents.length">
    <b-table
      :data="selectedIncidents"
      :bordered="false"
      narrowed
      paginated
      :per-page="10"
    >
      <template slot-scope="props">
        <b-table-column key="date" label="Year">
          {{ props.row.year }}
        </b-table-column>
        <b-table-column key="month" label="Month">
          {{ getHour(props.row) }}
        </b-table-column>
        <b-table-column key="month" label="Hour">
          {{ getHour(props.row) }}
        </b-table-column>
        <b-table-column field="mode_type" label="Mode" key="mode" centered>
          <b-icon
            :icon="getModeTypeIcon(props.row)"
            pack="mdi"
            size="is-small"
            custom-class="is-paddingless is-marginless"
          ></b-icon>
        </b-table-column>
        <b-table-column label="Position" key="position">
          {{ props.row.long.toFixed(6) }},
          {{ props.row.lat.toFixed(6) }}
        </b-table-column>
      </template>
    </b-table>
  </div>
</template>

<script>
import { HOURS, MONTHS } from "@/data/constants";
export default {
  name: "IncidentsTable",
  props: ["selectedIncidents"],
  methods: {
    getMonth(d) {
      return MONTHS[d.month];
    },
    getHour(d) {
      return HOURS[d.hour];
    },
    getModeTypeIcon(d) {
      switch (d.mode_type) {
        case "mv":
          return "car";
        case "ped":
          return "walk";
        case "bike":
          return "bike";
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.incidents {
  font-size: 0.8rem;
}
</style>
