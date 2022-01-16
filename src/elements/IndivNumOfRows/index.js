import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import date_cnt from './date_cnt.csv';
import hour_cnt from './hour_cnt.csv';
import minute_cnt from './minute_cnt.csv';
import './index.css';

function IndivNumOfRows() {
    // constants
    const URLsplit = window.document.URL.split('/');
    const user_id = URLsplit[URLsplit.length - 1];
    const email_addr = "iclab.drm" + user_id + "@kse.kaist.ac.kr";
    const xAxisLabel = 'Time';
    const yAxisLabel = '# of ';
    const margin = {
        top: 30,
        right: 40,
        left: 100,
        bottom: 70,
    };
    const datumType = ['APP_USAGE_EVENT', 'BATTERY', 'BLUETOOTH', 'CALL_LOG', 'DATA_TRAFFIC',
        'DEVICE_EVENT', 'FITNESS', 'EXTERNAL_SENSOR', 'INSTALLED_APP', 'KEY_LOG',
        'LOCATION', 'MEDIA', 'MESSAGE', 'NOTIFICATION', 'PHYSICAL_ACTIVITY',
        'PHYSICAL_ACTIVITY_TRANSITION', 'SURVEY', 'WIFI'];
    const colors = ["#5779A3", "#E1EDF6", "#E59243", "#F6C087",
        "#6B9E58", "#9BCE86", "#B39A44", "#ECCE74", "#5F9794", 
        "#91BAB6", "#D1605E", "#F2A19D", "#77706E", "#B8B0AC", 
        "#C67593", "#F1C2D1", "#A87D9F", "#D2B6A8", "#7ECBCB"];

    // handlers
    const handleAggr = () => {
        setAggr(document.getElementById("aggrselect").selectedOptions[0].value);
    }
    // usestate
    const svgRef = useRef();
    const [date_data, setDData] = useState([]);
    const [hour_data, setHData] = useState([]);
    const [minute_data, setMData] = useState([]);
    const [aggr, setAggr] = useState("1");
    const [Dloading, setDLoading] = useState(true);
    const [Hloading, setHLoading] = useState(true);
    const [Mloading, setMLoading] = useState(true);

    // useeffect
    useEffect(()=>{
        // loading data from csv
        d3.csv(date_cnt).then(function(data) {
            data = data.filter(function(row) {
                return row.subject_email == email_addr;
            });
            data.forEach(d => {
                const d_split = d.date.split('-');
                d.value = +d.value;
                d.date = new Date(Number(d_split[2]) + 2000, d_split[1], d_split[0]);
            });
            setDData(data);
            setDLoading(false);
        });

        d3.csv(hour_cnt).then(function(data) {
            data = data.filter(function(row) {
                return row.subject_email == email_addr;
            });
            data.forEach(d => {
                const d_split = d.hour.split('-');
                const h_split = d_split[2].split(' ');
                d.value = +d.value;
                d.hour = new Date(Number(h_split[0]) + 2000, d_split[1], d_split[0], h_split[1]);
            });
            setHData(data);
            setHLoading(false);
        });

        d3.csv(minute_cnt).then(function(data) {
            data = data.filter(function(row){
                return row.subject_email == email_addr;
            });
            data.forEach(d => {
                const d_split = d.minute.split('-');
                const h_split = d_split[2].split(' ');
                const m_split = h_split[1].split(':');
                d.value = +d.value;
                d.minute = new Date(Number(d_split[0]) + 2000, d_split[1], h_split[0], m_split[0], m_split[1]);
            });
            setMData(data);
            setMLoading(false);
        });
    }, [])

    useEffect(() => { if (!(Dloading || Hloading || Mloading)) {
        var svg = d3.select(svgRef.current);
        const width = +svg.attr('width');
        const height = 300;
        const innerWidth = width - margin.right - margin.left;
        const innerHeight = height - margin.top - margin.bottom;
        svg.select("#svg_frame").selectAll(".appended").remove()

        for (var i = 0; i < datumType.length; i++) {
        var xValue, yValue;
        var aggr_num = Number(aggr)
        var data
        if (aggr_num > 0) {
            xValue = d => d.date;
            yValue = d => d.value;
            data = date_data.filter(function(row) {
                return row.datumType == datumType[i];
            });
        }
        else if (aggr_num == 0) {
            xValue = d => d.hour;
            yValue = d => d.value;
            data = hour_data.filter(function(row) {
                return row.datumType == datumType[i];
            });
        }
        else {
            xValue = d => d.minute;
            yValue = d => d.value;
            data = minute_data.filter(function(row) {
                return row.datumType == datumType[i];
            });
        }
        
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, xValue))
            .range([0, innerWidth])
            .nice();
        const yScale = d3.scaleLinear()
            .domain(d3.extent(data, yValue))
            .range([innerHeight, 0])
            .nice();
        const xAixs = d3.axisBottom(xScale).ticks(10).tickSize(-innerHeight).tickPadding(15);
        const yAxis = d3.axisLeft(yScale).ticks(7).tickSize(-innerWidth).tickPadding(10);
        const g = svg.select("#svg_frame").append("g").attr("transform", "translate(" + margin.left + "," + (margin.top + 300 * i) + ")");
        const yAxisG = g.append('g').attr("class", "appended").call(yAxis);
        yAxisG.selectAll('.domain').remove();
        yAxisG.selectAll('line').attr("stroke", "rgb(187 189 201)");
        yAxisG
            .append('text').attr("class", "appended")
            .attr('class', 'axis-label')
            .attr('y', -50)
            .attr('x', -innerHeight / 2)
            .attr('fill', 'black')
            .attr('transform', `rotate(-90)`)
            .attr('text-anchor', `middle`)
            .text(yAxisLabel + datumType[i]);
        const xAxisG = g
            .append('g').attr("class", "appended")
            .call(xAixs)
            .attr('transform', `translate(0, ${innerHeight})`);
        xAxisG.select('.domain').remove();
        xAxisG.selectAll('line').attr("stroke", "rgb(187 189 201)");
        xAxisG
            .append('text').attr("class", "appended")
            .attr('class', 'axis-label')
            .attr('y', 60)
            .attr('x', innerWidth / 2)
            .attr('fill', 'black')
            .text(xAxisLabel);

        const lineGenerator = d3.line()
            .x(d => xScale(xValue(d)))
            .y(d => yScale(yValue(d)))
            .curve(d3.curveBasis); // (*)
        g.append('path')
            .attr("class", "appended")
            .attr('id', 'line-path')
            .attr('stroke', colors[i])
            .attr('stroke-width', '2.5')
            .attr('d', lineGenerator(data));
        
        }
    }}, [Dloading, Hloading, Mloading, aggr]);
    
    // render
    return (
        <div className="fragment">
            <div className="title">
                <h1>Row Counts of UserId {user_id}</h1>
                <h3>email address: {email_addr}</h3>
                <div>
                    <text>AGGREGATION </text>
                    <select id="aggrselect" onChange={handleAggr}>
                        <option value = "1">DATE</option>
                        <option value = "0">HOUR</option>
                        <option value = "-1">MINUTE</option>
                    </select>
                </div>
            </div>
        {(Dloading || Hloading || Mloading) &&
            <h2>Loading ...</h2>
        }
        {!(Dloading || Hloading || Mloading) &&
            <>
            <svg ref = {svgRef} width="1200" height="5500">
                <g id = "svg_frame">
                </g>
            </svg>
            </>
        }
        </div>
    );
}

export default IndivNumOfRows;