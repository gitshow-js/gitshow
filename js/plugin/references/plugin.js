/*
	References plugin for Reveal.js
	(c) 2022 Radek Burget <burgetr@fit.vut.cz>
 */

const Plugin = () => {
	
	const SLIDES_SELECTOR = '.reveal .slides section';
	const REFS_ITEM_SELECTOR = '.r-refs [data-key]';
	const KEY_ATTRIBUTE = 'data-key';
	const INDEX_ATTRIBUTE = 'data-index';
	const refs = {};
	let next_ref_index = 1; 
	let deck;

	function rewriteAllSlides() {
		var slides = document.querySelectorAll(SLIDES_SELECTOR);
		slides.forEach(function(slide) {
			if (slide.classList.contains('stack')) {
				var subslides = slide.querySelectorAll('section');
				subslides.forEach(function(subslide) {
					rewriteSlide(subslide, refs);
				});
			} else {
				rewriteSlide(slide, refs);
			}
		});
	}
	
	function rewriteSlide(slide, refs) {
		// store the original content if not stored yet
		if (typeof slide.xrefsOrigState === 'undefined')
			slide.xrefsOrigState = slide.innerHTML;
		// operate on the original content
		let content = slide.xrefsOrigState;
		content = replaceReferences(content, refs); // [@something]
		content = replaceOccurrences(content, refs); // [:@something]
		slide.innerHTML = content;
	}
	
	function replaceReferences(src, refs) {
		return src.replace(/\[\@([a-zA-Z0-9_]+)\]/g, function(match, p, offset, string) {
			if (refs.hasOwnProperty(p)) {
				if (refs[p].index === -1) {
					refs[p].index = next_ref_index++;
				}
				return `<span class="r-ref" title="${refs[p].text}">[${refs[p].index}]</span>`;
			} else {
				return '[??]';
			}
		});
	}
	
	function replaceOccurrences(src, refs) {
		return src.replace(/\[\:\@([a-zA-Z0-9_]+)\]/g, function(match, p, offset, string) {
			if (refs.hasOwnProperty(p)) {
				return `<span class="r-ref-occurrence">${refs[p].html}</span>`;
			} else {
				return '(??)';
			}
		});
	}
	
	function loadReferences() {
		let refitems = document.querySelectorAll(REFS_ITEM_SELECTOR);
		let i = 1;
		for (let child of refitems) {
			if (child.hasAttribute(KEY_ATTRIBUTE)) {
				child.setAttribute(INDEX_ATTRIBUTE, (i++));
				let key = child.getAttribute(KEY_ATTRIBUTE);
				refs[key] = {
					index: child.getAttribute(INDEX_ATTRIBUTE), 
					key: key,
					text: child.textContent,
					html: child.innerHTML
				};
			}
		}
	}

	function initReferences(reveal) {
		deck = reveal;
		loadReferences();
		deck.addEventListener('ready', function(event) {
			rewriteAllSlides(); // pre-rewrite all slides
		});
		deck.addEventListener('slidechanged', function(event) {
			rewriteSlide(event.currentSlide, refs);
		});
	}

	return {
		id: 'references',
		init: function(deck) {
			initReferences(deck);
		}
	}

};

export default Plugin;
