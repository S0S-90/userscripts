// ==UserScript==
// @name         Jigidi-Helper
// @version      2.1
// @author       Susanne Sauer
// @description  Help solving jigidi puzzles by coloring and numbering them (modified from https://gist.github.com/Dan-Q/e9bfe5c2ca4b13fae4994c5e84685761)
// @match        https://www.jigidi.com/solve/*
// ==/UserScript==


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
        this.fillStyle = window.jColors[col % window.jColors.length];
        this.fillRect(-1000,-1000,2000,2000);

        // set line number by row
        const row = Math.floor(window.jC / window.jCols); // row number
        this.fillStyle = window.lColors[row % window.lColors.length];
        this.fillRect(-1000, -35, 2000, window.lWidth);

        // add text
        this.font = 'bold 14px sans-serif';
        this.fillStyle = 'black';
        this.fillText(`${row+1},${col+1}`, -5, 0);

        window.jC++;
    }
})();