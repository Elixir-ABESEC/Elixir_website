/**
 * Arctext.js
 * A jQuery plugin for curved text
 * http://www.codrops.com
 *
 * Copyright 2011, Pedro Botelho / Codrops
 * Free to use under the MIT license.
 *
 * Date: Mon Jan 23 2012
 */

(function( $, undefined ) {

	/*!	
	* FitText.js 1.0
	*
	* Copyright 2011, Dave Rupert http://daverupert.com
	* Released under the WTFPL license 
	* http://sam.zoy.org/wtfpl/
	*
	* Date: Thu May 05 14:23:00 2011 -0600
	*/
	$.fn.fitText = function( kompressor, options ) {

		var settings = {
			'minFontSize' : Number.NEGATIVE_INFINITY,
			'maxFontSize' : Number.POSITIVE_INFINITY
		};

		return this.each(function() {
			var $this = $(this);              // store the object
			var compressor = kompressor || 1; // set the compressor

			if ( options ) { 
				$.extend( settings, options );
			}

			// Resizer() resizes items based on the object width divided by the compressor * 10
			var resizer = function () {
				$this.css('font-size', Math.max(Math.min($this.width() / (compressor*10), parseFloat(settings.maxFontSize)), parseFloat(settings.minFontSize)));
			};

			// Call once to set.
			resizer();

			// Call on resize. Opera debounces their resize by default. 
			$(window).resize(resizer);
		});

	};

	/*
	 * Lettering plugin
	 *
	 * changed injector function:
	 *   add &nbsp; for empty chars.
	 */
	function injector(t, splitter, klass, after) {
		var a = t.text().split(splitter), inject = '', emptyclass;
		if (a.length) {
			$(a).each(function(i, item) {
				emptyclass = '';
				if(item === ' ') {
					emptyclass = ' empty';
					item='&nbsp;';
				}	
				inject += '<span class="'+klass+(i+1)+emptyclass+'">'+item+'</span>'+after;
			});	
			t.empty().append(inject);
		}
	}

	var methods 			= {
		init : function() {

			return this.each(function() {
				injector($(this), '', 'char', '');
			});

		},

		words : function() {

			return this.each(function() {
				injector($(this), ' ', 'word', ' ');
			});

		},

		lines : function() {

			return this.each(function() {
				var r = "eefec303079ad17405c889e092e105b0";
				// Because it's hard to split a <br/> tag consistently across browsers,
				// (*ahem* IE *ahem*), we replaces all <br/> instances with an md5 hash 
				// (of the word "split").  If you're trying to use this plugin on that 
				// md5 hash string, it will fail because you're being ridiculous.
				injector($(this).children("br").replaceWith(r).end(), r, 'line', '');
			});

		}
	};

	$.fn.lettering 			= function( method ) {
		// Method calling logic
		if ( method && methods[method] ) {
			return methods[ method ].apply( this, [].slice.call( arguments, 1 ));
		} else if ( method === 'letters' || ! method ) {
			return methods.init.apply( this, [].slice.call( arguments, 0 ) ); // always pass an array
		}
		$.error( 'Method ' +  method + ' does not exist on jQuery.lettering' );
		return this;
	};

	/*
	 * Arctext object.
	 */
	$.Arctext 				= function( options, element ) {

		this.$el	= $( element );
		this._init( options );

	};

	$.Arctext.defaults 		= {
		radius	: 0, 	// the minimum value allowed is half of the word length. if set to -1, the word will be straight.
		dir		: 1,	// 1: curve is down, -1: curve is up.
		rotate	: true,	// if true each letter will be rotated.
		fitText	: false // if you wanna try out the fitText plugin (http://fittextjs.com/) set this to true. Don't forget the wrapper should be fluid.
	};

	$.Arctext.prototype 	= {
		_init 				: function( options ) {

			this.options 		= $.extend( true, {}, $.Arctext.defaults, options );

			// apply the lettering plugin.
			this._applyLettering();

			this.$el.data( 'arctext', true );

			// calculate values
			this._calc();

			// apply transformation.
			this._rotateWord();

			// load the events
			this._loadEvents();

		},
		_applyLettering		: function() {

			this.$el.lettering();

			if( this.options.fitText )
				this.$el.fitText();

			this.$letters	= this.$el.find('span').css('display', 'inline-block');

		},
		_calc				: function() {

			if( this.options.radius === -1 )
				return false;

			// calculate word / arc sizes & distances.
			this._calcBase();

			// get final values for each letter.
			this._calcLetters();

		},
		_calcBase			: function() {

			// total word width (sum of letters widths)
			this.dtWord		= 0;

			var _self 		= this;

			this.$letters.each( function(i) {

				var $letter 		= $(this),
						letterWidth		= $letter.outerWidth( true );

				_self.dtWord += letterWidth;

				// save the center point of each letter:
				$letter.data( 'center', _self.dtWord - letterWidth / 2 );

			});

			// the middle point of the word.
			var centerWord = this.dtWord / 2;

			// check radius : the minimum value allowed is half of the word length.
			if( this.options.radius < centerWord )
				this.options.radius = centerWord;

			// total arc segment length, where the letters will be placed.
			this.dtArcBase	= this.dtWord;

			// calculate the arc (length) that goes from the beginning of the first letter (x=0) to the end of the last letter (x=this.dtWord).
			// first lets calculate the angle for the triangle with base = this.dtArcBase and the other two sides = radius.
			var angle		= 2 * Math.asin( this.dtArcBase / ( 2 * this.options.radius ) );

			// given the formula: L(ength) = R(adius) x A(ngle), we calculate our arc length.
			this.dtArc		= this.options.radius * angle;

		},
		_calcLetters		: function() {

			var _self 		= this,
					iteratorX 	= 0;

			this.$letters.each( function(i) {

				var $letter 		= $(this),
						// calculate each letter's semi arc given the percentage of each letter on the original word.
						dtArcLetter		= ( $letter.outerWidth( true ) / _self.dtWord ) * _self.dtArc,
						// angle for the dtArcLetter given our radius.
						beta			= dtArcLetter / _self.options.radius,
						// distance from the middle point of the semi arc's chord to the center of the circle.
						// this is going to be the place where the letter will be positioned.
						h				= _self.options.radius * ( Math.cos( beta / 2 ) ),
						// angle formed by the x-axis and the left most point of the chord.
						alpha			= Math.acos( ( _self.dtWord / 2 - iteratorX ) / _self.options.radius ),
						// angle formed by the x-axis and the right most point of the chord.
						theta 			= alpha + beta / 2,
						// distances of the sides of the triangle formed by h and the orthogonal to the x-axis.
						x				= Math.cos( theta ) * h,
						y				= Math.sin( theta ) * h,
						// the value for the coordinate x of the middle point of the chord.
						xpos			= iteratorX + Math.abs( _self.dtWord / 2 - x - iteratorX ),
						// finally, calculate how much to translate each letter, given its center point.
						// also calculate the angle to rotate the letter accordingly.
						xval	= 0| xpos - $letter.data( 'center' ),
						yval	= 0| _self.options.radius - y,
						angle 	= ( _self.options.rotate ) ? 0| -Math.asin( x / _self.options.radius ) * ( 180 / Math.PI ) : 0;

				// the iteratorX will be positioned on the second point of each semi arc
				iteratorX = 2 * xpos - iteratorX;

				// save these values
				$letter.data({
					x	: xval,
					y	: ( _self.options.dir === 1 ) ? yval : -yval,
					a	: ( _self.options.dir === 1 ) ? angle : -angle
				});

			});

		},
		_rotateWord			: function( animation ) {

			if( !this.$el.data('arctext') ) return false;

			var _self = this;

			this.$letters.each( function(i) {

				var $letter 		= $(this),
						transformation	= ( _self.options.radius === -1 ) ? 'none' : 'translateX(' + $letter.data('x') + 'px) translateY(' + $letter.data('y') + 'px) rotate(' + $letter.data('a') + 'deg)',
						transition		= ( animation ) ? 'all ' + ( animation.speed || 0 ) + 'ms ' + ( animation.easing || 'linear' ) : 'none';

				$letter.css({
					'-webkit-transition' : transition,
					'-moz-transition' : transition,
					'-o-transition' : transition,
					'-ms-transition' : transition,
					'transition' : transition
				})
					.css({
					'-webkit-transform' : transformation,
					'-moz-transform' : transformation,
					'-o-transform' : transformation,
					'-ms-transform' : transformation,
					'transform' : transformation
				});

			});

		},
		_loadEvents			: function() {

			if( this.options.fitText ) {

				var _self = this;

				$(window).on( 'resize.arctext', function() {

					_self._calc();

					// apply transformation.
					_self._rotateWord();

				});

			}

		},
		set					: function( opts ) {

			if( !opts.radius &&  
				 !opts.dir &&
				 opts.rotate === 'undefined' ) {
				return false;
			}

			this.options.radius = opts.radius || this.options.radius;
			this.options.dir 	= opts.dir || this.options.dir;

			if( opts.rotate !== undefined ) {
				this.options.rotate = opts.rotate;
			}	

			this._calc();

			this._rotateWord( opts.animation );

		},
		destroy				: function() {

			this.options.radius	= -1;
			this._rotateWord();
			this.$letters.removeData('x y a center');
			this.$el.removeData('arctext');
			$(window).off('.arctext');

		}
	};

	var logError 			= function( message ) {
		if ( this.console ) {
			console.error( message );
		}
	};

	$.fn.arctext			= function( options ) {

		if ( typeof options === 'string' ) {

			var args = Array.prototype.slice.call( arguments, 1 );

			this.each(function() {

				var instance = $.data( this, 'arctext' );

				if ( !instance ) {
					logError( "cannot call methods on arctext prior to initialization; " +
									 "attempted to call method '" + options + "'" );
					return;
				}

				if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
					logError( "no such method '" + options + "' for arctext instance" );
					return;
				}

				instance[ options ].apply( instance, args );

			});

		} 
		else {

			this.each(function() {

				var instance = $.data( this, 'arctext' );
				if ( !instance ) {
					$.data( this, 'arctext', new $.Arctext( options, this ) );
				}
			});

		}

		return this;

	};

})( jQuery );


/*
 * CircleType 0.36
 * Peter Hrynkow
 * Copyright 2014, Licensed GPL & MIT
 *
*/

$.fn.circleType = function(options) {

	var self = this,
			settings = {
				dir: 1,
				position: 'relative',
			};
	if (typeof($.fn.lettering) !== 'function') {
		console.log('Lettering.js is required');
		return;
	}
	return this.each(function () {

		if (options) { 
			$.extend(settings, options);
		}
		var elem = this, 
				delta = (180 / Math.PI),
				fs = parseInt($(elem).css('font-size'), 10),
				ch = parseInt($(elem).css('line-height'), 10) || fs,
				txt = elem.innerHTML.replace(/^\s+|\s+$/g, '').replace(/\s/g, '&nbsp;'),
				letters, 
				center;

		elem.innerHTML = txt
		$(elem).lettering();

		elem.style.position =  settings.position;

		letters = elem.getElementsByTagName('span');
		center = Math.floor(letters.length / 2)

		var layout = function () {
			var tw = 0, 
					i,
					offset = 0,
					minRadius, 
					origin, 
					innerRadius,
					l, style, r, transform;

			for (i = 0; i < letters.length; i++) {
				tw += letters[i].offsetWidth;
			}
			minRadius = (tw / Math.PI) / 2 + ch;

			if (settings.fluid && !settings.fitText) {
				settings.radius = Math.max(elem.offsetWidth / 2, minRadius);
			}    
			else if (!settings.radius) {
				settings.radius = minRadius;
			}   

			if (settings.dir === -1) {
				origin = 'center ' + (-settings.radius + ch) / fs + 'em';
			} else {
				origin = 'center ' + settings.radius / fs + 'em';
			}

			innerRadius = settings.radius - ch;

			for (i = 0; i < letters.length; i++) {
				l = letters[i];
				offset += l.offsetWidth / 2 / innerRadius * delta;
				l.rot = offset;                      
				offset += l.offsetWidth / 2 / innerRadius * delta;
			}   
			for (i = 0; i < letters.length; i++) {
				l = letters[i]
				style = l.style
				r = (-offset * settings.dir / 2) + l.rot * settings.dir            
				transform = 'rotate(' + r + 'deg)';

				style.position = 'absolute';
				style.left = '50%';
				style.marginLeft = -(l.offsetWidth / 2) / fs + 'em';

				style.webkitTransform = transform;
				style.MozTransform = transform;
				style.OTransform = transform;
				style.msTransform = transform;
				style.transform = transform;

				style.webkitTransformOrigin = origin;
				style.MozTransformOrigin = origin;
				style.OTransformOrigin = origin;
				style.msTransformOrigin = origin;
				style.transformOrigin = origin;
				if(settings.dir === -1) {
					style.bottom = 0;
				}
			}

			if (settings.fitText) {
				if (typeof($.fn.fitText) !== 'function') {
					console.log('FitText.js is required when using the fitText option');
				} else {
					$(elem).fitText();
					$(window).resize(function () {
						updateHeight();
					});
				}
			}    
			updateHeight();

			if (typeof settings.callback === 'function') {
				// Execute our callback with the element we transformed as `this`
				settings.callback.apply(elem);
			}
		};

		var getBounds = function (elem) {
			var docElem = document.documentElement,
					box = elem.getBoundingClientRect();
			return {
				top: box.top + window.pageYOffset - docElem.clientTop,
				left: box.left + window.pageXOffset - docElem.clientLeft,
				height: box.height
			};
		};       

		var updateHeight = function () {
			var mid = getBounds(letters[center]),
					first = getBounds(letters[0]),
					h;
			if (mid.top < first.top) {
				h = first.top - mid.top + first.height;
			} else {
				h = mid.top - first.top + first.height;
			}
			elem.style.height = h + 'px';  
		}

		if (settings.fluid && !settings.fitText) {
			$(window).resize(function () {
				layout();
			});
		}    

		if (document.readyState !== "complete") {
			elem.style.visibility = 'hidden';
			$(window).load(function () {
				elem.style.visibility = 'visible';
				layout();
			});
		} else {
			layout();
		}
	});
};


/*global jQuery */
/*!
* Lettering.JS 0.6.1
*
* Copyright 2010, Dave Rupert http://daverupert.com
* Released under the WTFPL license
* http://sam.zoy.org/wtfpl/
*
* Thanks to Paul Irish - http://paulirish.com - for the feedback.
*
* Date: Mon Sep 20 17:14:00 2010 -0600
*/
(function($){
	function injector(t, splitter, klass, after) {
		var text = t.text()
		, a = text.split(splitter)
		, inject = '';
		if (a.length) {
			$(a).each(function(i, item) {
				inject += '<span class="'+klass+(i+1)+'" aria-hidden="true">'+item+'</span>'+after;
			});
			t.attr('aria-label',text)
				.empty()
				.append(inject)

		}
	}


	var methods = {
		init : function() {

			return this.each(function() {
				injector($(this), '', 'char', '');
			});

		},

		words : function() {

			return this.each(function() {
				injector($(this), ' ', 'word', ' ');
			});

		},

		lines : function() {

			return this.each(function() {
				var r = "eefec303079ad17405c889e092e105b0";
				// Because it's hard to split a <br/> tag consistently across browsers,
				// (*ahem* IE *ahem*), we replace all <br/> instances with an md5 hash
				// (of the word "split").  If you're trying to use this plugin on that
				// md5 hash string, it will fail because you're being ridiculous.
				injector($(this).children("br").replaceWith(r).end(), r, 'line', '');
			});

		}
	};

	$.fn.lettering = function( method ) {
		// Method calling logic
		if ( method && methods[method] ) {
			return methods[ method ].apply( this, [].slice.call( arguments, 1 ));
		} else if ( method === 'letters' || ! method ) {
			return methods.init.apply( this, [].slice.call( arguments, 0 ) ); // always pass an array
		}
		$.error( 'Method ' +  method + ' does not exist on jQuery.lettering' );
		return this;
	};

})(jQuery);




/*global jQuery */
/*!	
* FitText.js 1.1
*
* Copyright 2011, Dave Rupert http://daverupert.com
* Released under the WTFPL license 
* http://sam.zoy.org/wtfpl/
*
* Date: Thu May 05 14:23:00 2011 -0600
*/



(function( $ ){

	$.fn.fitText = function( kompressor, options ) {

		// Setup options
		var compressor = kompressor || 1,
				settings = $.extend({
					'minFontSize' : Number.NEGATIVE_INFINITY,
					'maxFontSize' : Number.POSITIVE_INFINITY
				}, options);

		return this.each(function(){

			// Store the object
			var $this = $(this); 

			// Resizer() resizes items based on the object width divided by the compressor * 10
			var resizer = function () {
				$this.css('font-size', Math.max(Math.min($this.width() / (compressor*10), parseFloat(settings.maxFontSize)), parseFloat(settings.minFontSize)));
			};

			// Call once to set.
			resizer();

			// Call on resize. Opera debounces their resize by default. 
			$(window).on('resize', resizer);

		});

	};

})( jQuery );





var items = $('.circle .item'),
		itemLen = items.length,
		wheelBinded = true, //flag to mark mousewheel activation
		mouseDragged = false; //flag to mark swipe activation


items.each(function(){
	var $this = $(this);
	//curve the text
	//$this.find('h4').arctext({radius: 150});
	$this.find('span').circleType({radius:290});

	if(itemLen > 1){
		setSiblings($this);
	}

});

//function to set sequence class
function setSiblings(currEl){
	var $this = currEl;

	if($this.hasClass('active')){

		//clear sequence class from active item
		$this.removeClass('prev next');

		//get the previous and next elem to appear next
		var $next = $this.next('.item'),
				$prev = $this.prev('.item');

		//if active item is last item,
		//set next item to first item in the list
		if($next.length <= 0 )
			$next = $this.siblings(".item:first");

		//if active item is last item,
		//set prev to the last item in the list
		if($prev.length <= 0 )
			$prev = $this.siblings(".item:last");


		if(itemLen == 2){
			if($prev.length <= 0) $prev = $next;
			else $next = $prev;

			$prev.addClass('prev next').removeClass('active');

		}
		else if(itemLen > 2){
			//set sequence class to all item
			$this.siblings('.item').removeClass('prev next active');
			$next.addClass('next').removeClass('prev active');
			$prev.addClass('prev').removeClass('next active');
		}

	}	

}

//function to set center content
function setCenter(activeEl){

	var $active = $(activeEl) ,
			$activeCenter = $('.cc.active' ),
			$siblings = $activeCenter.siblings('.cc');

	var tl = new TimelineMax();
	tl.to($activeCenter,2, {className:"-=active"}, 0)
		.to($siblings, 1, {className: "+=active"}, 0.5);

}


//function to toggle spinwheel event activation
function enableSpinwheel(currEl, nextEl) { 

	//POST EVENT HANDLING

	//set current active item
	currEl.removeClass('active');
	nextEl.addClass('active');

	//recheck sequence classes
	if(itemLen > 1) setSiblings(nextEl);


	//ENABLE EVENT ACTIVATION
	wheelBinded = true;
};

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