const drawScatterPlot = (data) => {
  // 1. create svg + inner group
  const svg = d3.select("#scatterplot")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
    innerChartS = chart;

  // 2. scales
  xScaleS
    .domain(d3.extent(data, d => d.energyConsumption))
    .range([0, innerWidth])
    .nice();

  yScaleS
    .domain(d3.extent(data, d => d.star))
    .range([innerHeight, 0])
    .nice();

  colorScale
    .domain([...new Set(data.map(d => d.screenTech))])
    .range(d3.schemeCategory10);

  // 3. axes
  chart.append("g")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScaleS));

  chart.append("g")
    .call(d3.axisLeft(yScaleS));

  // Add x-axis label
  chart.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("Energy Consumption");

  // Add y-axis label
  chart.append("text")
    .attr("x", -innerHeight / 2)
    .attr("y", -margin.left + 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("transform", "rotate(-90)")
    .text("Star Rating");

  // 4. points
  chart.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => xScaleS(d.energyConsumption))
    .attr("cy", d => yScaleS(d.star))
    .attr("r", 5)
    .attr("fill", d => colorScale(d.screenTech))
    .attr("opacity", 0.7);
    
  // Legend
  const legend = svg.append("g")
  .attr("transform", `translate(${width - margin.right - 120},${margin.top})`);

const techs = [...new Set(data.map(d => d.screenTech))];

techs.forEach((tech, i) => {
  const legendRow = legend.append("g")
    .attr("transform", `translate(0, ${i * 20})`);
  
  legendRow.append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", colorScale(tech));

  legendRow.append("text")
    .attr("x", 20)
    .attr("y", 10)
    .attr("text-anchor", "start")
    .attr("font-size", "12px")
    .text(tech);
     });
};
