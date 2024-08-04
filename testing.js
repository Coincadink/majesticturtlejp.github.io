window.onresize = () => { location.reload(); };

const svg = d3.select("#test");
const width = parseFloat(svg.style("width"));
const height = parseFloat(svg.style("height"));

const margin = {
    "T": 20,
    "B": 30,
    "R": 20,
    "L": 30,
};

function getCorp(data, corp, year, caption) {
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
        "Corp": corp.replace(" ", "-"),
        "Scores": results
    }
}

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

    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%b, %d'));
    const yAxis = d3.axisLeft(yScale)
        .ticks(20);

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
                .transition()
                .duration(1000)
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

function remove(db, corp) {
    svg.selectAll(`.${corp}-point`) //TODO: Incoorporate into main plot loop callbacks?
        .transition()
        .duration(1000)
            .attr("r", 0)
            .remove();
    svg.selectAll(`.${corp}-path`) //TODO: Incoorporate into main plot loop callbacks?
        .transition()
        .duration(1000)
            .attr("stroke-width", 0)
            .remove();

    return db.filter(d => d.Corp !== corp.replace(" ", "-"));
}

function add(data, db, corp) {
    db.push(getCorp(data, corp, 2024, "Total"))
}

d3.dsv("|", "./data/scores.csv", parse).then(
    (data) => {

        db = []
        add(data, db, "Bluecoats")
        add(data, db, "Boston Crusaders")
        add(data, db, "Colts")

        plot(data, db);

        svg.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("x", 10)
            .attr("y", 10)
            .on("click", function() {
                add(data, db, "Seattle Cascades")
                plot(data, db);
            })

        svg.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("x", 30)
            .attr("y", 10)
            .on("click", function() {
                db = remove(db, "Bluecoats")
                plot(data, db);
            })

    }
)