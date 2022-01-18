import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import daily_rowcount_res from './daily_rowcount_res.csv';
import './index.css';
import { styled } from '@mui/styles';
import * as mui from '@mui/material';

////   To get the rowcount_res.csv   ////
// 0. check the folder named 'data_process'
// 1. query.py -> get raw data csv file for each indivitual datumtype -> [datumTypeName].csv
//    -> there should be a folder named 'dataset' which contains [datumTypeName].csv files to proceed to the next step
//       but I gitignored because of the large file size
// 2. extract_cnt.py -> intermediate data process -> date_cnt.csv
// 3. daily_rowcount.py
//    -> format the file in order to use it to make the horizontal staked bar, daily number of rows for each users
//    -> daily_rowcount_res.csv

function DailyNumOfRows() {
    // constants
    const margin = {top: 20, right: 20, bottom: 50, left: 230};
    const entire_keys = [
        'app_usage', 'battery', 'bluetooth', 'call_log', 'data_traffic',
        'device_event', 'embedded_sensor', 'external_sensor', 'fitness', 'installed_app',
        'key_log', 'location', 'media', 'message', 'notification', 'physical_activity',
        'physical_activity_transition', 'survey', 'wifi'];
    const MyRadio = styled(mui.RadioGroup)({
        marginRight: '20px',
    });
    const MySelect = styled(mui.Select)({
        marginRight: '40px',
        width: '150px'
    });
    
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
    const color_set = ["#5779A3", "#E1EDF6", "#E59243", "#F6C087", "#6B9E58",
                        "#9BCE86", "#B39A44", "#ECCE74", "#5F9794", "#91BAB6",
                        "#D1605E", "#F2A19D", "#77706E", "#B8B0AC", "#C67593",
                        "#F1C2D1", "#A87D9F", "#D2B6A8", "#7ECBCB"]
    const date_formatter = (raw_date) => {
        let month = raw_date.getMonth() + 1;
        let day = raw_date.getDate();

        month = month >= 10 ? month : '0' + month;
        day = day >= 10 ? day : '0' + day;

        return raw_date.getFullYear() + '/' + month + '/' + day;
    }
    // variables
    var bar_cnt = 0;
    var x = d3.scaleLinear();
    var y = d3.scaleBand()
        .paddingInner(0.05)
        .align(0.1);
    var z = d3.scaleOrdinal()
        .range(color_set);

    // event handlers
    const handleToAscending = () => {
        setOrdering(true)
    }
    const handleToDescending = () => {
        setOrdering(false)
    }
    const handleDate = (event) => {
        setDay(event.target.value);
        setRangeBtnCnt(0);
        setRange([0, 0]);
    }
    const handleTooltipShow = (event, datum) => {
        var tmp_text = datum.data.email + '\n' + String(datum[1] - datum[0]);
        tmp_text = tmp_text + ' row(s) of ';
        const bar_color = event.toElement.parentNode.attributes.fill.nodeValue;
        var type_name = entire_keys[color_set.indexOf(bar_color)]
        if (type_name == 'physical_activity_transition') type_name = 'PHYS_ACT_TRANS'
        tmp_text += type_name.replaceAll('_', ' ').toUpperCase();
        setTooltip(tmp_text)
        var selected_bar = document.getElementById(event.toElement.id);
        selected_bar.style = 'opacity: 0.6';
    }
    const handleTooltipHide = (event, datum) => {
        var selected_bar = document.getElementById(event.fromElement.id);
        selected_bar.style = 'opacity: 1';
    }
    const handleDatumType = (event, datum) => {
        var selected_legend = document.getElementById(event.target.id);
        if (keys.includes(selected_legend.id)) {
            selected_legend.style.opacity = '0.3';
            selected_legend.style.fill = 'grey';

            setKeys([
                ...keys.filter(item => item !== selected_legend.id)
              ]);
            setKeyCnt(cnt => cnt + 1)
        }
        else {
            selected_legend.style = 'opacity: 1';

            setKeys([
                ...keys,
                selected_legend.id
              ].sort());
            setKeyCnt(cnt => cnt + 1)
        }
    }
    const handleDatumSelect = (event) => {
        var selected_type = event.target.value;
        if (keys.includes(selected_type)) {
            setKeys([
                ...keys.filter(item => item !== selected_type)
              ]);
            setKeyCnt(cnt => cnt + 1)
        }
        else {
            setKeys([
                ...keys,
                selected_type
              ].sort());
            setKeyCnt(cnt => cnt + 1)
        }
    }
    const handleEmail = (event, datum) => {
        // console.log(datum.split('drm')[1].split('@')[0]);
        window.open(window.document.URL + 'indiv/' + String(datum.split('drm')[1].split('@')[0]))
    }
    const handleRange = (event, newValue) => {
        setRange(newValue);
    };
    const handleRangeBtn = () => {
        setRangeBtnCnt((rangebtncnt) => rangebtncnt + 1);
    };

    // usestate
    const svgRef = useRef();
    const [data, setData] = useState([]);
    var [dayset, setDaySet] = useState([]);
    var [loading, setLoading] = useState(true);
    var [ordering, setOrdering] = useState(true);
    var [day, setDay] = useState('');
    var [range, setRange] = useState([0, 0]);
    var [max_total, setMaxTotal] = useState(0);
    var [rangebtncnt, setRangeBtnCnt] = useState(0);
    var [tooltip_text, setTooltip] = useState('');
    var [keycnt, setKeyCnt] = useState(0);
    var [keys, setKeys] = useState([
        'app_usage', 'battery', 'bluetooth', 'call_log', 'data_traffic',
        'device_event', 'embedded_sensor', 'external_sensor', 'fitness', 'installed_app',
        'key_log', 'location', 'media', 'message', 'notification', 'physical_activity',
        'physical_activity_transition', 'survey', 'wifi']);

    // useeffect
    useEffect(()=>{
        d3.csv(daily_rowcount_res).then(function(data) {
            var tmp_dayset = []
            var min_day = ''
            data.forEach(row => {
                if (min_day == '' || Date(min_day) > Date(row['day'])) {
                    min_day = row['day']
                }
                if (!tmp_dayset.includes(row['day'])) tmp_dayset.push(row['day'])
            });

            setDaySet(tmp_dayset);
            setData(data);
            setLoading(false);
            setDay(min_day);
        });
    }, [])

    useEffect(() => { if (!loading) {
        var day_data = data.filter(row => {
            return row['day'] == day
        });

        var tmp_max = 0;
        var i = 0, j = 0;
        for (i = 0; i < day_data.length; i++) {
            var total = 0;
            for (j = 0; j < keys.length; j++) {
                total += Number(day_data[i][keys[j]])
            }
            day_data[i].total = total
            if(tmp_max < day_data[i].total) tmp_max = day_data[i].total;
        }
        if (rangebtncnt > 0) {
            day_data=day_data.filter((ele) => {
                return ele.total >= range[0] && ele.total <= range[1]
            })
            setRange([range[0], range[1]]);
        } else setRange([range[0], tmp_max]);
        setMaxTotal(tmp_max)

        day_data.sort(function(a, b) { 
            if(ordering) return b.total - a.total;
            else return a.total - b.total;
        });
        
        x.domain([0, d3.max(day_data, function(d) { return d.total; })]).nice();
        y.domain(day_data.map(function(d) { return d.email; }));
        z.domain(entire_keys);

        const svg = d3.select(svgRef.current);
        svg.attr("height", day_data.length * 25);
        // svg.attr("height", Math.max(day_data.length * 25, 400));
        const width = svg.attr("width") - margin.left - margin.right;
        const height = svg.attr("height");
        var g = svg.select("#svg_frame").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        svg.select("#svg_frame").selectAll(".appended").remove()

        // define the line
        var valueline = d3.line()
            .x(function(d) { return x(d.total); })
            .y(function(d) { return y(d.email); });
        // gridlines in x axis function
        function make_x_gridlines() {		
            return d3.axisBottom(x)
                .ticks(5)
        }

        x.rangeRound([0, width-200]);
        y.rangeRound([0, height]);

        g.select("#xgrid")
        .attr("transform", "translate(0," + height + ")")
            .call(make_x_gridlines()
                .tickSize(-height)
                .tickFormat("")
            ).style("color", "rgb(187 189 201)")

        g.select("#chart")
            .selectAll("g")
            .data(d3.stack().keys(keys.reverse())(day_data))
            .enter()
            .append("g").attr("class", "appended")
            .attr("fill", function(d) { return z(d.key); })
            .selectAll("rect")
            .data(function(d) { 
                return d; })
            .enter()
            .append("rect").attr("class", "appended")
            .attr("x", function(d) { return x(d[0]); })
            .attr("y", function(d) { return y(d.data.email); })
            .attr("width", function(d) { return x(d[1]) - x(d[0]); })
            .attr("height", 22)
            .attr("id", function(d) {
                bar_cnt++;
                return ("bar"+bar_cnt);
            });
        keys.reverse();

        g.select("#chart")
            .selectAll("rect")
            .on('mouseenter', (event, datum) => handleTooltipShow(event, datum))
            .on('mouseleave', (event, datum) => handleTooltipHide(event, datum));

        g.select("#xaxis_t")
            .attr("transform", "translate(0,0)")
            .call(d3.axisTop(x).ticks(null, "s"))
        g.select("#xaxis_b")
            .attr("transform", "translate(0,"+height+")")
            .call(d3.axisBottom(x).ticks(null, "s"))

        g.select("#yaxis")
            .attr("transform", "translate(0,0)")
            .call(d3.axisLeft(y))
            .selectAll('text')
            .attr("x", -10)
            .on('click', (event, datum) => handleEmail(event, datum));

        var legend = g.select("#legend")
            .selectAll("g")
            .data(entire_keys.slice())
            .enter()
            .append("g").attr("class", "appended")
            .attr("transform", function(d, i) { return "translate(-50," + (i * 20) + ")"; });

        legend.append("rect").attr("class", "appended")
            .attr("x", width - 19)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", z)
            .attr("id", (d) => {return ""+d})
            .style("opacity", (d) => {
                if(keys.includes(d)) return "1"
                else return "0.3"
            })
            .on('click', (event, datum) => handleDatumType(event, datum));

        legend.append("text").attr("class", "appended")
            .attr("text-overflow", "ellipsis")
            .attr("x", width - 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .attr("id", (d) => {return ""+d})
            .text(function(d) { 
                if(d=='physical_activity_transition') return "phys act trans".toUpperCase()
                else return d.replace("_", " ").toUpperCase();
            })
            .style("font-size", "13px")
            .on('click', (event, datum) => handleDatumType(event, datum));
        
        svg.attr("height", Math.max(400, day_data.length * 25 + 80));
    }}, [loading, keycnt, ordering, day, rangebtncnt, max_total]);

    // render
    return (
        <div className="fragment">
            <div className="title" style ={{width: '1300px', textAlign: 'center', marginLeft: '-80px'}}>
                <h1>Daily Row Counts of Users</h1>

                <mui.FormControl component="fieldset"  style ={{marginTop: '15px'}}>
                    <mui.FormLabel component="legend">Sort Type Selection</mui.FormLabel>
                    <MyRadio row aria-label="sorting" name="row-radio-buttons-group">
                        <mui.FormControlLabel value="Ascending" control={<mui.Radio />} checked={ordering} onChange={handleToAscending} label="Ascending" />
                        <mui.FormControlLabel value="Descending" control={<mui.Radio />} checked={!ordering} onChange={handleToDescending} label="Descending" />
                    </MyRadio>
                </mui.FormControl>
                
                <mui.FormControl style ={{marginTop: '15px'}}>
                    <mui.InputLabel id="dayselect-label">Date</mui.InputLabel>
                    <MySelect
                        labelId="dayselect-label"
                        id="dayselect"
                        label="Date"
                        value={day}
                        onChange={handleDate}
                    >
                    {dayset.map(element => (
                        <mui.MenuItem
                            value={element + ""}
                            key={element + ""}
                            >
                            {date_formatter(new Date(2000 + Number(element.split('-')[2]), element.split('-')[1], element.split('-')[0]))}
                        </mui.MenuItem>
                    ))}
                    </MySelect>
                </mui.FormControl>
                
                <mui.FormControl style ={{marginTop: '15px'}}>
                    <mui.InputLabel id="multiple-type-label">Type</mui.InputLabel>
                    <MySelect
                        labelId="multiple-type-label"
                        id="typeselect"
                        label="Type"
                        value={keys}
                        onChange={handleDatumSelect}
                        input={<mui.OutlinedInput label="Tag" />}
                        renderValue={(selected) => selected.join(', ').replaceAll('_', ' ').toUpperCase()}
                        MenuProps={MenuProps}
                    >
                    {entire_keys.map(element => (
                        <mui.MenuItem
                            value={element}
                            key={element}
                            >
                            <mui.Checkbox checked={keys.indexOf(element) > -1} />
                            <mui.ListItemText primary={element.replaceAll('_', ' ').toUpperCase()} />
                        </mui.MenuItem>
                    ))}
                    </MySelect>
                </mui.FormControl>

                <mui.FormControl sx={{ width: 300 }}>
                    <mui.FormLabel component="legend">Current Range Set: {range[0]} ~ {range[1]}</mui.FormLabel>
                    <mui.Slider
                        min={0}
                        step={10}
                        max={max_total}
                        getAriaLabel={() => 'Total Row Count Range'}
                        value={range}
                        onChange={handleRange}
                        getAriaValueText= {(value) => {return String(value)}}
                        valueLabelDisplay="auto"
                    />
                    <mui.Button size="small" variant="text" onClick={handleRangeBtn}>Apply_Range_Setting</mui.Button>
                </mui.FormControl>
            </div>
            {loading && <h2>Loding ...</h2>}
            {!loading &&
                <>
                <svg ref = {svgRef} width="1300">
                    <g id = "svg_frame">
                        <g id = "xgrid" className = "grid"/>
                        <g id = "ygrid" className = "grid"/>
                        <mui.Tooltip enterDelay={100} followCursor arrow
                            title={ tooltip_text.length <= 0? '' : <p style={{whiteSpace: 'pre-wrap', textAlign: 'center'}}>{tooltip_text}</p> }>
                        <g id = "chart"/>
                        </mui.Tooltip>
                        <g id = "xaxis_t" className = "axis"/>
                        <g id = "xaxis_b" className = "axis"/>
                        <g id = "yaxis" className = "axis"/>
                        <g id = "legend" fontFamily = "sans-serif" fontSize = "10" textAnchor = "end"/>
                        <g id = "tooltip" className="tooltip" opacity="0" pointerEvents="none">
                            <text id = "tooltip_value" fontFamily="sans-serif" fontSize="13px" fill="black"></text>
                        </g>
                    </g>
                </svg>
                </>
            }
        </div>
    );
}

export default DailyNumOfRows;