// ==UserScript==
// @name         ClusterStatistics
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  statistics for current cluster usage
// @author       Susanne Sauer
// @match        http://132.187.77.27/mauires-bin/mauistatus.pl*
// @updateURL    https://github.com/S0S-90/userscripts/raw/master/ClusterStatistics.user.js
// @downloadURL  https://github.com/S0S-90/userscripts/raw/master/ClusterStatistics.user.js
// @grant        none
// ==/UserScript==

// cuts first 2 lines (headings) and last 4 lines (statistics) from table
function cutTable(tableText){
    var tableArray = tableText.split("\n"); // convert to array where every line is a new element
    tableArray.pop();
    tableArray.pop();
    tableArray.pop();
    tableArray.pop();
    tableArray.pop();
    tableArray.shift();
    tableArray.shift();
    return tableArray;
}

// converts every line of the job table into an array
function convertToArray(jobStrings){
    var newArray = [];
    var job;
    for (job in jobStrings){
        var jobArray = jobStrings[job].split(/\s+/); // this seems to cut at white spaces
        newArray.push(jobArray);
    }
    return newArray;
}

// collects all names of users that have at least one job running
function collectNames(jobArrays){
    var nameArray = []
    var job;
    for (job in jobArrays){
        var name = jobArrays[job][1];
        if (!nameArray.includes(name)){
            nameArray.push(name);
        }
    }
    return nameArray;
}

// only for debugging purposes: show information about a person
function showPerson(p){
    alert(p.name + " " + p.jobs + " " + p.proc);
}

// main functionality!
// creates persons with correct numbers of jobs and processors and returns them as array 'people'
function collectInformationOnJobs(names, jobArrays){
    var name;
    var job;
    var people = [];

    // function that takes a name and returns the index of the corresponding person in array 'people'
    function findPersonByName(n){
        for (person in people){
            var personName = people[person].name;
            if (n == personName){
                return person;
            }
        }
    }

    // create a person for every name, fill array 'people'
    for (name in names){
        var person = {name: names[name], jobs : 0, proc : 0};
        people.push(person);
    }

    // goes through jobs and adds jobs and processors to correct person
    for (job in jobArrays){
        var currentName = jobArrays[job][1];
        var currentProc = jobArrays[job][3];
        var currentPerson = findPersonByName(currentName);
        people[currentPerson].jobs += 1;
        people[currentPerson].proc += Number(currentProc);
    }

    return people;
}

// creates the text of an html table out of the array 'people'
function createTableText(people){
    var person;
    var text = "<tr><th>name</th><th>jobs</th><th>processors</th></tr>";
    for (person in people){
        text += "<tr><td>"+people[person].name+"</td><td>"+people[person].jobs+"</td><td>"+people[person].proc+"</td></tr>";
    }
    return text;
}

// creates a table out of information about people
// adds it to the pre-element where the original table also it
function createTable(people){

    // create table
    var para = document.createElement("table");
    var tableText = createTableText(people);
    para.innerHTML = tableText;
    para.id = "statTable";

    // do some modification in CSS styling
    para.style.textAlign = "center";
    para.style.border = "1px solid black";
    para.style.borderSpacing = "5px";
    para.style.width = "400px";

    // add table to pre-element
    var element = document.getElementsByTagName("pre")[0];
    element.appendChild(para);
}

// sorts people for the chosen criterion
function sortPeople(people, sortingCriterion){
    if (sortingCriterion == "proc"){
        people.sort(function(a,b){return b.proc - a.proc});
    }
    else if (sortingCriterion == "jobs"){
        people.sort(function(a,b){return b.jobs - a.jobs});
    }
    else if (sortingCriterion == "name"){
        people.sort(function(a,b){if (a.name > b.name) return 1; else return -1;});
    }
    return people;
}

// function that reads information from page, processes it and creates or updates the table
// parameters: sortCrit (sorting criterion for table)
//             createNew (true: create a completely new table and add it, false: just replace table text)
function getInfoAndCreateTable(sortCrit, createNew){
    var runningTableText = document.getElementsByTagName("pre")[0].innerHTML; // find table and get text
    var result = cutTable(runningTableText); // convert text into array of lines and cut off those that are not needed
    var tableArray = convertToArray(result); // convert every line into an array, so we now have an array of arrays
    var names = collectNames(tableArray); // get usernames
    var people = collectInformationOnJobs(names, tableArray); // for every user: collect number of jobs and processors
    people = sortPeople(people, sortCrit); // sort people array for chosen criterion
    if (createNew == true){
        createTable(people); // create table
    }
    else{
        var tableElement = document.getElementById("statTable"); // find table (must exist before)
        var tableText = createTableText(people); // create text for table
        tableElement.innerHTML = tableText; // set content of table to formerly created text
    }
}

// happens when submit button for dropdown menu is clicked, updates table
function updateTable(event){
    event.preventDefault(); // prevent page from reloading when button is pressed
    var x = document.forms.myForm.crit.value; // get sorting criterion from dropdown menu
    getInfoAndCreateTable(x, false); // update table
}

// creates dropdown menu
function createDropdown(){
    // find element to which the menu should be added
    var element = document.getElementsByTagName("pre")[0];

    // create and add question
    var headline = document.createElement("p");
    headline.innerHTML = "By which criterion should the table be sorted?";
    element.appendChild(headline);

    // create and add dropdown menu
    var para = document.createElement("form");
    var text = "<select name=crit><option value='name'>Name</option><option value='jobs'>Jobs</option><option value='proc'>Processors</option></select>";
    text += "<input type='submit'>";
    para.innerHTML = text;
    para.id = "myForm";
    para.addEventListener("submit", updateTable); // function that is executed when submit button is clicked
    para.style.padding = "5px"; // add a bit of space around form
    element.appendChild(para);
}


(function() {
    'use strict';
    createDropdown(); // create dropdown menu
    getInfoAndCreateTable("name", true); // create first version of table (sorted by name)
})();