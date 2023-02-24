import Reveal from 'reveal.js';
import Markdown from 'reveal.js/plugin/markdown/markdown.esm.js';

class GitShow {
    
    init() { 
        console.log('Hello!');
        console.log(presentationConfig);
        const cfg = presentationConfig;
        this.main = document.getElementById('gitshow-main');
        if (cfg.contents) {
            if (cfg.contents.length > 0) {
                this.createContent(cfg.contents);
            }
            this.runReveal();
        } else {
            this.showError('Presentation config not found.');
        }
    }
    
    runReveal() {
        let deck = new Reveal({
            plugins: [ Markdown ]
         })
         deck.initialize();
    }

    createContent(contents) {
        let sections = '';
        for (let cont of contents) {
            sections += `<section data-markdown="${cont}" class="normal"></section>`;
        }
        this.main.innerHTML = '<div class="reveal"><div class="slides">'
            + sections
            + '</div></div>';
    }

    showError(msg) {
        this.main.innerHTML = '<strong>Error:</strong> ' + msg;
    }

}

export default GitShow;
