// ==UserScript==
// @name         DeleteInternet
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  delete the internet
// @author       You
// @match        http*://*
// ==/UserScript==

(function() {
    'use strict';

    var element = document.getElementsByTagName("body")[0];
    element.innerHTML = "Entschuldigung, das Internet wurde gelöscht.";
})();