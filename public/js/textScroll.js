
/* window.onclick = function () {
   scrollFunction();
}; */

function scrollFunction() {
   /* if (
      document.body.scrollTop > 50 ||
      document.documentElement.scrollTop > 50
   ) {
      document.getElementById("header").style.fontSize = "30px";
   } else {
      document.getElementById("header").style.fontSize = "90px";
   } */

   document.querySelector(".heading").style.fontSize = "10px";
   document.querySelector(".main-text").style.position = "absolute";
   document.querySelector(".main-text").style.top = "200px";
   document.querySelector(".main-text").style.transition = "0.3qs";

}
