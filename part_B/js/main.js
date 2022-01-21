//variables

let formatTime = d3.timeFormat("%Y/%m/%d")
let parseTime = d3.timeParse("%Y/%m/%d")
let dataselect = document.getElementById("dataselect")

let dataset = ['(All)','Null','App Usage', 'Battery', 'Bluetooth', 'Call Log', 'Data Traffic','Device Event', 'External Sensor', 'Fitness', 'Installed App', 'Key Log','Location', 'Media', 'Message', 'Notification', 'Physical Activity','Physical Activity Transition', 'Survey', 'Wifi']
let dayset = []
let newDataset = []
let flag = false
let selectedItemList = []

let selectedItems = []
let stadiv=0
let radiobtns = document.querySelectorAll("input[name='contact']");



//standard deviation calculator
function getStandardDeviation (array) {
    const n = array.length
    const mean = array.reduce((a, b) => a + b) / n
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}


//load query for the drop down menu

$(document).ready(function(){
    
    for (let i=0;i<dataset.length;i++){
        newDataset.push({
            Name: dataset[i],
            dataId: i
        })
    }
    // Load whole list into DropDownList
    $("#dataselect").ikrLoadfSelectCombo({
        List: newDataset,
        DisplayText: "Name",
        OtherProperties: "dataId,Name", 
        PrimaryKey: "dataId", //PrimaryKey
        
        })

    

})

// "change" event lister for drop down menu 
function makeChange(){
    //Get selected items from DropDownList
    
    $("#dataselect").ikrGetValuefSelectCombo({
        PrimaryKey: "dataId",
        DataValue: "Name",  //Display Property name
        ReturnProperties: "dataId,Name",
        IsReturnSingleValue: false
        }, function (response) {
            if (response.status && response.obj != null) {
                selectedItemList = response.obj;
                selectedItemList.forEach(function(d){
                    if (d.Name=="(All)"){
                        $("#dataselect").ikrSetValuefSelectCombo({
                            List: newDataset,
                            MatchField: "Name" 
                        });
                    }
                    if (d.Name=="Null"){
                        $("#dataselect").ikrResetfSelectCombo()
                    }
                })
            }
    });

    renderChange()
    
}


//svg size

let height = 400
let width = 400

//margins for the svg

const margin = {top: 50, right: 50, bottom: 50, left: 50};

// average line 
let average = 0//SUM((totalRows of a participant/number of days of data collection) of each participant )/ number of participants

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


             
            
        })

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



//transition
let t = d3.transition().duration(500);

//axis
let z = d3.scaleLinear()
        .range([height,0])

let y = d3.scaleLinear()
        .range([height,0])
        

let x = d3.scaleLinear()
        .range([0,width])

let averageGroup = svg.append("g")
            .attr("class", "redAxis")
            

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

//standard deviation shade

let stdiv = svg.append("rect")
    .attr("class", "stdiv")
    .attr("fill", "grey")
    .attr("opacity", 0.5)
    .attr("transform", "translate(" + margin.right + "," + (margin.top) +")")

function update(data){
    stdiv
        .attr("width", 0)

    //variables

    let sum = 0
    let rows = []
    let numberOfDuplicates = []
    let emails = []
    let jsonFile = {}
    let newData = []
    let counter = 1
    let counterList = []
    let participantsWithRow = []
    let temporaryParticipantsWithRow = {}

    // organizing the data, nesting would work too

    data.forEach(function(d){
        if (!emails.includes(d.email)){
            emails.push(d.email)   
        }
    })
    let tobeAdded = []
    selectedItemList.forEach(function(d){
        tobeAdded.push(d.dataId)
        
    })

    //editing based on the drop down option
    
    for(let i = 0; i < emails.length; i++) {
        data.forEach(function(d){
            if (d.email===emails[i]){
                counter+=1
                if ((tobeAdded).includes("0")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }     
                    sum+=([d.app_usage,d.battery ,d.bluetooth ,d.call_log,d.data_traffic,d.fitness,d.device_event,d.external_sensor,d.installed_app,d.key_log,d.location,d.media,d.message,d.notification,d.physical_activity,d.physical_activity_transition,d.survey,d.wifi].reduce((a, b) => a + b, 0))
                } else if((tobeAdded).includes("1") && !(tobeAdded).includes("0")){
                    sum = 0
                }if((tobeAdded).includes("2") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.app_usage)
                }if((tobeAdded).includes("3") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.battery)
                }if((tobeAdded).includes("4") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.bluetooth)
                }if((tobeAdded).includes("5") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.call_log)
                }if((tobeAdded).includes("6") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.data_traffic)
                }if((tobeAdded).includes("7") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.device_event)
                }if((tobeAdded).includes("8") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.external_sensor)
                }if((tobeAdded).includes("9") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.fitness)
                }if((tobeAdded).includes("10") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.installed_app)
                }if((tobeAdded).includes("11") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.key_log)
                }if((tobeAdded).includes("12") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.location)
                }if((tobeAdded).includes("13") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.media)
                }if((tobeAdded).includes("14") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.message)
                }if((tobeAdded).includes("15") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.notification)
                }if((tobeAdded).includes("16") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.physical_activity)
                }if((tobeAdded).includes("17") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.physical_activity_transition)
                }if((tobeAdded).includes("18") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.survey)
                }if((tobeAdded).includes("19") && !(tobeAdded).includes("0") && !(tobeAdded).includes("1")){
                    // check how many unique days there are
                    if (!dayset.includes(d.day)){
                        dayset.push(d.day)
                    }  
                    sum+=(d.wifi)
                }
                let emailFlagger = 0

                participantsWithRow.forEach(function(elements){
                    if (elements.email==d.email){
                        emailFlagger = 1
                    }else{
                        emailFlagger = 0
                    }
                })
                if (emailFlagger == 0){
                    temporaryParticipantsWithRow["email"] = d.email
                    temporaryParticipantsWithRow["row"] = sum
                    temporaryParticipantsWithRow["days"] = dayset.length
                    participantsWithRow.push(temporaryParticipantsWithRow)
                    temporaryParticipantsWithRow = {}
                    dayset = []
                }else{
                    participantsWithRow.forEach(function(elements){
                        if (elements.email==d.email){
                            elements.row+=sum
                        }
                    })
                }
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
        jsonFile["people"]=numberOfDuplicates[i] // how many people share the same count of rows
        jsonFile["counter"] = counterList[emails.length-1] 
        newData.push(jsonFile)
        jsonFile=[]
        counter =1
        
    }
    
   
    
    let map = newData.map(function(d){
        return d.row;
    })

    //finding average

    let totalRows = 0

    participantsWithRow.forEach(function(d){
        totalRows+=(d.row/d.days)
    })

    if ( isNaN(totalRows)){
        totalRows = 0
    }


    average = (totalRows / (emails.length)) // here total rows refers to row/day of each person added together

    //setting axis based on average for stdiv shade

    if ((average-getStandardDeviation (map))<0){
        x.domain([-(getStandardDeviation (map)*2),((map.reduce(function(a, b) {
            return Math.max(a, b);
        }, 0))*1.2)])
    } else {
        x.domain([0,((map.reduce(function(a, b) {
            return Math.max(a, b);
        }, 0))*1.2)])
    }
    y.domain([0,(emails.length*2)]);
    z.domain([0,(emails.length*2)]);

    average = x(totalRows / (emails.length))
    stadiv = x(getStandardDeviation (map))

    // to adjust the scale difference
    let multiplier = 0.28    

    //standard diviation shade creator

    let findSelected = ()=>{
        if (document.querySelector("input[name='contact']:checked").value=="1" && selectedItemList.length!=0){
            stdiv
                .attr("x", (average-((stadiv*0.68)*multiplier)))
                .attr("y", 0)
                .attr("width",(stadiv*2*0.68)*multiplier)
                .attr("height", height)
    
        }else if(document.querySelector("input[name='contact']:checked").value=="2" && selectedItemList.length!=0){
            stdiv
                .attr("x", ((average-((stadiv*0.95))*multiplier)))
                .attr("y", 0)
                .attr("width", ((stadiv*2)*0.95)*multiplier)
                .attr("height", height)
        }else if(document.querySelector("input[name='contact']:checked").value=="3" && selectedItemList.length!=0){
            stdiv
                .attr("x", ((average-((stadiv*0.995))*multiplier)))
                .attr("y", 0)
                .attr("width", ((stadiv*2)*0.995)*multiplier)
                .attr("height", height)
        }
    }

    radiobtns.forEach(radiobtn=>{
        radiobtn.addEventListener("change",findSelected)
    })

    //binning
    
    // set the parameters for the histogram
    let histogram = d3.histogram()
        .value(function(d){
            return d
        })
        .domain(x.domain())
        .thresholds(x.ticks(20)); // the numbers of bins
    

    // And apply this function to data to get the bins
    let bins = histogram(map);

    
  //adjusting axis
    
    let averageAxisCall = d3.axisLeft(z)
                        .ticks(0)
                        
    let yAxisCall = d3.axisLeft(y)
                        .ticks(3)
                        .tickSize((-height)) // -innerHeight would also work

    let xAxisCall = d3.axisBottom(x)
                        .ticks(5)
                        .tickSize((-width))
    
    if ((map.reduce(function(a, b) {
        return Math.max(a, b);
    }, 0))>1000 || (map.reduce(function(a, b) {
        return Math.max(a, b);
    }, 0))<-1000){
        xAxisCall.tickFormat(d => `${parseInt(d / 1000)}k`)
    }
                        
    averageGroup
        .attr("transform", "translate(" + (margin.right + average) + "," + margin.top +")")
        .transition(t)
        .call(averageAxisCall)
    yGroup.transition(t).call(yAxisCall)
    xGroup.transition(t).call(xAxisCall)

    
                    
    // tool tip

    let tip = d3.tip()
		.attr("class", "d3-tip")
		.html(function(d){
			let text = "Distinct count of Email: " + d.length
			return text
		})
	
	svg.call(tip)

    //old data
    let rectangles= svg.selectAll(".bar")
            .data(bins)
            
            
    
    //remove unused old data
    rectangles.exit().remove()
    
    
    //enter and manage the exiting data
    rectangles
        .enter()
        .append("rect")
        .on("mouseover",tip.show)
		.on("mouseout",tip.hide)
        .attr("class","bar")
        .merge(rectangles)
        .transition(t)
        
        .attr("x",1)
        .attr("transform", function(d) { return "translate(" + (x(d.x0)+margin.right) + "," + (y(d.length)+margin.top) + ")"; })
        .attr("width",function(d) { return x(d.x1) - x(d.x0)  ; })
        .attr("height",
            function(d) { return height - y(d.length); }
        )
        .attr("fill","#008ECC");
        
}


