// File: js/bar-chart.js
// ----------------------
// This script expects that load-data.js has already set window.allData = [ parsed CSV rows ].
// We will populate #yearDropdown with checkboxes for each unique year, then on every change:
//  • Update #selectedYearsDisplay to say “Years: …”
//  • Re-draw the bar chart (summing fines across the selected years + current filters).

(function() {
    // Will hold the full dataset once loaded
    let allData = [];
  
    // DOM references
    const yearDropdown = document.getElementById('yearDropdown');
    const yearSelectedDiv = yearDropdown.querySelector('.dropdown-selected');
    const yearListDiv = yearDropdown.querySelector('.dropdown-list');
    const selectedYearsDiv = document.getElementById('selectedYearsDisplay');
    const barContainerId = 'barchart';
  
    // Helper: get currently checked years (as an array of numbers)
    function getSelectedYears() {
      const checkedBoxes = yearListDiv.querySelectorAll('input[type="checkbox"]:checked');
      return Array.from(checkedBoxes).map(cb => +cb.value);
    }
  
    // Helper: update the “Selected Years” display text
    function updateSelectedYearsDisplay(uniqueYears) {
      const chosenYears = getSelectedYears();
      if (chosenYears.length === 0) {
        // No box checked ⇒ treat as “All years”
        selectedYearsDiv.textContent = 'Years: All';
      } else if (chosenYears.length === uniqueYears.length) {
        // All boxes checked
        selectedYearsDiv.textContent = 'Years: All';
      } else {
        // Some subset chosen ⇒ show comma-separated
        // Sort chronologically for readability
        chosenYears.sort((a, b) => a - b);
        selectedYearsDiv.textContent = 'Years: ' + chosenYears.join(', ');
      }
    }
  
    // Main drawing function
    function drawBarChart(data, selectedYears, selectedJurisdictions, selectedMethods) {
      // 1) Update the “Years: …” text in the new div
      const allUniqueYears = Array.from(new Set(data.map(d => +d.year)));
      updateSelectedYearsDisplay(allUniqueYears);
  
      // 2) Clear any old chart or “no data” message
      d3.select(`#${barContainerId} svg`).remove();
      d3.select(`#${barContainerId} p`).remove();
  
      // 3) Determine which years to actually use for filtering
      let yearsToUse;
      if (selectedYears.length === 0 || selectedYears.length === allUniqueYears.length) {
        // “None checked” OR “All checked” ⇒ use every year in the dataset
        yearsToUse = allUniqueYears;
      } else {
        yearsToUse = selectedYears.slice();
      }
  
      // 4) Filter data by year
      let filteredByYear = data.filter(d => yearsToUse.includes(+d.year));
  
      // 5) Filter by jurisdiction (if any are checked)
      if (selectedJurisdictions.length > 0) {
        filteredByYear = filteredByYear.filter(d =>
          selectedJurisdictions.includes(d.jurisdiction)
        );
      }
  
      // 6) Filter by detectionMethod (same “effectiveMethods” logic as before)
      let effectiveMethods = new Set(selectedMethods);
      if (
        selectedMethods.includes('Fixed camera') ||
        selectedMethods.includes('Mobile camera')
      ) {
        if (selectedMethods.includes('Fixed camera')) effectiveMethods.add('Fixed or mobile camera');
        if (selectedMethods.includes('Mobile camera')) effectiveMethods.add('Fixed or mobile camera');
      }
      if (selectedMethods.length > 0) {
        filteredByYear = filteredByYear.filter(d =>
          effectiveMethods.has(d.detectionMethod)
        );
      }
  
      // 7) If nothing remains after filtering, show “no data” and exit
      if (filteredByYear.length === 0) {
        d3.select(`#${barContainerId}`)
          .append('p')
          .text('No data available for the selected filters.')
          .style('color', 'gray')
          .style('text-align', 'center')
          .style('margin-top', '1rem');
        return;
      }
  
      // 8) Group by jurisdiction, summing fines across the filtered subset
      const finesByJurisdiction = d3.rollup(
        filteredByYear,
        (v) => d3.sum(v, d => +d.fines),
        (d) => d.jurisdiction
      );
  
      // 9) Get the complete list of jurisdictions that appear in the chosen years
      const allJursForYears = Array.from(
        new Set(
          data
            .filter(d => yearsToUse.includes(+d.year))
            .map(d => d.jurisdiction)
        )
      ).sort();
  
      // 10) Build an array of { jurisdiction, totalFines } for every jurisdiction
      let barData = allJursForYears.map(jur => ({
        jurisdiction: jur,
        totalFines: finesByJurisdiction.get(jur) || 0
      }));
  
      // Sort descending by totalFines
      barData.sort((a, b) => b.totalFines - a.totalFines);
  
      // 11) Set up chart dimensions + margins
      const margin = { top: 40, right: 30, bottom: 80, left: 70 };
      const width = 800;
      const height = 400;
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
  
      // 12) Create the SVG
      const svg = d3.select(`#${barContainerId}`)
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('background', 'white');
  
      const chartGroup = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
  
      // 13) X scale: one band per jurisdiction
      const xScale = d3.scaleBand()
        .domain(barData.map(d => d.jurisdiction))
        .range([0, innerWidth])
        .padding(0.2);
  
      // 14) Y scale: 0 → max totalFines
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.totalFines)])
        .nice()
        .range([innerHeight, 0]);
  
      // 15) Draw bars
      chartGroup.selectAll('.bar')
        .data(barData)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.jurisdiction))
        .attr('y', d => yScale(d.totalFines))
        .attr('width', xScale.bandwidth())
        .attr('height', d => innerHeight - yScale(d.totalFines))
        .attr('fill', '#606464');
  
      // 16) X axis (jurisdictions)
      const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
      chartGroup.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .attr('transform', 'rotate(-40)')
        .attr('text-anchor', 'end')
        .attr('font-size', '0.75rem');
  
      // 17) Y axis (total fines)
      const yAxis = d3.axisLeft(yScale).ticks(6);
      chartGroup.append('g')
        .call(yAxis)
        .selectAll('text')
        .attr('font-size', '0.75rem');
  
      // 18) Axis labels
      svg.append('text')
        .text('Jurisdiction')
        .attr('x', margin.left + innerWidth / 2)
        .attr('y', height - margin.bottom / 4)
        .attr('text-anchor', 'middle')
        .attr('class', 'axis-label');
  
      svg.append('text')
        .text('Total Fines')
        .attr('x', -(margin.top + innerHeight / 2))
        .attr('y', 15)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('class', 'axis-label');
    }
  
    // Once load-data.js populates window.allData, build the year checkboxes + event listeners
    function setupYearCheckboxDropdown() {
      const checkInterval = setInterval(() => {
        if (window.allData && Array.isArray(window.allData) && window.allData.length > 0) {
          clearInterval(checkInterval);
          allData = window.allData;
  
          // 1) Extract unique years
          const uniqueYears = Array.from(new Set(allData.map(d => +d.year))).sort((a, b) => a - b);
  
          // 2) Populate #yearDropdown .dropdown-list with one checkbox per year
          uniqueYears.forEach(yr => {
            const label = document.createElement('label');
            label.style.display = 'block';
            label.style.margin = '4px 0';
  
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.value = yr;
  
            label.appendChild(cb);
            label.appendChild(document.createTextNode(' ' + yr));
            yearListDiv.appendChild(label);
          });
  
          // 3) Toggle open/close for the year dropdown (same pattern as other dropdowns)
          yearSelectedDiv.addEventListener('click', () => {
            yearDropdown.classList.toggle('open');
          });
          document.addEventListener('click', (e) => {
            if (!yearDropdown.contains(e.target)) {
              yearDropdown.classList.remove('open');
            }
          });
  
          // 4) Helper to read current jurisdiction & detection filters
          function getCurrentJurAndMethods() {
            const jur = Array.from(
              document.querySelectorAll('#jurisdictionDropdown input[type="checkbox"]:checked')
            ).map(cb => cb.value);
  
            const meth = Array.from(
              document.querySelectorAll('#detectionDropdown input[type="checkbox"]:checked')
            ).map(cb => cb.value);
  
            return { jur, meth };
          }
  
          // 5) Initial draw (no year/jur/meth selected ⇒ “all”)
          const initialSelectedYears = [];
          const { jur: initialJur, meth: initialMeth } = getCurrentJurAndMethods();
          drawBarChart(allData, initialSelectedYears, initialJur, initialMeth);
  
          // 6) Add event listeners to each year checkbox
          Array.from(yearListDiv.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
            cb.addEventListener('change', () => {
              const chosenYears = getSelectedYears(); // array of numbers
              // Update chart with new years + current filters
              const { jur, meth } = getCurrentJurAndMethods();
              drawBarChart(allData, chosenYears, jur, meth);
            });
          });
  
          // 7) Also re-draw whenever jurisdiction OR detection‐method changes
          const jurCbs = document.querySelectorAll('#jurisdictionDropdown input[type="checkbox"]');
          const methCbs = document.querySelectorAll('#detectionDropdown input[type="checkbox"]');
          function jurOrMethChanged() {
            const chosenYears = getSelectedYears();
            const { jur, meth } = getCurrentJurAndMethods();
            drawBarChart(allData, chosenYears, jur, meth);
          }
          jurCbs.forEach(cb => cb.addEventListener('change', jurOrMethChanged));
          methCbs.forEach(cb => cb.addEventListener('change', jurOrMethChanged));
        }
      }, 100);
    }
  
    document.addEventListener('DOMContentLoaded', setupYearCheckboxDropdown);
  })();
  