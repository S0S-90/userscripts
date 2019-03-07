// ==UserScript==
// @name         removeAnswerBox
// @version      1.0
// @description  remove ugly orange answering block on e-fellows question and answer page
// @author       Susanne Sauer
// @match        https://www.community.e-fellows.net/*
// ==/UserScript==

// change foot
var myFooter = document.getElementsByClassName('c2a-herofooter')[0];
myFooter.style.position = "sticky"; // make it sticky (other information is relative to block, not to whole window)
myFooter.style.width= "0px"; // make it small
myFooter.style.height = "60px"; // move to to bottom as far as possible without making picture disappear
myFooter.style.left = "100%"; // move it to the right
myFooter.style.backgroundColor = "transparent"; // remove orange background color

// change input field
var myInput = document.getElementsByClassName('c2a-hf__input')[0];
myInput.style.boxShadow = "none"; // no frame around field
myInput.style.backgroundColor = "transparent"; // make it transparent
