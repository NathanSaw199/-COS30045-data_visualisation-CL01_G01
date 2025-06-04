import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
console.log(" piechart.js loaded");

const wongColors = [
  "#000000", "#E69F00", "#56B4E9", "#009E73", 
  "#F0E442", "#0072B2", "#D55E00", "#CC79A7"
];
const width = 500, height = 400, radius = Math.min(width, height) / 2 - 50;
const color = d3.scaleOrdinal(wongColors);

let allData = [];

d3.csv("data/newcsv.csv").then(data => {
  allData = data;
  console.log(" Raw data sample:", data.slice(0, 5));
  renderPieChart(data);  
  setupListeners();      
});

function renderPieChart(data) {
  d3.select("#piechart svg").remove();  

  if (!data || data.length === 0) {
    d3.select("#piechart")
      .append("p")
      .text("No data for selected filters")
      .style("color", "gray")
      .style("text-align", "center");
    return;
  }

  const grouped = d3.rollups(
    data,
    v => d3.sum(v, d => {
      const raw = d["FINES"];
      const clean = raw ? +raw.toString().replaceAll(",", "").trim() : 0;
      return isNaN(clean) ? 0 : clean;
    }),
    d => d["AGE_GROUP"]
  );

  const ageData = grouped
    .filter(([ageGroup]) => ageGroup && ageGroup !== "All ages")
    .map(([ageGroup, fineCount]) => ({ ageGroup, fineCount }));

  console.log(" Age group data:", ageData);

  if (ageData.length === 0) {
    d3.select("#piechart")
      .append("p")
      .text("No fines recorded for selected filters")
      .style("color", "gray")
      .style("text-align", "center");
    return;
  }

  const svg = d3.select("#piechart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const pie = d3.pie().value(d => d.fineCount);
  const arc = d3.arc().innerRadius(0).outerRadius(radius - 40);
  const labelArc = d3.arc().innerRadius(radius - 20).outerRadius(radius - 20);

  const arcs = svg.selectAll("g")
    .data(pie(ageData))
    .enter()
    .append("g")
    .attr("class", "arc");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", d => color(d.data.ageGroup));

 // add connecting lines - design update since the labels inside wasnt displaying properly when sector is small
arcs.append("polyline")
  .attr("stroke", "#333")
  .attr("stroke-width", 1)
  .attr("fill", "none")
  .attr("points", function(d) {
    const centroid = arc.centroid(d);
    const labelPos = labelArc.centroid(d);
    const outerPos = [labelPos[0] * 1.0, labelPos[1] * 1.2]; 
    return [centroid, labelPos, outerPos];
  });

// external labeks - design update since the labels inside wasnt displaying properly when sector is small
arcs.append("text")
  .attr("transform", function(d) {
    const pos = labelArc.centroid(d);
    const finalPos = [pos[0] * 1.25, pos[1] * 1.25]; 
    return `translate(${finalPos})`;
  })
  .attr("text-anchor", function(d) {
    const pos = labelArc.centroid(d);
    return pos[0] > 0 ? "start" : "end";
  })
  .style("font-size", "11px")
  .style("font-weight", "bold")
  .style("fill", "#000")  
  .text(d => d.data.ageGroup);
}

function setupListeners() {
  document.querySelectorAll("#jurisdictionDropdown input[type=checkbox], #detectionDropdown input[type=checkbox]").forEach(cb => {
    cb.addEventListener("change", () => {
      const selectedJurisdictions = getSelected("#jurisdictionDropdown");
      const selectedMethods = getSelected("#detectionDropdown");

      console.log("Selected jurisdictions:", selectedJurisdictions);
      console.log("Selected methods:", selectedMethods);

      const filtered = allData.filter(row => {
        
        const jur = row["JURISDICTION"];
        const method = row["DETECTION_METHOD"] || row["METHOD"]; //debugging
        
       
        const jurMatch = selectedJurisdictions.length === 0 || 
                        selectedJurisdictions.some(selectedJur => {
                     
                          const jurMapping = {
                            'VIC': ['VIC', 'Victoria'],
                            'NSW': ['NSW', 'New South Wales'],
                            'QLD': ['QLD', 'Queensland'], 
                            'SA': ['SA', 'South Australia'],
                            'TAS': ['TAS', 'Tasmania'],
                            'WA': ['WA', 'Western Australia'],
                            'NT': ['NT', 'Northern Territory'],
                            'ACT': ['ACT', 'Australian Capital Territory']
                          };
                          
                          return jurMapping[selectedJur] && 
                                 jurMapping[selectedJur].some(variant => 
                                   jur && jur.trim().toUpperCase().includes(variant.toUpperCase())
                                 );
                        });

       
        let effectiveMethods = new Set(selectedMethods);
        if (selectedMethods.includes('Fixed camera') || selectedMethods.includes('Mobile camera')) {
          if (selectedMethods.includes('Fixed camera')) effectiveMethods.add('Fixed or mobile camera');
          if (selectedMethods.includes('Mobile camera')) effectiveMethods.add('Fixed or mobile camera');
        }
        
        const methodMatch = selectedMethods.length === 0 || 
                           (method && effectiveMethods.has(method.trim()));

        return jurMatch && methodMatch;
      });

      console.log("Filtered rows:", filtered.length);
      console.log(" Sample filtered data:", filtered.slice(0, 3));

      renderPieChart(filtered);
    });
  });
}

function getSelected(selector) {
  return Array.from(document.querySelectorAll(`${selector} input[type=checkbox]:checked`))
              .map(cb => cb.value.trim());
}