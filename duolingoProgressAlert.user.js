// ==UserScript==
// @name         duolingoProgressAlert
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  shows progress of each lesson after a practice session
// @author       Susanne Sauer
// @match        http*://www.duolingo.com/*
// ==/UserScript==

let K_DUOTREE = "i12-l"; // classname of tree (taken from userscript duolingonextlesson)
let K_SIDEBAR = "_2_lzu" // classname of the sidebar (does not exist if window too small)


// STUFF TO GET INFORMATION ABOUT THE SKILL TREE
// THIS INFORMATION IS SAVED IN AN ARRAY OF OBJECTS WHICH REPRESENT THE SINGLE SKILLS
// EVERY SKILL CONTAINS THE ATTRIBUTES: NAME, PROGRESS, LEVEL

// calculates percentage from circle arc (defined by radius of the cirle r and endpoint P)
function get_percentage(r, P)
{
    var alpha = Math.asin(P.x/r);
    if (P.y > 0){
        alpha = Math.PI - alpha;
    }
    else if (alpha < 0){
        alpha = 2*Math.PI + alpha;
    }
    var percent = alpha / (2*Math.PI);
    percent = Math.round(percent*100);
    return percent;
}

// gets the percentage from a skill (defined as div-object)
function get_percentage_from_skill(skill)
{
    // get svg path for circle arc
    var g = skill.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.childNodes[1];
    var path = g.childNodes[2].getAttribute("d");
    // get relevant information out of path
    if (path.includes('L') == false){
        return 100;
    }
    else if (path.split('L')[1].includes("A") == false){
        return 0;
    }
    var path_array = path.split('L')[0].split(',');
    var r = Math.abs(Number(path_array[1].split('A')[0])); // radius
    var x = Number(path_array[path_array.length - 2]);
    var y = Number(path_array[path_array.length - 1]);
    var endpoint = {"x":x,"y":y}; // endpoint
    // calculate percentage
    return get_percentage(r,endpoint);
}

// gets name for a skill (defined as div-object)
function get_skill_name(skill){
    return skill.firstChild.firstChild.firstChild.childNodes[1].firstChild.innerHTML;
}

// gets level from a skill (defined as div-object)
function get_skill_level(skill)
{
    if (skill.firstChild.firstChild.firstChild.firstChild.firstChild.childNodes[2].childNodes.length == 1){
        return 0; // skill is still locked so I am on level 0
    }
    return skill.firstChild.firstChild.firstChild.firstChild.firstChild.childNodes[2].childNodes[1].innerHTML;
}

// takes an array and creates a new array that consists only of every other element of original array
function every_second_element(array)
{
    var result = Array();
    for (var i = 0; i < array.length; i+=2){
        result.push(array[i]);
    }
    return result;
}

// gets all skills from the duolingo tree as an array of div-objects
function get_all_skills(treename)
{
    var tree = document.getElementsByClassName(treename)[0].childNodes[1];
    var result = Array(); // array of the skills (as div-objects)

    var checkpoints = tree.childNodes; // only every second node consists of lessons
    checkpoints = every_second_element(checkpoints);
    for (var checkpoint of checkpoints){
        var number_of_children = checkpoint.childNodes.length;
        var rows;
        if (number_of_children == 1){ // checkpoint already unlocked
            rows = checkpoint.firstChild.childNodes;
        }
        else if (number_of_children == 3){ // checkpoint still locked
            rows = checkpoint.childNodes[1].childNodes;
        }
        else alert("Error: strange number of children for a checkpoint");
        for (var r of rows){
            var skills = r.childNodes; // this is a nodeList
            var skill_array = Array.prototype.slice.call(skills); // convert to array
            result = result.concat(skill_array);
        }
    }
    return result;
}

// collects all relevant information (name, percent, level) of all skills and returns an array with those infos
// every skill info contains the following attributes: name, progress, level
function get_information_about_skills(skills)
{
    var result = Array();
    for (var skill of skills){
        var percent = get_percentage_from_skill(skill);
        //alert(percent);
        var name = get_skill_name(skill);
        //alert(name);
        var level = get_skill_level(skill);
        //alert(level);
        var skill_info = {"name":name, "progress":percent, "level": level};
        result.push(skill_info);
    }
    return result;
}

// HERE THE STUFF TO GET THE TREE INFORMAION ENDS
// NOW WE HAVE TO WORK WITH IT


// compares two arrays of skill_infos
// returns empty string if they are equal or not comparable
// returns information about the changes as string if they are comparable and not equal
function compare_skill_infos(info_1, info_2)
{
    if (info_1.length != info_2.length){ // different number of skills
        return "";
    }
    var result_string = String();
    for (var [i, inf_a] of info_1.entries()){
        var inf_b = info_2[i];
        if (inf_a.name != inf_b.name){ // different name of corresponding skills
            return "";
        }
        if (inf_a.progress != inf_b.progress || inf_a.level != inf_b.level){ // percentage or level has changed
            result_string += "<p>" + inf_a.name + ": " + inf_a.progress + "% (level " + inf_a.level + ") -> " + inf_b.progress + "% (level " + inf_b.level + ")<\p>";
        }
    }
    return result_string;
}

// function that resets the stored info to the current progress of the tree
// furthermore it removes the printed information on site and the reset button
function reset_skills_info(){
    var skills = get_all_skills(K_DUOTREE);
    var info = get_information_about_skills(skills);
    sessionStorage.setItem("info_about_skills", JSON.stringify(info));
    document.getElementById("progress_info").outerHTML = "";
    document.getElementById("reset_button").outerHTML = "";
}

// function to print info for skills when there are some skills several times
// in this case the newer info about this skill is printed
function update_printed_skill_info(text_before, new_text){
    var lines_before = text_before.split("<p>");
    var lines_new = new_text.split("<p>");

    var total_lines = [];
    for (var line of lines_before){
        var found = false;
        for (var [i,line_new] of lines_new.entries()){
            if (line.split(':').length != 0 && line_new.split(':').length != 0){ // otherwise next line won't work
                if (line.split(':')[0] == line_new.split(':')[0]){ // same skill
                    total_lines.push(line_new); // add more recent version of skill to total_lines
                    lines_new.splice(i,1); // remove line_new from lines_new
                    found = true;
                    break;
                }
            }
        }
        if (!found){
            total_lines.push(line); // add lines before that were not overwritten to total_lines
        }
    }
    for (line_new of lines_new){
        total_lines.push(line_new); // add new lines that did not overwrite an old line
    }

    return total_lines.join("<p>");
}

// function that creates a new element <p> on the sidebar and prints text on it
function print_text_on_sidebar(text){
    if (!!document.getElementById("progress_info")){ // if there is already something written: do not overwrite but only add text
        var element = document.getElementById("progress_info");
        var former_text = element.innerHTML;
        element.innerHTML = update_printed_skill_info(former_text, text);
    }
    else if (document.getElementsByClassName(K_SIDEBAR).length != 0) { // if sidebar exists
        // create text field with progress information
        var para = document.createElement("p");
        para.innerHTML = "<p>You made progress in the following skills:<\p>" + text;
        para.id = "progress_info";
        element = document.getElementsByClassName(K_SIDEBAR)[0];
        element.insertBefore(para, element.firstChild)

        // create button to reset (calls above function)
        var button = document.createElement("button");
        button.innerHTML = "Reset Progress";
        button.onclick = reset_skills_info;
        button.id = "reset_button";
        element.insertBefore(button, element.childNodes[1]);
    }
}

// this is the main function of the script
function main() {
    'use strict';

    // get and save information when reaching site
    var skills = get_all_skills(K_DUOTREE);
    var info = get_information_about_skills(skills);
    sessionStorage.setItem("info_about_skills", JSON.stringify(info));

    // run real program when something in the tree changes
    var observer = new MutationObserver(update);
    observer.observe(document.body, {subtree : true, childList : true});

    // function that is called everytime when something on the site changes
    var printed_info = info; // take track of info that has already written during update function
    function update()
    {
        // some variables that are filled during has_progressed() function
        var current_info; // information about current tree
        var compare_string; // string that compares current information to old one

        // function that looks if tree progress has changed, returns true if yes and false if no
        // furthermore it filled current information into 'current_info' and a string with the differences into 'compare_string'
        function has_progressed() {
            // get new information
            var skills = get_all_skills(K_DUOTREE);
            current_info = get_information_about_skills(skills);

            // get old information
            var old_json = sessionStorage.getItem("info_about_skills");

            // compare old and new information
            if (old_json != null){
                var info_old = JSON.parse(old_json);
                compare_string = compare_skill_infos(info_old, current_info);
                if (compare_string == "") return false; // no difference
                else{
                    if (JSON.stringify(current_info) == JSON.stringify(printed_info)){
                        return false; // info has already printed
                    }
                    else{
                        printed_info = current_info;
                        return true; // print info
                    }
                }
            }
            else return false; // no info about before status
        }

        // this is what is done in update()
        if (window.location.pathname == "/learn") // only on tree page (www.duolingo.com/learn)
        {
            if (has_progressed()) // if there is some progress on the tree: print and save information
            {
                print_text_on_sidebar(compare_string);
            }
        }
    }
}

// run script only when page has loaded completely
window.addEventListener('load', function() {
    main();
}, false);
