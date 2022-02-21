/* eslint-disable no-loop-func */
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import eval_battery from '../../data_process/eval_dataset/eval_battery.csv';
import eval_data_traffic from '../../data_process/eval_dataset/eval_data_traffic.csv';
import eval_message from '../../data_process/eval_dataset/eval_message.csv';
import eval_call_log from '../../data_process/eval_dataset/eval_call_log.csv';
import './index.css';
import { styled } from '@mui/styles';
import * as mui from '@mui/material';

function ValueOverview() {
    // constants
    const URLsplit = window.document.URL.split('/');
    const user_id = URLsplit[URLsplit.length - 1];
    const email_addr = "iclab.drm" + user_id + "@kse.kaist.ac.kr";
    const xAxisLabel = 'Time';
    const margin = { top: 10, bottom: 15, left: 220, right: 40 };
    const width = 1200;
    const height = 50;
    const minBarWidth = 5;
    const minDistance = 1000 * 60 * 60 * 6;
    const ITEM_HEIGHT = 48;
    const ITEM_PADDING_TOP = 8;
    const MenuProps = {
        PaperProps: {
            style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
            },
        },
    };
    const MySelect = styled(mui.Select)({
        marginRight: '40px',
        width: '150px'
    });


    // global variables
    var bar_cnt = 0;


    // datum type structure
    const datumType = ['BATTERY', 'DATA_TRAFFIC', 'CALL_LOG', 'MESSAGE'];
    // const datumType = ['APP_USAGE_EVENT', 'BATTERY', 'BLUETOOTH', 'CALL_LOG', 'DATA_TRAFFIC',
    //     'DEVICE_EVENT', 'FITNESS', 'EMBEDDED_SENSOR', 'EXTERNAL_SENSOR', 'INSTALLED_APP', 'KEY_LOG',
    //     'LOCATION', 'MEDIA', 'MESSAGE', 'NOTIFICATION', 'PHYSICAL_ACTIVITY',
    //     'PHYSICAL_ACTIVITY_TRANSITION', 'SURVEY', 'WIFI'];
    const category = ['DECIVE_EVENT', 'SOCIAL_INTERACTION'];
    const type_cat = {
        'BATTERY': 'DECIVE_EVENT', 'DATA_TRAFFIC': 'DECIVE_EVENT',
        'CALL_LOG': 'SOCIAL_INTERACTION', 'MESSAGE': 'SOCIAL_INTERACTION'
    }
    const classify = {
        'BATTERY': 'num', 'DATA_TRAFFIC': ['num', 'num'],
        'CALL_LOG': 'cat_b', 'MESSAGE': 'cat_a'
    }
    const colors = {
        'BATTERY': ["#F2BA4E"], 'DATA_TRAFFIC': ['#F3D25B', '#F1CB44'],
        'CALL_LOG': {'INCOMING': "#75b368", 'OUTGOING': "#94C09C", 'MISSED': "#658d61", 'REJECTED': "#bdccb9"},
        'MESSAGE': {'INBOX': "#78925c", 'SENT': "#376830"}
    }
    const colored_field = {
        'BATTERY': ['eval_level'], 'DATA_TRAFFIC': ['eval_rxBytes', 'eval_txBytes'],
        'CALL_LOG': ['eval_type'], 'MESSAGE': ['eval_messagebox']
    }


    // utility methods
    const date_formatter = (raw_date) => {
        raw_date = new Date(raw_date)
        let month = raw_date.getMonth();
        let day = raw_date.getDate();
        let hour = raw_date.getHours();
        let minute = raw_date.getMinutes();

        month = month >= 10 ? month+1 : '0' + month+1;
        day = day >= 10 ? day : '0' + day;
        hour = hour >= 10 ? hour : '0' + hour;
        minute = minute >= 10 ? minute : '0' + minute;

        return raw_date.getFullYear() + '/' + month + '/' + day + ' ' + hour + ':' + minute;
    }


    // event handlers
    const handleRange = (event, newValue, activeThumb) => {
        var adRange = [];

        if (newValue[1] - newValue[0] < minDistance) {
            if (activeThumb === 0) {
                const clamped = Math.min(newValue[0], max_minute - minDistance);
                adRange = [clamped, clamped + minDistance];
            } else {
                newValue[1] = Math.max(newValue[1], min_minute + minDistance);
                const clamped = Math.max(newValue[1], minDistance);
                adRange = [clamped - minDistance, clamped];
            }
        } else {
              adRange = newValue;
        }

        setRange(adRange);
        const start = new Date(adRange[0]);
        const format_start = date_formatter(start);
        const end = new Date(adRange[1]);
        const format_end = date_formatter(end);
        setPeriod(format_start + ' ~ ' + format_end);
    };
    const handleRangeBtn = () => {
        setRangeBtnCnt((rangebtncnt) => rangebtncnt + 1);
    };
    const handleTooltipShow = (event, datum) => {
        var selected = document.getElementById(event.target.id);
        selected.setAttribute("r", 10);
        event.target.style = 'opacity: 0.6';

        var keys = Object.keys(datum);
        keys = keys.filter(function(ele) {
            return ele.includes("eval_");
        })

        var tmp_text = ''
        for (var i = 0; i < keys.length; i ++) {
            if (!(classify[datum.datumType].includes('num') && keys[i] == 'eval_duration')) {
                tmp_text += '\n' + keys[i].replace('eval_', '') + ': ' + datum[keys[i]];
            }
        }
        var type_name = datum.datumType
        if (type_name == 'PHYSICAL_ACTIVITY_TRANSITION') type_name = 'PHYS_ACT_TRANS'
        else if (type_name == 'APP_USAGE_EVENT') type_name = 'APP_USAGE'
        type_name = type_name.replaceAll('_', ' ') + tmp_text + '\nat ';

        var date;
        date = new Date(datum.timestamp);
        
        var formate_date = date_formatter(date);
        type_name += formate_date;

        setTooltip(type_name)
    }
    const handleTooltipHide = (event, datum) => {
        var selected = document.getElementById(event.target.id);
        selected.setAttribute("r", 3);
        event.target.style = 'opacity: 1';
        setTooltip('');
    }

    const handleDatumSelect = (event) => {
        var selected_type = event.target.value;
        if (selected_type == 'ALL') {
            setTypes([... datumType]);
            setKeyCnt(cnt => cnt + 1);
        }
        else if (selected_type == 'NONE') {
            setTypes([]);
            setKeyCnt(cnt => cnt + 1);
        }
        else if (types.includes(selected_type)) {
            setTypes([
                ...types.filter(item => item !== selected_type)
              ]);
            setKeyCnt(cnt => cnt + 1)
        }
        else {
            setTypes([
                ...datumType.filter(item => item == selected_type || types.includes(item))
              ]);
            setKeyCnt(cnt => cnt + 1)
        }
    }


    // use state definition
    const svgRef = useRef();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    var [range, setRange] = useState([0, 0]);
    var [rangebtncnt, setRangeBtnCnt] = useState(0);
    var [period, setPeriod] = useState('');
    var [min_minute, setMinMin] = useState(-1);
    var [max_minute, setMaxMin] = useState(-1);
    var [tooltip_text, setTooltip] = useState('');
    var [keycnt, setKeyCnt] = useState(0);
    var [types, setTypes] = useState([
        'BATTERY', 'DATA_TRAFFIC', 'CALL_LOG', 'MESSAGE']);
    var [cats, setCats] = useState([
        'device_event', 'social_interaction']);

    // use effect

    // load data from csv
    useEffect(()=>{
        var tmp_min = Infinity;
        var tmp_max = -1;

        Promise.all([
            d3.csv(eval_battery),
            d3.csv(eval_data_traffic),
            d3.csv(eval_call_log),
            d3.csv(eval_message)
        ]).then(function(allData) {
            var merged = d3.merge(allData);

            merged = merged.filter(function(row){
                return row.subject_email == email_addr;
            });
            merged.forEach(d => {
                d.timestamp = new Date(parseInt(d.timestamp));
                if (d.timestamp.getTime() < tmp_min) tmp_min = d.timestamp.getTime();
                if (d.timestamp.getTime() > tmp_max) tmp_max = d.timestamp.getTime();
            })

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
            setData(merged);
            setLoading(false);
        });
    }, [])

    // render plots
    useEffect(() => { if (!(loading)) {
        var index = 0;
        var svg = d3.select(svgRef.current);
        const innerWidth = width - margin.right - margin.left;
        const innerHeight = height - margin.top - margin.bottom;
        svg.selectAll(".appended").remove()

        var xValue = d => d.timestamp;
        var intime_data = data.filter(function(row) {
            return row.timestamp >= range[0] && row.timestamp <= range[1];
        });
        const xScale = d3.scaleTime()
            .domain(d3.extent(intime_data, xValue))
            .range([0, innerWidth])
            .nice();

        // iterate for each datum types
        for (var i = 0; i < types.length; i++) {
            const tydata = intime_data.filter(function(row) {
                return row.datumType == types[i];
            });

            var fields = colored_field[types[i]]
            for (var field = 0; field < fields.length; field++) {
                const g = svg.select("#svg_frame")
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + (margin.top + height * index) + ")");
                index += 1;
                svg.attr('height', height * (index + 1))

                const yAxisG = g.append('g').attr("class", "appended");
                yAxisG.selectAll('.domain').remove();
                yAxisG.selectAll('line').attr("stroke", "rgb(187 189 201)");
                yAxisG // datum type name
                    .append('text').attr("class", "appended")
                    .attr('class', 'axis-label')
                    .attr('y', height / 2 - 10)
                    .attr('x', -20)
                    .attr('fill', 'black')
                    .attr('text-anchor', `end`)
                    .style('font-weight', 'bold')
                    .style('font-size', '12px')
                    .text(types[i].replaceAll('_', ' '));
                yAxisG
                    .append('text').attr("class", "appended")
                    .attr('class', 'axis-label')
                    .attr('y', height / 2 + 5)
                    .attr('x', -20)
                    .attr('fill', 'grey')
                    .attr('text-anchor', `end`)
                    .style('font-size', '12px')
                    .text(() => {
                        return fields[field].replace('eval_', '')}
                    );

                var xAixs = d3.axisBottom(xScale).ticks(4).tickSize(-innerHeight).tickPadding(25).tickFormat('');
                const xAxisG = g
                    .append('g').attr("class", "appended")
                    .call(xAixs)
                    .attr('transform', `translate(0, ${innerHeight})`);
                xAxisG.select('.domain').remove();
                xAxisG.selectAll('line').attr("stroke", "rgb(187 189 201)");

                var domain_max = NaN, domain_min = NaN;
                if (classify[types[i]].includes('num')) {
                    domain_max = d3.max(tydata, d => Number(d[fields[field]]))
                    domain_min = d3.min(tydata, d => Number(d[fields[field]]))
                }

                g.append('g').attr("class", "appended")
                    .selectAll("rect")
                    .data(tydata)
                    .enter()
                    .append("rect").attr("class", "appended")
                    .attr("fill", function(d) { 
                        if (classify[types[i]].includes('cat')) {
                            return colors[types[i]][d[fields[field]]];
                        }
                        else if (classify[types[i]].includes('num')) {
                            var myColor = d3.scaleSqrt()
                                .range(["white", colors[types[i]][field]])
                                .domain([domain_min, domain_max])
                            return myColor(d[fields[field]])
                        }
                    })
                    .attr("x", function(d) {
                        return xScale(xValue(d)); })
                    .attr("y",  - margin.top - 2)
                    .attr("width", function(d) { 
                        if (classify[types[i]] == 'cat_a') { return minBarWidth; }
                        else if (classify[types[i]] == 'cat_b' || classify[types[i]] == 'num') {
                            if (d.eval_duration != undefined) {
                                return Math.max(minBarWidth, 1200 * d.eval_duration * 1000 / (range[1] - range[0]));
                            }
                            else return minBarWidth;
                        }
                        else return minBarWidth;
                    })
                    .attr("height", height)
                    .attr("id", function(d) {
                        bar_cnt ++;
                        return ("bar" + bar_cnt);
                    })
                    .on('mouseenter', (event, datum) => handleTooltipShow(event, datum))
                    .on('mouseleave', (event, datum) => handleTooltipHide(event, datum));
                

                svg.append('path').attr('class', 'appended')
                    .attr('width', width)
                    .attr('stroke', 'grey')
                    .attr('stroke-width', '0.5')
                    .attr('d', 'M 210 '+(index * height - 2)+' L'+ width+' '+(index * height - 2))
            }
        }

        // x axis labeling below the plot
        var xAxis = d3.axisBottom(xScale).ticks(4).tickSize(-innerHeight).tickPadding(25);
        const g = svg.select("#svg_frame")
                .append("g").attr('class', 'appended')
                .attr("transform", "translate(" + margin.left + "," + (margin.top + height * (index-1)) + ")");
        const xAxisG = g
            .append("g").attr("class", "appended")
            .call(xAxis)
            .attr('transform', `translate(0, ${innerHeight})`);
        xAxisG.select('.domain').remove();
        xAxisG.selectAll('line').attr("stroke", "rgb(187 189 201)");
        xAxisG.append('text').attr("class", "appended")
            .attr('class', 'axis-label')
            .attr('y', 60)
            .attr('x', innerWidth / 2)
            .attr('fill', 'black')
            .text(xAxisLabel);
        console.log(index)

    }}, [loading, keycnt, min_minute, max_minute, rangebtncnt]);
    
    // render
    return (
        <div className="fragment">
            <div className="title" style ={{width: '1200px', textAlign: 'center', marginLeft: '-20px'}}>
                <h1>One User's Value Overview along Time</h1>


                <mui.FormControl style ={{marginTop: '15px', marginRight: '10px'}}>
                    <mui.InputLabel id="multiple-type-label">Type</mui.InputLabel>
                    <MySelect
                        labelId="multiple-type-label"
                        id="typeselect"
                        label="Type"
                        value={types}
                        onChange={handleDatumSelect}
                        input={<mui.OutlinedInput label="Tag" />}
                        renderValue={ (selected) =>
                                types.length == datumType.length
                                ? '(ALL)'
                                : selected.join(', ').replaceAll('_', ' ').toUpperCase()
                            }
                        MenuProps={MenuProps}
                    >
                        <mui.MenuItem
                            value={'ALL'}
                            key={'ALL'}
                            >
                            <mui.Checkbox checked={types.length == datumType.length} />
                            <mui.ListItemText primary={'(ALL)'} />
                        </mui.MenuItem>
                        <mui.MenuItem
                            value={'NONE'}
                            key={'NONE'}
                            >
                            <mui.Checkbox checked={types.length == 0} />
                            <mui.ListItemText primary={'(NONE)'} />
                        </mui.MenuItem>
                    {datumType.map(element => (
                        <mui.MenuItem
                            value={element}
                            key={element}
                            >
                            <mui.Checkbox checked={types.indexOf(element) > -1} />
                            <mui.ListItemText primary={element.replaceAll('_', ' ').toUpperCase()} />
                        </mui.MenuItem>
                    ))}
                    </MySelect>
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
                
                <div style ={{textAlign: 'right', marginTop: '12px', marginBottom: '-10px', fontSize: '16px', color: '#4b4950'}}>
                    <text style ={{fontWeight: 'bold'}}>Email: </text>
                    <text>{email_addr}</text>
                </div>
            </div>
        {(loading) &&
        <mui.Backdrop
            sx={{ color: '#ffffff'}}
            open= {true}
        >
            <mui.CircularProgress color="inherit" />
        </mui.Backdrop>
        }
        {!(loading) &&
            <>
            <svg ref = {svgRef} width={width} height={height}>

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

export default ValueOverview;