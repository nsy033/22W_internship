//variables

let formatTime = d3.timeFormat("%Y-%m-%d")
let parseTime = d3.timeParse("%Y-%m-%d")
let dayselect = document.getElementById("dayselect")
let dataselect = document.getElementById("dataselect")

let dataset = ["all","null","app_usage" ,"battery" ,"bluetooth" ,"call_log","data_traffic","fitness","device_event","external_sensor","installed_app","location","media","message","notification","physical_activity","physical_activity_transition","survey","wifi"]
let dayset = []
let newDataset = []
let flag = false
let selectedItemList = []

//load query for the drop down menu

$(document).ready(function(){
    
    for (let i=0;i<dataset.length;i++){
        newDataset.push({
            Name: dataset[i],
            dataId: i
        })
    }
    $("#dataselect").ikrLoadfSelectCombo({
        List: newDataset,
        DisplayText: "Name",
        OtherProperties: "dataId,Name", 
        PrimaryKey: "dataId", //PrimaryKey
        
        })

    

})

// change event lister for drop down menu 
function makeChange(){
    $("#dataselect").ikrGetValuefSelectCombo({
        PrimaryKey: "dataId",
        DataValue: "Name",  //Display Property name
        ReturnProperties: "dataId,Name",
        IsReturnSingleValue: false
        }, function (response) {
            if (response.status && response.obj != null) {
                selectedItemList = response.obj;
                selectedItemList.forEach(function(d){
                    if (d.Name=="all"){
                        $("#dataselect").ikrSetValuefSelectCombo({
                            List: newDataset,
                            MatchField: "Name" 
                        });
                    }
                    else if (d.Name=="null"){
                        $("#dataselect").ikrResetfSelectCombo()
                    }
                    
                })
                console.log(selectedItemList)
            }
    });
}

//svg size

let height = 400
let width = 400

//margins for the svg

const margin = {top: 50, right: 50, bottom: 50, left: 50};

// average line 
let average = 0 + margin.right //total number of rows/data collection period

function renderChange(){

    // load the file and change string to number

    d3.csv("data/daily_rowcount_res.csv").then(function(data){
        data.forEach(function(d){
            d.app_usage = +d.app_usage
            d.battery = +d.battery
            d.bluetooth = +d.bluetooth
            d.call_log=+d.call_log
            d.data_traffic=+d.data_traffic
            d.fitness=+d.fitness
            d.device_event=+d.device_event
            d.external_sensor=+d.external_sensor
            d.installed_app=+d.installed_app
            d.installed_app+=d.installed_app
            d.key_log=+d.key_log
            d.location=+d.location
            d.media=+d.media
            d.message=+d.message
            d.notification=+d.notification
            d.physical_activity=+d.physical_activity
            d.physical_activity_transition=+d.physical_activity_transition
            d.survey=+d.survey
            d.wifi=+d.wifi
            d.day=formatTime(new Date (d.day))


            // check how many unique days there are

            if (!dayset.includes(d.day)){
                dayset.push(d.day)
            }      
            
        })

        //add days to be selected making sure they are only added once

        if (flag===false){
            for(let i = 0; i < dayset.length; i++) {
                flag = true
                let opt = document.createElement('option');
                opt.value = dayset[i];
                opt.innerHTML = dayset[i];
                dayselect.append(dayset[i], opt)
            }
        }

        //run graph for the first time 

        update(data)

    })
}

// run initial function without the first date change

renderChange()

//append the svg to the page
    
const svg = d3.select("#chart-area")
    .append("svg")
    .attr("width",width+margin.left+margin.right)
    .attr("height",height+margin.top+margin.bottom);

let t = d3.transition().duration(500);

let z = d3.scaleLinear()
        .range([height,0]);

let y = d3.scaleLinear()
        .range([height,0]);

let x = d3.scaleBand()
        .range([0,width])
        .paddingInner(0.3)
        .paddingOuter(0.3);

let averageGroup = svg.append("g")
            .attr("class", "redAxis")
            .attr("transform", "translate(" + average + "," + margin.top +")")
            

let yGroup = svg.append("g")
        .attr("class","y axis")
        .attr("transform", "translate(" + margin.right + "," + margin.top +")")

let xGroup = svg.append("g")
        .attr("class","x axis")
        .attr("transform", "translate(" + margin.right + "," + (height +margin.top) +")")

// axis labels
const xLabel = svg.append("text")
	.attr("class", "x axisLabel")
	.attr("y", (height +margin.top+(margin.bottom/1.5)))
	.attr("x", ((width/2) + (margin.right)))
	.attr("font-size", "16px")
	.attr("text-anchor", "middle")
	.text("Count of Rows for a Day")

const yLabel = svg.append("text")
	.attr("class", "y axisLabel")
	.attr("transform", "rotate(-90)")
	.attr("y", ((margin.top/3)))
	.attr("x", -((margin.top)+(height/2)))
	.attr("font-size", "16px")
	.attr("text-anchor", "middle")
	.text("The number of participants")

function update(data){

    //variables

    let sum = 0
    let rows = []
    let numberOfDuplicates = []
    let emails = []
    let jsonFile = {}
    let newData = []
    let counter = 1
    let counterList = []

    // organizing the data, nesting would work too

    data.forEach(function(d){
        if (formatTime(new Date (dayselect.value)) === formatTime(new Date (d.day))){
            if (!emails.includes(d.email)){
                emails.push(d.email)   
            }
        }
    })
    
    for(let i = 0; i < emails.length; i++) {
        data.forEach(function(d){
            if (d.email===emails[i] && formatTime(new Date (dayselect.value)) == formatTime(new Date (d.day))){
                counter+=1
                sum+=([d.app_usage,d.battery ,d.bluetooth ,d.call_log,d.data_traffic,d.fitness,d.device_event,d.external_sensor,d.installed_app,d.key_log,d.location,d.media,d.message,d.notification,d.physical_activity,d.physical_activity_transition,d.survey,d.wifi].reduce((a, b) => a + b, 0))
            }
        })
        rows.push(sum)
        counterList.push(counter)
        sum=0
    }

    for(let i = 0; i < rows.length; i++){
        rows.forEach(function(d){
            if (d===rows[i]){
                sum+=1
            }
        })
        numberOfDuplicates.push(sum)
        sum = 0
    }

    for(let i = 0; i < emails.length; i++){
        
        jsonFile["email"]= emails[i],
        jsonFile["row"]=rows[i],
        jsonFile["people"]=numberOfDuplicates[i]
        jsonFile["counter"] = counterList[emails.length-1]
        average+=(rows[i]/counterList[emails.length-1])
        newData.push(jsonFile)
        jsonFile=[]
        counter =1
        
    }

    //binning
    console.log(newData)
    let map = newData.map(function(d){
        return d.row;
    })

    // set the parameters for the histogram
    var histogram = d3.histogram()
    .thresholds([0,500]); // then the numbers of bins

    // And apply this function to data to get the bins
    var bins = histogram(map);
    console.log(bins)
    
    y.domain([0,150])    
    z.domain([0,150])  
    
    x.domain(d3.extent(newData,function(d){
        return d.row
    }))
    
    let averageAxisCall = d3.axisLeft(z)
                        .ticks(0)
                        
    let yAxisCall = d3.axisLeft(y)
                        .ticks(3)

    let xAxisCall = d3.axisBottom(x)
                        .ticks(12)
                        .tickFormat(d => `${parseInt(d / 1000)}k`)
    
    averageGroup.call(averageAxisCall)
    yGroup.transition(t).call(yAxisCall)
    xGroup.transition(t).call(xAxisCall)
    
    // sigma area

    // const area = d3.area()
    //                 .x(function(d){
    //                     return (x(d.row)+margin.right)
    //                 }) // how far along in the xaxis does it go
    //                 .y0(y(0)) //bottom of the area
    //                 .y1(150)//what is the upper limit;

                    //area graph
    // svg.append("path")
    //     .datum(data)
    //     .attr("d",area)
    //     .attr("fill","grey")
    //     .attr("Stroke","grey")
    //     .attr("stroke-width",2)
    //     .attr("transform", "translate(" + margin.right + "," + margin.top +")")
    
    // tool tip

    let tip = d3.tip()
		.attr("class", "d3-tip")
		.html(function(d){
			let text = "Distinct count of Email: " + d.people
			return text
		})
	
	svg.call(tip)

    //old data
    let rectangles= svg.selectAll("rect")
            .data(newData,function(d){
                return d.row; //tracks the independent variable when slice is used
            })
    
    //remove unused old data
    rectangles.exit().remove()

    //update the figure
    rectangles.transition(t)
        .attr("x",function(d){
            return (x(d.row)+margin.right)
        })
        .attr("y",function(d){
            return (y(d.people)+margin.top)
        })
        .attr("width",x.bandwidth)
        .attr("height",function(d){
            return (height-y(d.people));
        })
    
    //enter
    rectangles
            .enter()
            .append("rect")
            .on('mouseover', tip.show)
            .on("mouseout",tip.hide)
            .attr("x",function(d){
                return ((x(d.row))+margin.right)
            })
            .attr("y",function(d){
                return ((y(d.people))+margin.top)
            })
            .attr("width",x.bandwidth)
            .attr("height",function(d){
                return (height-y(d.people));
            })
            .attr("fill","#008ECC");
}