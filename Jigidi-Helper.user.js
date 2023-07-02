// ==UserScript==
// @name         Jigidi-Helper
// @version      2.3
// @author       Susanne Sauer
// @description  Help solving jigidi puzzles by coloring and numbering them (modified from https://gist.github.com/Dan-Q/e9bfe5c2ca4b13fae4994c5e84685761)
// @match        https://www.jigidi.com/solve/*
// ==/UserScript==


// brightness like described here: http://fseitz.de/blog/index.php?/archives/112-Helligkeit-von-Farben-des-RGB-Farbraums-berechnen.html
// values range from 0 to 255
function compute_brightness(hex)
{
    // convert hex to RGB (see https://convertingcolors.com/blog/article/convert_hex_to_rgb_with_javascript.html)
    function hexToRGB(hex){
        hex = hex.slice(1); // remove leading #
        var hex_splitted = hex.match(/.{1,2}/g);
        return {"r": parseInt(hex_splitted[0], 16), "g": parseInt(hex_splitted[1], 16), "b": parseInt(hex_splitted[2], 16)};
    }
    var rgb = hexToRGB(hex);
    var brightness = Math.sqrt(0.299*Math.pow(rgb.r,2) + 0.587*Math.pow(rgb.g,2) + 0.114*Math.pow(rgb.b,2));
    return brightness;
}

// create hexstring for color from single values (red, green, blue)
// copied from https://krazydad.com/tutorials/makecolors.php
function RGB2Color(r,g,b)
{
    function byte2Hex(n) {
        var nybHexString = "0123456789ABCDEF";
        return String(nybHexString.substr((n >> 4) & 0x0F,1)) + nybHexString.substr(n & 0x0F,1);
    }
    return '#' + byte2Hex(r) + byte2Hex(g) + byte2Hex(b);
}

// function to create an array of color strings in RGB code, representing a rainbow
// for more information see here: https://krazydad.com/tutorials/makecolors.php
function make_rainbow(length)
{
    // phaseShift = 120° (rainbow)
    var phase1 = 0;
    var phase2 = 2*Math.PI/3;
    var phase3 = 4*Math.PI/3;

    // width and center are ~255/2 (color space)
    var center = 128;
    var width = 127;

    // frequency of the rainbow (0.1 for length=50)
    var frequency = 5/length;

    // create colorstrings
    var rainbow = [];
    for (var i = 0; i < length; ++i)
    {
        var red = Math.sin(frequency*i+phase1) * width + center;
        var green = Math.sin(frequency*i+phase2) * width + center;
        var blue = Math.sin(frequency*i+phase3) * width + center;
        rainbow.push(RGB2Color(red,green,blue));
    }
    return rainbow;
}

// function to create an array of color strings in RGB code, representing a greyscale
function make_greyscale(length)
{
    var step = 255/(length-1);

    var greyscale = [];
    for (var i = 0; i < length; ++i)
    {
        var value = i*step;
        greyscale.push(RGB2Color(value, value, value));
    }
    return greyscale.reverse();
}

(function() {
    'use strict';

    window.jCols = parseInt(document.getElementById('info-creator').innerText.match(/(\d+)×/)[1]); // get number of cols
    window.jColors = make_rainbow(window.jCols); // column colors

    window.jRows = parseInt(document.getElementById('info-creator').innerText.match(/×(\d+)/)[1]); // get number of rows
    window.lColors = make_greyscale(window.jRows); // line colors
    window.lWidth = 20; // line width

    window.jC = 0; // variable to increment
    CanvasRenderingContext2D.prototype.putImageData = function(imageData, dx, dy) // for every piece
    {
        // set background color by coloumn
        const col = window.jC % window.jCols; // col number
        var background_color = window.jColors[col % window.jColors.length];
        this.fillStyle = background_color;
        this.fillRect(-1000,-1000,2000,2000);

        // set line color by row
        const row = Math.floor(window.jC / window.jCols); // row number
        this.fillStyle = window.lColors[row % window.lColors.length];
        this.fillRect(-500, 50, 2000, window.lWidth);

        // add text where text color is determined by background color
        this.font = 'bold 14px sans-serif';
        if (compute_brightness(background_color) > 255/2){
            this.fillStyle = 'black';
        }
        else {
            this.fillStyle = 'white';
        }
        this.fillText(`${row+1},${col+1}`, 25, 50);

        window.jC++;
    }
})();