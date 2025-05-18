const populateFilter = (data) => {

  const filters_screen = [
    {id: "VIC", label: "VIC", isActive: false},
    {id: "NSW", label: "NSW", isActive: false},
    {id: "QLD", label: "QLD", isActive: false},
    {id: "SA", label: "SA", isActive: false},
    {id: "TAS", label: "TAS", isActive: false},
    {id: "WA", label: "WA", isActive: false}
  ];
  




  d3.select("#filters_screen")
  .selectAll(".filter")
  .data(filters_screen)
  .join("button")
  .attr('class', d=>`filter ${d.isActive ? 'active' : ''}`)
  .text(d => d.label)
  .on("click",(e,d) => {
    console.log("Clicked filter:",e);
    console.log("Clicked filter data:",d);
    if(!d.isActive){
      filters_screen.forEach(filter => {
        filter.isActive = d.id === filter.id ?true : false;
      });
      //update the filter buttons based on which one was clicked 
      d3.selectAll("#filters_screen .filter")
      .classed("active", filter => filter.id === d.id ? true : false);
      updateHistogram(d.id,data);
    }
  });

  const updateHistogram = (filterId, data) => {
    const updatedData = filterId === "all" ? data : data.filter(d => d.jurisdiction === filterId);
    drawHistogram(updatedData);
  }



  d3.select("#filters_size")
  .selectAll(".filter")
  .data(filtersSize)
  .join("button")
  .attr('class', d=>`filter ${d.isActive ? 'active' : ''}`)
  .text(d => d.label)
  .on("click",(e,d) => {
    console.log("Clicked filter:",e);
    console.log("Clicked filter data:",d);
    if(!d.isActive){
      filtersSize.forEach(filter => {
        filter.isActive = d.id === filter.id ?true : false;
      });
      //update the filter buttons based on which one was clicked 
      d3.selectAll("#filters_size .filter")
      .classed("active", filter => filter.id === d.id ? true : false);
      updateHistory(d.id,data);

    }
  });

  const updateHistory = (filterId, data) => {
    const updatedData = filterId==="all" ? data : data.filter(tv => tv.screenSize === +filterId);
    const updatedBins = binGenerator(updatedData); //save the bins into an array
    d3.selectAll("#histogram rect")
    .data(updatedBins) //bind the data to the rectangles
    .transition() //add a transition to the rectangles
    .duration(500) //set the duration of the transition to 1 second
    .ease(d3.easeCubicInOut) //set the easing function of the transition to cubic in out
    .attr("y", d => yScale(d.length))
    .attr("height",d=> innerHeight - yScale(d.length)); 
  }

}



  // 2. Actually implement createTooltip()
  const createTooltip = () => {
    console.log("▶︎ createTooltip() called, innerChartS =", innerChartS);
    
    // a <g> that will hold the rect + text, hidden by default
    const tooltip = innerChartS
      .append("g")
      .attr("class", "tooltip")
      .style("visibility", "hidden")
      .style("pointer-events", "none");    // so it never steals your mouse
    
    // grey background
    tooltip.append("rect")
      .attr("width",  50)
      .attr("height", 24)
      .attr("rx",      4)
      .attr("fill",   "#7f7f7f");
    
    // white, centered text
    tooltip.append("text")
      .attr("class", "tooltip-text")
      .attr("x",         25)
      .attr("y",         16)
      .attr("text-anchor", "middle")
      .attr("fill",       "#fff")
      .style("font-size","12px");

      innerChartS.selectAll("circle")
      .on("mouseover", (event, d) => {
        console.log("Mouse Entered circle:", d);
        tooltip.select(".tooltip-text").text(d.star);
        const cx = xScaleS(d.energyConsumption),
              cy = yScaleS(d.star);
        tooltip
          .attr("transform", `translate(${cx - 25},${cy - 30})`)
          .style("visibility", "visible");
      })
      
      .on("mouseleave", (event, d) => {
        console.log("Mouse Left circle:", d);
        // e.g. you could also clear the tooltip text here:
        // tooltip.select(".tooltip-text").text("");
      });
    }


