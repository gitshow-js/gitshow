#!/usr/bin/env node

const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const commands = require(__dirname + '/src/commands.js');
const utils = require(__dirname + '/src/utils.js');

const HELP = `Usage: gitshow.sh <command> [<source_path>]
Commands:
  init -- create a new presentation
  serve -- run live server
  package -- package the complete presentation
  pdf -- create PDF
  clean -- clean the project (remove the generated files)
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
let destdir = '';

// execute the command
switch (cmd) {
    case 'init':
        utils.checkProjectConfig(srcdir, cmd);
        commands.init(gspath, srcdir);
        break;
    case 'serve':
        utils.checkProjectConfig(srcdir, cmd);
        destdir = utils.checkDestFolder(srcdir);
        process.chdir(gspath);
        commands.serve(gspath, srcdir, destdir);
        break;
    case 'package':
        utils.checkProjectConfig(srcdir, cmd);
        destdir = utils.checkDestFolder(srcdir);
        process.chdir(gspath);
        commands.package(gspath, srcdir, destdir);
        break;
    case 'pdf':
        utils.checkProjectConfig(srcdir, cmd);
        destdir = utils.checkDestFolder(srcdir);
        process.chdir(gspath);
        commands.pdf(gspath, srcdir, destdir);
        break;
    case 'clean':
        utils.cleanDestFolder(srcdir);
        break;
    default:
        console.error(`Unknown command: ${cmd}`);
        break;
}
