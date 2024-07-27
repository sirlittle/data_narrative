// Set up the SVG container
console.log("At the start");
const svg = d3.select("#visualization").append("svg").attr("width", 1000).attr("height", 750);
console.log("SVG created:", svg.node());
// Load the data
d3.csv("StudentsPerformance.csv").then((data) => {
  // Parse numeric values
  console.log("Data loaded. First data point:", data[0]);
  console.log("Number of data points:", data.length);
  data.forEach((d) => {
    d["math score"] = +d["math score"];
    d["reading score"] = +d["reading score"];
    d["writing score"] = +d["writing score"];
  });

  // Set up navigation
  const slides = [
    { title: "Introduction", render: renderIntro },
    { title: "Gender and Test Scores", render: renderGenderComparison },
    { title: "Parental Education and Scores", render: renderParentalEducation },
    { title: "Race/Ethnicity and Scores", render: renderRaceEthnicity },
    { title: "Socioeconomic Status and Scores", render: renderLunchType },
    { title: "Conclusion", render: renderConclusion },
  ];

  let currentSlide = 0;

  function showSlide(index) {
    console.log(`Showing slide ${index}: ${slides[index].title}`);
    svg.selectAll("*").remove();
    slides[index].render(data);
  }

  d3.select("#prev").on("click", () => {
    currentSlide = Math.max(0, currentSlide - 1);
    showSlide(currentSlide);
  });

  d3.select("#next").on("click", () => {
    currentSlide = Math.min(slides.length - 1, currentSlide + 1);
    showSlide(currentSlide);
  });

  // Render the first slide
  showSlide(0);
  console.log("Initial slide rendered");
});

function renderIntro(data) {
  console.log("Rendering intro slide");
  svg
    .append("text")
    .attr("x", 500)
    .attr("y", 350)
    .attr("text-anchor", "middle")
    .text("Understanding the Factors Influencing Student Performance")
    .attr("font-size", "24px");
  svg
    .append("text")
    .attr("x", 500)
    .attr("y", 400)
    .attr("text-anchor", "middle")
    .text("Use the buttons below to navigate through the slides.")
    .attr("font-size", "18px");

}

function renderGenderComparison(data) {
  console.log("Rendering gender comparison");

  // Calculate average scores by gender
  const genderAverages = d3.rollup(
    data,
    (v) => ({
      average: d3.mean(v, (d) => (d["math score"] + d["reading score"] + d["writing score"]) / 3),
      math: d3.mean(v, (d) => d["math score"]),
      reading: d3.mean(v, (d) => d["reading score"]),
      writing: d3.mean(v, (d) => d["writing score"]),
    }),
    (d) => d.gender
  );
  console.log("Gender averages:", genderAverages);

  // Set up chart dimensions
  const margin = { top: 80, right: 100, bottom: 60, left: 60 };
  const width = 1000 - margin.left - margin.right;
  const height = 750 - margin.top - margin.bottom;

  svg.selectAll("*").remove(); // Clear previous content

  const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales
  const x = d3.scaleBand().range([0, width]).padding(0.1);
  const y = d3.scaleLinear().range([height, 0]);

  // Add axes
  const xAxis = chart.append("g").attr("transform", `translate(0,${height})`);
  const yAxis = chart.append("g");

  const scoreTypes = ["average", "math", "reading", "writing"];
  let currentScoreType = "average";

  // Define color scale
  const colorScale = d3.scaleOrdinal().domain(["male", "female"]).range(["#4e79a7", "#f28e2c"]); // Blue for male, Orange for female

  // Function to update the chart based on selected score type
  function updateChart(scoreType) {
    currentScoreType = scoreType;

    const data = Array.from(genderAverages, ([key, value]) => ({ gender: key, score: value[scoreType] }));

    x.domain(data.map((d) => d.gender));
    y.domain([0, d3.max(data, (d) => d.score) * 1.1]); // Add 10% padding to the top

    xAxis.call(d3.axisBottom(x));
    yAxis.call(d3.axisLeft(y).ticks(5));

    // Update bars
    const bars = chart.selectAll(".bar").data(data, (d) => d.gender);

    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .merge(bars)
      .transition()
      .duration(300)
      .attr("x", (d) => x(d.gender))
      .attr("y", (d) => y(d.score))
      .attr("width", x.bandwidth())
      .attr("height", (d) => height - y(d.score))
      .attr("fill", (d) => colorScale(d.gender));

    bars.exit().remove();

    // Update labels
    const labels = chart.selectAll(".bar-label").data(data, (d) => d.gender);

    labels
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .merge(labels)
      .transition()
      .duration(300)
      .attr("x", (d) => x(d.gender) + x.bandwidth() / 2)
      .attr("y", (d) => y(d.score) - 5)
      .attr("text-anchor", "middle")
      .text((d) => d.score.toFixed(1));

    labels.exit().remove();

    // Update y-axis label
    chart.select(".y-axis-label").remove();
    chart
      .append("text")
      .attr("class", "y-axis-label")
      .attr("transform", "rotate(-90)")
      .attr("y", 0 - margin.left)
      .attr("x", 0 - height / 2)
      .attr("dy", "1em")
      .style("text-anchor", "middle")
      .text(`Average ${scoreType === "average" ? "overall" : scoreType} score`);

    // Update chart title
    chart.select(".chart-title").remove();
    chart
      .append("text")
      .attr("class", "chart-title")
      .attr("x", width / 2)
      .attr("y", 0 - margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(
        `Gender Comparison: ${
          scoreType === "average" ? "Overall" : scoreType.charAt(0).toUpperCase() + scoreType.slice(1)
        } Scores`
      );

    // Add annotations
    chart.selectAll(".annotation-group").remove();
    
    const annotations = [];
    
    // Annotation for the highest score
    const maxScore = d3.max(data, d => d.score);
    const maxGender = data.find(d => d.score === maxScore).gender;
    annotations.push({
      note: {
        label: "Highest score",
        title: `${maxGender.charAt(0).toUpperCase() + maxGender.slice(1)}: ${maxScore.toFixed(1)}`,
        wrap: 150
      },
      x: x(maxGender) + x.bandwidth() / 2,
      y: y(maxScore),
      dx: maxGender === "male" ? 30 : -30,
      dy: -30
    });

    // Annotation for the score difference
    const maleScore = data.find(d => d.gender === "male").score;
    const femaleScore = data.find(d => d.gender === "female").score;
    const scoreDiff = Math.abs(maleScore - femaleScore).toFixed(1);
    annotations.push({
      note: {
        label: "Score difference",
        title: `${scoreDiff} points`,
        wrap: 150
      },
      x: width / 2,
      y: y((maleScore + femaleScore) / 2),
      dx: 0,
      dy: maleScore > femaleScore ? 30 : -30
    });

    // Create the annotation
    const makeAnnotations = d3.annotation()
      .type(d3.annotationLabel)
      .annotations(annotations);

    chart.append("g")
      .attr("class", "annotation-group")
      .call(makeAnnotations);
  }

  // Initial render
  updateChart(currentScoreType);

  // Add buttons for switching between score types
  const buttonContainer = svg.append("g").attr("transform", `translate(${margin.left}, ${height + margin.top + 20})`);

  scoreTypes.forEach((type, i) => {
    const button = buttonContainer
      .append("g")
      .attr("transform", `translate(${i * 100}, 0)`)
      .style("cursor", "pointer")
      .on("click", () => updateChart(type));

    button.append("rect").attr("width", 90).attr("height", 30).attr("rx", 5).attr("ry", 5).attr("fill", "lightgray");

    button
      .append("text")
      .attr("x", 45)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text(type === "average" ? "Overall" : type);
  });

  // Add an explanation text
  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", height + margin.top + 70)
    .style("font-size", "14px")
    .text("Click on the buttons above to view scores for different subjects.");

  // Add legend
  const legend = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(["male", "female"])
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(${width + margin.left},${i * 20 + margin.top})`);

  legend.append("rect").attr("x", -19).attr("width", 19).attr("height", 19).attr("fill", colorScale);

  legend
    .append("text")
    .attr("x", -24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text((d) => d.charAt(0).toUpperCase() + d.slice(1));
}

function renderParentalEducation(data) {
  console.log("Rendering Parental education");

  const educationAverages = d3.rollup(
    data,
    (v) => ({
      math: d3.mean(v, (d) => d["math score"]),
      reading: d3.mean(v, (d) => d["reading score"]),
      writing: d3.mean(v, (d) => d["writing score"]),
    }),
    (d) => d["parental level of education"]
  );

  const margin = { top: 60, right: 150, bottom: 140, left: 60 };
  const width = 1000 - margin.left - margin.right;
  const height = 750 - margin.top - margin.bottom;

  svg.selectAll("*").remove(); // Clear previous content

  const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const educationLevels = Array.from(educationAverages.keys());
  const scoreTypes = ["math", "reading", "writing"];

  const x0 = d3.scaleBand().domain(educationLevels).rangeRound([0, width]).paddingInner(0.1);

  const x1 = d3.scaleBand().domain(scoreTypes).rangeRound([0, x0.bandwidth()]).padding(0.05);

  const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

  const color = d3.scaleOrdinal().domain(scoreTypes).range(["#98abc5", "#8a89a6", "#7b6888"]);

  const xAxis = d3.axisBottom(x0);
  const yAxis = d3.axisLeft(y);

  chart
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)");

  chart
    .append("g")
    .attr("class", "y-axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Score");

  function updateChart(sortBy = null) {
    let sortedEducationLevels = [...educationLevels];
    if (sortBy) {
      sortedEducationLevels.sort((a, b) => educationAverages.get(b)[sortBy] - educationAverages.get(a)[sortBy]);
    }

    x0.domain(sortedEducationLevels);

    chart
      .select(".x-axis")
      .transition()
      .duration(750)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    const educationGroup = chart.selectAll(".education-group").data(sortedEducationLevels, (d) => d);

    const enterGroup = educationGroup.enter().append("g").attr("class", "education-group");

    educationGroup.exit().remove();

    enterGroup
      .merge(educationGroup)
      .transition()
      .duration(750)
      .attr("transform", (d) => `translate(${x0(d)},0)`);

    const bars = enterGroup
      .merge(educationGroup)
      .selectAll("rect")
      .data((d) => scoreTypes.map((key) => ({ key, value: educationAverages.get(d)[key] })));

    bars
      .enter()
      .append("rect")
      .merge(bars)
      .transition()
      .duration(750)
      .attr("x", (d) => x1(d.key))
      .attr("y", (d) => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", (d) => height - y(d.value))
      .attr("fill", (d) => color(d.key));

    bars.exit().remove();

    // Add labels on top of each bar
    const labels = enterGroup
      .merge(educationGroup)
      .selectAll(".bar-label")
      .data((d) => scoreTypes.map((key) => ({ key, value: educationAverages.get(d)[key] })));

    labels
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .merge(labels)
      .transition()
      .duration(750)
      .attr("x", (d) => x1(d.key) + x1.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 5)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .text((d) => d.value.toFixed(1));

    labels.exit().remove();
  }

  // Initial render
  updateChart();

  // Add sort buttons
  const buttonContainer = svg.append("g").attr("transform", `translate(${margin.left}, ${height + margin.top + 80})`);

  const sortOptions = ["Unsorted", ...scoreTypes];

  sortOptions.forEach((option, i) => {
    const button = buttonContainer
      .append("g")
      .attr("transform", `translate(${i * 120}, 0)`)
      .style("cursor", "pointer")
      .on("click", () => updateChart(option === "Unsorted" ? null : option));

    button.append("rect").attr("width", 110).attr("height", 30).attr("rx", 5).attr("ry", 5).attr("fill", "lightgray");

    button
      .append("text")
      .attr("x", 55)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text(option);
  });

  // Add legend
  const legend = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(scoreTypes.slice().reverse())
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(${width + margin.left + 20},${i * 20 + margin.top})`);

  legend.append("rect").attr("x", 19).attr("width", 19).attr("height", 19).attr("fill", color);

  legend
    .append("text")
    .attr("x", 15)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text((d) => d);

  // Add chart title
  svg
    .append("text")
    .attr("x", width / 2 + margin.left)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Average Scores by Parental Education Level");

  // Add explanation text
  svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", height + margin.top + 130)
    .style("font-size", "14px")
    .text("Click on the buttons above to sort by different score types.");
}

function renderRaceEthnicity(data) {
  console.log("Rendering race/ethnicity comparison");

  const raceAverages = d3.rollup(
    data,
    (v) => ({
      math: d3.mean(v, (d) => d["math score"]),
      reading: d3.mean(v, (d) => d["reading score"]),
      writing: d3.mean(v, (d) => d["writing score"]),
    }),
    (d) => d["race/ethnicity"]
  );

  const margin = { top: 60, right: 200, bottom: 180, left: 80 };
  const width = 1000 - margin.left - margin.right;
  const height = 750 - margin.top - margin.bottom;

  svg.selectAll("*").remove(); // Clear previous content

  const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const subgroups = ["math", "reading", "writing"];
  const groups = Array.from(raceAverages.keys());

  const x = d3.scaleBand().domain(groups).range([0, width]).padding([0.2]);

  const y = d3
    .scaleLinear()
    .domain([0, 300]) // Max possible score is 100 * 3 subjects
    .range([height, 0]);

  const color = d3.scaleOrdinal().domain(subgroups).range(["#e41a1c", "#377eb8", "#4daf4a"]);

  // Add X axis
  chart
    .append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end")
    .style("font-size", "12px");

  // Add Y axis
  chart.append("g").attr("class", "y-axis").call(d3.axisLeft(y)).selectAll("text").style("font-size", "12px");

  // Initialize visibility state
  const visibility = {
    math: true,
    reading: true,
    writing: true,
  };

  function updateChart() {
    // Filter subgroups based on visibility
    const visibleSubgroups = subgroups.filter((subgroup) => visibility[subgroup]);

    // Prepare stacked data
    const stackedData = d3.stack().keys(visibleSubgroups)(
      Array.from(raceAverages, ([key, value]) => ({ group: key, ...value }))
    );

    // Update y-axis domain
    const yMax = d3.max(stackedData, (d) => d3.max(d, (d) => d[1]));
    y.domain([0, yMax]);
    chart.select(".y-axis").transition().duration(500).call(d3.axisLeft(y));

    // Create or update the stacked bars
    const barGroups = chart.selectAll(".bar-group").data(stackedData);

    const barGroupsEnter = barGroups.enter().append("g").attr("class", "bar-group");

    barGroupsEnter
      .merge(barGroups)
      .attr("fill", (d) => color(d.key))
      .each(function (d) {
        d3.select(this)
          .selectAll("rect")
          .data(d)
          .join("rect")
          .transition()
          .duration(500)
          .attr("x", (d) => x(d.data.group))
          .attr("y", (d) => y(d[1]))
          .attr("height", (d) => y(d[0]) - y(d[1]))
          .attr("width", x.bandwidth())
          .attr("stroke", "white")
          .attr("stroke-width", 1);
      });

    barGroups.exit().remove();

    // Add sum labels at the top of each stack
    const sumLabels = chart.selectAll(".sum-label").data(groups);

    sumLabels
      .enter()
      .append("text")
      .attr("class", "sum-label")
      .merge(sumLabels)
      .transition()
      .duration(500)
      .attr("x", (d) => x(d) + x.bandwidth() / 2)
      .attr("y", (d) => {
        const groupData = stackedData[stackedData.length - 1].find((item) => item.data.group === d);
        return y(groupData[1]) - 5;
      })
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .text((d) => {
        const sum = visibleSubgroups.reduce((acc, subject) => acc + raceAverages.get(d)[subject], 0);
        return sum.toFixed(1);
      });

    sumLabels.exit().remove();

    // Add interactivity
    chart
      .selectAll(".bar-group")
      .selectAll("rect")
      .on("mouseover", function (event, d) {
        const subgroupName = d3.select(this.parentNode).datum().key;
        const subgroupValue = d.data[subgroupName];
        const groupName = d.data.group;

        d3.select(this).attr("stroke", "black").attr("stroke-width", 3);

        chart
          .append("text")
          .attr("class", "tooltip")
          .attr("x", x(groupName) + x.bandwidth() / 2)
          .attr("y", y(d[1]) - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .text(`${subgroupName}: ${subgroupValue.toFixed(1)}`);
      })
      .on("mouseout", function () {
        d3.select(this).attr("stroke", "white").attr("stroke-width", 1);
        chart.selectAll(".tooltip").remove();
      });
  }

  // Initial chart render
  updateChart();

  // Add a legend with toggle functionality
  const legend = chart
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(subgroups.slice().reverse())
    .enter()
    .append("g")
    .attr("transform", (d, i) => `translate(${width + 20},${i * 25})`)
    .style("cursor", "pointer")
    .on("click", function (event, d) {
      visibility[d] = !visibility[d];
      d3.select(this).style("opacity", visibility[d] ? 1 : 0.2);
      updateChart();
    });

  legend.append("rect").attr("x", 0).attr("width", 19).attr("height", 19).attr("fill", color);

  legend
    .append("text")
    .attr("x", -5)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text((d) => d);

  // Add chart title
  chart
    .append("text")
    .attr("x", width / 2)
    .attr("y", 0 - margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Average Scores by Race/Ethnicity");

  // Add X axis label
  chart
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Race/Ethnicity");

  // Add Y axis label
  chart
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", 0 - height / 2)
    .attr("y", 0 - margin.left)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Score");

  // Add explanation text with manual line breaks
  const explanationText = svg
    .append("text")
    .attr("x", margin.left)
    .attr("y", height + margin.top + 80)
    .style("font-size", "14px");

  const explanationLines = [
    "Hover over the bars to see specific scores.",
    "Click on legend items to toggle visibility.",
    "Each bar represents average scores for math,",
    "reading, and writing tests.",
    "The number at the top of each bar is the sum",
    "of visible subject scores.",
  ];

  explanationLines.forEach((line, i) => {
    explanationText
      .append("tspan")
      .attr("x", margin.left)
      .attr("dy", i === 0 ? 0 : "1.2em")
      .text(line);
  });
}

function renderLunchType(data) {
  const margin = { top: 60, right: 200, bottom: 100, left: 60 };
  const width = 1000 - margin.left - margin.right;
  const height = 750 - margin.top - margin.bottom;

  svg.selectAll("*").remove(); // Clear previous content
  const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // Calculate averages for each lunch type
  const lunchAverages = d3.rollup(
    data,
    (v) => ({
      math: d3.mean(v, (d) => d["math score"]),
      reading: d3.mean(v, (d) => d["reading score"]),
    }),
    (d) => d["lunch"]
  );

  // Set up scales
  const xScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d["math score"])])
    .range([0, width]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d["reading score"])])
    .range([height, 0]);

  const colorScale = d3.scaleOrdinal().domain(["standard", "free/reduced"]).range(["#1f77b4", "#ff7f0e"]);

  // Add axes
  chart.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));
  chart.append("g").call(d3.axisLeft(yScale));

  // Add scatter plot points
  const dots = chart
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d["math score"]))
    .attr("cy", (d) => yScale(d["reading score"]))
    .attr("r", 4)
    .attr("fill", (d) => colorScale(d["lunch"]))
    .attr("opacity", 0.6);

  // Add interactivity
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

  dots
    .on("mouseover", (event, d) => {
      tooltip
        .style("opacity", 0.9)
        .html(
          `Math: ${d["math score"]}<br/>Reading: ${d["reading score"]}<br/>Writing: ${d["writing score"]}<br/>Lunch: ${d["lunch"]}`
        )
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // Add average points and annotations
  const lunchTypes = ["standard", "free/reduced"];
  const annotations = lunchTypes.map((lunchType, index) => {
    const avgScores = lunchAverages.get(lunchType);
    return {
      note: {
        label: `Math: ${avgScores.math.toFixed(1)}\nReading: ${avgScores.reading.toFixed(1)}`,
        title: lunchType.charAt(0).toUpperCase() + lunchType.slice(1) + " Lunch Average Scores",
        wrap: 150,
      },
      x: xScale(avgScores.math),
      y: yScale(avgScores.reading),
      dx: index === 0 ? 200 : -200,
      dy: index === 0 ? 50 : -50,
      color: "#2c3e50", // Dark blue-gray color for better contrast
    };
  });

  const makeAnnotations = d3.annotation().annotations(annotations);

  chart.append("g").attr("class", "annotation-group").call(makeAnnotations);

  // Add average points
  chart
    .selectAll(".average-point")
    .data(lunchTypes)
    .enter()
    .append("circle")
    .attr("class", "average-point")
    .attr("cx", (d) => xScale(lunchAverages.get(d).math))
    .attr("cy", (d) => yScale(lunchAverages.get(d).reading))
    .attr("r", 8)
    .attr("fill", (d) => colorScale(d))
    .attr("stroke", "white")
    .attr("stroke-width", 2);

  // Add legend
  const legend = chart.append("g").attr("transform", `translate(${width + 10}, 0)`);

  lunchTypes.forEach((lunchType, index) => {
    const legendItem = legend.append("g").attr("transform", `translate(0, ${index * 20})`);
    legendItem.append("rect").attr("width", 15).attr("height", 15).attr("fill", colorScale(lunchType));
    legendItem.append("text").attr("x", 20).attr("y", 12).text(lunchType);
  });

  // Add x-axis label
  chart
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle")
    .text("Math Score");

  // Add y-axis label
  chart
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text("Reading Score");

  // Add title
  chart
    .append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Math vs Reading Scores by Lunch Type");

  // Add text at the bottom saying you can hover over the dots
  chart
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 70)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("fill", "#555")
    .text("Hover over each dot to get more information");
}

function renderConclusion(data) {
  // Clear previous content
  svg.selectAll("*").remove();

  // Create a rectangle for the card-like background
  svg.append("rect")
    .attr("x", 50)
    .attr("y", 50)
    .attr("width", 900)
    .attr("height", 600)
    .attr("fill", "#f0f0f0")
    .attr("rx", 10)
    .attr("ry", 10);

  // Add title
  svg.append("text")
    .attr("x", 500)
    .attr("y", 100)
    .attr("text-anchor", "middle")
    .text("Key Takeaways")
    .attr("font-size", "28px")
    .attr("font-weight", "bold");

  // Calculate average scores
  const avgScores = d3.rollup(
    data,
    v => ({
      math: d3.mean(v, d => d["math score"]),
      reading: d3.mean(v, d => d["reading score"]),
      writing: d3.mean(v, d => d["writing score"])
    }),
    d => d.lunch
  );

  // Add takeaways
  const takeaways = [
    "Test performance is influenced by socioeconomic factors.",
    "Students with standard lunch have higher average scores.",
    "Certain ethnic groups tend to perform better than others.",
    "Parental education level correlates with student performance.",
    "Further investigation into socioeconomic factors and their impact on education is recommended."
  ];

  svg.selectAll(".takeaway")
    .data(takeaways)
    .enter()
    .append("text")
    .attr("class", "takeaway")
    .attr("x", 100)
    .attr("y", (d, i) => 160 + i * 40)
    .text(d => `• ${d}`)
    .attr("font-size", "16px")
    .attr("fill", "#333");

  // Add buttons to revisit charts
  const chartButtons = [
    { name: "Lunch Type Comparison", func: "renderLunchType" },
    { name: "Gender Comparison", func: "renderGenderComparison" },
    { name: "Parental Education", func: "renderParentalEducation" }
  ];

  svg.selectAll(".chart-button")
    .data(chartButtons)
    .enter()
    .append("g")
    .attr("class", "chart-button")
    .attr("transform", (d, i) => `translate(${100 + i * 300}, 500)`)
    .each(function(d) {
      d3.select(this)
        .append("rect")
        .attr("width", 250)
        .attr("height", 50)
        .attr("fill", "#4CAF50")
        .attr("rx", 25)
        .attr("ry", 25);

      d3.select(this)
        .append("text")
        .attr("x", 125)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .attr("font-size", "16px")
        .text(d.name);
    })
    .on("click", function(event, d) {
      // Call the respective rendering function
      window[d.func](data);
    });
}