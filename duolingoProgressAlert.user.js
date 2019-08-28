// ==UserScript==
// @name         duolingoProgressAlert
// @namespace    http://tampermonkey.net/
// @version      0.9
// @description  shows progress of each lesson after a practice session
// @author       Susanne Sauer
// @match        www.duolingo.com/*
// ==/UserScript==

let K_DUOTREE = "i12-l"; // classname of tree (taken from userscript duolingonextlesson)

// calculates percentage from circle arc (defined by radius of the cirle r and endpoint P)
function get_percentage(r, P){
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
function get_percentage_from_skill(skill){
    // get svg path for circle arc
    var g = skill.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild;
    var path = g.childNodes[1].getAttribute("d");
    // get relevant information out of path
    if (path.split('L')[1].includes("A") == false){
        return 0;
    }
    var path_array = path.split('L')[0].split(',');
    var r = Math.abs(Number(path_array[1].split('A')[0])); // radius
    var x = Number(path_array[path_array.length - 2]);
    var y = Number(path_array[path_array.length - 1]);
    var endpoint = {"x":x,"y": y}; // endpoint
    // calculate percentage
    return get_percentage(r,endpoint);
}

// gets name for a skill (defined as div-object)
function get_skill_name(skill){
    return skill.firstChild.firstChild.childNodes[1].firstChild.innerHTML;
}

// gets level from a skill (defined as div-object) which I'm on the way to
function get_skill_level(skill){
    if (skill.firstChild.firstChild.firstChild.firstChild.childNodes[1].childNodes[1].childNodes.length == 1){
        return 1; // skill is still locked so I am on the way to level 1
    }
    return skill.firstChild.firstChild.firstChild.firstChild.childNodes[1].childNodes[1].childNodes[1].innerHTML;
}

// takes an array and creates a new array that consists only of every other element of original array
function every_second_element(array){
    var result = Array();
    for (var i = 0; i < array.length; i+=2){
        result.push(array[i]);
    }
    return result;
}

// gets all skills from the duolingo tree as an array of div-objects
function get_all_skills(treename){
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
function get_information_about_skills(skills){
    var result = Array();
    for (var skill of skills){
        var percent = get_percentage_from_skill(skill);
        var name = get_skill_name(skill);
        var level = get_skill_level(skill);
        var skill_info = {"name":name, "progress":percent, "level": level};
        result.push(skill_info);
    }
    return result;
}

// compares two arrays of skill_infos
// returns empty string if they are equal or not comparable
// returns information about the changes as string if they are comparable and not equal
function compare_skill_infos(info_1, info_2){
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
            result_string += inf_a.name + ": " + inf_a.progress + "% (level " + inf_a.level + ") -> " + inf_b.progress + "% (level " + inf_b.level + ")\n";
        }
    }
    return result_string;
}

// creates a string for all the information about all the skills (to use as alert)
function create_skill_info_string(skills_info){
    var result = String();
    for (var skill_info of skills_info){
        result += skill_info.name + ": " + skill_info.progress + "% on the way to level " + skill_info.level + "\n";
    }
    return result;
}

(function() {
    'use strict';
    alert("duolingoProgressAlert is running");

    // get new information
    var skills = get_all_skills(K_DUOTREE);
    var info_new = get_information_about_skills(skills);

    // get old information
    var old_json = sessionStorage.getItem("info_about_skills");
    if (old_json != null){
        var info_old = JSON.parse(old_json);

        // compare them
        var compare_string = compare_skill_infos(info_old, info_new);
        if (compare_string != ""){
            alert("You made progress in the following skills:\n" + compare_string);
        }
    }

    // save new information
    sessionStorage.setItem("info_about_skills", JSON.stringify(info_new));
})();