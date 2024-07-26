// CONSTANTS

const colors = [
    "black",  
    "blue",
    "red", 
    "maroon", 
    "purple", 
    "green", 
    "lime", 
    "olive", 
    "yellow", 
    "navy", 
    "blue", 
    "teal",
    "aqua",
    "green"
]

const margin = 10.0;

const pointSize = 4.0;


// VARIABLES

var _plot = null;
var _legend = null;

var width = 0.0;
var height = 0.0;

var xScale = null;
var yScale = null;

var tooltip = null;

var dates = [];
var scores = [];


function setXAxis(dates) {
    xScale = d3.scaleTime()
        .domain(d3.extent(dates))
        .range([margin * 2.0, width - margin])

    const xAxis = d3.axisBottom(xScale)
        .ticks(3)
        .tickFormat(d3.timeFormat('%b, %d'))

    _plot.append("g")
        .attr("transform", `translate(0,${height - margin * 2.0})`)
        .call(xAxis)
}

function setYAxis(scores) {
    yScale = d3.scaleLinear()
        .domain(d3.extent(scores))
        .range([height - margin * 2.0, margin]);
    
    const yAxis = d3.axisLeft(yScale)
        .ticks(4)
    
    _plot.append("g")
        .attr("transform", `translate(${margin * 2.0}, 0)`)
        .call(yAxis);
}

function createTooltip() {
    tooltip = _plot.append("text")
        .attr("class", "tooltip")
        .attr("x", margin*3)
        .attr("y", margin)
        .attr("dy", 0)
        .attr("fill", "black")
        .selectAll("tspan")
        .data(["", "", ""])
            .join("tspan")
            .text(d => `${d}`)
            .attr("dy", "1.0em")
            .attr("x", margin*3)
}

function tooltipCallback(evt, d, corp) {
    tooltip
        .data([corp, d.show, parseFloat(d.score).toFixed(3)])
            .join(
                enter => enter.append("tspan").text(d => `${d}`),
                update => update.text(d => `${d}`),
                exit => exit.remove()
            )
}

function plotPoints([corp, scores], color) {

    var _data = _plot.append("g")
        .attr("id", corp)

    _data.append("path")
        .attr("fill", "none")
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .datum(scores)
        .attr("d", d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.score))
        )

    _data.append("g")
        .selectAll("circle")
        .data(scores)
        .join("circle")
            .attr("cx", d => xScale(d.date))
            .attr("cy", d => yScale(d.score))
            .attr("r", pointSize)
            .attr("fill", color)

        .on("mouseover mousedrag", (evt, d) => { tooltipCallback(evt, d, corp); })
        .on("mouseout", () => { tooltip.text(""); });
}


export function plot(svg, data) {

    _plot = svg
    width = parseFloat(svg.style("width"));
    height = parseFloat(svg.style("height"));

    console.log(`Width: ${width}, Height: ${height}`);
    
    dates = data.map(([_, shows]) => shows.map(show => show.date));
    scores = data.map(([_, shows]) => shows.map(show => show.score));
    
    setXAxis(dates.flat());
    setYAxis(scores.flat());

    createTooltip();

    for (const [i, pair] of data.entries()) {
        plotPoints(pair, colors[i]);
    }
}

export function legend(svg, data) {

    _legend = svg

    const final = data.map(subdata => subdata[1][subdata[1].length - 1].score);
    const corps = data.map(subdata => subdata[0]);
    
    var cy = yScale(final[0]);
    for (const [i, score] of final.entries()) {
        _legend.append("g")
            .append("circle")
                .attr("cx", 8)
                .attr("cy", cy)
                .attr("r", pointSize)
                .attr("fill", colors[i])

        _legend.append("text")
            .attr("x", 14)
            .attr("y", cy + 3.7)
            .attr("font-size", 10)
            .attr("font-family", "arial")
            .text(corps[i])

        cy += 20

    }

}