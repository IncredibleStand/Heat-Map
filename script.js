// Set margins and dimensions for the SVG container
const margin = { top: 60, right: 200, bottom: 100, left: 100 };
const width = 1430 - margin.left - margin.right; // Width of the chart area
const height = 600 - margin.top - margin.bottom; // Height of the chart area

// Tooltip: Create a tooltip element to display data on hover
const tooltip = d3.select("#tooltip");

// Fetch the data from the provided URL
const url = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";
d3.json(url).then((data) => {
  const baseTemp = data.baseTemperature; // Base temperature provided in the dataset
  const monthlyData = data.monthlyVariance; // Array of temperature variances by month and year

  // xScale: Maps years to horizontal positions
  const xScale = d3
    .scaleBand()
    .domain(monthlyData.map(d => d.year)) // Extract years from data
    .range([0, width]) // Scale to fit the chart width

  // yScale: Maps months to vertical positions
  const yScale = d3
    .scaleBand()
    .domain(d3.range(0, 12)) // Array [0, 1, ..., 11] for the months
    .range([0, height]); // Scale to fit the chart height

  // colorScale: Maps temperature values to colours
  const colorScale = d3
    .scaleQuantize()
    .domain([
      d3.min(monthlyData, d => baseTemp + d.variance), // Minimum temperature
      d3.max(monthlyData, d => baseTemp + d.variance)  // Maximum temperature
    ])
    .range(["#4575b4", "#91bfdb", "#e0f3f8", "#fee090", "#fc8d80", "#fc8d59", "#d73027"]); // Colour range

  // Append SVG element to the container
  const svg = d3
    .select("#chart-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right) // Total width including margins
    .attr("height", height + margin.top + margin.bottom) // Total height including margins
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`); // Move the chart area to account for margins

  // xAxis: Horizontal axis for years
  const xAxis = d3.axisBottom(xScale)
    .tickValues(xScale.domain().filter(year => year % 10 === 0)) // Show ticks every 10 years
    .tickFormat(d3.format("d")); // Format as integers

  svg.append("g")
    .attr("id", "x-axis")
    .attr("transform", `translate(0, ${height})`) // Move axis to bottom of the chart
    .call(xAxis);

  // yAxis: Vertical axis for months
  const yAxis = d3.axisLeft(yScale)
    .tickFormat((month) => {
      const date = new Date(); // Create a new date object.
      date.setMonth(month); // Set the month
      return d3.timeFormat("%B")(date); // Format as full month name
    });

  svg.append("g")
    .attr("id", "y-axis")
    .call(yAxis);

    svg.append("g")
            .append("text") // Append a text element
            .attr("transform", "rotate(-90)")
            .attr("y", -70) // Position the text above the horizontally
            .attr("x", -170) // Center the text vertically
            .style("text-anchor", "middle") // Center the text horizontally
            .style("font-size", 1.3 + "em")
            .text("Months"); // The text to display

    svg.append("g")
            .append("text") // Append a text element
            .attr("y", height + 40) // Position the text above the horizontally
            .attr("x", width - 30) // Center the text vertically
            .style("text-anchor", "middle") // Center the text horizontally
            .style("font-size", 1.3 + "em")
            .text("Years"); // The text to display

  // Add Cells for the heatmap
  svg.selectAll(".cell")
    .data(monthlyData) // Bind data
    .enter()
    .append("rect") // Create a rectangle for each data point
    .attr("class", "cell")
    .attr("data-month", d => d.month - 1) // Store month as a zero-based index
    .attr("data-year", d => d.year) // Store year
    .attr("data-temp", d => baseTemp + d.variance) // Store calculated temperature
    .attr("x", d => xScale(d.year)) // Position horizontally
    .attr("y", d => yScale(d.month - 1)) // Position vertically
    .attr("width", xScale.bandwidth()) // Set rectangle width
    .attr("height", yScale.bandwidth()) // Set rectangle height
    .attr("fill", d => colorScale(baseTemp + d.variance)) // Fill color based on temperature
    .on("mouseover", (event, d) => { // Show tooltip on hover
      tooltip.style("opacity", 0.9)
        .style("left", event.pageX + 10 + "px") // Position tooltip
        .style("top", event.pageY - 10 + "px")
        .attr("data-year", d.year) // Attach year data
        .html(
          `${d.year} - ${d3.timeFormat("%B")(new Date(0).setUTCMonth(d.month - 1))} <br>
           Temperature: ${(baseTemp + d.variance).toFixed(2)}℃ <br>
           Variance: ${d.variance.toFixed(2)}℃`
        );
    })
    .on("mouseout", () => tooltip.style("opacity", 0)); // Hide tooltip on mouseout

  // Add Legend to the chart
  const legendWidth = 370; // Width of the legend
  const legendHeight = 30; // Height of the legend

  const legend = svg.append("g").attr("id", "legend");

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain()) // Legend scale matches color scale domain
    .range([0, legendWidth]); // Spread across the legend width

// Create ticks from min to max
  const legendAxis = d3.axisBottom(legendScale)
    .tickValues(colorScale.range().map(d => colorScale.invertExtent(d)[0])) // Use range thresholds for ticks
    .tickFormat(d3.format(".2f")); // Format as fixed decimal numbers

  // Add colored rectangles for the legend
  legend.selectAll("rect")
    .data(colorScale.range()) // Bind colors
    .enter()
    .append("rect")
    .attr("x", (d, i) => legendScale(colorScale.invertExtent(d)[0])) // Position rectangles
    .attr("y", height + 40) // Position below the chart
    .attr("width", (d, i) => legendScale(colorScale.invertExtent(d)[1]) - legendScale(colorScale.invertExtent(d)[0])) // Set width based on scale
    .attr("height", legendHeight) // Fixed height
    .attr("fill", d => d); // Fill with color

  // Add legend axis
  legend.append("g")
    .attr("transform", `translate(0, ${height + 70})`) // Position below rectangles
    .call(legendAxis);
});
