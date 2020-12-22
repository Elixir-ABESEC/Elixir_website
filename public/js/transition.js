let video = document.getElementById("myVideo");
let btn = document.getElementById("myBtn");

video.pause();

function play() {
   video.play();
   document.getElementById("particles-js").style.visibility = "hidden";
   
   document.querySelector(".text").style.visibility = "hidden";
   setTimeout(function () {
      video.pause();
      document.getElementById("particles-js").style.visibility = "visible";
   document.querySelector(".text").style.visibility = "visible";
   }, 2000);
   
}