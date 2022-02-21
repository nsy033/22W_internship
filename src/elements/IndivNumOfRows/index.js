import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import date_cnt from '../../data_process/date_cnt.csv';
import hour_cnt from '../../data_process/hour_cnt.csv';
import minute_cnt from '../../data_process/minute_cnt.csv';
import './index.css';
import { styled } from '@mui/styles';
import * as mui from '@mui/material';
import { BsArrowRightSquare } from "react-icons/bs";

function IndivNumOfRows() {
    // constants
    const URLsplit = window.document.URL.split('/');
    const user_id = URLsplit[URLsplit.length - 1];
    const email_addr = "iclab.drm" + user_id + "@kse.kaist.ac.kr";
    const xAxisLabel = 'Time';
    const margin = {
        top: 10,
        right: 40,
        left: 220,
        bottom: 15,
    };
    const width = 1200;
    const height = 100;
    const yTicks = 3;
    const datumType = ['APP_USAGE_EVENT', 'BATTERY', 'BLUETOOTH', 'CALL_LOG', 'DATA_TRAFFIC',
        'DEVICE_EVENT', 'FITNESS', 'EMBEDDED_SENSOR', 'EXTERNAL_SENSOR', 'INSTALLED_APP', 'KEY_LOG',
        'LOCATION', 'MEDIA', 'MESSAGE', 'NOTIFICATION', 'PHYSICAL_ACTIVITY',
        'PHYSICAL_ACTIVITY_TRANSITION', 'SURVEY', 'WIFI'];
    const colors = ["#5779A3", "#E1EDF6", "#E59243", "#F6C087",
        "#6B9E58", "#9BCE86", "#B39A44", "#ECCE74", "#5F9794", 
        "#91BAB6", "#D1605E", "#F2A19D", "#77706E", "#B8B0AC", 
        "#C67593", "#F1C2D1", "#A87D9F", "#D2B6A8", "#7ECBCB"];
    const MyRadio = styled(mui.RadioGroup)({
        marginRight: '20px',
    });
    const date_formatter = (raw_date) => {
        let month = raw_date.getMonth();
        let day = raw_date.getDate();
        let hour = raw_date.getHours();
        let minute = raw_date.getMinutes();

        month = month >= 10 ? month : '0' + month;
        day = day >= 10 ? day : '0' + day;
        hour = hour >= 10 ? hour : '0' + hour;
        minute = minute >= 10 ? minute : '0' + minute;

        return raw_date.getFullYear() + '/' + month + '/' + day + ' ' + hour + ':' + minute;
    }
    // global variables
    var circle_cnt = 0;

    // handlers
    const handleAggrDate = () => { setAggr("1"); }
    const handleAggrHour = () => { setAggr("0"); }
    const handleAggrMin = () => { setAggr("-1"); }
    const handleDate = (event) => {
        setDay(event.target.value);
    }
    const handleRange = (event, newValue) => {
        setRange(newValue);
        const start = new Date(newValue[0]);
        const format_start = date_formatter(start);
        const end = new Date(newValue[1]);
        const format_end = date_formatter(end);
        setPeriod(format_start + ' ~ ' + format_end);
    };
    const valueOverview = () => {
        window.open(window.document.URL.replace('indiv', 'overview'));
    }
    const handleRangeBtn = () => {
        setRangeBtnCnt((rangebtncnt) => rangebtncnt + 1);
    };
    const handleTooltipShow = (event, datum) => {
        var selected_circle = document.getElementById(event.target.id);
        selected_circle.setAttribute("r", 10);
        event.target.style = 'opacity: 0.6';

        var tmp_text = datum.value + ' row(s) of ';
        var type_name = datum.datumType
        if (type_name == 'PHYSICAL_ACTIVITY_TRANSITION') type_name = 'PHYS_ACT_TRANS'
        else if (type_name == 'APP_USAGE_EVENT') type_name = 'APP_USAGE'
        tmp_text += type_name.replaceAll('_', ' ') + '\nat ';

        var date;
        if (aggr == '1') date = new Date(datum.date);
        else if( aggr == '0') date = new Date(datum.hour);
        else date = new Date(datum.minute);
        
        var formate_date = date_formatter(date);
        if (aggr == '1') formate_date = formate_date.split(' ')[0];
        else if( aggr == '0') {
            var tmp_time = formate_date.split(':')[0]
            var hour = Number(tmp_time.split(' ')[1]);
            if (hour < 12) formate_date = tmp_time.split(' ')[0] + ' AM ' + String(hour);
            else if (hour == 12) formate_date = tmp_time.split(' ')[0] + ' PM ' + String(hour);
            else formate_date = tmp_time.split(' ')[0] + ' PM ' + String(hour - 12);
        }
        tmp_text += formate_date;

        setTooltip(tmp_text)
    }
    const handleTooltipHide = (event, datum) => {
        // var selected_circle = event.target.id;
        // prev_select_circle.push(selected_circle);
        var selected_circle = document.getElementById(event.target.id);
        selected_circle.setAttribute("r", 3);
        event.target.style = 'opacity: 1';
        setTooltip('');
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
    var [range, setRange] = useState([0, 0]);
    var [rangebtncnt, setRangeBtnCnt] = useState(0);
    var [period, setPeriod] = useState('');
    var [min_minute, setMinMin] = useState(-1);
    var [max_minute, setMaxMin] = useState(-1);
    var [tooltip_text, setTooltip] = useState('');

    // useeffect
    useEffect(()=>{
        // loading data from csv
        d3.csv(date_cnt).then(function(data) {
            var min_day = ''
            data.forEach(row => {
                const d_split = row.date.split('-');
                const this_date = new Date(Number(d_split[2]) + 2000, d_split[1], d_split[0])
                if (min_day == '' || Date(min_day) > this_date) {
                    min_day = this_date
                }
            });

            data = data.filter(function(row) {
                return row.subject_email == email_addr;
            });
            data.forEach(d => {
                const d_split = d.date.split('-');
                d.value = +d.value;
                d.date = new Date(Number(d_split[2]) + 2000, d_split[1], d_split[0]);
            });

            for (var a = 0; a < data.length - 1; a++) {
                for (var b = a+1; b < data.length ; b++) {
                    const a_date = new Date(data[a].date).getTime()
                    const b_date = new Date(data[b].date).getTime()
                    if ( a_date === b_date && data[a].datumType == data[b].datumType) {
                        data[a].value += data[b].value;
                        data.splice(b, 1);
                    }
                }
            }

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
            var tmp_min = Infinity;
            var tmp_max = -1;
            
            data = data.filter(function(row){
                return row.subject_email == email_addr;
            });
            data.forEach(d => {
                const d_split = d.minute.split('-');
                const h_split = d_split[2].split(' ');
                const m_split = h_split[1].split(':');
                d.value = +d.value;
                d.minute = new Date(Number(d_split[0]) + 2000, d_split[1], h_split[0], m_split[0], m_split[1]);
                if (d.minute.getTime() < tmp_min) tmp_min = d.minute.getTime();
                if (d.minute.getTime() > tmp_max) tmp_max = d.minute.getTime();
            });
            const coeff = 1000 * 60 * 10 ;
            tmp_min = Math.floor(tmp_min / coeff) * coeff;
            tmp_max = Math.round(tmp_max / coeff) * coeff;

            const start = new Date(tmp_min);
            const format_start = date_formatter(start);
            const end = new Date(tmp_max);
            const format_end = date_formatter(end);
            setPeriod(format_start + ' ~ ' + format_end);

            setMinMin(tmp_min);
            setMaxMin(tmp_max);
            setRange([tmp_min, tmp_max]);
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
        if (aggr_num > 0) {
            xValue = d => d.date;
            data = date_data.filter(function(row) {
                return row.date >= range[0] && row.date <= range[1];
            });
        }
        else if (aggr_num == 0) {
            xValue = d => d.hour;
            data = hour_data.filter(function(row) {
                return row.hour >= range[0] && row.hour <= range[1];
            });
        }
        else {
            xValue = d => d.minute;
            data = minute_data.filter(function(row) {
                return row.minute >= range[0] && row.minute <= range[1];
            });
            }
        
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, xValue))
            .range([0, innerWidth])
            .nice();

        circle_cnt = 0;
        for (var i = 0; i < datumType.length; i++) {
            const tydata = data.filter(function(row) {
                return row.datumType == datumType[i];
            });

            const g = svg.select("#svg_frame").append("g").attr("transform", "translate(" + margin.left + "," + (margin.top + height * i) + ")");
        
            const yScale = d3.scaleLinear()
                .domain(d3.extent(tydata, yValue))
                .range([innerHeight, 0])
                .nice();
            const yAxis = d3.axisLeft(yScale).ticks(yTicks)
                .tickSize(-innerWidth).tickPadding(10)
                .tickFormat(d3.format(".3s"));
            const yAxisG = g.append('g').attr("class", "appended").call(yAxis);
            yAxisG.selectAll('.domain').remove();
            yAxisG.selectAll('line').attr("stroke", "rgb(187 189 201)");
            yAxisG
                .append('text').attr("class", "appended")
                .attr('class', 'axis-label')
                .attr('y', height / 2)
                .attr('x', -200)
                .attr('fill', 'black')
                // .attr('transform', `rotate(-90)`)
                .attr('text-anchor', `start`)
                .style('font-weight', 'bold')
                .text(() => {
                    if (datumType[i] == 'PHYSICAL_ACTIVITY_TRANSITION') return 'PHYS ACT TRANS';
                    else if(datumType[i] == 'APP_USAGE_EVENT') return 'APP USAGE'
                    return datumType[i].replaceAll('_', ' ')}
                );

            var xAixs
            if (i == datumType.length - 1) xAixs = d3.axisBottom(xScale).ticks(5).tickSize(-innerHeight).tickPadding(25);
            else xAixs = d3.axisBottom(xScale).ticks(10).tickSize(-innerHeight).tickPadding(25).tickFormat('');
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
                .attr('stroke-width', '3')
                .attr('d', lineGenerator(tydata));
            
            g.selectAll('circle')
                .data(tydata)
                .enter().append('circle')
                .attr("class", "appended")
                .attr('id', () => {
                    circle_cnt++;
                    return 'data-circle'+circle_cnt;}
                )
                .attr('r', 3)
                .attr('cx', function(d) { return xScale(xValue(d)); })
                .attr('cy', function(d) { return yScale(yValue(d)); })
                .attr('fill', function (d) { return colors[i]; })
                .on('mouseenter', (event, datum) => handleTooltipShow(event, datum))
                .on('mouseleave', (event, datum) => handleTooltipHide(event, datum));
            
            svg.append('path').attr('width', width)
                .attr('stroke', 'grey')
                .attr('stroke-width', '0.5')
                .attr('d', 'M0 '+((i+1)*height - 2)+' L'+width+' '+((i+1)*height - 2))
        }
    }}, [Dloading, Hloading, Mloading, aggr, min_minute, max_minute, rangebtncnt]);
    
    // render
    return (
        <div className="fragment">
            <div className="title" style ={{width: '1200px', textAlign: 'center', marginLeft: '-20px'}}>
                <h1>One User's Count of Rows along Time</h1>
                
                <mui.FormControl component="fieldset">
                    <mui.FormLabel component="legend">Aggregation Base</mui.FormLabel>
                    <MyRadio row aria-label="aggregation" name="row-radio-buttons-group">
                        <mui.FormControlLabel value="date_aggr" control={<mui.Radio />} checked={aggr == '1'} onChange={handleAggrDate} label="Daily" />
                        <mui.FormControlLabel value="hour_aggr" control={<mui.Radio />} checked={aggr == '0'} onChange={handleAggrHour} label="Hourly" />
                        <mui.FormControlLabel value="min_aggr" control={<mui.Radio />} checked={aggr == '-1'} onChange={handleAggrMin} label="Minute" />
                    </MyRadio>
                </mui.FormControl>

                <mui.FormControl sx={{ width: 300 }}>
                    <mui.Slider
                        min={min_minute}
                        step={10 * 60 * 1000}
                        max={max_minute}
                        getAriaLabel={() => 'Period'}
                        value={range}
                        onChange={handleRange}
                        valueLabelFormat= {(value) => {
                            const this_date = new Date(value);
                            const format_date = date_formatter(this_date);
                            return format_date;}}
                        valueLabelDisplay="auto"
                    />
                    <mui.Button size="small" variant="text" onClick={handleRangeBtn}>Apply Period Setting</mui.Button>
                </mui.FormControl>

                <mui.FormControl style ={{width: '370px'}}>
                    <mui.FormLabel>Current Focused Period</mui.FormLabel>
                    <mui.FormLabel>{period}</mui.FormLabel>
                </mui.FormControl>


                <mui.Button
                    size="small" variant="text" onClick={valueOverview}
                    style ={{marginTop: '-20px', marginLeft: '-10px'}}>
                    <p style={{whiteSpace: 'pre-wrap', textAlign: 'center'}}>value <br></br> overview </p>
                    <BsArrowRightSquare style ={{marginLeft: '7px'}}/>
                </mui.Button>

                
                <div style ={{textAlign: 'right', marginRight: '100px', marginTop: '12px', marginBottom: '-10px', fontSize: '16px', color: '#4b4950'}}>
                    <text style ={{fontWeight: 'bold'}}>Email: </text>
                    <text>{email_addr}</text>
                </div>
            </div>
        {(Dloading || Hloading || Mloading) &&
        <mui.Backdrop
            sx={{ color: '#ffffff'}}
            open= {true}
        >
            <mui.CircularProgress color="inherit" />
        </mui.Backdrop>
        }
        {!(Dloading || Hloading || Mloading) &&
            <>
            <svg ref = {svgRef} width={width} height={height * 20}>

                <mui.Tooltip enterDelay={100} leaveDelay={500} followCursor arrow id='tooltip'
                    title={ tooltip_text.length <= 0? '' : <p style={{whiteSpace: 'pre-wrap', textAlign: 'center'}}>{tooltip_text}</p> }>
                <g id = "svg_frame">
                </g>
                </mui.Tooltip>
            </svg>
            </>
        }
        </div>
    );
}

export default IndivNumOfRows;