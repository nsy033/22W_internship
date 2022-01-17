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
    const margin = {
        top: 10,
        right: 40,
        left: 180,
        bottom: 10,
    };
    const width = 1200;
    const height = 170;
    const yTicks = 3;
    const datumType = ['APP_USAGE_EVENT', 'BATTERY', 'BLUETOOTH', 'CALL_LOG', 'DATA_TRAFFIC',
        'DEVICE_EVENT', 'FITNESS', 'EXTERNAL_SENSOR', 'INSTALLED_APP', 'KEY_LOG',
        'LOCATION', 'MEDIA', 'MESSAGE', 'NOTIFICATION', 'PHYSICAL_ACTIVITY',
        'PHYSICAL_ACTIVITY_TRANSITION', 'SURVEY', 'WIFI'];
    const colors = ["#5779A3", "#E1EDF6", "#E59243", "#F6C087",
        "#6B9E58", "#9BCE86", "#B39A44", "#ECCE74", "#5F9794", 
        "#91BAB6", "#D1605E", "#F2A19D", "#77706E", "#B8B0AC", 
        "#C67593", "#F1C2D1", "#A87D9F", "#D2B6A8", "#7ECBCB"];

    // handlers
    const handleAggrDate = () => { setAggr("1"); }
    const handleAggrHour = () => { setAggr("0"); }
    const handleAggrMin = () => { setAggr("-1"); }
    const handleDate = () => {
        setDay(document.getElementById("dayselect").selectedOptions[0].value);
        console.log(document.getElementById("dayselect").selectedOptions[0].value);
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
    const [day, setDay] = useState('');

    // useeffect
    useEffect(()=>{
        // loading data from csv
        d3.csv(date_cnt).then(function(data) {
            var dayset = []
            var dayselect = document.getElementById("dayselect");
            var min_day = ''
            data.forEach(row => {
                const d_split = row.date.split('-');
                const this_date = String(new Date(Number(d_split[2]) + 2000, d_split[1], d_split[0]))
                if (min_day == '' || Date(min_day) > Date(this_date)) {
                    min_day = this_date
                }
                if (!dayset.includes(this_date)) dayset.push(this_date)
            });

            for(var i = 0; i < dayset.length; i++) {
                var opt = document.createElement('option');
                const this_date = new Date(dayset[i]);
                const format_date = this_date.getFullYear()+'-'+this_date.getMonth()+'-'+this_date.getDate();
                opt.value = dayset[i];
                opt.innerHTML = format_date;
                dayselect.append(dayset[i], opt)
            }

            data = data.filter(function(row) {
                return row.subject_email == email_addr;
            });
            data.forEach(d => {
                const d_split = d.date.split('-');
                d.value = +d.value;
                d.date = new Date(Number(d_split[2]) + 2000, d_split[1], d_split[0]);
            });

            setDay(min_day);
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
        const innerWidth = width - margin.right - margin.left;
        const innerHeight = height - margin.top - margin.bottom;
        svg.select("#svg_frame").selectAll(".appended").remove()

        var xValue, yValue
        var aggr_num = Number(aggr)
        var data

        yValue = d => d.value;
        if (aggr_num > 0) {xValue = d => d.date; data = date_data}
        else if (aggr_num == 0) {xValue = d => d.hour; data = hour_data}
        else {xValue = d => d.minute; data = minute_data}
        
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, xValue))
            .range([0, innerWidth])
            .nice();

        for (var i = 0; i < datumType.length; i++) {
            const tydata = data.filter(function(row) {
                return row.datumType == datumType[i];
            });
            const g = svg.select("#svg_frame").append("g").attr("transform", "translate(" + margin.left + "," + (margin.top + height * i) + ")");
        
            const yScale = d3.scaleLinear()
                .domain(d3.extent(tydata, yValue))
                .range([innerHeight, 0])
                .nice();
            const yAxis = d3.axisLeft(yScale).ticks(yTicks, "~s").tickSize(-innerWidth).tickPadding(10);
            const yAxisG = g.append('g').attr("class", "appended").call(yAxis);
            yAxisG.selectAll('.domain').remove();
            yAxisG.selectAll('line').attr("stroke", "rgb(187 189 201)");
            yAxisG
                .append('text').attr("class", "appended")
                .attr('class', 'axis-label')
                .attr('y', height / 2)
                .attr('x', -50)
                .attr('fill', 'black')
                // .attr('transform', `rotate(-90)`)
                .attr('text-anchor', `end`)
                .style('font-weight', 'bold')
                .text(() => {
                    if (datumType[i] == 'PHYSICAL_ACTIVITY_TRANSITION') return 'PHYS ACT TRANS';
                    else if(datumType[i] == 'APP_USAGE_EVENT') return 'APP USAGE'
                    return datumType[i].replaceAll('_', ' ')}
                );

            var xAixs
            if (i == datumType.length - 1) xAixs = d3.axisBottom(xScale).ticks(10).tickSize(-innerHeight).tickPadding(15);
            else xAixs = d3.axisBottom(xScale).ticks(10).tickSize(-innerHeight).tickPadding(15).tickFormat('');
            const xAxisG = g
                .append('g').attr("class", "appended")
                .call(xAixs)
                .attr('transform', `translate(0, ${innerHeight})`);
            xAxisG.select('.domain').remove();
            xAxisG.selectAll('line').attr("stroke", "rgb(187 189 201)");

            if (i == datumType.length - 1) {
                xAxisG.append('text').attr("class", "appended")
                    .attr('class', 'axis-label')
                    .attr('y', 60)
                    .attr('x', innerWidth / 2)
                    .attr('fill', 'black')
                    .text(xAxisLabel);
            }

            const lineGenerator = d3.line()
                .x(d => xScale(xValue(d)))
                .y(d => yScale(yValue(d)))
                // .curve(d3.curveBasis); // (*)
            g.append('path')
                .attr("class", "appended")
                .attr('id', 'line-path')
                .attr('stroke', colors[i])
                .attr('stroke-width', '2.5')
                .attr('d', lineGenerator(tydata));
            
            svg.append('hr').attr('width', width)
        }
    }}, [Dloading, Hloading, Mloading, aggr]);
    
    // render
    return (
        <div className="fragment">
            <div className="title">
                <h1>One User's Count of Rows along Time</h1>
                <h3>{email_addr}</h3>
                <div>
                    <text>Select specific date you want to explore </text>
                    <select id="dayselect" onChange={handleDate}>
                    </select>
                </div>
                <div>
                    <g onClick={handleAggrDate}>
                        <input id="date_aggr" value="1" type="radio" checked={aggr == '1'} onChange={handleAggrDate}></input>
                        <text>Daily</text>
                    </g>
                    <g onClick={handleAggrHour}>
                        <input id="hour_aggr" value="0" type="radio" checked={aggr == '0'} onChange={handleAggrHour}></input>
                        <text>Hourly</text>
                    </g>
                    <g onClick={handleAggrMin}>
                        <input id="min_aggr" value="-1" type="radio" checked={aggr == '-1'} onChange={handleAggrMin}></input>
                        <text>Minute </text>
                    </g>
                    <text> based aggregation</text>
                </div>
            </div>
        {(Dloading || Hloading || Mloading) &&
            <h2>Loading ...</h2>
        }
        {!(Dloading || Hloading || Mloading) &&
            <>
            <svg ref = {svgRef} width={width} height={height * 19}>
                <g id = "svg_frame">
                </g>
            </svg>
            </>
        }
        </div>
    );
}

export default IndivNumOfRows;