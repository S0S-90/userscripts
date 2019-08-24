// ==UserScript==
// @name         duolingoProgressAlert
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  shows progress of each lesson after a practice session
// @author       Susanne Sauer
// @match        www.duolingo.com
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

(function() {
    'use strict';
    var skills = get_all_skills(K_DUOTREE);
    alert(skills.length);
    for (var skill of skills){
        var percent = get_percentage_from_skill(skill);
        var name = get_skill_name(skill);
        var level = get_skill_level(skill);
        var skill_info = {"name":name, "progress":percent, "level": level};
        alert(skill_info.name + ": " + skill_info.progress + "% on the way to level " + skill_info.level);
    }
})();