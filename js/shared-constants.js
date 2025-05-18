//set up dimesions and margins 
const margin = {top: 40, right: 30, bottom: 50, left: 70};
const width = 800; // total width of the chart
const height = 400; // total height of the chart
const innerWidth = width - margin.left - margin.right; // width of the chart area
const innerHeight = height - margin.top - margin.bottom; // height of the chart area

let innerChartS;

const tooltipWidth =65;
const tooltipHeight = 32; // height of the tooltip

const barColor = "#606464"; // color of the bars
const bodyBackgroundColor = "#fffaf0"; // background color of the body

//set up the scales 
const xScale = d3.scaleLinear();
const yScale = d3.scaleLinear();

const xScaleS = d3.scaleLinear();
const yScaleS = d3.scaleLinear();
const colorScale = d3.scaleOrdinal(); // color scale for the scatter plot


const binGenerator = d3.bin()
.value(d => d.energyConsumption) // accessor to energy consumption