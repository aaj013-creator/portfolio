import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";
import { fetchJSON, renderProjects } from "../global.js";

const projects = await fetchJSON("../lib/projects.json");
const projectsContainer = document.querySelector(".projects");
const title = document.querySelector(".projects-title");
const searchInput = document.querySelector(".searchBar");

let query = "";
let selectedIndex = -1;
let selectedYear = null;

const colors = d3.scaleOrdinal(d3.schemeTableau10);

function getFilteredProjects() {
    return projects.filter((project) => {
        let values = Object.values(project).join("\n").toLowerCase();
        let matchesSearch = values.includes(query.toLowerCase());
        let matchesYear = selectedYear === null || project.year === selectedYear;

        return matchesSearch && matchesYear;
    });
}

function updatePage() {
    let filteredProjects = getFilteredProjects();

    renderProjects(filteredProjects, projectsContainer, "h2");

    if (title) {
        title.textContent = `${filteredProjects.length} Projects`;
    }

    renderPieChart(filteredProjects);
}

function renderPieChart(projectsGiven) {
    let svg = d3.select("#projects-pie-plot");
    let legend = d3.select(".legend");

    svg.selectAll("path").remove();
    legend.selectAll("li").remove();

    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year
    );

    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    let arcs = arcData.map((d) => arcGenerator(d));

    arcs.forEach((arc, i) => {
        svg.append("path")
            .attr("d", arc)
            .attr("fill", colors(i))
            .attr("class", selectedYear === data[i].label ? "selected" : "")
            .on("click", () => {
                if (selectedYear === data[i].label) {
                    selectedYear = null;
                    selectedIndex = -1;
                } else {
                    selectedYear = data[i].label;
                    selectedIndex = i;
                }

                updatePage();
            });
    });

    data.forEach((d, i) => {
        legend.append("li")
            .attr("style", `--color:${colors(i)}`)
            .attr("class", selectedYear === d.label ? "selected legend-item" : "legend-item")
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on("click", () => {
                if (selectedYear === d.label) {
                    selectedYear = null;
                    selectedIndex = -1;
                } else {
                    selectedYear = d.label;
                    selectedIndex = i;
                }

                updatePage();
            });
    });
}

searchInput.addEventListener("input", (event) => {
    query = event.target.value;
    updatePage();
});

updatePage();