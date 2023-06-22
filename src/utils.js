/*
 * GitShow
 * (c) 2023 Radek Burget <burgetr@fit.vut.cz>
 * 
 * utils.js
 * Utility functions.
 * 
 */
const fs = require('fs-extra');

const DEST = 'dist'; // target folder name

module.exports = {

    /**
     * Checks whether the project directory contains (or does not contain) an appropriate presentation config. Aborts the script
     * when it does not.
     * @param {string} srcdir the source folder to check
     * @param {string} command the command being executed
     */
    checkProjectConfig(srcdir, command) {
        if (command == 'init') {
            if (fs.existsSync(srcdir + '/presentation.json')) {
                console.error(`Presentation config file (presentation.json) already exists in ${srcdir}. Aborting init.`)
                process.exit(2);
            }
        }
        else {
            if (!fs.existsSync(srcdir + '/presentation.json')) {
                console.error(`No presentation config file (presentation.json) found in ${srcdir}. Use the 'init' command to create an empty presentation.`)
                process.exit(3);
            }
        }
    },

    checkTemplate(srcdir, templates, templateSpec) {
        let templatePath = templateSpec;
        if (templates.index[templateSpec]) {
            templatePath = srcdir + '/templates/' + templateSpec;
        }
        if (!fs.existsSync(templatePath)) {
            console.error(`Couldn't find template ${templatePath}.`);
            process.exit(5);
        }
        return templatePath;
    },

    readStoredTemplatePath(srcdir) {
        if (fs.existsSync(srcdir + '/.templatesrc')) {
            let templatePath = fs.readFileSync(srcdir + '/.templatesrc').toString().trim();
            console.log('Reseting source template from ' + templatePath);
            return templatePath;
        } else {
            console.error('Unknown template source. Please specify the source template using -t');
            process.exit(6);
        }
    },

    /**
     * Checks if the destination folder exists and tries to create it if it does not.
     * @param {string} srcdir the project source folder path
     * @returns the destination folder path
     */
    checkDestFolder(srcdir) {
        const dest = srcdir + '/' + DEST;
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
            if (!fs.existsSync(dest)) {
                console.error(`Couldn't create the destination folder ${dest}. Aborting.`);
                process.exit(4);
            }
        }
        return dest;
    },

    /**
     * Deletes the destination folder.
     * @param {string} srcdir the project source folder path
     */
    cleanDestFolder(srcdir) {
        const dest = srcdir + '/' + DEST;
        if (fs.existsSync(dest)) {
            fs.rmSync(dest, {recursive: true, force: true});
        }
    }

}
