#!/usr/bin/env node
/*
 * GitShow
 * (c) 2023 Radek Burget <burgetr@fit.vut.cz>
 * 
 * gitshow.js
 * The main srcipt.
 * 
 */

const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const yargs = require('yargs');

const commands = require(__dirname + '/src/commands.js');
const utils = require(__dirname + '/src/utils.js');

const templates = require(__dirname + '/templates/templates.js');

const HELP = `Usage: gitshow.sh <command> [<presentation_folder>]
Commands:
  init [-t template] -- create a new presentation
  serve -- run live server
  package -- package the complete presentation
  pdf -- create PDF
  clean -- clean the project (remove the generated files)

If the presentation folder is not specified, the current folder is used.

The template can be the name of a built-in template or the path to a custom template folder.`;

let TEMPLATE_HELP = 'Available built-in templates:\n';
for (let t in templates.index) {
    TEMPLATE_HELP += t + ' -- ' + templates.index[t] + '\n';
}


const gspath = __dirname;
const args = yargs.argv._;

if (args.length == 0) {
    console.log(HELP);
    console.log(TEMPLATE_HELP);
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
        let templateSpec = yargs.argv.t || 'default';
        utils.checkTemplate(gspath, templates, templateSpec);
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
