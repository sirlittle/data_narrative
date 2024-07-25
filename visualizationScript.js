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
    { title: "Test Preparation Impact", render: renderTestPrep },
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
    .attr("y", 400)
    .attr("text-anchor", "middle")
    .text("Student Performance Analysis")
    .attr("font-size", "24px");
}

function renderGenderComparison(data) {
  console.log("Rendering gender comparison");

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

  const margin = { top: 50, right: 40, bottom: 60, left: 50 };
  const width = 1000 - margin.left - margin.right;
  const height = 750 - margin.top - margin.bottom;

  const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().range([0, width]).padding(0.1);

  const y = d3.scaleLinear().range([height, 0]);

  const xAxis = chart.append("g").attr("transform", `translate(0,${height})`);

  const yAxis = chart.append("g");

  const scoreTypes = ["average", "math", "reading", "writing"];
  let currentScoreType = "average";

  function updateChart(scoreType) {
    currentScoreType = scoreType;

    const data = Array.from(genderAverages, ([key, value]) => ({ gender: key, score: value[scoreType] }));

    x.domain(data.map((d) => d.gender));
    y.domain([0, d3.max(data, (d) => d.score)]);

    xAxis.call(d3.axisBottom(x));
    yAxis.call(d3.axisLeft(y).ticks(5));

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
      .attr("fill", "steelblue");

    bars.exit().remove();

    // Add labels on top of each bar
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
      .attr("flex", 45)
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

  const margin = { top: 40, right: 20, bottom: 60, left: 40 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const educationLevels = Array.from(educationAverages.keys());
  const scoreTypes = ["math", "reading", "writing"];

  const x0 = d3.scaleBand()
    .domain(educationLevels)
    .rangeRound([0, width])
    .paddingInner(0.1);

  const x1 = d3.scaleBand()
    .domain(scoreTypes)
    .rangeRound([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3.scaleLinear()
    .domain([0, 100])
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(scoreTypes)
    .range(["#98abc5", "#8a89a6", "#7b6888"]);

  const xAxis = d3.axisBottom(x0);
  const yAxis = d3.axisLeft(y);

  chart.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)");

  chart.append("g")
    .attr("class", "y-axis")
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Score");

  function updateChart(sortBy = null) {
    let sortedEducationLevels = educationLevels;
    if (sortBy) {
      sortedEducationLevels = educationLevels.sort((a, b) => 
        educationAverages.get(b)[sortBy] - educationAverages.get(a)[sortBy]
      );
    }

    x0.domain(sortedEducationLevels);

    chart.select(".x-axis")
      .transition()
      .duration(750)
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    const educationGroup = chart.selectAll(".education-group")
      .data(sortedEducationLevels);

    educationGroup.enter()
      .append("g")
      .attr("class", "education-group")
      .merge(educationGroup)
      .transition()
      .duration(750)
      .attr("transform", d => `translate(${x0(d)},0)`);

    educationGroup.exit().remove();

    const bars = chart.selectAll(".education-group").selectAll("rect")
      .data(d => scoreTypes.map(key => ({key, value: educationAverages.get(d)[key]})));

    bars.enter()
      .append("rect")
      .merge(bars)
      .transition()
      .duration(750)
      .attr("x", d => x1(d.key))
      .attr("y", d => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", d => height - y(d.value))
      .attr("fill", d => color(d.key));

    bars.exit().remove();
  }

  // Initial render
  updateChart();

  // Add sort buttons
  const buttonContainer = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${height + margin.top + 40})`);

  const sortOptions = ["Unsorted", ...scoreTypes];

  sortOptions.forEach((option, i) => {
    const button = buttonContainer.append("g")
      .attr("transform", `translate(${i * 100}, 0)`)
      .style("cursor", "pointer")
      .on("click", () => updateChart(option === "Unsorted" ? null : option));

    button.append("rect")
      .attr("width", 90)
      .attr("height", 30)
      .attr("rx", 5)
      .attr("ry", 5)
      .attr("fill", "lightgray");

    button.append("text")
      .attr("x", 45)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text(option);
  });

  // Add legend
  const legend = svg.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(scoreTypes.slice().reverse())
    .enter().append("g")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

  legend.append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", color);

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(d => d);

  // Add chart title
  svg.append("text")
    .attr("x", (width / 2) + margin.left)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Average Scores by Parental Education Level");

  // Add explanation text
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", height + margin.top + 80)
    .style("font-size", "14px")
    .text("Click on the buttons above to sort by different score types.");
}


function renderTestPrep(data) {
  console.log("Rendering test preparation comparison");

  const prepAverages = d3.rollup(
    data,
    (v) => ({
      math: d3.mean(v, (d) => d["math score"]),
      reading: d3.mean(v, (d) => d["reading score"]),
      writing: d3.mean(v, (d) => d["writing score"]),
    }),
    (d) => d["test preparation course"]
  );

  const margin = { top: 60, right: 20, bottom: 60, left: 40 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const subjects = ["math", "reading", "writing"];
  const prepGroups = Array.from(prepAverages.keys());

  const x0 = d3.scaleBand()
    .domain(subjects)
    .rangeRound([0, width])
    .paddingInner(0.1);

  const x1 = d3.scaleBand()
    .domain(prepGroups)
    .rangeRound([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3.scaleLinear()
    .domain([0, d3.max(Array.from(prepAverages.values()), d => Math.max(d.math, d.reading, d.writing))])
    .nice()
    .rangeRound([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(prepGroups)
    .range(["#98abc5", "#8a89a6"]);

  chart.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0));

  chart.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y).ticks(null, "s"))
    .append("text")
    .attr("x", 2)
    .attr("y", y(y.ticks().pop()) + 0.5)
    .attr("dy", "0.32em")
    .attr("fill", "#000")
    .attr("font-weight", "bold")
    .attr("text-anchor", "start")
    .text("Score");

  const subject = chart.append("g")
    .selectAll("g")
    .data(subjects)
    .join("g")
    .attr("transform", d => `translate(${x0(d)},0)`);

  subject.selectAll("rect")
    .data(d => prepGroups.map(key => ({key, value: prepAverages.get(key)[d]})))
    .join("rect")
    .attr("x", d => x1(d.key))
    .attr("y", d => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", d => height - y(d.value))
    .attr("fill", d => color(d.key));

  // Add labels on top of each bar
  subject.selectAll(".bar-label")
    .data(d => prepGroups.map(key => ({key, value: prepAverages.get(key)[d]})))
    .join("text")
    .attr("class", "bar-label")
    .attr("x", d => x1(d.key) + x1.bandwidth() / 2)
    .attr("y", d => y(d.value) - 5)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .text(d => d.value.toFixed(1));

  // Add legend
  const legend = chart.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(prepGroups.slice().reverse())
    .join("g")
    .attr("transform", (d, i) => `translate(0,${i * 20})`);

  legend.append("rect")
    .attr("x", width - 19)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", color);

  legend.append("text")
    .attr("x", width - 24)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(d => d);

  // Add title
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", 0 - (margin.top / 2))
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Impact of Test Preparation Course on Scores");

  // Add annotations
  const annotations = [
    {
      note: {
        label: "Students who completed the course consistently scored higher",
        title: "Test Prep Impact"
      },
      x: width / 2,
      y: height / 2,
      dy: -30,
      dx: 30
    }
  ];

  const makeAnnotations = d3.annotation()
    .type(d3.annotationLabel)
    .annotations(annotations);

  chart.append("g")
    .attr("class", "annotation-group")
    .call(makeAnnotations);

  // Add explanation text
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", height + margin.top + 40)
    .style("font-size", "14px")
    .text("This chart compares average scores between students who completed the test preparation course and those who didn't.");
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

  const margin = { top: 60, right: 150, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const subgroups = ["math", "reading", "writing"];
  const groups = Array.from(raceAverages.keys());

  const x = d3.scaleBand()
    .domain(groups)
    .range([0, width])
    .padding([0.2]);

  const y = d3.scaleLinear()
    .domain([0, 300])  // Max possible score is 100 * 3 subjects
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(subgroups)
    .range(['#e41a1c','#377eb8','#4daf4a']);

  // Add X axis
  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .selectAll("text")  
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Add Y axis
  chart.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

  // Initialize visibility state
  const visibility = {
    math: true,
    reading: true,
    writing: true
  };

  function updateChart() {
    // Filter subgroups based on visibility
    const visibleSubgroups = subgroups.filter(subgroup => visibility[subgroup]);

    // Prepare stacked data
    const stackedData = d3.stack()
      .keys(visibleSubgroups)
      (Array.from(raceAverages, ([key, value]) => ({group: key, ...value})));

    // Update y-axis domain
    const yMax = d3.max(stackedData, d => d3.max(d, d => d[1]));
    y.domain([0, yMax]);
    chart.select(".y-axis").transition().duration(500).call(d3.axisLeft(y));

    // Create or update the stacked bars
    const barGroups = chart.selectAll(".bar-group")
      .data(stackedData);

    const barGroupsEnter = barGroups.enter()
      .append("g")
      .attr("class", "bar-group");

    barGroupsEnter.merge(barGroups)
      .attr("fill", d => color(d.key))
      .each(function(d) {
        d3.select(this).selectAll("rect")
          .data(d)
          .join("rect")
            .transition()
            .duration(500)
            .attr("x", d => x(d.data.group))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth())
            .attr("stroke", "white")
            .attr("stroke-width", 1);
      });

    barGroups.exit().remove();

    // Add interactivity
    chart.selectAll(".bar-group").selectAll("rect")
      .on("mouseover", function(event, d) {
        const subgroupName = d3.select(this.parentNode).datum().key;
        const subgroupValue = d.data[subgroupName];
        const groupName = d.data.group;

        d3.select(this).attr("stroke", "black").attr("stroke-width", 3);

        chart.append("text")
          .attr("class", "tooltip")
          .attr("x", x(groupName) + x.bandwidth() / 2)
          .attr("y", y(d[1]) - 5)
          .attr("text-anchor", "middle")
          .attr("font-size", "12px")
          .text(`${subgroupName}: ${subgroupValue.toFixed(1)}`);
      })
      .on("mouseout", function() {
        d3.select(this).attr("stroke", "white").attr("stroke-width", 1);
        chart.selectAll(".tooltip").remove();
      });
  }

  // Initial chart render
  updateChart();

  // Add a legend with toggle functionality
  const legend = chart.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .selectAll("g")
    .data(subgroups.slice().reverse())
    .enter().append("g")
      .attr("transform", (d, i) => `translate(0,${i * 20})`)
      .style("cursor", "pointer")
      .on("click", function(event, d) {
        visibility[d] = !visibility[d];
        d3.select(this).style("opacity", visibility[d] ? 1 : 0.2);
        updateChart();
      });

  legend.append("rect")
    .attr("x", width + 120)
    .attr("width", 19)
    .attr("height", 19)
    .attr("fill", color);

  legend.append("text")
    .attr("x", width + 115)
    .attr("y", 9.5)
    .attr("dy", "0.32em")
    .text(d => d);

  // Add chart title
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", 0 - (margin.top / 2))
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Average Scores by Race/Ethnicity");

  // Add interactivity
  chart.selectAll("rect")
    .on("mouseover", function(event, d) {
      const subgroupName = d3.select(this.parentNode).datum().key;
      const subgroupValue = d.data[subgroupName];
      const groupName = d.data.group;

      d3.select(this).attr("stroke", "black").attr("stroke-width", 3);

      chart.append("text")
        .attr("class", "tooltip")
        .attr("x", x(groupName) + x.bandwidth() / 2)
        .attr("y", y(d[1]) - 5)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .text(`${subgroupName}: ${subgroupValue.toFixed(1)}`);
    })
    .on("mouseout", function() {
      d3.select(this).attr("stroke", "white").attr("stroke-width", 1);
      chart.selectAll(".tooltip").remove();
    });

  // Add explanation text
  svg.append("text")
    .attr("x", margin.left)
    .attr("y", height + margin.top + 50)
    .style("font-size", "14px")
    .text("Hover over the bars to see specific scores. Click on legend items to toggle visibility. Each bar represents average scores for math, reading, and writing tests.");
}

function renderLunchType(data) {
  const margin = { top: 60, right: 120, bottom: 60, left: 60 };
  const width = 1000 - margin.left - margin.right;
  const height = 750 - margin.top - margin.bottom;

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const lunchAverages = d3.rollup(
    data,
    (v) => ({
      math: d3.mean(v, (d) => d["math score"]),
      reading: d3.mean(v, (d) => d["reading score"]),
      writing: d3.mean(v, (d) => d["writing score"]),
    }),
    (d) => d["lunch"]
  );

  // Set up scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d["math score"])])
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d["reading score"])])
    .range([height, 0]);

  const colorScale = d3.scaleOrdinal()
    .domain(["standard", "free/reduced"])
    .range(["#1f77b4", "#ff7f0e"]);

  // Add axes
  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale));

  chart.append("g")
    .call(d3.axisLeft(yScale));

  // Add scatter plot points
  const dots = chart.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d["math score"]))
    .attr("cy", d => yScale(d["reading score"]))
    .attr("r", 4)
    .attr("fill", d => colorScale(d["lunch"]))
    .attr("opacity", 0.6);

  // Add interactivity
  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

  dots.on("mouseover", (event, d) => {
    tooltip.style("opacity", .9)
      .html(`Math: ${d["math score"]}<br/>Reading: ${d["reading score"]}<br/>Writing: ${d["writing score"]}<br/>Lunch: ${d["lunch"]}`)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
  })
  .on("mouseout", () => {
    tooltip.style("opacity", 0);
  });

  // Add trend lines
  const lunchTypes = ["standard", "free/reduced"];
  lunchTypes.forEach(lunchType => {
    const filteredData = data.filter(d => d["lunch"] === lunchType);
    const line = d3.line()
      .x(d => xScale(d["math score"]))
      .y(d => yScale(d["reading score"]));

    const trendLine = d3.regressionLinear()
      .x(d => d["math score"])
      .y(d => d["reading score"])
      .domain([0, d3.max(data, d => d["math score"])])
      (filteredData);

    chart.append("path")
      .datum(trendLine)
      .attr("fill", "none")
      .attr("stroke", colorScale(lunchType))
      .attr("stroke-width", 2)
      .attr("d", line);
  });

  // Add legend
  const legend = chart.append("g")
    .attr("transform", `translate(${width + 10}, 0)`);

  lunchTypes.forEach((lunchType, index) => {
    const legendItem = legend.append("g")
      .attr("transform", `translate(0, ${index * 20})`);

    legendItem.append("rect")
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", colorScale(lunchType));

    legendItem.append("text")
      .attr("x", 20)
      .attr("y", 12)
      .text(lunchType);
  });

  // Add x-axis label
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .text("Math Score");

  // Add y-axis label
  chart.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 15)
    .attr("text-anchor", "middle")
    .text("Reading Score");

  // Add title
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text("Math vs Reading Scores by Lunch Type");

  // Add annotations
  lunchTypes.forEach((lunchType, index) => {
    const avgScores = lunchAverages.get(lunchType);
    chart.append("text")
      .attr("x", width - 150)
      .attr("y", 20 + index * 20)
      .attr("fill", colorScale(lunchType))
      .text(`${lunchType}: Math ${avgScores.math.toFixed(1)}, Reading ${avgScores.reading.toFixed(1)}`);
  });
}

function renderConclusion(data) {
  svg
    .append("text")
    .attr("x", 400)
    .attr("y", 300)
    .attr("text-anchor", "middle")
    .text("Key Takeaways")
    .attr("font-size", "24px");

  // Add text summarizing main findings
  // Implement interactive elements to revisit key charts
}
