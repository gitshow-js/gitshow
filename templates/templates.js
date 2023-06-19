import TemplateDefault from "./default/template.js";
import TemplateClassic from "./classic/template.js";

const Templates = () => {
    return {
        id: 'fit',
        index: {
            "default": TemplateDefault,
            "classic": TemplateClassic
        },
        init: function() {
        },
    }
}

export default Templates;
