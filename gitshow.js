#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const HELP = `Usage: gitshow.sh <command> [<source_path>]
Commands:
  init -- create a new presentation
  serve -- run live server
  package -- package the complete presentation
  pdf -- create PDF
`;

const gspath = __dirname;
const args = process.argv.splice(2);

if (args.length == 0) {
    console.log(HELP);
    process.exit(1);
}

const destdir = './dist';
const cmd = args[0];
let srcdir = process.cwd();
if (args.length > 1) {
    srcdir = path.resolve(args[1]);
}

console.log('Using source directory: %s', srcdir);

// check the source project configuration
if (cmd == 'init') {
    if (fs.existsSync(srcdir + '/presentation.json')) {
        console.error(`Presentation config file (presentation.json) already exists in ${srcdir}. Aborting init.`)
        process.exit(2);
    }
}
else {
    if (!fs.existsSync(srcdir + '/presentation.json')) {
        console.error(`No presentation config file (presentation.json) found in ${srcdir}.`)
        process.exit(3);
    }
}

