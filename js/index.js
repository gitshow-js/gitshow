import Reveal from 'reveal.js';
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js';
import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm.js';
import RevealMath from 'reveal.js/plugin/math/math.esm.js';

import RevealRewrite from './plugin/rewrite/plugin.js';
import RevealReferences from './plugin/references/plugin.js';

//let RevealSpotlight = require('./plugin/spotlight/spotlight.js');

/*<script src="plugin/rewrite/rewrite.js"></script>
<script src="plugin/references/references.js"></script>*/


class GitShow {
    
    init() { 
        console.log('Welcome to GitShow!');
        console.log('https://github.com/radkovo/gitshow');
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
        let rewriteConfig = {
            properties: {
                footer: 'Semantic Web Technology and the Web of Documents | Radek Burget | May 26, 2021'
            },
            rules: [
                /* typography */
                {
                    pattern: '--',
                    result: '&ndash;',
                    flags: 'g'
                },
                {
                    pattern: '\\.\\.\\.',
                    result: '&hellip;',
                    flags: 'g'
                },
                {
                    pattern: '``',
                    result: '&bdquo;',
                    flags: 'g'
                },
                {
                    pattern: '\'\'',
                    result: '&ldquo;',
                    flags: 'g'
                },
                /* custom elements */
                {
                    pattern: '@@([^@]+)@@', 
                    result: '<$1>',
                    flags: 'g'
                },
                /* fragments */
                {
                    pattern: '>\\?\\?', // block fragment: ?? at element start
                    result: ' class="fragment">',
                    flags: 'g'
                },
                {
                    pattern: '\\|\\|([^\\|]+)\\|\\|', // inline fragment: ||somecontent||
                    result: '<span class="fragment">$1</span>',
                    flags: 'g'

                },
                /* template */
                {
                    match: '.normal',
                    pattern: '$',
                    result: '</div><footer>{{footer}} <span class="slideno">{{totalIndex}} / {{totalSlides}}</span></footer>'
                },
                {
                    match: '.section',
                    pattern: '$',
                    result: '</div><footer>{{footer}} <span class="slideno">{{totalIndex}} / {{totalSlides}}</span></footer>'
                },
                {
                    match: '.normal',
                    pattern: '<h1',
                    result: "<header><h1"
                },
                {
                    match: '.normal',
                    pattern: '</h1>',
                    result: '</h1></header><div class="content">'
                }
            ]
        };

        let deck = new Reveal({
            width: 1920,
            height: 1080,
            margin: 0,

            hash: true,
            center: false,
            pdfMaxPagesPerSlide: 1,
            pdfSeparateFragments: false,

            plugins: [ RevealMarkdown, RevealHighlight, RevealNotes, RevealMath, RevealRewrite, RevealReferences ],
            rewrite: rewriteConfig
         });
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
