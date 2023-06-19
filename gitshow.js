#!/usr/bin/env node

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const commands = require(__dirname + '/src/commands.js');

const DEST = 'dist'; // target folder name
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

const cmd = args[0];
let srcdir = process.cwd();
if (args.length > 1) {
    srcdir = path.resolve(args[1]);
}

console.log('Using source directory: %s', srcdir);

// create the dest dir
const destdir = fs.mkdirSync(srcdir + '/' + DEST);

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

// execute the command
switch (cmd) {
    case 'init':
        commands.init(gspath, srcdir);
        break;
    case 'serve':
        process.chdir(gspath);
        commands.serve(gspath, srcdir, destdir);
        break;
    case 'package':
        process.chdir(gspath);
        commands.package(gspath, srcdir, destdir);
        break;
    case 'pdf':
        process.chdir(gspath);
        commands.pdf(gspath, srcdir, destdir);
        break;
    default:
        console.error(`Unknown command: ${cmd}`);
        break;
}
