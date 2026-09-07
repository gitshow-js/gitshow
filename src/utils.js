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
const PDF_DEST = 'dist-pdf'; // target folder name used for PDF generation

module.exports = {

    DEST: DEST,
    PDF_DEST: PDF_DEST,

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

    /**
     * Checks whether the given value is a valid TCP port number. Aborts the script when it is not.
     * @param {string|number} portSpec the port number specification to check
     * @returns the port number
     */
    checkPort(portSpec) {
        let port = Number(portSpec);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            console.error(`Invalid port number: ${portSpec}. Use an integer between 1 and 65535.`);
            process.exit(7);
        }
        return port;
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
     * Checks if the presentation source folder exists and tries to create it if it does not.
     * @param {string} srcdir the project source folder path
     * @returns the source folder path
     */
    checkSrcFolder(srcdir) {
        const dest = srcdir;
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
            if (!fs.existsSync(dest)) {
                console.error(`Couldn't create the source folder ${dest}. Aborting.`);
                process.exit(4);
            }
        }
        return dest;
    },

    /**
     * Checks if the destination folder exists and tries to create it if it does not.
     * @param {string} srcdir the project source folder path
     * @param {string} destName the destination folder name (DEST by default)
     * @returns the destination folder path
     */
    checkDestFolder(srcdir, destName = DEST) {
        const dest = srcdir + '/' + destName;
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
     * Deletes the destination folders (including the one used for PDF generation).
     * @param {string} srcdir the project source folder path
     */
    cleanDestFolder(srcdir) {
        for (const destName of [DEST, PDF_DEST]) {
            const dest = srcdir + '/' + destName;
            if (fs.existsSync(dest)) {
                fs.rmSync(dest, {recursive: true, force: true});
            }
        }
    }

}
