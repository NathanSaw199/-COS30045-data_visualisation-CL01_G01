console.log("interactions.js loaded with enhanced features");


let currentTooltip = null;


document.addEventListener('DOMContentLoaded', function() {
  console.log("Setting up enhanced interactions...");
  
  setTimeout(() => {
    try {
      addHistogramInteractions();
      addPieChartInteractions();
      addBarChartInteractions();
      addGlobalKeyboardShortcuts();
      setupChartUpdateListeners();
      console.log("All interactions successfully initialized!");
    } catch (error) {
      console.error("Error initializing interactions:", error);
    }
  }, 1000);
});

// chart update detection
function setupChartUpdateListeners() {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (let node of mutation.addedNodes) {
          if (node.tagName === 'svg' || (node.nodeType === 1 && node.querySelector('svg'))) {
            const container = mutation.target.id;
            if (container === 'histogram') {
              setTimeout(() => addHistogramInteractions(), 100);
            } else if (container === 'piechart') {
              setTimeout(() => addPieChartInteractions(), 100);
            } else if (container === 'barchart') {
              setTimeout(() => addBarChartInteractions(), 100);
            }break;
          }
        }
      }
    });
  });

  ['histogram', 'piechart', 'barchart'].forEach(id => {
    const container = document.getElementById(id);
    if (container) observer.observe(container, { childList: true, subtree: true });
  });
}

// ----- BAR CHART INTERACTIONS ----
function addBarChartInteractions() {
  const svg = d3.select("#barchart svg");
  if (svg.empty()) return;
  
  console.log("Adding bar chart interactions...");

  // Clear existing interactions
  svg.selectAll(".year-bar").on("mouseover mouseout click", null);

  svg.selectAll(".year-bar")
    .on("mouseover", function(event, d) {
      // Get the jurisdiction from the parent group
      const parentGroup = d3.select(this.parentNode);
      const jurisdiction = parentGroup.datum().jurisdiction;
      
      // Highlight current bar
      d3.select(this)
        .transition().duration(200)
        .style("filter", "brightness(1.2)")
        .style("stroke", "#333")
        .style("stroke-width", "2px");

      // Dim other bars
      svg.selectAll(".year-bar").filter(function() { return this !== event.target; })
        .transition().duration(200)
        .style("opacity", 0.4);

      // Show tooltip
      showTooltip(event, {
        jurisdiction: jurisdiction,
        year: d.year,
        fines: d.fines.toLocaleString()
      });
    })
    .on("mouseout", function() {
      // Reset all bars
      svg.selectAll(".year-bar")
        .transition().duration(200)
        .style("opacity", 1)
        .style("filter", "none")
        .style("stroke", "none")
        .style("stroke-width", "0px");

      hideTooltip();
    })
    .on("click", function(event, d) {
      event.stopPropagation();
      
      // Quick scale animation
      d3.select(this)
        .transition().duration(100)
        .attr("transform", "scale(1.05)")
        .transition().duration(100)
        .attr("transform", "scale(1)");
      
      // Get jurisdiction from parent group
      const parentGroup = d3.select(this.parentNode);
      const jurisdiction = parentGroup.datum().jurisdiction;
      
      console.log(`Selected: ${jurisdiction} - ${d.year} with ${d.fines.toLocaleString()} fines`);
    });

  console.log(`Bar chart interactions added to ${svg.selectAll(".year-bar").size()} bars`);
}

// ----- HISTOGRAM INTERACTIONS ----
function addHistogramInteractions() {
  const svg = d3.select("#histogram svg");
  if (svg.empty()) return;
  
  console.log("Adding histogram interactions...");

  // clear already existng interactions
  svg.selectAll("circle, .line-path").on("mouseover mouseout click", null);
  svg.select(".crosshair").remove();

  // point circle interaction
  svg.selectAll("circle")
    .on("mouseover", function(event, d) {
      showTooltip(event, {
        year: d.year,
        fines: d.fines.toLocaleString(),
        jurisdiction: getJurisdictionFromClass(this)
      });
      dimOthers(this, "circle");
    })
    .on("mouseout", function() {
      resetOpacity();
      hideTooltip();
    });

  //line interactions
  svg.selectAll(".line-path")
    .on("mouseover", function(event, d) {
      d3.select(this).transition().duration(200).style("stroke-width", 4);
      d3.selectAll(".line-path").filter(function() { return this !== event.target; })
        .transition().duration(200).style("opacity", 0.3);
      showTooltip(event, {
        jurisdiction: d.jurisdiction || "Unknown",
        totalFines: d.values ? d.values.reduce((sum, v) => sum + v.fines, 0).toLocaleString() : "N/A"
      });
    })
    .on("mouseout", function() {
      d3.select(this).transition().duration(200).style("stroke-width", 2);
      d3.selectAll(".line-path").transition().duration(200).style("opacity", 1);
      hideTooltip();
    });

  addCrosshair(svg);
  console.log(`Interactions added to ${svg.selectAll("circle").size()} circles and ${svg.selectAll(".line-path").size()} lines`);
}

// -----PIE CHART INTERACTIONS-------
function addPieChartInteractions() {
  const svg = d3.select("#piechart svg");
  if (svg.empty()) return;
  
  console.log("Adding pie chart interactions...");

  setTimeout(() => {
    // Clear existing interactions
    svg.selectAll(".arc, path").on("mouseover mouseout click", null);

    const slices = svg.selectAll(".arc, path").filter(function() {
      return d3.select(this).attr("d") && d3.select(this).attr("d").includes("A");
    });

    slices
      .on("mouseover", function(event, d) {
        const currentPath = d3.select(this).select("path");
        const path = currentPath.empty() ? d3.select(this) : currentPath;
        
        if (!path.attr("data-original-transform")) {
          path.attr("data-original-transform", path.attr("transform") || "");
        }
        
        path.transition().duration(200)
          .style("filter", "brightness(1.15)")
          .style("stroke", "#fff")
          .style("stroke-width", "3px")
          .style("cursor", "pointer");

        if (d && d.data) {
          const percentage = ((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1);
          showTooltip(event, {
            ageGroup: d.data.ageGroup,
            fines: d.data.fineCount.toLocaleString(),
            percentage: percentage + "%"
          });
        }

        svg.selectAll("path").filter(function() { return this !== path.node(); })
          .transition().duration(200).style("opacity", 0.6);
      })
      .on("mouseout", function(event, d) {
        const currentPath = d3.select(this).select("path");
        const path = currentPath.empty() ? d3.select(this) : currentPath;
        
        path.transition().duration(200)
          .attr("transform", path.attr("data-original-transform") || "")
          .style("filter", "none")
          .style("stroke", "none")
          .style("stroke-width", "0px")
          .style("cursor", "default");

        svg.selectAll("path").transition().duration(200).style("opacity", 1);
        hideTooltip();
      })
      .on("click", function(event, d) {
        event.stopPropagation();
        const path = d3.select(this).select("path");
        const currentPath = path.empty() ? d3.select(this) : path;
        
        currentPath.transition().duration(100)
          .attr("transform", "scale(1.1)")
          .transition().duration(100)
          .attr("transform", currentPath.attr("data-original-transform") || "");
        
        if (d && d.data) {
          console.log(`Selected: ${d.data.ageGroup} with ${d.data.fineCount.toLocaleString()} fines`);
        }
      });

    console.log(`Pie interactions added to ${slices.size()} elements`);
  }, 100);
}

// ----TOOLTIP FUNCTIONS------
function showTooltip(event, data) {
  hideTooltip();
  
  currentTooltip = d3.select("body").append("div")
    .attr("class", "interaction-tooltip")
    .style("position", "absolute")
    .style("background", "rgba(0, 0, 0, 0.9)")
    .style("color", "white")
    .style("padding", "12px")
    .style("border-radius", "6px")
    .style("font-size", "14px")
    .style("pointer-events", "none")
    .style("z-index", "1000")
    .style("box-shadow", "0 4px 12px rgba(0,0,0,0.3)")
    .style("opacity", 0);

  const content = Object.entries(data).map(([key, value]) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    return `<div style="margin-bottom: 4px;"><strong>${label}:</strong> ${value}</div>`;
  }).join('');

  currentTooltip.html(content)
    .style("left", (event.pageX + 15) + "px")
    .style("top", (event.pageY - 15) + "px")
    .transition().duration(200).style("opacity", 1);
}

function hideTooltip() {
  if (currentTooltip) {
    currentTooltip.transition().duration(200).style("opacity", 0).remove();
    currentTooltip = null;
  }
}

// ---- corsshair----
function addCrosshair(svg) {
  const crosshair = svg.append("g").attr("class", "crosshair").style("display", "none");
  
  crosshair.selectAll("line").data(["x", "y"]).enter().append("line")
    .attr("class", d => `crosshair-${d}`)
    .style("stroke", "#666")
    .style("stroke-width", 1)
    .style("stroke-dasharray", "3,3");

  svg.on("mousemove", function(event) {
    const [x, y] = d3.pointer(event);
    const bounds = svg.node().getBoundingClientRect();
    
    crosshair.select(".crosshair-x").attr("x1", 0).attr("x2", bounds.width).attr("y1", y).attr("y2", y);
    crosshair.select(".crosshair-y").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", bounds.height);
    crosshair.style("display", null);
  })
  .on("mouseleave", () => crosshair.style("display", "none"));
}

// KEYBOARD SHORTCUTS
function addGlobalKeyboardShortcuts() {
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      hideTooltip();
    }
    if ((event.key === 'r' || event.key === 'R') && !event.ctrlKey && !event.metaKey) {
      resetAllFilters();
    }
  });
}
function dimOthers(activeElement, selector) {
  d3.selectAll(selector).filter(function() { return this !== activeElement; })
    .transition().duration(200).style("opacity", 0.3);
}

function resetOpacity() {
  d3.selectAll("circle, .line-path").transition().duration(200).style("opacity", 1);
}

function getJurisdictionFromClass(element) {
  const className = d3.select(element).attr("class");
  return className && className.includes("circle-") ? 
    className.replace("circle-", "").replace(/-/g, " ") : "Unknown";
}

// KEYBOARD SHORTCUTS
function addGlobalKeyboardShortcuts() {
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      deselectDataPoint();
      hideTooltip();
    }
    if ((event.key === 'r' || event.key === 'R') && !event.ctrlKey && !event.metaKey) {
      resetAllFilters();
    }
  });
}

function resetAllFilters() {
  document.querySelectorAll('#jurisdictionDropdown input[type="checkbox"], #detectionDropdown input[type="checkbox"]')
    .forEach(cb => cb.checked = false);
  
  document.querySelector('#jurisdictionDropdown input[type="checkbox"]')?.dispatchEvent(new Event('change'));
}

// export utilities
window.InteractionUtils = {
  showTooltip,
  hideTooltip,
  resetAllFilters
};