const drawHistogram = (data) => {
  // Clear any existing SVG to prevent duplicates
  d3.select("#histogram svg").remove();

  // Aggregate total fines by year and jurisdiction
  const finesByYearJurisdiction = d3.rollup(
    data,
    v => d3.sum(v, d => d.fines),
    d => d.year,
    d => d.jurisdiction
  );

  // Convert to array format for easier use
  const chartData = [];
  finesByYearJurisdiction.forEach((jurisdictionMap, year) => {
    jurisdictionMap.forEach((fines, jurisdiction) => {
      chartData.push({ year, jurisdiction, fines });
    });
  });

  // Set dimensions and margins
  const width = 600;
  const height = 400;
  const margin = { top: 40, right: 20, bottom: 60, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create SVG
  const svg = d3.select("#histogram")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const innerChart = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // X scale (years)
  const xScale = d3.scaleBand()
    .domain([...new Set(chartData.map(d => d.year))])
    .range([0, innerWidth])
    .padding(0.2);

  // Y scale (fines)
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(chartData, d => d.fines)])
    .range([innerHeight, 0])
    .nice();

  // Color scale for jurisdictions
  const colorScale = d3.scaleOrdinal()
    .domain([...new Set(chartData.map(d => d.jurisdiction))])
    .range(d3.schemeCategory10);

  // Draw bars
  innerChart.selectAll("rect")
    .data(chartData)
    .join("rect")
    .attr("x", d => xScale(d.year))
    .attr("y", d => yScale(d.fines))
    .attr("width", xScale.bandwidth())
    .attr("height", d => innerHeight - yScale(d.fines))
    .attr("fill", d => colorScale(d.jurisdiction));

  // X axis
  const bottomAxis = d3.axisBottom(xScale);
  innerChart.append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(bottomAxis);

  // X axis label
  svg.append("text")
    .text("Year")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - margin.bottom / 4)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label");

  // Y axis
  const leftAxis = d3.axisLeft(yScale);
  innerChart.append("g")
    .call(leftAxis);

  // Y axis label
  svg.append("text")
    .text("Fines")
    .attr("x", 0 - height / 2)
    .attr("y", 20)
    .attr("transform", `rotate(-90)`)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label");

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - margin.right - 120}, ${margin.top})`);

  const jurisdictions = [...new Set(chartData.map(d => d.jurisdiction))];
  jurisdictions.forEach((jurisdiction, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);
    
    legendRow.append("rect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", colorScale(jurisdiction));

    legendRow.append("text")
      .attr("x", 20)
      .attr("y", 10)
      .attr("text-anchor", "start")
      .attr("font-size", "12px")
      .text(jurisdiction);
  });
}
