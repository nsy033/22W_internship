/* eslint-disable no-loop-func */
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import eval_battery from '../../data_process/eval_dataset/eval_battery.csv';
import eval_data_traffic from '../../data_process/eval_dataset/eval_data_traffic.csv';
import eval_message from '../../data_process/eval_dataset/eval_message.csv';
import eval_call_log from '../../data_process/eval_dataset/eval_call_log.csv';
import eval_location from '../../data_process/eval_dataset/eval_location.csv';
import eval_physical_activity_transition from '../../data_process/eval_dataset/eval_physical_activity_transition.csv';
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
    const legend_width = 200;
    const height = 50;
    const minBarWidth = 4;
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
    const datumType = ['BATTERY', 'DATA_TRAFFIC', 'CALL_LOG', 'MESSAGE', 'LOCATION', 'PHYSICAL_ACTIVITY_TRANSITION'];
    // const datumType = ['APP_USAGE_EVENT', 'BATTERY', 'BLUETOOTH', 'CALL_LOG', 'DATA_TRAFFIC',
    //     'DEVICE_EVENT', 'FITNESS', 'EMBEDDED_SENSOR', 'EXTERNAL_SENSOR', 'INSTALLED_APP', 'KEY_LOG',
    //     'LOCATION', 'MEDIA', 'MESSAGE', 'NOTIFICATION', 'PHYSICAL_ACTIVITY',
    //     'PHYSICAL_ACTIVITY_TRANSITION', 'SURVEY', 'WIFI'];
    const category = ['SMARTPHONE_USAGE', 'SOCIAL_INTERACTION', 'PHYSICAL_ACTIVITY'];
    const type_cat = {
        'BATTERY': 'SMARTPHONE_USAGE', 'DATA_TRAFFIC': 'SMARTPHONE_USAGE',
        'CALL_LOG': 'SOCIAL_INTERACTION', 'MESSAGE': 'SOCIAL_INTERACTION',
        'LOCATION': 'PHYSICAL_ACTIVITY', 'PHYSICAL_ACTIVITY_TRANSITION': 'PHYSICAL_ACTIVITY'
    }
    const cat_type = {
        'SMARTPHONE_USAGE': ['BATTERY', 'DATA_TRAFFIC'],
        'SOCIAL_INTERACTION': ['CALL_LOG', 'MESSAGE'],
        'PHYSICAL_ACTIVITY': ['LOCATION', 'PHYSICAL_ACTIVITY_TRANSITION']
    }
    const classify = {
        'BATTERY': ['num'], 'DATA_TRAFFIC': ['num', 'num'],
        'CALL_LOG': ['cat_b'], 'MESSAGE': ['cat_a'],
        'LOCATION': ['num'], 'PHYSICAL_ACTIVITY_TRANSITION': ['cat_a']
    }
    const cat_colors = {
        'SMARTPHONE_USAGE': "#F2BA4E", 'SOCIAL_INTERACTION': '#5ea280', 'PHYSICAL_ACTIVITY': '#2688AC'
    }
    const colors = {
        'BATTERY': ["#F2BA4E"], 'DATA_TRAFFIC': ['#F3D25B', '#F1CB44'],
        'CALL_LOG': {'MISSED': "#91d5b3", 'INCOMING': "#76CBA1", 'OUTGOING': "#5ea280", 'REJECTED': "#3b6550"},
        'MESSAGE': {'INBOX': "#65c97d", 'SENT': "#257037"}, 'LOCATION': ["#2688AC"], 
        'PHYSICAL_ACTIVITY_TRANSITION': {
            'STILL': '#cfe2f3', 'TILTING': '#9fc5e8', 'WALKING': '#6fa8dc',
            'RUNNING': '#3d85c6', 'ON_BICYCLE': '#0b5394', 'IN_VEHICLE': '#073763'}
    }
    const colored_field = {
        'BATTERY': ['eval_level'], 'DATA_TRAFFIC': ['eval_txBytes', 'eval_rxBytes'],
        'CALL_LOG': ['eval_type'], 'MESSAGE': ['eval_messagebox'],
        'LOCATION': ['eval_speed'], 'PHYSICAL_ACTIVITY_TRANSITION': ['eval_type']
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
        if (selected_type == '(ALL)') {
            setTypes([... datumType]); setCats([... category]);
            
        }
        else if (selected_type == '(NONE)') {
            setTypes([]); setCats([]);
        }
        else if (types.includes(selected_type)) {
            setTypes([ ...types.filter(item => item !== selected_type) ]);
            setCats([...cats.filter(item => item !== type_cat[selected_type])]);
        }
        else {
            setTypes([ ...datumType.filter(item => item == selected_type || types.includes(item)) ]);
            var tmp_types = [ ...datumType.filter(item => item == selected_type || types.includes(item)) ];
            var flag = new Array(category.length).fill(0);
            for(var i = 0; i < tmp_types.length; i++) {
                flag[category.indexOf(type_cat[tmp_types[i]])]++;
            }
            const tmp_index = category.indexOf(type_cat[selected_type])
            if (flag[tmp_index] == cat_type[category[tmp_index]].length) {
                setCats([ ...category.filter(item => cats.includes(item) || item == type_cat[selected_type]) ]);
            }
        }
        setKeyCnt(cnt => cnt + 1);
    }
    const handleCatSelect = (event) => {
        var selected_cat = event.target.value;
        if (selected_cat == '(ALL)') {
            setTypes([... datumType]);
            setCats([... category]);
        }
        else if (selected_cat == '(NONE)') {
            setTypes([]);
            setCats([]);
        }
        else if (cats.includes(selected_cat)) {
            setTypes([ ...types.filter(item => type_cat[item] !== selected_cat) ]);
            setCats([ ...cats.filter(item => item !== selected_cat) ]);
        }
        else {
            setTypes([ ...datumType.filter(item => type_cat[item] == selected_cat || types.includes(item)) ]);
            setCats([ ...category.filter(item => item == selected_cat || cats.includes(item)) ]);
        }
        setKeyCnt(cnt => cnt + 1);
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
        'BATTERY', 'DATA_TRAFFIC', 'CALL_LOG', 'MESSAGE', 'LOCATION', 'PHYSICAL_ACTIVITY_TRANSITION']);
    var [cats, setCats] = useState([
        'SMARTPHONE_USAGE', 'SOCIAL_INTERACTION', 'PHYSICAL_ACTIVITY']);

    // use effect

    // load data from csv
    useEffect(()=>{
        var tmp_min = Infinity;
        var tmp_max = -1;

        Promise.all([
            d3.csv(eval_battery),
            d3.csv(eval_data_traffic),
            d3.csv(eval_call_log),
            d3.csv(eval_message),
            d3.csv(eval_location),
            d3.csv(eval_physical_activity_transition)
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

        var cat_flag = "";
        // iterate for each datum types
        for (var i = 0; i < types.length; i++) {
            const this_type = data.filter((row) => { return row.datumType == types[i]; });
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

                if (!cat_flag.includes(type_cat[types[i]])) {
                    cat_flag += type_cat[types[i]] + ' ';
                    // category name box
                    yAxisG
                        .append('g').attr("class", "appended").attr('id', 'categoryBox')
                    yAxisG.select('#categoryBox')
                        .append('text').attr("class", "appended")
                        .attr('fill', 'black').attr('text-anchor', 'center')
                        .attr('x', -200).attr('y', 3)
                        .style('font-size', '10px')
                        .text(() => { return type_cat[types[i]].replace('_', ' ')} )
                    yAxisG.select('#categoryBox')
                        .append('rect').attr("class", "appended")
                        .attr('x', -210).attr('y', height / 2 - 34).attr('height', '15px').attr('rx', 7).attr('ry', 7)
                        .attr('width', () => {
                            return Number(yAxisG.selectAll('text')._groups[0][0].textLength.baseVal.valueAsString) + 18})
                        .attr('fill', 'transparent').style('stroke', cat_colors[type_cat[types[i]]]).style('stroke-width', '2px')
                }
                yAxisG // datum type name
                    .append('text').attr("class", "appended")
                    .attr('x', -15).attr('y', height / 2 - 5)
                    .attr('fill', 'black').attr('text-anchor', `end`)
                    .style('font-size', '12px').style('font-weight', 'bold')
                    .text(types[i].replaceAll('_', ' '));
                yAxisG // field name
                    .append('text').attr("class", "appended")
                    .attr('x', -15).attr('y', height / 2 + 10)
                    .attr('fill', 'grey').attr('text-anchor', `end`)
                    .style('font-size', '12px')
                    .text(() => { return fields[field].replace('eval_', '')} );

                var xAixs = d3.axisBottom(xScale).ticks(4).tickSize(-innerHeight).tickPadding(25).tickFormat('');
                const xAxisG = g
                    .append('g').attr("class", "appended")
                    .call(xAixs)
                    .attr('transform', `translate(0, ${innerHeight})`);
                xAxisG.select('.domain').remove();
                xAxisG.selectAll('line').attr("stroke", "rgb(187 189 201)");
                
                const max_val = d3.max(this_type, d => Number(d[fields[field]]));
                const min_val = d3.min(this_type, d => Number(d[fields[field]]));
                
                g.append('g').attr("class", "appended")
                    .selectAll("rect")
                    .data(tydata)
                    .enter()
                    .append("rect").attr("class", "appended").attr('r', 0)
                    .attr("fill", function(d) { 
                        if (classify[types[i]][field].includes('cat')) {
                            return colors[types[i]][d[fields[field]]];
                        }
                        else if (classify[types[i]][field].includes('num')) {
                            if(types[i] == 'LOCATION') console.log()

                            var myColor
                            if (max_val - min_val > 10000) myColor = d3.scaleLog();
                            else myColor = d3.scaleLinear();
                            myColor
                                .range(["white", colors[types[i]][field]])
                                .domain([1, max_val])
                            return myColor(d[fields[field]])
                        }
                    })
                    .attr("x", function(d) {
                        return xScale(xValue(d)); })
                    .attr("y",  - margin.top - 2)
                    .attr("width", function(d) { 
                        if (classify[types[i]][field] == 'cat_a') { return minBarWidth; }
                        else if (classify[types[i]][field] == 'cat_b' || classify[types[i]][field] == 'num') {
                            if (d.eval_duration != undefined) {
                                let val = Math.max(minBarWidth, 1200 * d.eval_duration * 1000 / (range[1] - range[0]));
                                let xpos = xScale(xValue(d))
                                if (xpos + val > 980) return 980 - xpos;
                                else return val;
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

                if (classify[types[i]][field].includes('num')) {
                    const new_group = g.append('g').attr("class", "appended")
                    const myColor = d3.scaleLinear()
                        .range(["white", colors[types[i]][field]])
                        .domain([0, 22]);

                    for (var j = 0; j < 23; j++) {
                        new_group
                            .append("rect").attr("class", "appended").attr('r', 0)
                            .attr("fill", myColor(j))
                            .attr("x", 990).attr("y",  - margin.top + ((22 - j) * 2))
                            .attr("width", 10).attr("height", 2);
                        new_group
                            .append("rect").attr("class", "appended").attr('r', 0)
                            .attr("fill", 'transparent').attr("stroke", '#bcbcbc')
                            .attr("x", 990).attr("y",  - margin.top)
                            .attr("width", 10).attr("height", height - 4);
                        new_group
                            .append("text").attr("class", "appended")
                            .attr("fill", '#5b5b5b')
                            .attr("x", 1005).attr("y",  - margin.top + (12 * 0) + 9)
                            .attr('font-size', '9px').attr('font-weight', 'lighter')
                            .text(() => {return max_val.toLocaleString()});
                        new_group
                            .append("text").attr("class", "appended")
                            .attr("fill", '#5b5b5b')
                            .attr("x", 1005).attr("y",  - margin.top + (12 * 3) + 9)
                            .attr('font-size', '9px').attr('font-weight', 'lighter')
                            .text(() => {return min_val.toLocaleString()});
                    }
                } else {
                    const new_group = g.append('g').attr("class", "appended")
                    const cat_values = Object.keys(colors[types[i]])
                    for (var j = 0; j < cat_values.length; j++) {
                        new_group
                            .append("rect").attr("class", "appended").attr('r', 0)
                            .attr("fill", colors[types[i]][cat_values[j]])
                            .attr("x", 990 + 65 * Math.trunc((j)/4)).attr("y",  - margin.top + (12 * (j%4)))
                            .attr("width", 10).attr("height", 10);
                        new_group
                            .append("text").attr("class", "appended")
                            .attr("fill", '#5b5b5b')
                            .attr("x", 1005 + 65 * Math.trunc((j)/4)).attr("y",  - margin.top + (12 * (j%4)) + 8)
                            .attr('font-size', '9px').text(cat_values[j]);
                    }
                }

                svg.append('path').attr('class', 'appended')
                    .attr('width', width)
                    .attr('stroke', 'grey')
                    .attr('stroke-width', '0.5')
                    .attr('d', 'M 220 '+(index * height - 2)+' L'+ width+' '+(index * height - 2))
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
    }}, [loading, keycnt, min_minute, max_minute, rangebtncnt]);
    
    // render
    return (
        <div className="fragment">
            <div className="title" style ={{width: '1200px', textAlign: 'center', marginLeft: '-12px'}}>
                <h1 style ={{marginBottom: '30px'}}>One User's Value Overview along Time</h1>

                <mui.FormControl style ={{marginLeft: '140px'}}>
                    <mui.InputLabel id="multiple-type-label">Category</mui.InputLabel>
                    <MySelect
                        labelId="multiple-type-label"
                        id="catselect"
                        label="Category"
                        defaultValue='none'
                        onChange={handleCatSelect}
                        input={<mui.OutlinedInput label="Tag" />}
                        renderValue={ () =>
                                cats.length == category.length
                                ? '(ALL)'
                                : cats.toString().replaceAll('_', ' ').toUpperCase()
                            }
                        MenuProps={MenuProps}
                    >
                        <mui.MenuItem
                            value={'(ALL)'}
                            key={'(ALL)'}
                            >
                            <mui.Checkbox checked={cats.length == category.length} />
                            <mui.ListItemText primary={'(ALL)'} />
                        </mui.MenuItem>
                        <mui.MenuItem
                            value={'(NONE)'}
                            key={'(NONE)'}
                            >
                            <mui.Checkbox checked={cats.length == 0} />
                            <mui.ListItemText primary={'(NONE)'} />
                        </mui.MenuItem>
                    <mui.MenuItem value={'none'} key={'none'} selected disabled hidden/>
                    {category.map(element => (
                        <mui.MenuItem
                            value={element}
                            key={element}
                            >
                            <mui.Checkbox checked={cats.indexOf(element) > -1} />
                            <mui.ListItemText primary={element.replaceAll('_', ' ').toUpperCase()} />
                        </mui.MenuItem>
                    ))}
                    </MySelect>
                </mui.FormControl>

                <mui.FormControl style ={{marginRight: '10px'}}>
                    <mui.InputLabel id="multiple-type-label">Type</mui.InputLabel>
                    <MySelect
                        labelId="multiple-type-label"
                        id="typeselect"
                        label="Type"
                        defaultValue='none'
                        onChange={handleDatumSelect}
                        input={<mui.OutlinedInput label="Tag" />}
                        renderValue={ () =>
                                types.length == datumType.length
                                ? '(ALL)'
                                : types.toString().replaceAll('_', ' ').toUpperCase()
                            }
                        MenuProps={MenuProps}
                    >
                        <mui.MenuItem
                            value={'(ALL)'}
                            key={'(ALL)'}
                            >
                            <mui.Checkbox checked={types.length == datumType.length} />
                            <mui.ListItemText primary={'(ALL)'} />
                        </mui.MenuItem>
                        <mui.MenuItem
                            value={'(NONE)'}
                            key={'(NONE)'}
                            >
                            <mui.Checkbox checked={types.length == 0} />
                            <mui.ListItemText primary={'(NONE)'} />
                        </mui.MenuItem>
                    <mui.MenuItem value={'none'} key={'none'} selected disabled hidden/>
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
                
                <div style ={{marginTop: '12px', marginBottom: '-10px', textAlign: 'right', fontSize: '16px', color: '#4b4950'}}>
                    <span style ={{fontWeight: 'bold'}}>Email: </span>
                    <span>{email_addr}</span>
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
            <svg ref = {svgRef} width={width + legend_width} height={height}>

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