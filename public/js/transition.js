let video = document.getElementById("myVideo");
let btn = document.getElementById("myBtn");

video.pause();

function play() {
   video.play();
   document.getElementById("particles-js").style.opacity = "0";
   
   document.querySelector(".text").style.opacity = "0";
   setTimeout(function () {
     
      document.getElementById("particles-js").style.opacity = "1";
   document.querySelector(".text").style.opacity = "1";
   video.pause();
   }, 2200);
   
}