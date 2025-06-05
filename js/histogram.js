const drawHistogram = (data, selectedJurisdiction = 'all') => {
  // Clear any existing SVG to prevent duplicates
  d3.select("#histogram svg").remove();

  // Get all years and jurisdictions
  const years = Array.from(new Set(data.map(d => d.year))).sort((a, b) => a - b);
  let jurisdictions = Array.from(new Set(data.map(d => d.jurisdiction)));

  // If a specific jurisdiction or array is selected, filter to just those
  if (selectedJurisdiction !== 'all') {
    if (Array.isArray(selectedJurisdiction)) {
      jurisdictions = jurisdictions.filter(j => selectedJurisdiction.includes(j));
    } else {
      jurisdictions = jurisdictions.filter(j => j === selectedJurisdiction);
    }
  }

  // Aggregate fines by year and jurisdiction
  const finesByYearJur = d3.rollup(
    data,
    v => d3.sum(v, d => d.fines),
    d => d.year,
    d => d.jurisdiction
  );

  // Prepare line data for each jurisdiction
  const lineData = jurisdictions.map(jurisdiction => {
    return {
      jurisdiction,
      label: jurisdiction,
      values: years.map(year => {
        const fines = finesByYearJur.get(year)?.get(jurisdiction) || 0;
        return { year, fines };
      })
    };
  }).filter(d => d.values.some(v => v.fines > 0)); 

  // Set dimensions and margins 
  const width = 800;  
  const height = 320; 
  const margin = { top: 30, right: 180, bottom: 50, left: 60 }; 
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select("#histogram")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const innerChart = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // X scale (years)
  const xScale = d3.scalePoint()
    .domain(years)
    .range([0, innerWidth])
    .padding(1);

  // Y scale (fines)
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(lineData, d => d3.max(d.values, v => v.fines))])
    .range([innerHeight, 0])
    .nice();

  // Use colourblind friendly colours palette 
  //https://www.color-hex.com/color-palette/1018347
  const wongColors = [
    "#000000", "#E69F00", "#56B4E9", "#009E73", 
    "#F0E442", "#0072B2", "#D55E00", "#CC79A7"
  ];

  // Color scale for lines
  const colorScale = d3.scaleOrdinal()
    .domain(lineData.map(d => d.label))
    .range(wongColors);

  // Define different dash patterns
  //GENAI DECLARATION - used to find line patterns
  const dashPatterns = [
    "none",           // solid line
    "5,5",            // dashed (--- --- ---)
    "2,3",            // short dash
    "10,5,2,5",       // dash-dot (-.-.-.)
    "10,5,2,5,2,5",   // dash-dot-dot (-..-..-..)
    "15,3,3,3",       // long dash-dot
    "3,3",            // dotted (...)
    "8,3,2,3,2,3",    // dash-dot-dot with longer dash
    "12,2",           // long dash
    "6,2,2,2,2,2"     // dash with multiple dots
  ];

  // Create dash pattern scale
  const dashScale = d3.scaleOrdinal()
    .domain(lineData.map(d => d.label))
    .range(dashPatterns);

  // Draw lines
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.fines));

  innerChart.selectAll(".line-path")
    .data(lineData)
    .join("path")
    .attr("class", "line-path")
    .attr("fill", "none")
    .attr("stroke", d => colorScale(d.label))
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", d => selectedJurisdiction === 'all' ? "none" : dashScale(d.label)) 
    .attr("d", d => line(d.values));

  // Draw circles at data points
  lineData.forEach(comboData => {
    innerChart.selectAll(`.circle-${comboData.label.replace(/\s+/g, '-')}`)
      .data(comboData.values)
      .join("circle")
      .attr("class", `circle-${comboData.label.replace(/\s+/g, '-')}`)
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.fines))
      .attr("r", 3)
      .attr("fill", colorScale(comboData.label));
  });

  // X axis
  const bottomAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
  innerChart.append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(bottomAxis)
    .selectAll("text")
    .attr("dy", "0.5em")
    .attr("dx", "-1.2em") 
    .attr("transform", "rotate(-35)") 
    .style("text-anchor", "end")
    .style("font-size", "11px"); 
  // X axis label
  svg.append("text")
    .text("Year")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - margin.bottom / 4)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .style("font-size", "12px"); 

  // Y axis
  const leftAxis = d3.axisLeft(yScale).ticks(5); 
  innerChart.append("g")
    .call(leftAxis)
    .selectAll("text")
    .style("font-size", "11px"); 

  // Y axis label
  svg.append("text")
    .text("Fines")
    .attr("x", 0 - height / 2)
    .attr("y", 15) 
    .attr("transform", `rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .style("font-size", "12px"); 

  // Compact Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right + 20}, ${margin.top})`);

  lineData.forEach((combo, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${i * 16})`); 

    legendRow.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 15) 
      .attr("y2", 0)
      .attr("stroke", colorScale(combo.label))
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", selectedJurisdiction === 'all' ? "none" : dashScale(combo.label));

    legendRow.append("text")
      .attr("x", 20) 
      .attr("y", 3)
      .text(combo.label)
      .style("font-size", "11px"); 
  });
};