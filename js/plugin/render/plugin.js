
/*
	Render plugin for Reveal.js
	2025, Jiri Hynek <hynek@vut.cz>

	Area which renders code snippets using iframes.
 */

const Plugin = () => {

	function rewriteSlide(slide) {
		let renderElements = slide.querySelectorAll(".code-render");
		//console.log('render code', renderElements);
		renderElements.forEach(function (element) {
			let url = element.getAttribute('src');
			if (url) {
				// embed iframe
				let iframe = document.createElement('iframe');
				iframe.setAttribute('src', url);
				iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
				element.innerHTML = ''; // clear the element
				element.appendChild(iframe);
			} else {
				// embed code
				let code = element.innerHTML;
				if (code) {
					const tags = element.getAttribute('tags') === "true" ? true : false;

					let style = element.getAttribute('default-style');
					
					if(tags) {
						// replace all strings which begins with &lt; and ends with &gt;
						code = code.replace(/&lt;/g, '<span class="code-tag">&lt;').replace(/&gt;/g, '&gt;</span>');

						style = (style ?? "") + 
						` .code-tag { color: gray; font-family: monospace; font-size: 1rem; font-weight: bold; }`
					}

					code = `
						<!DOCTYPE html>
						<html>
						<head>
							<meta charset="utf-8">
							<title>Code Preview</title>
							<style>
								html {
									font-size: 2rem
								}
									
								${style ? style : ""}
							</style>
						</head>
						<body>
							${code}
						</body>
						</html>
					`
					let blob = new Blob([code], { type: 'text/html' });
					let url = URL.createObjectURL(blob);
					let iframe = document.createElement('iframe');
					iframe.setAttribute('src', url);
					iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms');
					element.innerHTML = ''; // clear the element
					element.appendChild(iframe);
				}
			}
			let resizable = element.getAttribute('resizable') || 'false';
			if (resizable === 'true') {
				let resizer = document.createElement('div');
				resizer.classList.add('resizer');
				resizer.addEventListener('mousedown', function (e) {
					e.preventDefault();

					const startX = e.clientX;
					const startY = e.clientY;
					const startWidth = element.offsetWidth;
					const startHeight = element.offsetHeight;
					const styles = Object.fromEntries(
						document.body.getAttribute('style')
							.split(';')
							.filter(rule => rule.trim()) // remove empty strings
							.map(rule => {
								const [property, value] = rule.split(':');
								return [property.trim(), value.trim()];
							})
					);
					const scale = styles['--slide-scale'] ? parseFloat(styles['--slide-scale']) : 1;

					const onMouseMove = (e) => {
						const newWidth = startWidth + ((e.clientX - startX) / scale);
						element.style.width = `${newWidth}px`;

						const newHeight = startHeight + ((e.clientY - startY) / scale);
						element.style.height = `${newHeight}px`;
					};

					const onMouseUp = () => {
						document.removeEventListener('mousemove', onMouseMove);
						document.removeEventListener('mouseup', onMouseUp);
					};

					document.addEventListener('mousemove', onMouseMove);
					document.addEventListener('mouseup', onMouseUp);
				});
				element.appendChild(resizer);
				element.classList.add('resizable');
			}
		});
	}

	function initRender(reveal) {

		reveal.addEventListener('ready', function (event) {
			rewriteSlide(event.currentSlide);
		});
		reveal.addEventListener('slidechanged', function (event) {
			rewriteSlide(event.currentSlide);
		});
	}

	return {
		id: 'RevealRender',
		init: function (deck) {
			initRender(deck);
		}
	}

};

export default Plugin;
