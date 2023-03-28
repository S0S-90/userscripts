// ==UserScript==
// @name         Jigidi-Helper
// @version      1.0
// @description  Help solving jigidi puzzles by coloring and numbering them (modified from https://gist.github.com/Dan-Q/e9bfe5c2ca4b13fae4994c5e84685761)
// @match        https://www.jigidi.com/solve/*
// ==/UserScript==

(function() {
    'use strict';

    window.jColors = ['red', 'blue', 'brown', 'orange', 'yellow', 'pink', 'lightblue', 'lightgreen', 'lightgray'];
    window.lColors = ['white', 'black', 'purple', 'darkgray', '#009'];
    window.lWidths = [5, 10, 20];
    window.jCols = parseInt(document.getElementById('info-creator').innerText.match(/(\d+)×/)[1]);
    window.jC = 0;
    CanvasRenderingContext2D.prototype.putImageData = function(imageData, dx, dy){
        const col = window.jC % window.jCols;
        const row = Math.floor(window.jC / window.jCols);
        this.fillStyle = window.jColors[col % window.jColors.length];
        this.fillRect(-1000,-1000,2000,2000);
        if(0 == (row % 2)){ this.fillStyle = '#ffffff33'; this.fillRect(-1000,-1000,2000,2000); }
        this.fillStyle = window.lColors[row % window.lColors.length];
        this.fillRect(-1000, -35, 2000, window.lWidths[row % window.lWidths.length]);
        this.fillStyle = window.lColors[col % window.lColors.length];
        this.fillRect(-35, -1000, window.lWidths[col % window.lWidths.length], 2000);
        this.font = 'bold 14px sans-serif';
        this.fillStyle = 'black';
        this.fillText(`${row+1},${col+1}`, -5, 0);
        window.jC++;
    }
})();