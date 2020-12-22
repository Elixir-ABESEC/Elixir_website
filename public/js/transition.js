let video = document.getElementById("myVideo");
let btn = document.getElementById("myBtn");

video.pause();

function play() {
   video.play();
   document.querySelector(".text").style.visibility = "hidden";
   setTimeout(function () {
      video.pause();
   }, 3900);
}