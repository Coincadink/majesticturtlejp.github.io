// Configuration object
const CONFIG = {
    margin: { top: 20, right: 20, bottom: 50, left: 200 },
    animation: {
        duration: 800,
        delay: 100
    },
    tooltip: {
        padding: 10,
        offset: { x: 20, y: 0 }
    },
    point: {
        radius: 5,
        strokeWidth: 2
    },
    line: {
        strokeWidth: 3
    }
};

// Corps data
const CORPS_DATA = {
    worldClass: [
        "Blue Devils", "Blue Knights", "Blue Stars", "Bluecoats",
        "Boston Crusaders", "Carolina Crown", "Colts", "Crossmen",
        "Genesis", "Jersey Surf", "Madison Scouts", "Mandarins",
        "Music City", "Pacific Crest", "Phantom Regiment",
        "Santa Clara Vanguard", "Seattle Cascades", "Spirit of Atlanta",
        "The Academy", "The Cavaliers", "Troopers"
    ],
    openClass: [
        "Blue Devils B", "Blue Devils C", "Colt Cadets", "Columbians",
        "Gold", "Golden Empire", "Guardians", "Impulse", "Les Stentors",
        "Raiders", "River City Rhythm", "Spartans", "The Battalion", "Vessel"
    ]
};

// Main visualization class
class DrumCorpsVisualization {
    constructor(containerId) {
        this.container = d3.select(containerId);
        this.currentScoreType = 'Total';
        this.currentYear = '2024'; // Changed from 'all' to '2024'
        this.activeCorps = new Set();
        this.data = [];
        this.processedData = new Map();
        
        this.initializeSVG();
        this.initializeTooltip();
        this.initializeScales();
        this.initializeAxes();
        this.setupEventHandlers();
    }

    initializeSVG() {
        const containerRect = this.container.node().getBoundingClientRect();
        this.width = containerRect.width - 40; // Account for padding
        this.height = 600;
        
        this.svg = this.container.select('#plot')
            .attr('width', this.width)
            .attr('height', this.height);

        this.plotArea = this.svg.append('g')
            .attr('class', 'plot-area');
    }

    initializeTooltip() {
        this.tooltip = this.svg.append('g')
            .attr('id', 'tooltip')
            .style('display', 'none');

        this.tooltip.append('rect')
            .attr('id', 'tooltip-back')
            .attr('rx', 4);

        this.tooltipText = this.tooltip.append('text')
            .attr('id', 'tooltip-text');
    }

    initializeScales() {
        this.xScale = d3.scaleTime()
            .range([CONFIG.margin.left, this.width - CONFIG.margin.right]);
        
        this.yScale = d3.scaleLinear()
            .range([this.height - CONFIG.margin.bottom, CONFIG.margin.top]);

        this.colorScale = d3.scaleOrdinal(d3.schemePaired);
    }

    initializeAxes() {
        this.xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d3.timeFormat('%b %d'));
        
        this.yAxis = d3.axisLeft(this.yScale);

        this.xAxisGroup = this.svg.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0, ${this.height - CONFIG.margin.bottom})`);

        this.yAxisGroup = this.svg.append('g')
            .attr('class', 'axis y-axis')
            .attr('transform', `translate(${CONFIG.margin.left}, 0)`);
    }

    setupEventHandlers() {
        // Score type selector
        d3.select('#score-type').on('change', (event) => {
            this.currentScoreType = event.target.value;
            this.processedData.clear(); // Clear cache when score type changes
            this.updateVisualization();
        });

        // Year filter
        d3.select('#year-filter').on('change', (event) => {
            this.currentYear = event.target.value;
            this.processedData.clear(); // Clear cache when year changes
            this.updateVisualization();
        });

        // Responsive resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleResize() {
        const containerRect = this.container.node().getBoundingClientRect();
        const newWidth = containerRect.width - 40;
        
        if (Math.abs(newWidth - this.width) > 50) { // Only resize if significant change
            this.width = newWidth;
            this.svg.attr('width', this.width);
            this.xScale.range([CONFIG.margin.left, this.width - CONFIG.margin.right]);
            this.updateVisualization();
        }
    }

    parseData(d) {
        try {
            return {
                year: +d.Year,
                date: d3.timeParse('%Y-%m-%d')(d.Date),
                show: d.Show,
                city: d.City,
                state: d.State,
                scores: JSON.parse(d.Scores)
            };
        } catch (error) {
            console.warn('Failed to parse data row:', d, error);
            return null;
        }
    }

    processCorpData(corpName) {
        const key = `${corpName}-${this.currentYear}-${this.currentScoreType}`;
        
        if (this.processedData.has(key)) {
            return this.processedData.get(key);
        }

        const results = [];
        const normalizedCorpName = corpName.trim();

        this.data.forEach(show => {
            if (!show || !show.date) return;
            
            // Filter by year if not "all"
            if (this.currentYear !== 'all' && show.year !== +this.currentYear) {
                return;
            }

            try {
                Object.values(show.scores).forEach(division => {
                    if (!division.Corps || !division[this.currentScoreType]) return;

                    // Convert the corps object to array format
                    const corpsArray = Object.values(division.Corps);
                    const scoresArray = Object.values(division[this.currentScoreType]);

                    const corpIndex = corpsArray.findIndex(corp => 
                        corp.trim() === normalizedCorpName
                    );

                    if (corpIndex !== -1 && scoresArray[corpIndex] != null) {
                        const score = +scoresArray[corpIndex];
                        // Filter out zero scores
                        if (score > 0) {
                            results.push({
                                date: show.date,
                                score: score,
                                show: show.show,
                                year: show.year,
                                city: show.city,
                                state: show.state
                            });
                        }
                    }
                });
            } catch (error) {
                console.warn('Error processing show data:', show, error);
            }
        });

        results.sort((a, b) => a.date - b.date);
        
        const processedResult = {
            corp: normalizedCorpName,
            id: this.sanitizeId(normalizedCorpName),
            scores: results
        };

        this.processedData.set(key, processedResult);
        return processedResult;
    }

    sanitizeId(corpName) {
        return corpName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    }

    updateScales() {
        const activeData = Array.from(this.activeCorps)
            .map(corp => this.processCorpData(corp))
            .filter(data => data.scores.length > 0);

        if (activeData.length === 0) {
            return;
        }

        const allDates = activeData.flatMap(d => d.scores.map(s => s.date));
        const allScores = activeData.flatMap(d => d.scores.map(s => s.score));

        this.xScale.domain(d3.extent(allDates));
        this.yScale.domain(d3.extent(allScores));

        // Update axes with smooth transition
        this.xAxisGroup
            .transition()
            .duration(CONFIG.animation.duration)
            .call(this.xAxis);

        this.yAxisGroup
            .transition()
            .duration(CONFIG.animation.duration)
            .call(this.yAxis);
    }

    updateVisualization() {
        this.updateScales();
        this.renderLines();
        this.renderPoints();
    }

    renderLines() {
        const activeData = Array.from(this.activeCorps)
            .map(corp => this.processCorpData(corp))
            .filter(data => data.scores.length > 0);

        const line = d3.line()
            .x(d => this.xScale(d.date))
            .y(d => this.yScale(d.score))
            .curve(d3.curveMonotoneX);

        const lines = this.plotArea
            .selectAll('.corp-line')
            .data(activeData, d => d.id);

        // Enter
        lines.enter()
            .append('path')
            .attr('class', 'corp-line')
            .attr('id', d => `line-${d.id}`)
            .attr('fill', 'none')
            .attr('stroke', d => this.colorScale(d.corp))
            .attr('stroke-width', 0)
            .attr('d', d => line(d.scores))
            .transition()
            .duration(CONFIG.animation.duration)
            .attr('stroke-width', CONFIG.line.strokeWidth);

        // Update
        lines.transition()
            .duration(CONFIG.animation.duration)
            .attr('d', d => line(d.scores))
            .attr('stroke', d => this.colorScale(d.corp));

        // Exit
        lines.exit()
            .transition()
            .duration(CONFIG.animation.duration)
            .attr('stroke-width', 0)
            .remove();
    }

    renderPoints() {
        const activeData = Array.from(this.activeCorps)
            .map(corp => this.processCorpData(corp))
            .filter(data => data.scores.length > 0);

        const allPoints = activeData.flatMap(corpData => 
            corpData.scores.map(score => ({
                ...score,
                corp: corpData.corp,
                id: corpData.id
            }))
        );

        const points = this.plotArea
            .selectAll('.corp-point')
            .data(allPoints, d => `${d.id}-${d.date.getTime()}`);

        // Enter
        const enterPoints = points.enter()
            .append('circle')
            .attr('class', 'corp-point')
            .attr('cx', d => this.xScale(d.date))
            .attr('cy', d => this.yScale(d.score))
            .attr('r', 0)
            .attr('fill', d => this.colorScale(d.corp))
            .attr('stroke', 'white')
            .attr('stroke-width', CONFIG.point.strokeWidth);

        enterPoints
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mouseout', () => this.hideTooltip())
            .transition()
            .duration(CONFIG.animation.duration)
            .attr('r', CONFIG.point.radius);

        // Update
        points.transition()
            .duration(CONFIG.animation.duration)
            .attr('cx', d => this.xScale(d.date))
            .attr('cy', d => this.yScale(d.score))
            .attr('fill', d => this.colorScale(d.corp));

        // Exit
        points.exit()
            .transition()
            .duration(CONFIG.animation.duration)
            .attr('r', 0)
            .remove();
    }

    showTooltip(event, d) {
        const [mouseX, mouseY] = d3.pointer(event, this.svg.node());
        
        // Clear previous content
        this.tooltipText.selectAll('*').remove();
        
        // Add content
        this.tooltipText.append('tspan')
            .attr('x', CONFIG.tooltip.padding)
            .attr('y', CONFIG.tooltip.padding)
            .text(d.corp);
        
        this.tooltipText.append('tspan')
            .attr('x', CONFIG.tooltip.padding)
            .attr('dy', '1.2em')
            .text(`${this.currentScoreType}: ${d.score}`);
        
        this.tooltipText.append('tspan')
            .attr('x', CONFIG.tooltip.padding)
            .attr('dy', '1.2em')
            .text(d3.timeFormat('%B %d, %Y')(d.date));

        if (d.city && d.state) {
            this.tooltipText.append('tspan')
                .attr('x', CONFIG.tooltip.padding)
                .attr('dy', '1.2em')
                .text(`${d.city}, ${d.state}`);
        }

        // Size tooltip background
        const bbox = this.tooltipText.node().getBBox();
        this.tooltip.select('#tooltip-back')
            .attr('width', bbox.width + CONFIG.tooltip.padding * 2)
            .attr('height', bbox.height + CONFIG.tooltip.padding * 2);

        // Position tooltip
        let tooltipX = mouseX + CONFIG.tooltip.offset.x;
        let tooltipY = mouseY - bbox.height / 2;

        // Keep tooltip in bounds
        if (tooltipX + bbox.width + CONFIG.tooltip.padding * 2 > this.width) {
            tooltipX = mouseX - bbox.width - CONFIG.tooltip.padding * 2 - CONFIG.tooltip.offset.x;
        }
        
        this.tooltip
            .attr('transform', `translate(${tooltipX}, ${tooltipY})`)
            .style('display', 'block');
    }

    hideTooltip() {
        this.tooltip.style('display', 'none');
    }

    toggleCorp(corpName) {
        if (this.activeCorps.has(corpName)) {
            this.activeCorps.delete(corpName);
        } else {
            this.activeCorps.add(corpName);
        }
        this.updateVisualization();
    }

    createLegend() {
        const legend = this.svg.append('g')
            .attr('class', 'legend-container')
            .attr('transform', `translate(10, ${CONFIG.margin.top})`);

        let yOffset = 0;

        // World Class section header
        legend.append('text')
            .attr('class', 'section-header')
            .attr('y', yOffset)
            .text('WORLD CLASS')
            .style('cursor', 'pointer')
            .on('click', () => {
                this.toggleDivision('worldClass');
            });
        yOffset += 20;

        // Create World Class legend items with data binding
        legend.selectAll('.legend-world')
            .data(CORPS_DATA.worldClass)
            .enter()
            .append('text')
            .attr('class', 'legend legend-world')
            .attr('y', (d, i) => yOffset + i * 16)
            .text(d => d)
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                this.toggleCorp(d);
                this.updateLegendStyles();
            });

        yOffset += CORPS_DATA.worldClass.length * 16 + 10;

        // Open Class section header
        legend.append('text')
            .attr('class', 'section-header')
            .attr('y', yOffset)
            .text('OPEN CLASS')
            .style('cursor', 'pointer')
            .on('click', () => {
                this.toggleDivision('openClass');
            });
        yOffset += 20;

        // Create Open Class legend items with data binding
        legend.selectAll('.legend-open')
            .data(CORPS_DATA.openClass)
            .enter()
            .append('text')
            .attr('class', 'legend legend-open')
            .attr('y', (d, i) => yOffset + i * 16)
            .text(d => d)
            .style('cursor', 'pointer')
            .on('click', (event, d) => {
                this.toggleCorp(d);
                this.updateLegendStyles();
            });

        this.updateLegendStyles();
    }

    toggleDivision(division) {
        const corpsInDivision = CORPS_DATA[division];
        
        // Check if all corps in this division are currently active
        const allActive = corpsInDivision.every(corp => this.activeCorps.has(corp));
        
        if (allActive) {
            // If all are active, remove all from this division
            corpsInDivision.forEach(corp => this.activeCorps.delete(corp));
        } else {
            // If not all are active, add all from this division
            corpsInDivision.forEach(corp => this.activeCorps.add(corp));
        }
        
        this.updateLegendStyles();
        this.updateVisualization();
    }

    updateLegendStyles() {
        console.log("UPDATE")
        this.svg.selectAll('.legend')
            .classed('active', d => this.activeCorps.has(d))
            .classed('inactive', d => !this.activeCorps.has(d))
            .style('fill', d => {
                return this.activeCorps.has(d) ? this.colorScale(d) : '#999';
            });
    }

    loadData() {
        // Load your actual CSV data
        d3.dsv('|', './scores.csv', d => this.parseData(d)).then(data => {
            this.data = data.filter(d => d !== null); // Filter out failed parses
            console.log(`Loaded ${this.data.length} records`);
            
            // Get available years for the year filter
            const years = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a); // Descending order
            const yearSelect = d3.select('#year-filter');
            
            // Clear all existing options
            yearSelect.selectAll('option').remove();
            
            // Add year options in descending order
            yearSelect.selectAll('.year-option')
                .data(years)
                .enter()
                .append('option')
                .attr('class', 'year-option')
                .attr('value', d => d)
                .text(d => d);
            
            // Add "All Years" option at the end
            yearSelect.append('option')
                .attr('value', 'all')
                .text('All Years');
            
            // Set default to 2024 if it exists, otherwise use the most recent year
            const defaultYear = years.includes(2024) ? '2024' : years[0].toString();
            yearSelect.property('value', defaultYear);
            this.currentYear = defaultYear;
            
            this.createLegend();
            console.log('Visualization ready! Click on corps names in the legend to add/remove them from the chart.');
        }).catch(error => {
            console.error('Error loading data:', error);
        });
    }

    generateSampleData() {
        // Generate sample data for demonstration
        const corps = [...CORPS_DATA.worldClass, ...CORPS_DATA.openClass];
        const data = [];
        
        for (let month = 6; month <= 8; month++) {
            for (let day = 1; day <= 28; day += 7) {
                const date = new Date(2024, month - 1, day);
                const scores = {};
                
                // Generate scores for different divisions
                scores['World Class'] = {
                    Corps: corps.slice(0, 12),
                    Total: corps.slice(0, 12).map(() => Math.random() * 20 + 70),
                    'Music - Brass': corps.slice(0, 12).map(() => Math.random() * 8 + 15),
                    'Music - Percussion': corps.slice(0, 12).map(() => Math.random() * 6 + 12),
                    'Visual - Performance': corps.slice(0, 12).map(() => Math.random() * 8 + 15),
                    'Visual - Effect': corps.slice(0, 12).map(() => Math.random() * 6 + 12),
                    'Music - Effect': corps.slice(0, 12).map(() => Math.random() * 6 + 12)
                };
                
                data.push({
                    date: date,
                    show: `Show ${month}/${day}`,
                    scores: scores
                });
            }
        }
        
        return data;
    }
}

// Initialize the visualization
const viz = new DrumCorpsVisualization('#container');
viz.loadData();