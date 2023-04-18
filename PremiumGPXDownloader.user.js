// ==UserScript==
// @name Geocaching Premium GPX Download for free
// @namespace *
// @match https://www.geocaching.com/geocache/*
// @version 1.0
// @author Susanne Sauer
// @description A Script that adds a Download Button to geocaching.com Premium Cache, if you have no Premium.
// ==/UserScript==

// function copied from "Geocaching log Premium for free"
function getElementByXpath(path) {
    return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue; }

// function copied from "Geocaching log Premium for free"
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling); }

// download file (copied from https://ourcodeworld.com/articles/read/189/how-to-create-a-file-and-generate-a-download-with-javascript-in-the-browser-without-a-server)
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

// reverse string (copied from https://www.freecodecamp.org/news/how-to-reverse-a-string-in-javascript-in-3-different-ways-75e4763c68cb/)
function reverseString(str) {
    var splitString = str.split("");
    var reverseArray = splitString.reverse();
    var joinArray = reverseArray.join("");
    return joinArray;
}

// converts coordinates from a string (format N XX°XX.XXX, E XXX°XX.XXX) to decimal coordinates
function convertCoordinates(coordstr) {
    if (coordstr.length != 25) {
        alert("Wrong coordinates format! Invalid length of string.");
        return;
    }
    if (coordstr[4] != "°" || coordstr[18] != "°" || coordstr[7] != "." || coordstr[21] != ".") {
        alert("Wrong coordinates format!");
        return;
    }
    var north_degree = parseInt(coordstr.slice(2,4))
    var east_degree = parseInt(coordstr.slice(15,18))
    var north_minutes = parseFloat(coordstr.slice(5,11))
    var east_minutes = parseFloat(coordstr.slice(19,25))
    var north = north_degree + north_minutes / 60
    var east = east_degree + east_minutes / 60
    if (north > 90 || east > 180) {
        alert("Error: These coordinates do not exist on earth!");
        return;
    }
    if (coordstr[0] == "S") {north = -north}
    else if (coordstr[0] != "N") {
        alert("Wrong coordinates format! North coordinate does not start with N or S.");
        return;
    }
    if (coordstr[13] == "W") {east = -east}
    else if (coordstr[13] != "E") {
        alert("Wrong coordinates format! East coordinate does not start with W or E.");
        return;
    }
    return [north, east];
}

// convert cache type shown on website to the one printed in gpx file
function getType(type) {
    if (type == "Mystery") {
        return "Unknown Cache";
    }
    else if (type == "Letterbox") {
        return "Letterbox Hybrid";
    }
    else if (type == "Multi-cache" || type == "EarthCache") {
        return type;
    }
    else {
        return type + " Cache";
    }
}

// compute GeocacheID from gccode (see https://kryptografie.de/kryptografie/chiffre/gc-code.htm)
function getGcID(gccode) {
    const SIGNS = "0123456789ABCDEFGHJKMNPQRTVWXYZ";
    var gccode_reverse = reverseString(gccode.slice(2));
    var id = -411120; // smaller number are old caches, not taken into account here
    for (let i in gccode_reverse) { // i = index
        var value = SIGNS.search(gccode_reverse[i]);
        id += value * Math.pow(31, i);
    }
    return id;
}

// get cache information from website
function getInfo() {
    var info = {};
    info.gccode = getElementByXpath('//*[@id="ctl00_divContentMain"]/div[1]/ul[1]/li[3]').innerText;
    info.id = getGcID(info.gccode);
    info.owner = document.getElementById("ctl00_ContentBody_uxCacheBy").innerHTML.split(" ").slice(-1);
    info.coords = convertCoordinates(inp_coordinates.value);
    info.name = document.getElementsByClassName("heading-3")[0].innerHTML;
    info.type = getType(document.getElementsByClassName("li__cache-type")[0].innerHTML.trim());
    info.difficulty = document.getElementsByClassName("ul__hide-details")[0].childNodes[1].childNodes[2].innerHTML;
    info.terrain = document.getElementsByClassName("ul__hide-details")[0].childNodes[3].childNodes[2].innerHTML;
    info.url = 'https://www.geocaching.com/geocache/' + info.gccode;
    info.size = document.getElementsByClassName("ul__hide-details")[0].childNodes[5].childNodes[2].innerHTML.toLowerCase();
    info.description = inp_description.value;
    var today = new Date();
    info.date = today.getFullYear()+'-'+today.getMonth()+'-'+today.getDate()+'T'+today.getHours()+':'+today.getMinutes()+':'+today.getSeconds();
    return info;
}

// generate text for the gpx file, uses information from getInfo() as gcinfo
function generateGPXtext(gcinfo) {
    var text = '<?xml version="1.0" encoding="utf-8"?>\n'
    text += '<gpx xmlns:xsd="http://www.w3.org/2001/XMLSchema"   xmlns:xsi="http://www.w3.org/2001/XMLSchema" version="1.0" ' +
             'creator="Groundspeak, Inc. All  Rights Reserved. http://www.groundspeak.com" xsi:schemaLocation="http://www.topografix.com/GPX/1/0 ' +
             'http://www.topografix.com/GPX/1/0/gpx.xsd http://www.groundspeak.com/cache/1/0  http://www.groundspeak.com/cache/1/0/cache.xsd" ' +
             'xmlns="http://www.topografix.com/GPX/1/0">\n'
    text += ' <bounds minlat="'+gcinfo.coords[0]+'" minlon="'+gcinfo.coords[1]+'" maxlat="'+gcinfo.coords[0]+'" maxlon="'+gcinfo.coords[1]+'" />\n'
    text += ' <wpt lat="'+gcinfo.coords[0]+'" lon="'+gcinfo.coords[1]+'">\n'
    text += '   <time>'+gcinfo.date+'</time>\n' // does this work?
    text += '   <name>'+gcinfo.gccode+'</name>\n'
    text += '   <desc>'+gcinfo.name+' by '+gcinfo.owner+', '+gcinfo.type+' ('+gcinfo.difficulty+'/'+gcinfo.terrain+')</desc>\n'
    text += '   <url>'+gcinfo.url+'</url>\n'
    text += '   <urlname>'+gcinfo.name+' </urlname>\n'
    text += '   <sym>Geocache</sym>\n'
    text += '   <type>Geocache|'+gcinfo.type+'</type>\n'
    text += '   <groundspeak:cache id="'+gcinfo.id+'" xmlns:groundspeak="http://www.groundspeak.com/cache/1/0" available="True" archived="False">\n'
    text += '     <groundspeak:name>'+gcinfo.name+'</groundspeak:name>\n'
    text += '     <groundspeak:placed_by>'+gcinfo.owner+'</groundspeak:placed_by>\n'
    text += '     <groundspeak:type>'+gcinfo.type+'</groundspeak:type>\n'
    text += '     <groundspeak:container>'+gcinfo.size+'</groundspeak:container>\n'
    text += '     <groundspeak:difficulty>'+gcinfo.difficulty+'</groundspeak:difficulty>\n'
    text += '     <groundspeak:terrain>'+gcinfo.terrain+'</groundspeak:terrain>\n'
    text += '     <groundspeak:short_description html="True"><![CDATA[]]></groundspeak:short_description>\n'
    text += '     <groundspeak:long_description html="True"><![CDATA['+gcinfo.description+']]></groundspeak:long_description>\n'
    text += '     <groundspeak:encoded_hints>no hint available</groundspeak:encoded_hints>\n'
    text += '     <groundspeak:logs>\n'
    text += '       <groundspeak:log id="0">\n' // this log entry is reserved for attributes, as in Garmin GPX Downloader
    text += '          <groundspeak:date>'+gcinfo.date+'</groundspeak:date>\n'
    text += '          <groundspeak:type>Write note</groundspeak:type>\n'
    text += '          <groundspeak:finder>Attributes</groundspeak:finder>\n' // removed id
    text += '          <groundspeak:text encoded="False"><![CDATA[no attributes available]]></groundspeak:text>\n' // attributes to be added here, seperated by komma
    text += '       </groundspeak:log>\n'
    text += '     </groundspeak:logs>\n'
    text += '   </groundspeak:cache>\n'
    text += ' </wpt>\n'
    text += '</gpx>'
    return text
}

// this is what happens when button is clicked
function downloadGPX(){
    var gcinfo = getInfo();
    var text = generateGPXtext(gcinfo)
    download(gcinfo.gccode+".gpx", text)
}

// main function
var element = getElementByXpath('//*[@id="ctl00_divContentMain"]/section[@class="premium-upgrade-widget"]');
if (typeof(element) != 'undefined' && element != null) { // if Premium Geocache

    // input field for cache description
    var inp_description = document.createElement('textarea');
    inp_description.defaultValue = "Enter description here.";
    inp_description.style.width = "100%";

    // input field for coordinates
    var inp_coordinates = document.createElement('input');
    inp_coordinates.defaultValue = "N 50°00.000, E 009°00.000";

    // download button
    var btn = document.createElement("button");
    btn.onclick = downloadGPX
    btn.innerHTML = 'Download GPX';

    // insert elements (in reverse order)
    insertAfter(btn, element);
    insertAfter(inp_coordinates, element);
    insertAfter(inp_description, element);
}