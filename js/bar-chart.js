// File: js/bar-chart.js
// ----------------------
// This script expects that load-data.js has already set window.allData = [ parsed CSV rows ].
// We will populate #yearDropdown with checkboxes for each unique year, then on every change:
//  • Update #selectedYearsDisplay to say "Years: …"
//  • Re-draw the bar chart (summing fines across the selected years + current filters).

(function() {
  // Will hold the full dataset once loaded
  let allData = [];

  // DOM references
  const yearDropdown = document.getElementById('yearDropdown');
  const yearSelectedDiv = yearDropdown.querySelector('.dropdown-selected');
  const yearListDiv = yearDropdown.querySelector('.dropdown-list');
  const barContainerId = 'barchart';

  // Helper: get currently checked years (as an array of numbers)
  function getSelectedYears() {
    const checkedBoxes = yearListDiv.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkedBoxes).map(cb => +cb.value);
  }

  // Helper: update the "Selected Years" display text
  
  function updateYearDropdownPlaceholder(uniqueYears) {
    const chosenYears = getSelectedYears();
    const placeholderSpan = yearSelectedDiv.querySelector('.placeholder');
    
    if (chosenYears.length === 0) {
      // No box checked ⇒ show "Latest 10 years"
      const sortedYears = uniqueYears.sort((a, b) => b - a);
      const latest10 = sortedYears.slice(0, 10).sort((a, b) => a - b);
      placeholderSpan.textContent = `${latest10[0]}-${latest10[latest10.length - 1]} (Latest 10)`;
    } else if (chosenYears.length === uniqueYears.length) {
      // All boxes checked
      placeholderSpan.textContent = 'All Years';
    } else if (chosenYears.length === 1) {
      // Single year selected
      placeholderSpan.textContent = chosenYears[0].toString();
    } else {
      // Multiple years selected
      chosenYears.sort((a, b) => a - b);
      placeholderSpan.textContent = `${chosenYears.length} Years Selected`;
    }
  }

  // Main drawing function
  function drawBarChart(data, selectedYears, selectedJurisdictions, selectedMethods) {
    // 1) Update the "Years: …" text in the new div
    const allUniqueYears = Array.from(new Set(data.map(d => +d.year)));
    updateYearDropdownPlaceholder(allUniqueYears);

    // 2) Clear any old chart or "no data" message
    d3.select(`#${barContainerId} svg`).remove();
    d3.select(`#${barContainerId} p`).remove();

    // 3) Determine which years to actually use for filtering
    let yearsToUse;
    if (selectedYears.length === 0) {
      // No years selected ⇒ use latest 10 years as default
      const sortedYears = allUniqueYears.sort((a, b) => b - a); // Sort descending (latest first)
      yearsToUse = sortedYears.slice(0, 10).sort((a, b) => a - b); // Take first 10, then sort ascending for display
    } else if (selectedYears.length === allUniqueYears.length) {
      // All checked ⇒ use every year in the dataset
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

    // 6) Filter by detectionMethod (same "effectiveMethods" logic as before)
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

    // 7) If nothing remains after filtering, show "no data" and exit
    if (filteredByYear.length === 0) {
      d3.select(`#${barContainerId}`)
        .append('p')
        .text('No data available for the selected filters.')
        .style('color', 'gray')
        .style('text-align', 'center')
        .style('margin-top', '1rem');
      return;
    }

    // 8) Group by jurisdiction AND year for grouped bar chart
    const finesByJurisdictionAndYear = d3.rollup(
      filteredByYear,
      (v) => d3.sum(v, d => +d.fines),
      (d) => d.jurisdiction,
      (d) => +d.year
    );

    // 9) Get jurisdictions based on current filters
    let allJursForYears;
    if (selectedJurisdictions.length > 0) {
        // Only use selected jurisdictions
        allJursForYears = selectedJurisdictions.slice().sort();
  } else {
    // Use all jurisdictions when none are selected
    allJursForYears = Array.from(
      new Set(
        data
          .filter(d => yearsToUse.includes(+d.year))
          .map(d => d.jurisdiction)
      )
    ).sort();
  }

    // 10) Build grouped data structure for D3
    let groupedData = allJursForYears.map(jurisdiction => {
      const yearData = yearsToUse.map(year => ({
        year: year,
        fines: finesByJurisdictionAndYear.get(jurisdiction)?.get(year) || 0
      }));
      return {
        jurisdiction: jurisdiction,
        years: yearData
      };
    });

    // Sort by total fines across all years (descending)
    groupedData.sort((a, b) => {
      const totalA = d3.sum(a.years, d => d.fines);
      const totalB = d3.sum(b.years, d => d.fines);
      return totalB - totalA;
    });

    // 11) Set up chart dimensions + margins
    const margin = { top: 40, right: 120, bottom: 80, left: 90 };
    const width = 900;
    const height = 400;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // 12) Create the SVG
    const svg = d3.select(`#${barContainerId}`)
      .append('svg')
      .attr('viewBox', `0 0 ${width} ${height}`);

    const chartGroup = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 13) Scales for grouped bar chart
    // Use only selected jurisdictions for X scale when filters are applied
    const xDomain = selectedJurisdictions.length > 0 
      ? groupedData.map(d => d.jurisdiction)  // Only filtered/selected jurisdictions
      : groupedData.map(d => d.jurisdiction); // All jurisdictions when no filter

    const x0Scale = d3.scaleBand()
      .domain(xDomain)
      .range([0, innerWidth])
      .padding(0.2);

    const x1Scale = d3.scaleBand()
      .domain(yearsToUse)
      .range([0, x0Scale.bandwidth()])
      .padding(0.05);

    // Use max from currently filtered data (selected jurisdictions only)
    const maxValue = selectedJurisdictions.length > 0 
      ? d3.max(groupedData, d => d3.max(d.years, y => y.fines))
      : d3.max(groupedData, d => d3.max(d.years, y => y.fines));

    const yScale = d3.scaleLinear()
      .domain([0, maxValue])
      .nice()
      .range([innerHeight, 0]);

    // 14) Color scale for years
    const colorScale = d3.scaleOrdinal()
      .domain(yearsToUse)
      .range(['#E69F00', '#56B4E9', '#009E73', '#F0E442', '#0072B2', '#D55E00', '#CC79A7', '#000000']);

    // 15) Draw grouped bars
    const jurisdictionGroups = chartGroup.selectAll('.jurisdiction-group')
      .data(groupedData)
      .join('g')
      .attr('class', 'jurisdiction-group')
      .attr('transform', d => `translate(${x0Scale(d.jurisdiction)}, 0)`);

    jurisdictionGroups.selectAll('.year-bar')
      .data(d => d.years)
      .join('rect')
      .attr('class', 'year-bar')
      .attr('x', d => x1Scale(d.year))
      .attr('y', d => yScale(d.fines))
      .attr('width', x1Scale.bandwidth())
      .attr('height', d => innerHeight - yScale(d.fines))
      .attr('fill', d => colorScale(d.year));

    // 16) X axis (jurisdictions)
    const xAxis = d3.axisBottom(x0Scale).tickSizeOuter(0);
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
      .attr('font-size', '0.9rem')
      .attr('font-weight', '500')
      .style('fill', '#333');

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

    // 19) Legend for years
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);

    yearsToUse.forEach((year, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendRow.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', colorScale(year));

      legendRow.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(year)
        .attr('font-size', '12px');
    });
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

        // 5) Initial draw (no year/jur/meth selected ⇒ "all")
        const initialSelectedYears = [];
        const { jur: initialJur, meth: initialMeth } = getCurrentJurAndMethods();
        drawBarChart(allData, initialSelectedYears, initialJur, initialMeth);

        // 6) Add event listeners to each year checkbox
        Array.from(yearListDiv.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
          cb.addEventListener('change', () => {
            const chosenYears = getSelectedYears(); // array of numbers
              // Update dropdown placeholder and chart
              const { jur, meth } = getCurrentJurAndMethods();
              updateYearDropdownPlaceholder(uniqueYears);
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