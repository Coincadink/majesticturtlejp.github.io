const corps = [
    "Bluecoats",
    "Boston Crusaders",
    "Blue Devils",
    "Phantom Regiment",
    "Carolina Crown",
    "Santa Clara Vanguard",
    "Mandarins",
    "Blue Stars",
    "Colts",
    "The Cavaliers",
    "Troopers",
    "Blue Knights",
    "Madison Scouts",
    "Spirit of Atlanta",
    "Crossmen",
    "Pacific Crest",
    "Music City",
    "The Academy",
    "Genesis",
    "Jersey Surf",
    "Seattle Cascades"
];

const colors = [
    '#e6194B', 
    '#3cb44b', 
    '#ffe119', 
    '#4363d8', 
    '#f58231', 
    '#911eb4', 
    '#42d4f4', 
    '#f032e6', 
    '#bfef45', 
    '#fabed4', 
    '#469990', 
    '#dcbeff', 
    '#9A6324', 
    '#808000', 
    '#ffd8b1', 
    '#000075', 
    '#a9a9a9', 
    '#000000',
    '#e6194B', 
    '#3cb44b', 
    '#ffe119', 
]

window.onresize = function(){ location.reload(); }

const _plot = d3.select("#plot");
const _legend = d3.select("#legend");

var xScale = null;
var maxDate = null;
var yScale = null;
var tooltip = null;

const margin = 10.0;

const pointSize = 4.0;

var width = 0.0;
var height = 0.0;


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


function plot(data) {

    width = parseFloat(_plot.style("width"));
    height = parseFloat(_plot.style("height"));

    console.log(`Width: ${width}, Height: ${height}`);
    
    dates = data.map(([_, shows]) => shows.map(show => show.date));
    scores = data.map(([_, shows]) => shows.map(show => show.score));
    
    maxDate = d3.max(dates.flat())

    setXAxis(dates.flat());
    setYAxis(scores.flat());

    createTooltip();

    for (const [i, pair] of data.entries()) {
        plotPoints(pair, colors[i]);
    }
}

function legend(data) {

    const final = data.map(subdata => subdata[1][subdata[1].length - 1].score);
    const corps = data.map(subdata => subdata[0]);

    for (var i = 0; i < final.length - 1; i++) {
        if(final[i] - final[i+1] < 1) {
            const avg = (final[i] + final[i+1]) / 2
            final[i] = avg + 0.5
            final[i+1] = avg - 0.5
        }
    }

    for (var i = 0; i < final.length - 1; i++) {
        if(final[i] - final[i+1] < 1) {
            const avg = (final[i] + final[i+1]) / 2
            final[i] = avg + 0.35
            final[i+1] = avg - 0.35
        }
    }

    var cy = yScale(final[0]);
    for (const [i, score] of final.entries()) {
        _legend.append("g")
            .append("circle")
                .attr("cx", 8)
                .attr("cy", yScale(final[i]))
                .attr("r", pointSize - 2)
                .attr("fill", colors[i])

        _legend.append("text")
            .attr("x", 14)
            .attr("y", yScale(final[i]) + 3.7)
            .attr("font-size", 10)
            .attr("font-family", "arial")
            .text(corps[i])

        cy += 20

    }

}



Promise.all(corps.map(corp => d3.csv(`data/2024/${corp}.csv`))).then( 
    data => {
        data.map((corp) => {
            corp.map((score) => {
                score.date = d3.timeParse("%Y-%m-%d")(score.date)
                score.score = parseFloat(score.score)
            })
        })

        data = data.map((d, idx) => [corps[idx], d]);
        
        plot(data)
        legend(data)
    }
    
);