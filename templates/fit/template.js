/*
    FIT template
    (c) 2022 Radek Burget
*/

const Template = () => {

    let rewriteConfig = {
        properties: {
            footer: ''
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

    function initTemplate(show) {
        show.addStyle('css/theme/sky.css');
        show.addStyle('template/fit.css');
        const cfg = show.getPresentationConfig();
        if (cfg.template?.properties?.footer) {
            rewriteConfig.properties.footer = cfg.template?.properties?.footer;
        }
        show.getRevealConfig().rewrite = rewriteConfig;
    }

    return {
        id: 'fit',
        init: function(show) {
            initTemplate(show);
        }
    }

}

export default Template;
