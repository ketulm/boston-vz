import * as d3 from "d3";

export default {
  toggleSpinner(domElement) {
    let element = domElement.getElementsByClassName("fa")[0] || domElement;
    if (element) {
      if (
        element.classList.contains("fa-pulse") &&
        element.classList.contains("fa-spinner")
      ) {
        element.classList.remove("fa-pulse");
        element.classList.replace("fa-spinner", "fa-refresh");
      } else if (element.classList.contains("fa-refresh")) {
        element.classList.replace("fa-refresh", "fa-spinner");
        element.classList.add("fa-pulse");
      }
    }
  },
  scaleColor(p) {
    return d3.color(d3.interpolateGreys(1 - p)).hex();
  },
  scaleColorSelection(p) {
    return d3.color(d3.interpolateOranges(1 - p)).hex();
  }
};
