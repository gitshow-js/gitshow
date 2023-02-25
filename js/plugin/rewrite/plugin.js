
/*
	Rewrite plugin for Reveal.js
	(c) 2022 Radek Burget <burgetr@fit.vut.cz>
 */

const Plugin = () => {
	
	const SLIDES_SELECTOR = '.reveal .slides section';

	let deck;
	let config;
	let properties;
	let rules;

	function rewriteAllSlides() {
		if (typeof config.rules !== 'undefined' && config.rules.length > 0) {
			var slides = document.querySelectorAll(SLIDES_SELECTOR);
			var props = { ...properties }; // clone properties for one-time rewrite
			props.indexh = 1;
			props.indexv = 1;
			props.totalIndex = 1;
			slides.forEach(function(slide) {
				if (slide.classList.contains('stack')) {
					var subslides = slide.querySelectorAll('section');
					props.indexv = 1;
					subslides.forEach(function(subslide) {
						rewriteSlide(subslide, props);
						props.indexv++;
						props.totalIndex++;
					});
				} else {
					rewriteSlide(slide, props);
					props.totalIndex++;
				}
				props.indexh++;
			});
		}
	}
	
	function rewriteSlide(slide, props) {
		// store the original content if not stored yet
		if (typeof slide.xedOrigState === 'undefined')
			slide.xedOrigState = slide.innerHTML;
		// operate on the original content
		let content = slide.xedOrigState;
		for (var i = 0; i < rules.length; i++) {
			var rule = rules[i];
			if (typeof rule.pattern !== 'undefined' && typeof rule.result !== 'undefined') {
				var regexp;
				if (rule.flags !== 'undefined')
					regexp = new RegExp(rule.pattern, rule.flags);
				else
					regexp = new RegExp(rule.pattern);
				
				//console.log(regexp);
				//console.log(properties);
				// check if the selector matches (if defined)
				if (typeof rule.match === 'undefined' || slide.matches(rule.match)) {
					if (rule.debug) {
						console.log('Before: ' + content);
					}

					var target = replaceProperties(rule.result, props);
					content = content.replace(regexp, target);

					if (rule.debug) {
						console.log('After: ' + content);
					}
				}
			}
		}
		slide.innerHTML = content;
	}
	
	function replaceProperties(src, props) {
		return src.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, function(match, p, offset, string) {
			return (props.hasOwnProperty(p)) ? props[p] : '';
		});
	}
	
	function updateProperties(event) {
		properties.indexh = event.indexh + 1;
		properties.indexv = event.indexv + 1;
		properties.totalIndex = deck.getSlidePastCount() + 1;
		properties.totalSlides = deck.getTotalSlides();
	}

	function initRewrite(reveal) {

		deck = reveal;
		config = deck.getConfig().rewrite || {};
		properties = config.properties || {};
		rules = config.rules || [];

		deck.addEventListener('ready', function(event) {
			updateProperties(event);
			rewriteAllSlides(); // pre-rewrite all slides
			rewriteSlide(event.currentSlide, properties);
		});
		deck.addEventListener('slidechanged', function(event) {
			updateProperties(event);
			rewriteSlide(event.currentSlide, properties);
		});
		
		if (rules.length === 0) {
			console.log('RevealRewrite: WARNING: no rewrite rules defined');
		}
	}

	return {
		id: 'RevealRewrite',
		init: function(deck) {
			initRewrite(deck);
		}
	}

};

export default Plugin;
