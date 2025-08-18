
/*
	Footer plugin for Reveal.js
	2025, Jiri Hynek <hynek@vut.cz>

	It adds a header, a content element and a footer to each slide
	and moves notes from the slide to the footer.
 */

const Plugin = () => {

	let config;

	function processContent(reveal, slide) {
		// get content element
		let content = slide.querySelector("div.content");
		if(!content) {
			content = document.createElement("div");
			content.classList.add("content");
			// move all content from slide to content element
			while (slide.firstChild) {
				content.appendChild(slide.firstChild);
			}
			slide.appendChild(content);
		}
	}

	function processHeader(reveal, slide) {
		// get header element
		let header = slide.querySelector("header");
		if(!header) {
			header = document.createElement("header");
			// move all header content from slide to header element
			let h1 = slide.querySelector("h1");
			if (h1) {
				//h1.parentNode.removeChild(h1);
				header.appendChild(h1);
			}
		}
		slide.insertBefore(header, slide.firstChild);
	}

	function processFooter(reveal, slide) {
		// get footer element
		let footer = slide.querySelector("footer");
		if(!footer) {
			footer = document.createElement("footer");
			if (config.footer?.label && config.footer.label.length > 0) {
				addFooterLabel(footer);
			}
			addFooterNotes(reveal, slide, footer);
			if(config.footer?.numbering) {
				addSlideNumber(reveal, slide, footer);
			}
		}
		slide.appendChild(footer);
	}

	function addSlideNumber(reveal, slide, footer) {
		// get slide number
		const indices = reveal.getIndices(slide);
		const h = indices.h+1;
		const ht = reveal.getHorizontalSlides().length;
		const v = indices.v ? "." + (indices.v+1) : "";
		const slideNumber = h + v + " / " + ht;

		// add slide number to footer
		footer.querySelector(".slideno")?.remove();
		const slideNo = document.createElement("div");
		slideNo.classList.add("slideno");
		slideNo.textContent = slideNumber;
		footer.appendChild(slideNo);
	}

	function addFooterNotes(reveal, slide, footer) {
		// get notes container
		let notes = footer.querySelector("div.notes");
		if(!notes) {
			notes = document.createElement("div");
			notes.classList.add("notes");
			footer.appendChild(notes);
		}

		// get notes
		slide.querySelectorAll(".note").forEach(function(note) {
			//note.parentNode.removeChild(note);
			notes.appendChild(note);
		});
	}

	function addFooterLabel(footer) {
		// get label
		let label = footer.querySelector("div.label");
		if(!label) {
			label = document.createElement("div");
			label.classList.add("label");
			label.textContent = config.footer.label;
			footer.appendChild(label);
		}
	}

	function rewriteSlide(reveal, slide) {
		processContent(reveal, slide);
		processHeader(reveal, slide);
		processFooter(reveal, slide);
	}

	function initFooter(reveal) {

		config = reveal.getConfig().layout || {};

		reveal.addEventListener('ready', function(event) {
			rewriteSlide(reveal, event.currentSlide);
		});
		reveal.addEventListener('slidechanged', function(event) {
			rewriteSlide(reveal, event.currentSlide);
		});
	}

	return {
		id: 'RevealLayout',
		init: function(deck) {
			initFooter(deck);
		}
	}
};

export default Plugin;
