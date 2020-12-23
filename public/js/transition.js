/****************************************************************************************
Author - w3schools
link - https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_fullscreen_video
*****************************************************************************************/

let video = document.getElementById("myVideo");
let btn = document.getElementById("myBtn");

video.pause();

function play() {
   video.play();
   document.querySelector(".text").style.visibility = "hidden";
   setTimeout(function () {
      video.pause();
      // document.getElementById("myVideo").style.visibility = "hidden";
   }, 3900);
}