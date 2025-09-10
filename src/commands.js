/*
 * GitShow
 * (c) 2023 Radek Burget <burgetr@fit.vut.cz>
 * 
 * commands.js
 * Implementation of the commands using gulp.
 * 
 */
const fs = require('fs-extra');

const {rollup} = require('rollup');
const terser = require('@rollup/plugin-terser').default;
const babel = require('@rollup/plugin-babel').default;
const commonjs = require('@rollup/plugin-commonjs');
const resolve = require('@rollup/plugin-node-resolve').default;

const gulp = require('gulp');
const zip = require('gulp-zip');
const connect = require('gulp-connect');
const replace = require('gulp-replace');

const puppeteer = require('puppeteer');

// defaults
let root = '.';
let port = 8000;
let host = 'localhost';
let psrcdir = '.';
let pdestdir = './dist';
let ptemplate = './template';

// gulp tasks

// Prevents warnings from opening too many test pages
process.setMaxListeners(20);

const babelConfig = {
    babelHelpers: 'bundled',
    ignore: ['node_modules'],
    compact: false,
    extensions: ['.js', '.html'],
    plugins: [
        //'transform-html-import-to-string'
    ],
    presets: [[
        '@babel/preset-env',
        {
            corejs: 3,
            useBuiltIns: 'usage',
            modules: false
        }
    ]]
};

// Our ES module bundle only targets newer browsers with
// module support. Browsers are targeted explicitly instead
// of using the "esmodule: true" target since that leads to
// polyfilling older browsers and a larger bundle.
const babelConfigESM = JSON.parse( JSON.stringify( babelConfig ) );
babelConfigESM.presets[0][1].targets = { browsers: [
    'last 2 Chrome versions',
    'last 2 Safari versions',
    'last 2 iOS versions',
    'last 2 Firefox versions',
    'last 2 Edge versions',
] };

let cache = {};
let banner = '/* GitShow */\n';

const configFile = 'presentation.json';
const clientJsFile = 'gitshow.js';

loadConfig = function() {
    return JSON.parse(fs.readFileSync(psrcdir + '/' + configFile));
}

loadTemplate = function() {
    return JSON.parse(fs.readFileSync(psrcdir + '/template/template.json'));
}

toJSONString = function(obj) {
    return JSON.stringify(obj).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

// Copies the pre-built client javascript
gulp.task('js', () => {
    return gulp.src(root + '/dist/' + clientJsFile)
        .pipe(gulp.dest(pdestdir + ''))
});

// Copies the CSS files
gulp.task('css', () => {
    return gulp.src(root + '/dist/css/**/*')
        .pipe(gulp.dest(pdestdir + '/css'))
});

// Copies the config file
gulp.task('config', () => {
    return gulp.src(psrcdir + '/' + configFile)
        .pipe(gulp.dest(pdestdir + ''))
});

// copies and configures the index file
gulp.task('index', () => {
    const cfg = loadConfig();
    const template = loadTemplate();
    return gulp.src(root + '/index.html')
        .pipe(replace('{{TITLE}}', cfg.title))
        .pipe(replace('{{LANG}}', cfg.lang))
        .pipe(replace('{{CONFIG}}', toJSONString(cfg)))
        .pipe(replace('{{TEMPLATE}}', toJSONString(template)))
        .pipe(gulp.dest(pdestdir))
});

// copies the presentation contents to the destination folder
gulp.task('contents', () => {
    const cfg = loadConfig();
    let paths = [];
    for (let src of cfg.contents) {
        if (src.startsWith('/')) {
            paths.push(src);
        } else {
            paths.push(psrcdir + '/' + src);
        }
    }
    return gulp.src(paths)
        .pipe(gulp.dest(pdestdir));
});
// copies the presentation assets to the destination folder
gulp.task('assets', () => {
    return gulp.src([psrcdir + '/assets/**/*'], {encoding: false})
        .pipe(gulp.dest(pdestdir + '/assets'))
});

// copies the template from current folder to the destination folder
gulp.task('template', () => {
    return gulp.src([psrcdir + '/template/**/*'], {encoding: false})
        .pipe(gulp.dest(pdestdir + '/template'))
});

gulp.task('build', gulp.parallel('config', 'index', 'css', 'js', 'contents', 'assets', 'template'));

gulp.task('package', () => {
    const cfg = loadConfig();
    let presId = cfg.id || 'presentation';
    let destFile = presId + '.zip';
    console.log('Creating package in ' + psrcdir + '/' + destFile);
    return gulp.src([pdestdir + '/**'])
        .pipe(zip(destFile)).pipe(gulp.dest(psrcdir + '/'));
});

gulp.task('reload', () => gulp.src(['*.html', '*.md'])
    .pipe(connect.reload()));

gulp.task('serve', () => {
    return new Promise(async (resolve, reject) => {
        connect.server({
            root: [pdestdir],
            port: port,
            host: host,
            livereload: true
        });

        gulp.watch(['*.html', '*.md'], gulp.series('index', 'reload'));
        gulp.watch(['*.html', '*.md'], {cwd: psrcdir}, gulp.series('contents', 'reload'));
        gulp.watch(['*.json'], {cwd: psrcdir}, gulp.series('config', 'index', 'reload'));

        gulp.watch(['js/**'], gulp.series('js', 'reload'))
        gulp.watch(['templates/**'], gulp.series('template', 'reload'))

        resolve();
    });
});

async function createPdf(presId) {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    const page = await browser.newPage();
    console.log('Opening the presentation')
    await page.goto('http://localhost:8000?print-pdf', {
      waitUntil: 'networkidle2',
    });
    console.log('Creating PDF')
    await page.pdf({
      path: psrcdir + '/' + presId + '.pdf',
      printBackground: true,
      preferCSSPageSize: true
    });
    console.log('Closing')
    await browser.close();
}

gulp.task('pdf', () => {
    const cfg = loadConfig();
    let presId = cfg.id || 'presentation';
    return new Promise(async (resolve, reject) => {
        connect.server({
            root: [pdestdir],
            port: 8000,
            host: 'localhost'
        });

        await createPdf(presId);
        connect.serverClose();
        resolve();
    });
});

// initializes the local copy of the template
gulp.task('init-all', () => {
    return gulp.src([ptemplate + '/**/*'], {encoding: false})
        .pipe(gulp.dest(psrcdir))
});

// initializes the local copy of the template
gulp.task('update-template', () => {
    return gulp.src([ptemplate + '/template/**/*'],  {encoding: false})
        .pipe(gulp.dest(psrcdir + '/template'))
});

// removes the local copy of the template
gulp.task('clean-template', () => {
    return new Promise(async (resolve, reject) => {
        fs.removeSync(psrcdir + '/template');
        resolve();
    });
});

// removes the destination folder
gulp.task('cleanup', () => {
    return new Promise(async (resolve, reject) => {
        console.log('clean ' + pdestdir);
        fs.removeSync(pdestdir);
        resolve();
    });
});

//======================================================================

module.exports = {

    init(gspath, srcdir, templatePath) {
        psrcdir = srcdir;
        ptemplate = templatePath;
        gulp.series([
            gulp.task('init-all')
        ])();
        fs.writeFileSync(psrcdir + '/.templatesrc', templatePath);
        console.log('Presentation created. See presentation.json for further configuration.');
    },

    reset(gspath, srcdir, templatePath) {
        psrcdir = srcdir;
        ptemplate = templatePath;
        gulp.series([
            gulp.task('clean-template'),
            gulp.task('update-template')
        ])();
    },

    serve(gspath, srcdir, destdir) {
        psrcdir = srcdir;
        pdestdir = destdir;
        gulp.series([
            gulp.task('build'), 
            gulp.task('serve')
        ])();
    },

    package(gspath, srcdir, destdir) {
        psrcdir = srcdir;
        pdestdir = destdir;
        gulp.series([
            gulp.task('build'), 
            gulp.task('package'), 
            gulp.task('cleanup')
        ])();
    },

    pdf(gspath, srcdir, destdir) {
        psrcdir = srcdir;
        pdestdir = destdir;
        gulp.series([
            gulp.task('build'), 
            gulp.task('pdf'), 
            gulp.task('cleanup')
        ])();
    }

};
