import Reveal from 'reveal.js';
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.esm.js';
import RevealNotes from 'reveal.js/plugin/notes/notes.esm.js';
import RevealHighlight from 'reveal.js/plugin/highlight/highlight.esm.js';
import RevealMath from 'reveal.js/plugin/math/math.esm.js';
import RevealSearch from 'reveal.js/plugin/search/search.esm.js';
import RevealZoom from 'reveal.js/plugin/zoom/zoom.esm.js';

import GitShowRewrite from './plugin/rewrite/plugin.js';
import GitShowReferences from './plugin/references/plugin.js';
import GitShowRender from './plugin/render/plugin.js';
import GitShowMonaco from "./plugin/monaco/plugin.js";
import GitShowLayout from "./plugin/layout/plugin.js";

//let RevealSpotlight = require('./plugin/spotlight/spotlight.js');


class GitShow {

    presentationConfig = {};
    template = null;

    availablePlugins = [
        // built-in plugins
        RevealMarkdown,
        RevealHighlight,
        RevealNotes,
        RevealMath.MathJax2,
        RevealMath.MathJax3,
        RevealMath.KaTeX,
        RevealSearch,
        RevealZoom,
        // additional GitShow plugins
        GitShowRewrite,
        GitShowReferences,
        GitShowRender,
        GitShowMonaco,
        GitShowLayout
    ];
    availablePluginMap = {};
    usedPlugins = ['markdown', 'highlight', 'notes', 'mathjax2', 'zoom', 'rewrite']; // default selection

    /*
        Reveal.js configuration is taken from the following sources (in the following order)
        1. The default config below
        2. Each template can update the config via updateRevealConfig()
        3. The presentation may upadte the config in the 'reveal' section of presentation.json.
    */
    revealConfig = {
        width: 1920,
        height: 1080,
        margin: 0,

        hash: true,
        center: true,
        pdfMaxPagesPerSlide: 1,
        pdfSeparateFragments: false,

        plugins: [], // to be filled after all config files are loaded
    };

    init(config, templateData) {
        this.presentationConfig = config;
        console.log('Welcome to GitShow!');
        console.log('https://github.com/gitshow-js');
        //console.log(this.presentationConfig);

        this.initPlugins();
        console.log('Available plugins:', Object.keys(this.availablePluginMap));

        this.main = document.getElementById('gitshow-main');
        if (config.contents) {
            this.template = this.parseTemplate(templateData, config);
            this.useTemplate(this.template);
            if (config.contents.length > 0) {
                this.createContent(config.contents);
            }
            if (config.reveal) {
                this.updateRevealConfig(config.reveal);
            }
            if (config.usePlugins) {
                this.addPlugins(config.usePlugins);
            }
            this.runReveal();
        } else {
            this.showError('Presentation config not found.');
        }
    }

    initPlugins() {
        this.availablePluginMap = {};
        this.availablePlugins.forEach(plugin => {
            this.availablePluginMap[plugin().id] = plugin;
        });
    }

    /**
     * Adds specified plugins to the list of used plugins.
     * @param {*} pluginIds 
     */
    addPlugins(pluginIds) {
        for (const pluginId of pluginIds) {
            if (this.availablePluginMap[pluginId]) {
                if (!this.usedPlugins.includes(pluginId)) {
                    this.usedPlugins.push(pluginId);
                }
            } else {
                console.error(`Plugin '${pluginId}' not found.`);
            }
        }
    }

    /**
     * Configures Reveal.js plugins based on the usedPlugins array.
     */
    populatePlugins() {
        this.revealConfig.plugins = [];
        this.usedPlugins.forEach(pluginId => {
            const plugin = this.availablePluginMap[pluginId];
            if (plugin) {
                this.revealConfig.plugins.push(plugin);
            } else {
                console.error(`Plugin '${pluginId}' not found.`);
            }
        });
    }

    parseTemplate(templateData, config) {
        let template = JSON.parse(templateData);
        if (config.template?.properties) {
            template = this.replacePlaceholders(template, config.template.properties);
        }
        return template;
    }

    replacePlaceholders(template, properties) {
        if (typeof template === 'string') {
            let exactMatch = template.match(/\${(.*?)}/);
            if (exactMatch) { // exact match - return the property value
                return properties[exactMatch[1]] || exactMatch[0];
            } else { // replace in a string
                return template.replace(/\${(.*?)}/g, (match, propertyName) => {
                    return properties[propertyName] || match;
                });
            }
        } else if (Array.isArray(template)) {
            return template.map(item => this.replacePlaceholders(item, properties));
        } else if (typeof template === 'object' && template !== null) {
            const result = {};
            for (const key in template) {
                if (template.hasOwnProperty(key)) {
                    result[key] = this.replacePlaceholders(template[key], properties);
                }
            }
            return result;
        } else {
            return template;
        }
    }

    useTemplate(template) {
        console.log("USE");
        console.log(template);
        // use base CSS
        if (template.baseTheme) {
            this.addStyle('css/theme/' + template.baseTheme + '.css');
        }
        // use custom styles
        if (template.styles) {
            for (let sname of template.styles) {
                this.addStyle('template/' + sname);
            }
        }
        // update reveal config
        if (template.reveal) {
            this.updateRevealConfig(template.reveal);
        }
        // use custom plugins
        if (template.usePlugins) {
            this.addPlugins(template.usePlugins);
        }
    }

    getPresentationConfig() {
        return this.presentationConfig;
    }

    getRevealConfig() {
        return this.revealConfig;
    }

    updateRevealConfig(newConfig) {
        this.revealConfig = { ...this.revealConfig, ...newConfig };
    }

    addStyle(path) {
        const head = document.head || document.getElementsByTagName('head')[0];
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', path);
        head.appendChild(link);
    }

    runReveal() {
        this.populatePlugins();
        console.log('Reveal config:', this.revealConfig);
        let deck = new Reveal(this.revealConfig);
        deck.initialize();
    }
    
    createContent(contents) {
        const defaultClass = this.template.defaultClass || 'normal';
        let sections = '';
        for (let cont of contents) {
            sections += `<section
                                data-markdown="${cont}"
                                data-separator="^---"
                                data-separator-vertical="^=--"
                                class="${defaultClass}">
                        </section>`;
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
