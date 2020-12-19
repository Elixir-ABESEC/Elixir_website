particlesJS("particles-js", { "particles": { "number": { "value": 431, "density": { "enable": false, "value_area": 3945.7382081613637 } }, "color": { "value": "#ffffff" }, "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 }, "image": { "src": "https://johannlurf.net/%E2%98%85/johann_lurf_starfilm08.jpg", "width": 100, "height": 100 } }, "opacity": { "value": 0.5997522076405273, "random": false, "anim": { "enable": false, "speed": 5.274725274725275, "opacity_min": 0.1, "sync": true } }, "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } }, "line_linked": { "enable": false, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 6, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 2324.947488255008, "rotateY": 2886.1417095579413 } } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": false, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 400, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 80, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } } }, "retina_detect": false }); var count_particles, stats, update; stats = new Stats; stats.setMode(0); stats.domElement.style.position = 'absolute'; stats.domElement.style.left = '0px'; stats.domElement.style.top = '0px';  count_particles = document.querySelector('.js-count-particles'); update = function () { stats.begin(); stats.end(); if (window.pJSDom[0].pJS.particles && window.pJSDom[0].pJS.particles.array) { count_particles.innerText = window.pJSDom[0].pJS.particles.array.length; } requestAnimationFrame(update); }; requestAnimationFrame(update);;

const el = document.querySelector("#main");


window.onload = () =>{
    setTimeout(() => {
      anime.timeline({loop: false}).add({
        targets: '.spinner-box',
        scale: [1,14],
        opacity: [1,0],
        easing: "easeOutCirc",
        duration: 800,
        delay: (el, i) => 1000 * i
      });

    }, 700);
    
  
}
el.addEventListener("mousemove", (e) => {
  el.style.backgroundPositionX = -e.offsetX + "px";
  el.style.backgroundPositionY = -e.offsetY + "px";
});
setTimeout(() => {
    $(".ml15 .word").css("opacity:1");
    anime.timeline({loop: false})
  .add({
    targets: '.ml15 .word',
    scale: [14,1],
    opacity: [0,1],
    easing: "easeOutCirc",
    duration: 800,
    delay: (el, i) => 1000 * i
  });

  
}, 1000);

setTimeout(() => {
    $(".ml15 .tagline").css("opacity:1");
    anime.timeline({loop: false})
  .add({
    targets: '.ml15 .tagline',
    scale: [14,1],
    opacity: [0,1],
    easing: "easeOutCirc",
    duration: 800,
    delay: (el, i) => 1000 * i
  });
  $(".spinner-box").hide();
}, 1500);

var textWrapper = document.querySelector('.ml16');
textWrapper.innerHTML = textWrapper.textContent.replace(/\S/g, "<span class='letter'>$&</span>");
setTimeout(() => {
    
    anime.timeline({loop: true})
  .add({
    targets: '.ml16 .letter',
    translateY: [-100,0],
    opacity:[0,1],
    easing: "easeOutExpo",
    duration: 1400,
    delay: (el, i) => 30 * i
  }).add({
    targets: '.ml16 .letter',
    opacity:[1,0],
    easing: "easeOutExpo",
    duration: 1400,
    delay: (el, i) => 30 * i
  });
}, 2500);

// var spinnerBox = document.querySelector('.spinner-box');

// window.addEventListener('load', function() {

//   spinnerBox.parentElement.removeChild(spinnerBox);
// });