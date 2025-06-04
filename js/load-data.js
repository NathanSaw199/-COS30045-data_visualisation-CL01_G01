// File: js/load-data.js
// (Keep everything you already had; we only add window.allData = data)

d3.csv("data/newcsv.csv", d => ({
  year: +d.YEAR,
  jurisdiction: d.JURISDICTION,
  location: d.LOCATION,
  ageGroup: d.AGE_GROUP,
  metric: d.METRIC,
  detectionMethod: d.DETECTION_METHOD,
  fines: +d.FINES
})).then(data => {
  // Make the data globally accessible for bar‐chart.js
  window.allData = data;

  // Log the data to the console
  console.log(data);

  // Draw the line chart (histogram)
  drawHistogram(data, 'all');

  // --- Jurisdiction Dropdown Logic (UNCHANGED) ---
  const dropdown = document.getElementById('jurisdictionDropdown');
  const selectedDiv = dropdown.querySelector('.dropdown-selected');
  const listDiv = dropdown.querySelector('.dropdown-list');
  const checkboxes = Array.from(listDiv.querySelectorAll('input[type="checkbox"]'));

  selectedDiv.addEventListener('click', function(e) {
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', function(e) {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });

  function updateSelectedDisplay() {
    const selected = checkboxes.filter(cb => cb.checked);
    selectedDiv.innerHTML = '';
    if (selected.length === 0) {
      selectedDiv.innerHTML = '<span class="placeholder">Select</span>';
    } else if (selected.length === checkboxes.length) {
      selectedDiv.textContent = 'All selected';
    } else if (selected.length === 1) {
      selectedDiv.textContent = selected[0].parentElement.textContent.trim();
    } else {
      selectedDiv.textContent = `${selected.length} selected`;
    }
  }

  // --- Detection Method Dropdown Logic (UNCHANGED) ---
  const detectionDropdown = document.getElementById('detectionDropdown');
  const detectionSelectedDiv = detectionDropdown.querySelector('.dropdown-selected');
  const detectionListDiv = detectionDropdown.querySelector('.dropdown-list');

  const allowedMethods = [
    'Fixed camera',
    'Fixed or mobile camera',
    'Mobile camera',
    'Police issued'
  ];
  allowedMethods.forEach(method => {
    const label = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = method;
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + method));
    detectionListDiv.appendChild(label);
  });
  const detectionCheckboxes = Array.from(detectionListDiv.querySelectorAll('input[type="checkbox"]'));

  detectionSelectedDiv.addEventListener('click', function(e) {
    detectionDropdown.classList.toggle('open');
  });
  document.addEventListener('click', function(e) {
    if (!detectionDropdown.contains(e.target)) {
      detectionDropdown.classList.remove('open');
    }
  });

  function updateDetectionSelectedDisplay() {
    const selected = detectionCheckboxes.filter(cb => cb.checked);
    detectionSelectedDiv.innerHTML = '';
    if (selected.length === 0) {
      detectionSelectedDiv.innerHTML = '<span class="placeholder">Select</span>';
    } else if (selected.length === detectionCheckboxes.length) {
      detectionSelectedDiv.textContent = 'All selected';
    } else if (selected.length === 1) {
      detectionSelectedDiv.textContent = selected[0].parentElement.textContent.trim();
    } else {
      detectionSelectedDiv.textContent = `${selected.length} selected`;
    }
  }

  // --- Chart Update Logic (UNCHANGED) ---
  function updateChart() {
    const selectedJurisdictions = checkboxes.filter(cb => cb.checked).map(cb => cb.value);
    const selectedMethods = detectionCheckboxes.filter(cb => cb.checked).map(cb => cb.value);

    let effectiveMethods = new Set(selectedMethods);
    if (selectedMethods.includes('Fixed camera') || selectedMethods.includes('Mobile camera')) {
      if (selectedMethods.includes('Fixed camera')) effectiveMethods.add('Fixed or mobile camera');
      if (selectedMethods.includes('Mobile camera')) effectiveMethods.add('Fixed or mobile camera');
    }

    const filteredData = data.filter(d =>
      (selectedJurisdictions.length === 0 || selectedJurisdictions.includes(d.jurisdiction)) &&
      (selectedMethods.length === 0 || effectiveMethods.has(d.detectionMethod))
    );
    drawHistogram(filteredData, selectedJurisdictions.length === 0 ? 'all' : selectedJurisdictions);
    updateSelectedDisplay();
    updateDetectionSelectedDisplay();
  }

  checkboxes.forEach(cb => {
    cb.addEventListener('change', updateChart);
  });
  detectionCheckboxes.forEach(cb => {
    cb.addEventListener('change', updateChart);
  });

  // Initial display
  updateSelectedDisplay();
  updateDetectionSelectedDisplay();

}).catch(error => {
  console.error('Error loading the CSV file:', error);
});
