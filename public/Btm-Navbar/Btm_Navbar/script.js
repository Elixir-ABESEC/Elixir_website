"use strict";

console.clear();
Splitting({
  target: '.planet-title h1',
  by: 'chars'
});
const elApp = document.querySelector('#app');
const elPlanets = Array.from(document.querySelectorAll('[data-planet]')).reduce((acc, el) => {
  const planet = el.dataset.planet;
  acc[planet] = el;
  return acc;
}, {});
const planetKeys = Object.keys(elPlanets);

function getDetails(planet) {
  // tilt, gravity, hours
  const details = Array.from(elPlanets[planet].querySelectorAll(`[data-detail]`)).reduce((acc, el) => {
    acc[el.dataset.detail] = el.innerHTML.trim();
    return acc;
  }, {
    planet
  });
  return details;
} // ...........


let currentPlanetIndex = 0;
let currentPlanet = getDetails('Events');

function selectPlanet(planet) {
  const prevPlanet = currentPlanet;
  const elActive = document.querySelector('[data-active]');
  delete elActive.dataset.active;
  const elPlanet = elPlanets[planet];
  elPlanet.dataset.active = true;
  currentPlanet = getDetails(elPlanet.dataset.planet);
  console.log(prevPlanet, currentPlanet);
  const elHoursDetail = elPlanet.querySelector('[data-detail="hours"]');
  animate.fromTo({
    from: +prevPlanet.hours,
    to: +currentPlanet.hours
  }, value => {
    elHoursDetail.innerHTML = Math.round(value);
  });
  const elTiltDetail = elPlanet.querySelector('[data-detail="tilt"]');
  animate.fromTo({
    from: +prevPlanet.tilt,
    to: +currentPlanet.tilt
  }, value => {
    elTiltDetail.innerHTML = value.toFixed(2);
  });
  const elGravityDetail = elPlanet.querySelector('[data-detail="gravity"]');
  animate.fromTo({
    from: +prevPlanet.gravity,
    to: +currentPlanet.gravity
  }, value => {
    elGravityDetail.innerHTML = value.toFixed(1);
  });
}

function selectPlanetByIndex(i) {
  currentPlanetIndex = i;
  elApp.style.setProperty('--active', i);
  selectPlanet(planetKeys[i]);
} // document.body.addEventListener('click', () => {
//   currentPlanetIndex = (currentPlanetIndex + 1) % planetKeys.length;
//   selectPlanet(planetKeys[currentPlanetIndex]);
// });

/* ---------------------------------- */


function animate(duration, fn) {
  const start = performance.now();
  const ticks = Math.ceil(duration / 16.666667);
  let progress = 0; // between 0 and 1, +/-

  function tick(now) {
    if (progress >= 1) {
      fn(1);
      return;
    }

    const elapsed = now - start;
    progress = elapsed / duration; // callback

    fn(progress); // number between 0 and 1

    requestAnimationFrame(tick); // every 16.6666667 ms
  }

  tick(start);
}

function easing(progress) {
  return (1 - Math.cos(progress * Math.PI)) / 2;
}

const animationDefaults = {
  duration: 1000,
  easing
};

animate.fromTo = ({
  from,
  to,
  easing,
  duration
}, fn) => {
  easing = easing || animationDefaults.easing;
  duration = duration || animationDefaults.duration;
  const delta = +to - +from;
  return animate(duration, progress => fn(from + easing(progress) * delta));
};
/* ---------------------------------- */


const svgNS = 'http://www.w3.org/2000/svg';
const elSvgNav = document.querySelector('.planet-nav svg');
const elTspans = [...document.querySelectorAll('tspan')];
;
const length = elTspans.length - 1;
elSvgNav.style.setProperty('--length', length); // Getting the length for distributing the text along the path

const elNavPath = document.querySelector('#navPath');
const elLastTspan = elTspans[length];
const navPathLength = elNavPath.getTotalLength() - elLastTspan.getComputedTextLength();
elTspans.forEach((tspan, i) => {
  let percent = i / length;
  tspan.setAttribute('x', percent * navPathLength);
  tspan.setAttributeNS(svgNS, 'x', percent * navPathLength);
  tspan.addEventListener('click', e => {
    e.preventDefault();
    selectPlanetByIndex(i);
  });
});
var items = $('.circle .item'),
		itemLen = items.length,
		wheelBinded = true, //flag to mark mousewheel activation
		mouseDragged = false; //flag to mark swipe activation


function spinNext(){

	//get current item
	var curr = $('.item.active'),
			next = $('.item.next'); //get next item

	var	tl = new TimelineMax({ 
		onCompleteParams: [curr, next],
		onComplete: enableSpinwheel 
	}).pause();

	//next spin animation
	tl
		.to(curr, 2, {rotation: -180}, 0)	
		.fromTo(next, 2, {rotation: 180}, {rotation: 0}, 0);

	//if there is next item, do animation
	//otherwise, enable Spinwheel
	if( next.length > 0 ){
		setCenter(next);
		tl.play();

	} else {
		console.log('last-item');
		enableSpinwheel();
	}
}

function spinPrev(){

	//get current item
	var curr = $('.item.active'),
			prev = $('.item.prev');

	var	tl = new TimelineMax({ 
		onCompleteParams: [curr, prev],
		onComplete: enableSpinwheel  
	}).pause();


	//spin animation
	tl
		.to(curr, 2, {rotation: 180}, 0)
		.fromTo(prev, 2, {rotation: -180}, {rotation: 0}, 0);

	//if there is previous item, do animation
	//otherwise, enable Spinwheel
	if( prev.length > 0 ){
		setCenter(prev);
		tl.play();
	} else {
		console.log('first-item');
		enableSpinwheel();
	}
}

//bind mousewheel event
$('#spinning-wheel').on("mousewheel", function(e) {

	//if activation enabled
	if(wheelBinded){

		wheelBinded = false;

		//if scroll direction is up
		//show previous item
		if(e.deltaY > 0 ){ spinPrev(); }


		//if scroll direction is down
		//show next item
		if(e.deltaY < 0 ){ spinNext(); }

	}

});


var touchDown = false,
		touchPos = null,
		$spinwheel = $('#spinning-wheel');

$spinwheel.on( "touchstart mousedown", function ( e ) {
	touchDown = true;
	touchPos = {
		x: e.pageX,
		y: e.pageY
	};	
} );

$(document).on( "touchend mouseup", function (e) {
	touchDown = false;
	touchPos = null;
} );

$spinwheel.on( "touchmove mousemove", function ( e ) {
	if ( !wheelBinded ) { return;}

	//get current position
	var x = e.pageX,
			y = e.pageY;

	if(touchPos != null){

		//get swipe direction
		var dirX = (x > touchPos.x) ? 1 : -1, // 1 == right
				dirY = (y > touchPos.y) ? 1 : -1; // 1 == down

		//get swipe offset
		var distX = Math.abs(touchPos.x - x),
				distY = Math.abs(touchPos.y - y);

		if(distX > 50 || distY > 50){

			//if swipe right and down
			if( (dirX > 0 && dirY > 0) || (dirX > 0 && dirY < 0) ) {
				wheelBinded = false;
				spinNext();
			}
			//swipe left and up
			else if((dirX < 0 && dirY < 0) || (dirX < 0 && dirY > 0) ){
				wheelBinded = false;
				spinPrev();
			}

		}

	}


} );


$('#wheel-next').on('click', function(e){

	if(wheelBinded){
		wheelBinded = false;
		spinNext();
	}

});

$('#wheel-prev').on('click', function(e){
	
	if(wheelBinded){
		wheelBinded = false;
		spinPrev();
	}
	
});
