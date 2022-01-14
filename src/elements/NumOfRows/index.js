import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import rowcount_res from './rowcount_res.csv';
import './index.css';

////   To get the rowcount_res.csv   ////
// 0. check the folder named 'data_process'
// 1. query.py -> get raw data csv file for each indivitual datumtype -> [datumTypeName].csv
//    -> there should be a folder named 'dataset' which contains [datumTypeName].csv files to proceed to the next step
//       but I gitignored because of the large file size
// 2. merge_dataframe.py -> intermediate data process -> merged_df.csv
// 3. num_of_rows_formatting.py
//    -> format the file in order to use it to make the horizontal staked bar, daily number of rows for each users
//    -> rowcount_res.csv

function NumOfRows() {
    const svgRef = useRef();
    const [data, setData] = useState([]);
    var [loading, setLoading] = useState(true);
    var [ordering, setOrdering] = useState(true);
    var [day, setDay] = useState('');
    var [keycnt, setKeyCnt] = useState(0);
    var [keys, setKeys] = useState([
        'app_usage', 'battery', 'bluetooth', 'call_log', 'data_traffic',
        'device_event', 'external_sensor', 'fitness', 'installed_app', 'key_log',
        'location', 'media', 'message', 'notification', 'physical_activity',
        'physical_activity_transition', 'survey', 'wifi'].reverse());

    const margin = {top: 20, right: 20, bottom: 50, left: 200};
    const entire_keys = [
        'app_usage', 'battery', 'bluetooth', 'call_log', 'data_traffic',
        'device_event', 'external_sensor', 'fitness', 'installed_app', 'key_log',
        'location', 'media', 'message', 'notification', 'physical_activity',
        'physical_activity_transition', 'survey', 'wifi'].reverse();

    var bar_cnt = 0;

    var x = d3.scaleLinear();
    var y = d3.scaleBand()
        .paddingInner(0.05)
        .align(0.1);
    var z = d3.scaleOrdinal()
        .range(["#5779A3", "#E1EDF6", "#E59243", "#F6C087", "#6B9E58",
                "#9BCE86", "#B39A44", "#ECCE74", "#5F9794", "#91BAB6",
                "#D1605E", "#F2A19D", "#77706E", "#B8B0AC", "#C67593",
                "#F1C2D1", "#A87D9F", "#D2B6A8", "#7ECBCB"].reverse());

    const onMouseEnter = (event, datum) => {
        var tooltip = d3.select("#tooltip");
        tooltip.select("#tooltip_value")
            .attr("x", x((datum[1]+datum[0])/2))
            .attr("y", y(datum.data.email) + y.bandwidth())
            .attr("transform", "translate(0, -" + y.bandwidth()/4 + ")")
            .text(datum[1] - datum[0]);
        var selected_bar = document.getElementById(event.toElement.id);
        selected_bar.style = 'opacity: 0.6';
        tooltip.style("opacity", 1);
    }
    const onMouseLeave = (event, datum) => {
        var tooltip = d3.select("#tooltip");
        tooltip.style("opacity", 0);
        var selected_bar = document.getElementById(event.fromElement.id);
        selected_bar.style = 'opacity: 1';
    }
    const onMouseClick = (event, datum) => {
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
              ].sort().reverse());
            setKeyCnt(cnt => cnt + 1)
        }
    }

    useEffect(()=>{
        d3.csv(rowcount_res).then(function(data) {
            var dayset = []
            var dayselect = document.getElementById("dayselect");
            var min_day = ''
            data.forEach(row => {
                if (min_day == '' || Date(min_day) > Date(row['day'])) {
                    min_day = row['day']
                }
                if (!dayset.includes(row['day'])) dayset.push(row['day'])
            });

            for(var i = 0; i < dayset.length; i++) {
                var opt = document.createElement('option');
                opt.value = dayset[i];
                opt.innerHTML = dayset[i];
                dayselect.append(dayset[i], opt)
            }

            setData(data);
            setLoading(false);
            setDay(min_day);
        });
    }, [])

    useEffect(() => { if (!loading) {
        var day_data = data.filter(row => {
            return row['day'] == day
        });

        var i = 0, j = 0;
        for (i = 0; i < day_data.length; i++) {
            var total = 0;
            for (j = 0; j < keys.length; j++) {
                total += Number(day_data[i][keys[j]])
            }
            day_data[i].total = total
        }
        day_data.sort(function(a, b) { 
            if(ordering) return b.total - a.total;
            else return a.total - b.total;
        });
        
        x.domain([0, d3.max(day_data, function(d) { return d.total; })]).nice();
        y.domain(day_data.map(function(d) { return d.email; }));
        z.domain(entire_keys);

        const svg = d3.select(svgRef.current);
        const width = svg.attr("width") - margin.left - margin.right;
        const height = svg.attr("height") - margin.top - margin.bottom;
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
        // gridlines in y axis function
        function make_y_gridlines() {		
            return d3.axisLeft(y)
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

        // g.select("#ygrid")
        //     .call(make_y_gridlines()
        //     .tickSize(-width)
        //     .tickFormat("")
        // )

        g.select("#chart")
            .selectAll("g")
            .data(d3.stack().keys(keys)(day_data))
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
            .attr("height", y.bandwidth())
            .attr("id", () => {
                bar_cnt++;
                return ("bar"+bar_cnt);
            });

        g.select("#chart")
            .selectAll("rect")
            .on('mouseenter', (event, datum) => onMouseEnter(event, datum))
            .on('mouseleave', (event, datum) => onMouseLeave(event, datum));

        g.select("#xaxis_t")
            .attr("transform", "translate(0,0)")
            .call(d3.axisTop(x).ticks(null, "s"))
        g.select("#xaxis_b")
            .attr("transform", "translate(0,"+height+")")
            .call(d3.axisBottom(x).ticks(null, "s"))

        g.select("#yaxis")
            .attr("transform", "translate(0,0)")
            .call(d3.axisLeft(y))
            .selectAll('text').attr("x", -10);

        var legend = g.select("#legend")
            .selectAll("g")
            .data(entire_keys.slice().reverse())
            .enter()
            .append("g").attr("class", "appended")
            .attr("transform", function(d, i) { return "translate(-50," + (300 + i * 20) + ")"; });

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
            .on('click', (event, datum) => onMouseClick(event, datum));

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
            .on('click', (event, datum) => onMouseClick(event, datum));
    }}, [loading, keycnt, ordering, day]);

    const handleToAscending = () => {
        setOrdering(true)
    }
    const handleToDescending = () => {
        setOrdering(false)
    }
    const handleDate = () => {
        setDay(document.getElementById("dayselect").selectedOptions[0].value);
    }

    return (
        <div className="fragment">
            <div className="title">
                <h1>Daily Row Counts of Users</h1>
                <div>
                    <select id="dayselect" onChange={handleDate}>
                    </select>
                    <g onClick={handleToAscending}>
                        <input id="Ascending" value="Ascending" type="radio" checked={ordering} onChange={handleToAscending}></input>
                        <text>Ascending</text>
                    </g>
                    <g onClick={handleToDescending}>
                        <input id="Descending" value="Descending" type="radio" checked={!ordering} onChange={handleToDescending}></input>
                        <text>Descending</text>
                    </g>
                </div>
            </div>
            {!loading &&
                <>
                <svg ref = {svgRef} width="1300" height="1820">
                    <g id = "svg_frame">
                        <g id = "xgrid" className = "grid"/>
                        <g id = "ygrid" className = "grid"/>
                        <g id = "chart"/>
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

export default NumOfRows;