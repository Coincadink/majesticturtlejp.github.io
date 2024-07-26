window.onresize = function(){ location.reload(); }
const width = window.innerWidth * 0.8;
const height = window.innerHeight * 0.8;

const marginTop = 40;
const marginRight = 60;
const marginBottom = 60;
const marginLeft = 60;

const yaxisMargin = 0.2;

const tooltipMarginTop = 0;
const tooltipMarginLeft = 20;
const tooltipColor = "black";

const pointSize = 4;

// ----- CONSTANTS ----- //

const corps = [
    "Bluecoats",
    "Blue-Devils",
    "Boston-Crusaders",
];

const colors = [
    "red",
    "green",
    "blue"
]

// ----- HELPER TOOLS ----- //

const parseTime = d3.timeParse("%Y-%m-%d");

// ----- CHART FEATURES ----- //

// Select the svg container.
svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

// - tooltip -- //
const tooltip = svg.append("text")
    .attr("class", "tooltip")
    .attr("x", marginLeft + tooltipMarginLeft)
    .attr("y", marginTop + tooltipMarginTop)
    .attr("dy", 0)
    .attr("fill", tooltipColor)
    .selectAll("tspan")
    .data(["", "", ""])
        .join("tspan")
        .text(d => `${d}`)
        .attr("dy", "1.0em")
        .attr("x", marginLeft + tooltipMarginLeft)

function tooltipCallback(evt, d, corp) {
    tooltip
        .data([corp, d.show, parseFloat(d.score).toFixed(3)])
            .join(
                enter => enter.append("tspan").text(d => `${d}`),
                update => update.text(d => `${d}`),
                exit => exit.remove()
            )
}

// - x axis - //

const xScale = d3.scaleTime()
    .domain([parseTime("2024-06-26"), parseTime("2024-07-20")])
    .range([marginLeft, width - marginRight])

const xAxis = d3.axisBottom(xScale)
    .ticks(12)
    .tickFormat(d3.timeFormat('%b, %d'))

svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(xAxis)

// - y axis - //

const yScale = d3.scaleLinear()
    .domain([70, 95])
    .range([height - marginBottom, marginTop]);

const yAxis = d3.axisLeft(yScale)
    .ticks(4)

svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(yAxis);

// ----- DATA FEATURES ----- //

// Import data and plot points for each set.
Promise.all(corps.map(corp => d3.csv(`data/${corp}.csv`))).then( 
    data => {
        // Pair corps with scores data.
        const paired = data.map((d, idx) => [corps[idx], d, colors[idx]]);
        paired.forEach(corp => plotCorp(corp))
    }
);

function plotCorp(data) {

    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", data[2])
        .attr("stroke-width", 1.5)
        .datum(data[1])
        .attr("d", d3.line()
            .x(d => xScale(parseTime(d.date)))
            .y(d => yScale(d.score))
        )

    svg.append("g")
        .attr("id", `${data[0]}`)
        .selectAll("circle")
        .data(data[1])
        .join("circle")
            .attr("cx", d => xScale(parseTime(d.date)))
            .attr("cy", d => yScale(d.score))
            .attr("r", pointSize)
            .attr("fill", data[2])

        .on("mouseover mousedrag", (evt, d) => { tooltipCallback(evt, d, data[0]); })
        .on("mouseout", () => { tooltip.text(""); });

}