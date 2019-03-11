// ==UserScript==
// @name         ClusterStatistics
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  statistics for current cluster usage
// @author       Susanne Sauer
// @match        http://132.187.77.27/mauires-bin/mauistatus.pl
// @grant        none
// ==/UserScript==

// sort user by number of jobs or by number of processors used?
const SORTING_MODE = "jobs"; // can be proc or jobs

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

// creates a table out of information about people
// adds it to the pre-element where the original table also it
function createTable(people){
    var para = document.createElement("table");
    var person;

    // create headline
    var row = para.insertRow();
    var cell1 = row.insertCell(0);
    cell1.outerHTML = "<th>name</th>";
    var cell2 = row.insertCell(1);
    cell2.outerHTML = "<th>jobs</th>";
    var cell3 = row.insertCell(2);
    cell3.outerHTML = "<th>processors</th>";

    // create line for every person
    for (person in people){
        row = para.insertRow();
        cell1 = row.insertCell(0);
        cell1.innerHTML = people[person].name;
        cell2 = row.insertCell(1);
        cell2.innerHTML = people[person].jobs;
        cell3 = row.insertCell(2);
        cell3.innerHTML = people[person].proc;
    }

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
function sortPeople(people){
    if (SORTING_MODE == "proc"){
        people.sort(function(a,b){return b.proc - a.proc});
    }
    else if (SORTING_MODE == "jobs"){
        people.sort(function(a,b){return b.jobs - a.jobs});
    }
    return people;
}


(function() {
    'use strict';

    var runningTableText = document.getElementsByTagName("pre")[0].innerHTML; // find table and get text
    var result = cutTable(runningTableText); // convert text into array of lines and cut off those that are not needed
    var tableArray = convertToArray(result); // convert every line into an array, so we now have an array of arrays
    var names = collectNames(tableArray); // get usernames
    var people = collectInformationOnJobs(names, tableArray); // for every user: collect number of jobs and processors
    people = sortPeople(people); // sort people array for chosen criterion
    createTable(people); // create table
})();
