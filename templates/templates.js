import TemplateDefault from "./default/template.js";
import TemplateFit from "./fit/template.js";

const Templates = () => {
    return {
        id: 'fit',
        index: {
            "default": TemplateDefault,
            "fit": TemplateFit
        },
        init: function() {
        },
    }
}

export default Templates;
