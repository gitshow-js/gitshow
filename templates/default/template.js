/*
    A default template that only uses a built-in reveal.js theme.
    (c) 2022 Radek Burget
*/

const Template = () => {

    function initTemplate(show) {
        let cfg = show.getPresentationConfig();
        if (cfg.template.properties.theme) {
            show.addStyle('css/theme/' + cfg.template.properties.theme + '.css');
        }
    }

    return {
        id: 'default',
        init: function(show) {
            initTemplate(show);
        }
    }

}

export default Template;
