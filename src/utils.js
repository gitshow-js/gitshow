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

    cleanDestFolder(srcdir) {
        const dest = srcdir + '/' + DEST;
        if (fs.existsSync(dest)) {
            fs.rmSync(dest, {recursive: true, force: true});
        }
    }

}
