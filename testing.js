window.onresize = () => { location.reload(); };

const svg = d3.select("#plot");
const width = parseFloat(svg.style("width"));
const height = parseFloat(svg.style("height"));

// const caption = "Total"
// const caption = "Music - Brass"
// const caption = "Music - Percussion"
let caption = "Total"

// ----- TOOLTIP ----- //

ttWidth = 20;
ttHeight = 40;

let tooltip = svg
    .append("g")
        .attr("id", "tooltip");

tooltip
    .append("rect")
        .attr("id", "tooltip-back")
        .attr("rx", 10);

textIDs = ["corp", "score"]
tooltip.append("text")
    .attr("id", "tooltip-text")
    .selectAll("tspan")
    .data(textIDs)    
    .enter().append("tspan")
        .attr("id", d => d)
        .attr("dy", "1.0em")
        .attr("x", 0)

const margin = {
    "T": 20,
    "B": 30,
    "R": 20,
    "L": 200,
};

function getCorp(data, corp, year) {
    results = []
    data.map(
        (show) => {
            if (show.Date.getFullYear() == year) {
                
                const scoreJson = JSON.parse(show.Scores)

                Object.keys(scoreJson).forEach(
                    (div) => {
                        
                        const divCorps = Object.values(scoreJson[div].Corps);
                        
                        for (const [i, divCorp] of divCorps.entries()) {
                            if (divCorp != corp) continue;
                            
                            results.push({
                                "Date": show.Date,
                                "Score": scoreJson[div][caption][i]
                            })
                        }
                    }
                )
            }
        }
    )
    results.sort((a, b) => a.Date - b.Date);
    return {
        "Corp": corp.replaceAll(" ", "-"),
        "Scores": results
    }
};

function parse(d) {
    return {
        "Date": d3.timeParse("%Y-%m-%d")(d.Date),
        "Show": d.Show,
        "Scores": d.Scores,
    };
};

function plot(data, db) {
    
    // ---- AXES ----- //

    const dates = db.flatMap(corp => corp.Scores.map(score => score.Date));
    const scores = db.flatMap(corp => corp.Scores.map(score => score.Score));

    const xScale = d3.scaleTime()
        .domain(d3.extent(dates))
        .range([margin.L, width - margin.R]);
    const yScale = d3.scaleLinear()
        .domain(d3.extent(scores))
        .range([height - margin.B, margin.T]);

    const xAxis = d3.axisBottom(xScale.nice())
        .tickFormat(d3.timeFormat('%b, %d'))
    const yAxis = d3.axisLeft(yScale.nice())

    svg.select(".x-axis")
        .transition()
        .duration(1000) 
        .call(xAxis);
    svg.select(".y-axis")
        .transition()
        .duration(1000)
        .call(yAxis);

    if (svg.select(".x-axis").empty()) {
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${height - margin.B})`)
            .call(xAxis);
    }
    if (svg.select(".y-axis").empty()) {
        svg.append("g")
            .attr("class", "y-axis")
            .attr("transform", `translate(${margin.L}, 0)`)
            .call(yAxis);
    }

    // ----- DATA ----- //
    
    const corps = db.flatMap(corp => corp.Corp);
    const color = d3.scaleOrdinal()
        .domain(corps)
        .range(d3.schemePaired);

    db.forEach(
        (corp) => {

            // --- LINES --- //

            const line = d3.line()
                .x(d => xScale(d.Date))
                .y(d => yScale(d.Score))

            const paths = svg.selectAll(`.${corp.Corp}-path`)
                .data([corp])

            paths
                .enter()
                .append("path")
                    .attr("class", `${corp.Corp}-path`)
                    .attr("d", d => line(corp.Scores))
                    .attr("stroke", d => color(corp.Corp))
                    .attr("stroke-width", 0)
                    .style("fill", "none")

                .transition()
                .duration(500)
                .transition()
                .duration(1000)
                    .attr("stroke-width", 4)

            paths
                .transition()
                .duration(1000)
                .attr("d", d => line(corp.Scores))

            // --- POINTS --- //

            // Circle Data.
            const points = svg.selectAll(`.${corp.Corp}-point`)
                .data(corp.Scores);

            // Add Circles.
            points
                .enter()
                .append("circle")
                    .attr("class", `${corp.Corp}-point`)
                    .attr("cx", d => xScale(d.Date))
                    .attr("cy", d => yScale(d.Score))
                    .attr("r", 0)
                    .attr("fill", d => color(corp.Corp))
                    .attr("stroke", "white")

                .on("mouseover",
                    (evt, d) => {
                        let trgt = d3.select(evt.target);
                                        
                        tooltip
                            .attr("display", "inline")
                            .raise()

                        d3.select("#corp")
                            .text(corp.Corp.replaceAll("-", " "));
                        d3.select("#score")
                            .text(`${caption}: ${d.Score}`);

                        let bbox = d3.select("#tooltip-text").node().getBBox();

                        d3.select("#tooltip-back")
                            .attr("width", bbox.width+20)
                            .attr("height", bbox.height+10)
                            .attr("transform", `translate(${bbox.x-10}, ${bbox.y-5})`)

                        tooltip
                            .attr("transform", `translate(${trgt.attr("cx") - 20}, ${trgt.attr("cy") - bbox.height/2})`)

                    }
                )
                .on("mouseout",
                    (evt, d) => {
                        tooltip
                            .attr("display", "none");
                    }
                )

                .transition()
                .duration(500)
                    .attr("r", 5);

            // Update Circles.
            points
                .transition()
                .duration(1000)
                    .attr("cx", d => xScale(d.Date))
                    .attr("cy", d => yScale(d.Score))

        }
    )
}

function add(data, db, corp) {
    db.push(getCorp(data, corp, 2024))
};

function remove(db, corp) {
    svg.selectAll(`.${corp}-point`) //TODO: Incoorporate into main plot loop callbacks?
        .transition()
        .duration(1000)
            .attr("r", 0)
            .remove();``
    svg.selectAll(`.${corp}-path`) //TODO: Incoorporate into main plot loop callbacks?
        .transition()
        .duration(1000)
            .attr("stroke-width", 0)
            .remove();

    return db.filter(d => d.Corp !== corp.replaceAll(" ", "-"));
};

// List of corps.

const WORLD_CLASS = [
    "WORLD CLASS",
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
    "OPEN CLASS",
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

d3.dsv("|", "./data/scores.csv", parse).then(
    (data) => {

        db = [];
        // add(data, db, "Bluecoats");
        // add(data, db, "Boston Crusaders");
        // add(data, db, "Blue Stars");

        plot(data, db);

        // svg.append("rect")
        //     .attr("width", 10)
        //     .attr("height", 10)
        //     .attr("x", 10)
        //     .attr("y", 10)
        //     .on("click", function() {
        //         add(data, db, "The Battalion")
        //         plot(data, db);
        //     });

        // svg.append("rect")
        //     .attr("width", 10)
        //     .attr("height", 10)
        //     .attr("x", 30)
        //     .attr("y", 10)
        //     .on("click", function() {
        //         db = remove(db, "Bluecoats");
        //         plot(data, db);
        //     });

        // ----- LEGEND ----- //
        
        let legend = svg.append("text")
            .attr("y", margin.T)

        legend
            .selectAll("tspan")
            .data(WORLD_CLASS.concat(OPEN_CLASS))
            .join("tspan")
                .attr("class", "legend")
                .text(d => d)
                .attr("x", 0)
                .attr("dy", "1.0em")
                .on("click",
                    (evt, d) => {
                        if (db.map(c => c.Corp).includes(d.replaceAll(" ", "-"))) {
                            d3.select(evt.target).attr("fill", "black")
                            db = remove(db, d.replaceAll(" ", "-"));
                            plot(data, db);
                        } else {
                            d3.select(evt.target).attr("fill", "blue")
                            add(data, db, d);
                            plot(data, db);
                        }
                    }
                );
    }
);