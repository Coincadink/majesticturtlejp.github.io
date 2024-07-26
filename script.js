import { plot, legend } from './plot.js'

window.onresize = function(){ location.reload(); }

const _plot = d3.select("#plot");
const _legend = d3.select("#legend");

const corps = [
    "Bluecoats",
    "Blue-Devils",
    "Boston-Crusaders",
    "Carolina-Crown",
    "Santa-Clara-Vanguard",
    "Phantom-Regiment",
    "Mandarins",
    "Blue-Stars",
    "The-Cavaliers",
    "Troopers",
    "Colts",
    "Blue-Knights"
];

Promise.all(corps.map(corp => d3.csv(`data/${corp}.csv`))).then( 
    data => {
        data.map((corp) => {
            corp.map((score) => {
                score.date = d3.timeParse("%Y-%m-%d")(score.date)
                score.score = parseFloat(score.score)
            })
        })

        data = data.map((d, idx) => [corps[idx], d]);
        
        plot(_plot, data)
        legend(_legend, data)
    }
    
);