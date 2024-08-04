// Window resize callback function.

window.onresize = () => { location.reload(); };

// Get elements and flexbile dimensions.

const legend = d3.select("#legend");
const legWidth = parseFloat(legend.style("width"));
const legHeight = parseFloat(legend.style("height"));

const plot = d3.select("#plot");
const plotWidth = parseFloat(plot.style("width"));
const plotHeight = parseFloat(plot.style("height"));

// Plot margins.

const margin = {
    "T": 20,
    "B": 30,
    "R": 20,
    "L": 30,
};

//----------------------------------------------------------------------------//
//                                    AXES                                    //
//----------------------------------------------------------------------------//

// x Axis.

var xScale = null;
var xAxis = null;
var xAx = null;

updateXAxis([0, 0], 0);

function updateXAxis(domain, ticks) {

    if (xAx) xAx.remove();

    xScale = d3.scaleTime()
        .domain(domain)
        .range([0 + margin.L, plotWidth - margin.R]);

    xAxis = d3.axisBottom(xScale)
        .ticks(ticks)
        .tickFormat(d3.timeFormat('%b, %d'));

    xAx = plot.append("g")
        .attr("transform", `translate(0, ${plotHeight - margin.B})`)
        .call(xAxis);

};

// y Axis.
ow to 
var yScale = null;
var yAxis = null;
var yAx = null;

updateYAxis([0, 0], 0);

function updateYAxis(domain, ticks = 10) {
    
    if (yAx) yAx.remove();

    yScale = d3.scaleLinear()
        .domain(domain)
        .range([plotHeight - margin.B, margin.T]);

    yAxis = d3.axisLeft(yScale)
        .ticks(ticks)
        .tickFormat(d3.format(".1f"));

    yAx = plot.append("g")
        .attr("transform", `translate(${margin.L}, 0)`)
        .call(yAxis);

};

//----------------------------------------------------------------------------//
//                                   LEGEND                                   //
//----------------------------------------------------------------------------//

// List of corps.

const WORLD_CLASS = [
    "Blue Devils",
    "Blue Knights",
    "Blue Stars",
    "Bluecoats",
    "Boston Crusaders",
    "Carolina Crown",
    "Colts",
    "Crossmen",
    "Genesis",
    "Jersey Surf",
    "Madison Scouts",
    "Mandarins",
    "Music City",
    "Pacific Crest",
    "Phantom Regiment",
    "Santa Clara Vanguard",
    "Seattle Cascades",
    "Spirit of Atlanta",
    "The Academy",
    "The Cavaliers",
    "Troopers",
];

const OPEN_CLASS = [
    // "7th Regiment",
    "Blue Devils B",
    "Blue Devils C",
    "Colt Cadets",
    "Columbians",
    "Gold",
    "Golden Empire",
    "Guardians",
    "Impulse",
    "Les Stentors",
    "Raiders",
    "River City Rhythm",
    "Spartans",
    "The Battalion",
    "Vessel",
];

function createLegend(division, corpsList, xpos) {

    // Background for corps list.
    
    var backing = plot.append("rect")
        .attr("width", 200)
        .attr("height", 350)
        .attr("x", xpos - 100)
        .attr("y", plotHeight - 440)
        .attr("fill-opacity", 0)
        .attr("rx", 50)

    // Add corps lists.

    const legendText = plot.append("text")

    legendText // TODO: ADD A SELECT ALL OPTION
        .selectAll("tspan")
        .data(corpsList)
        .join("tspan")
            .attr("class", "corps")
            .text(d => d)
            .attr("x", xpos)
            .attr("dy", "1.0em")
            .on("click",
                (evt, d) => {
                    currentOpacity = d3.selectAll("." + d.replaceAll(" ", "-")).style("opacity");
                    if (currentOpacity == 1) {
                        d3.selectAll("." + d.replaceAll(" ", "-")).transition().style("opacity", 0);
                        d3.select(evt.target).attr("fill", "black");
                    } else {
                        d3.selectAll("." + d.replaceAll(" ", "-")).transition().style("opacity", 1);
                        d3.select(evt.target).attr("fill", "blue");
                    }
                }
            );
    
    var bbox = legendText.node().getBBox()
    
    legendText
        .attr("y", plotHeight - bbox.height - 100) // Place on bottom of plot svg.
        .attr("display", "none");

    // Adds division text.

    legend.append("text")
        .text(division)
        .attr("class", "division")
        .attr("x", xpos)
        .attr("y", legHeight / 2)
        .attr("font-size", "6vh")
        .on("click", (evt, d) => { 
            legendText.attr("display", legendText.attr("display") === "none" ? "inline" : "none")
            backing.attr("fill-opacity", backing.attr("fill-opacity") == 0.05 ? 0 : 0.05)
        });

};

//----------------------------------------------------------------------------//
//                                    PLOT                                    //
//----------------------------------------------------------------------------//

// Return array of caption scores for a given year and corp.
function getCorp(data, _corp, _year, _caption) { // TODO: REWRITE AND VIX VARS
    
    results = []
    
    data.forEach(
        (show) => {
            if (show.Date.getFullYear() == _year) {
                scores = JSON.parse(show.Scores);
                Object.keys(scores).forEach(
                    (div) => {                            
                        const corps = Object.values(scores[div].Corps)
                        const totals = scores[div][_caption]

                        for (const [i, corp] of corps.entries()) {
                            if (corp == _corp) {   
                                const data = { 
                                    "show": show.Title, 
                                    "date": show.Date, 
                                    "score": totals[i] 
                                }
                                results.push(data);
                            }
                        }
                    }
                )          
            }
        }
    )
    results.sort((a, b) => new Date(a.date) - new Date(b.date));
    return results;
};

// Parse data to js variable types.
function parse(d) {
    return {
        "Date": d3.timeParse("%Y-%m-%d")(d.Date),
        "Title": d.Show,
        "Scores": d.Scores,
    };
};

var totaldb = null // TODO: fix var names / scope.

d3.dsv("|", "./data/scores.csv", parse).then(
    (data) => {

        // List of all corps.
        const corpsList = WORLD_CLASS.concat(OPEN_CLASS);
        
        // Map corps to their data.
        const db = corpsList.map(corp => ({ "name": corp,  "scores": getCorp(data, corp, 2024, "Music - Brass") }));

        totaldb = db; //TODO: GET RID OF ME

        // Colors for each group.
        const colorGen = d3.scaleOrdinal()
            .domain(corpsList)
            .range(d3.schemeSet2);
            
        const dates = db.flatMap(team => team.scores.map(score => new Date(score.date)));
        xAxis = updateXAxis(d3.extent(dates))
        const totals = db.flatMap(team => team.scores.map(score => new Date(score.score)));
        yAxis = updateYAxis(d3.extent(totals));

        const line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(+d.score))

        plot.selectAll("myLines")
            .data(db)
            .join("path")
                .attr("class", d => d.name.replaceAll(" ", "-"))
                .attr("d", d => line(d.scores))
                .attr("stroke", d => colorGen(d.name))
                .style("stroke-width", 4)
                .style("fill", "none")
        
        plot
            .selectAll("dots")
            .data(db)
            .join('g')
                .attr("class", d => d.name.replaceAll(" ", "-"))
                .style("fill", d => colorGen(d.name))
            .selectAll("points")
            .data(d => d.scores)
            .join("circle")
                .attr("cx", d => xScale(d.date))
                .attr("cy", d => yScale(+d.score))
                .attr("r", 5)
                .attr("stroke", "white")
        
        db.map(d => d3.selectAll("." + d.name.replaceAll(" ", "-")).transition().style("opacity", 0))

        createLegend("World", WORLD_CLASS, legWidth * 1 / 3);
        createLegend("Open", OPEN_CLASS, legWidth * 2 / 3);
        
    }
);