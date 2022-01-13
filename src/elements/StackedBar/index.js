import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import example from './data.csv';

function StackedBar() {
    const svgRef = useRef();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const margin = {top: 20, right: 20, bottom: 30, left: 40};

    var bar_cnt = 0;

    var x = d3.scaleLinear();
    var y = d3.scaleBand()
        .paddingInner(0.05)
        .align(0.1);
    var z = d3.scaleOrdinal()
        .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

    const tooltip = d3.select("#tooltip");
    const onMouseEnter = (event, datum) => {
        tooltip.style("opacity", 1);
        tooltip.select("#tooltip_value")
            .attr("x", x((datum[1]+datum[0])/2))
            .attr("y", y(datum.data.State) + y.bandwidth())
            .attr("transform", "translate(-25, -2)")
            .text(datum[1]);
        var selected_bar = document.getElementById(event.toElement.id);
        selected_bar.style = 'opacity: 0.8';
    }
    const onMouseLeave = (event, datum) => {
        tooltip.style("opacity", 0);
        var selected_bar = document.getElementById(event.fromElement.id);
        selected_bar.style = 'opacity: 1';
    }
    const onMouseClick = (event, datum) => {
        console.log("legend mouse click")
        console.log(datum)
    }

    useEffect(()=>{
        d3.csv(example).then(function(data) {
            setData(data);
            setLoading(false);
        });
    }, [])

    useEffect(() => { if (!loading) {
        var keys = data.columns.slice(1);

        var i = 0, j = 0;
        for (i = 0; i < data.length; i++) {
            var total = 0;
            for (j = 0; j < keys.length; j++) {
                total += Number(data[i][keys[j]])
            }
            data[i].total = total
        }
        data.sort(function(a, b) { return b.total - a.total; });
        
        x.domain([0, d3.max(data, function(d) { return d.total; })]).nice();
        y.domain(data.map(function(d) { return d.State; }));
        z.domain(keys);

        const svg = d3.select(svgRef.current);
        const width = svg.attr("width") - margin.left - margin.right;
        const height = svg.attr("height") - margin.top - margin.bottom;
        var g = svg.select("#svg_frame").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.rangeRound([0, width]);
        y.rangeRound([0, height]);

        g.select("#chart")
            .selectAll("g")
            .data(d3.stack().keys(keys)(data))
            .enter().append("g")
            .attr("fill", function(d) { return z(d.key); })
            .selectAll("rect")
            .data(function(d) { 
                return d; })
            .enter().append("rect")
            .attr("x", function(d) { return x(d[0]); })
            .attr("y", function(d) { return y(d.data.State); })
            .attr("width", function(d) { return x(d[1]) - x(d[0]); })
            .attr("height", y.bandwidth())
            .attr("id", () => {
                bar_cnt++;
                return ("bar"+bar_cnt);
            });

        g.select("#chart")
            .selectAll("rect")
            .on('mouseenter', (event, datum) => onMouseEnter(event, datum))
            .on('mouseleave', (event, datum) => onMouseLeave(event, datum));

        g.select("#yaxis")
            .attr("transform", "translate(0,0)")
            .call(d3.axisLeft(y));

        g.select("#xaxis")
            .attr("transform", "translate(0,"+height+")")
            .call(d3.axisBottom(x).ticks(null, "s"))

        var legend = g.select("#legend")
            .selectAll("g")
            .data(keys.slice().reverse())
            .enter().append("g")
            .attr("transform", function(d, i) { return "translate(-50," + (300 + i * 20) + ")"; });

        legend.append("rect")
            .attr("x", width - 19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", z)
            .on('click', (event, datum) => onMouseClick(event, datum));

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(function(d) { return d; })
            .on('click', (event, datum) => onMouseClick(event, datum));
    }}, [loading]);

    return (
        <React.Fragment>
            {loading && <h1>loading</h1>}
            <svg ref = {svgRef} width="960" height="960">
                <g id = "svg_frame">
                    <g id = "chart"/>
                    <g id = "xaxis" className = "axis"/>
                    <g id = "yaxis" className = "axis"/>
                    <g id = "legend" fontFamily = "sans-serif" fontSize = "10" textAnchor = "end"/>
                    <g id = "tooltip" className="tooltip" opacity="0" pointerEvents="none">
                        <text id = "tooltip_value" fontFamily="sans-serif" fontSize="13" fill="black">Hello</text>
                    </g>
                </g>
            </svg>
        </React.Fragment>
    );
}

export default StackedBar;