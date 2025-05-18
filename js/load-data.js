d3.csv("data/newcsv.csv", d => ({
  year: +d.YEAR,
  jurisdiction: d.JURISDICTION,
  location: d.LOCATION,
  ageGroup: d.AGE_GROUP,
  metric: d.METRIC,
  detectionMethod: d.DETECTION_METHOD,
  fines: +d.FINES
})).then(data => {
  //log the data to the console 
  console.log(data);
  //call functions to draw the histogram and populate the filter
  drawHistogram(data);
  populateFilter(data);
  drawScatterPlot(data);
  createTooltip();


  

}).catch(error => {
  console.error('Error loading the CSV file:', error);
});