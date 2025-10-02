/*
    Monaco editor plugin for Reveal.js
	2025, Jiri Hynek <hynek@vut.cz>

    Web editor composed of Monaco Editor and a view part rendering the web content.

    Based on Monaco Editor plugin for Reveal.js
    Version 2.0
    by Joe Skeen
    License: MIT
 */

const EDITOR_CLASSES = {
    editor: "editor",
    code: "code",
    view: "view",
    full: "full",
}

let currentMode = EDITOR_CLASSES.editor;

let defaultOptions = {
    monacoBaseUrl: "https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0",
    selector: "code.monaco",
    defaultLanguage: "javascript",
    debug: false,
    editorOptions: {
        fontSize: 24,
        minimap: {
            enabled: false
        },
        automaticLayout: true,
        scrollBeyondLastLine: false,
        lineNumbers: "on",
        lineDecorationsWidth: 2,
        lineNumbersMinChars: 3,

        glyphMargin: false,
        scrollbar: {
            vertical: "hidden",
            horizontal: "hidden",
            /*useShadows: false,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            arrowSize: 0,
            alwaysConsumeMouseWheel: false,
            horizontalScrollbarSize: 0,
            verticalScrollbarSize: 0,
            handleMouseWheel: false,
            mouseWheelScrollSensitivity: 1,
            mouseWheelZoom: false,
            fastScrollSensitivity: 5,
            scrollByPage: false,
            smoothScrolling: false,
            useShadows: false,
            horizontalSliderSize: 0,
            verticalSliderSize: 0*/
        }
    }
};

export class MonacoPlugin {
    constructor(reveal) {
        this.deck = reveal;
        this.activeEditor = null;
        let revealOptions = this.deck.getConfig().monaco || {};
        this.options = { ...defaultOptions, ...revealOptions };
        this.monacoBaseUrl = this.options.monacoBaseUrl;
        let markdownOptions = this.deck.getConfig().markdown || {};
        this.contentBaseUrl = markdownOptions.baseUrl;
        this.monacoElem = undefined;
        this.iframeElem = undefined;
        this.data = undefined;
        this.url = undefined;
        this.timerLock = false;
        this.timeout = null;
    }

    async init() {
        await new Promise((resolve) =>
            this.loadScript(`${this.monacoBaseUrl}/min/vs/loader.js`, resolve)
        );
        require.config({ paths: { vs: `${this.monacoBaseUrl}/min/vs` } });
        await new Promise((resolve) => require(["vs/editor/editor.main"], resolve));
        if (window.monaco) {
            this.log("[monaco] loaded");
            this.monaco = window.monaco;
        } else {
            throw new Error("Could not load Monaco");
        }

        this.deck.on("slidechanged", (x) => this.onSlideChanged(x));
        this.deck.on("ready", (x) => this.onSlideChanged(x));

        // see if there is an editor on the initial slide
        this.onSlideChanged();
    }

    loadScript(url, callback) {
        let head = document.querySelector("head");
        let script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;

        // Wrapper for callback to make sure it only fires once
        let finish = () => {
            if (typeof callback === "function") {
                callback.call();
                callback = null;
            }
        };

        script.onload = finish;

        // IE
        script.onreadystatechange = () => {
            if (this.readyState === "loaded") {
                finish();
            }
        };

        // Normal browsers
        head.appendChild(script);
    }

    onSlideChanged(event) {
        const state = {
            previousSlide: event?.previousSlide || this.deck.getPreviousSlide(),
            currentSlide: event?.currentSlide || this.deck.getCurrentSlide(),
        };
        this.log(state);
        if (state.previousSlide) {
            const codeBlock = state.previousSlide.querySelector(
                this.options.selector
            );
            if (codeBlock && this.activeEditor) {
                const contents = this.activeEditor.getModel().getValue().trimStart();

                this.activeEditor.dispose();
                this.activeEditor = null;

                const noscript = document.createElement("script");
                noscript.setAttribute("type", "text/template");
                noscript.innerHTML = contents;
                codeBlock.appendChild(noscript);
            }
        }
        if (state.currentSlide) {
            const editor = state.currentSlide.querySelector("*[data-iframe]");
            if(editor) {
                this.renderEditor(editor).then(({ monacoElem, iframeElem, data, url }) => {
                    this.monacoElem = monacoElem;
                    this.iframeElem = iframeElem;
                    this.data = data;
                    this.url = url;

                    this.renderView();
                    this.renderMonaco();
                }).catch((error) => {
                    console.error("Error rendering Monaco editor:", error);
                });
            }
        }
    }

    async renderEditor(element) {
        let url = this.resolveUrl(element.getAttribute('data-iframe'));
        element.classList.add("reveal-include");
        element.classList.add("editor");
        if (url) {

            let response = await fetch(url);
            let data = await response.text();

            let fileExtension = url.split('.').pop().toLowerCase();

            element.innerHTML =
                `<div class="reveal-include-controls">
                    <div class="btn-${EDITOR_CLASSES.editor} active">Editor</div>
                    <div class="btn-${EDITOR_CLASSES.code}">Code</div>
                    <div class="btn-${EDITOR_CLASSES.view}">View</div>
                    <div class="btn-${EDITOR_CLASSES.full}">Fullscreen</div>
                </div>
                <div class="reveal-include-editor">
                    <div class="${EDITOR_CLASSES.code}">
                        <code class="monaco" language="${fileExtension || this.options.defaultLanguage}">
                        </code>
                    </div>
                    <div class="${EDITOR_CLASSES.view}">
                        <iframe src='about:blank'></iframe>
                    </div>
                </div>`;

            let controls = element.querySelector('.reveal-include-controls');

            controls.addEventListener('mouseenter', function (event) {
                controls.classList.add('active');
            });

            controls.addEventListener('mouseleave', function (event) {
                controls.classList.remove('active');
            });

            let iframeElem = element.querySelector("." + EDITOR_CLASSES.view + " iframe");
            let monacoElem = element.querySelector("code.monaco");

            for (let key in EDITOR_CLASSES) {
                element.getElementsByClassName("btn-" + EDITOR_CLASSES[key])[0].addEventListener('click', function () {

                    let mode = EDITOR_CLASSES[key];
                    if (currentMode !== mode) {
                        for (let key in EDITOR_CLASSES) {
                            if (key === mode) {
                                element.getElementsByClassName("btn-" + EDITOR_CLASSES[key])[0].classList.add('active');
                            } else {
                                element.getElementsByClassName("btn-" + EDITOR_CLASSES[key])[0].classList.remove('active');
                            }
                        }
                        element.classList.remove(currentMode);
                        element.classList.add(mode);
                        currentMode = mode;
                    }

                    // fix bug in monaco editor rendering
                    monacoElem.style.display = "none";
                    setTimeout(() => {
                        monacoElem.style.display = null;
                    }, 0);
                });
            }

            return {
                monacoElem: monacoElem,
                iframeElem: iframeElem,
                data: data,
                url: url
            };
        }
    }

    resolveUrl(url) {
        if (this.contentBaseUrl && url && !url.includes("://")) {
            return this.contentBaseUrl + url;
        } else {
            return url;
        }
    }

    renderView() {
        let iframe = this.iframeElem;

        // Optional: style the iframe or set attributes
        iframe.setAttribute("sandbox", "allow-scripts allow-same-origin"); // adjust as needed

        // Write content into the iframe
        iframe.onload = () => {
                let doc = iframe.contentDocument || iframe.contentWindow.document;
                doc.open();
                doc.write(this.data);
                doc.close();
        };

        iframe.src = 'about:blank';
    }

    renderMonaco() {
        const codeBlock = this.monacoElem;
        if (codeBlock) {
            const scriptTemplateChild = codeBlock.querySelector(
                "script[type='text/template']"
            );
            const initialCode = (
                scriptTemplateChild
                    ? scriptTemplateChild.innerHTML
                    : codeBlock.innerHTML
            ).trimStart();
            codeBlock.innerHTML = "";
            const language =
                codeBlock.getAttribute("language") || codeBlock.getAttribute("data-language") || this.options.defaultLanguage;
            this.activeEditor = this.monaco.editor.create(codeBlock, {
                ...this.options.editorOptions,
                value: this.data,
                language: language
            });

            this.activeEditor.getModel().onDidChangeContent(e => {
                const contentChangeEvent = new CustomEvent("reveal-monaco-content-change", { detail: { textContent: this.activeEditor.getModel().getValue() } });
                if(this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                }
                this.timeout = setTimeout(() => {
                    this.data = contentChangeEvent.detail.textContent;
                    this.renderView();
                }, 1000);
                window.dispatchEvent(contentChangeEvent);
            });
            // dispatch event for initial display of the editor
            window.dispatchEvent(new CustomEvent("reveal-monaco-content-change", { detail: { textContent: this.activeEditor.getModel().getValue() } }));
        }
    }

    log(content) {
        if (this.options.debug) {
            console.info(content);
        }
    }
}

export const Plugin = () => {
    return {
        id: "monaco",

        init: function (reveal) {
            const plugin = new MonacoPlugin(reveal);
            return plugin.init();
        },
    };
};

export default Plugin;