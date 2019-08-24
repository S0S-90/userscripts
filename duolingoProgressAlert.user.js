// ==UserScript==
// @name         duolingoProgressAlert
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  shows progress of each lesson after a practice session
// @author       Susanne Sauer
// @match        www.duolingo.com
// ==/UserScript==

// calculates percentage from circle arc (defined by radius of the cirle r and endpoint P)
function get_percentage(r, P){
    var alpha = Math.asin(P.x/r);
    if (P.y > 0){
        alpha = Math.PI - alpha;
    }
    var percent = alpha / (2*Math.PI);
    percent = Math.round(percent*100);
    return percent;
}

// gets the percentage from a lesson (defined as div-object)
function get_percentage_from_lesson(lesson){
    // get svg path for circle arc
    var g = lesson.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild.firstChild;
    var path = g.childNodes[1].getAttribute("d");
    // get relevant information out of path
    var path_array = path.split('L')[0].split(',');
    var r = Math.abs(Number(path_array[1].split('A')[0])); // radius
    var x = Number(path_array[path_array.length - 2]);
    var y = Number(path_array[path_array.length - 1]);
    var endpoint = {"x":x,"y": y}; // endpoint
    // calculate percentage
    return get_percentage(r,endpoint);
}

(function() {
    'use strict';
    var tree = document.getElementsByClassName("i12-l")[0].childNodes[1];
    var row = tree.firstChild.firstChild.childNodes[1]; // second row (_2GJb6)
    var lesson = row.childNodes[1]; // second lesson
    var percentage = get_percentage_from_lesson(lesson);

    alert(percentage);
})();