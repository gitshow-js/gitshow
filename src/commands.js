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

loadConfig = function() {
    return JSON.parse(fs.readFileSync(psrcdir + '/' + configFile));
}

// Creates a bundle with broad browser support, exposed
// as UMD
gulp.task('js-es5', () => {
    return rollup({
        cache: cache.umd,
        input: root + '/js/index.js',
        plugins: [
            resolve(),
            commonjs(),
            babel( babelConfig ),
            terser()
        ]
    }).then( bundle => {
        cache.umd = bundle.cache;
        return bundle.write({
            name: 'GitShow',
            file: pdestdir + '/gitshow.js',
            format: 'umd',
            banner: banner,
            sourcemap: true
        });
    });
})

// Creates an ES module bundle
gulp.task('js-es6', () => {
    return rollup({
        cache: cache.esm,
        input: 'js/index.js',
        plugins: [
            resolve(),
            commonjs(),
            babel( babelConfigESM ),
            terser()
        ]
    }).then( bundle => {
        cache.esm = bundle.cache;
        return bundle.write({
            file: pdestdir + '/gitshow.esm.js',
            format: 'es',
            banner: banner,
            sourcemap: true
        });
    });
})
gulp.task('js', gulp.parallel('js-es5'/*, 'js-es6'*/));

// Plugins are not being built automatically at the moment but this task is prepared
gulp.task('plugins', () => {
    return Promise.all([
        { name: 'RevealRewrite', input: './js/plugin/rewrite/plugin.js', output: './js/plugin/rewrite/rewrite' },
        { name: 'RevealReferences', input: './js/plugin/references/plugin.js', output: './js/plugin/references/references' },
    ].map( plugin => {
        return rollup({
                cache: cache[plugin.input],
                input: plugin.input,
                plugins: [
                    resolve(),
                    commonjs(),
                    babel({
                        ...babelConfig,
                        ignore: [/node_modules\/(?!(highlight\.js|marked)\/).*/],
                    }),
                    terser()
                ]
            }).then( bundle => {
                cache[plugin.input] = bundle.cache;
                bundle.write({
                    file: plugin.output + '.esm.js',
                    name: plugin.name,
                    format: 'es'
                })

                bundle.write({
                    file: plugin.output + '.js',
                    name: plugin.name,
                    format: 'umd'
                })
            });
    } ));
})

gulp.task('css-reveal', () => {
    return gulp.src([root + '/node_modules/reveal.js/dist/**.css'])
        .pipe(gulp.dest(pdestdir + '/css'))
});
gulp.task('css-themes', () => {
    return gulp.src([root + '/node_modules/reveal.js/dist/theme/**/*'])
        .pipe(gulp.dest(pdestdir + '/css/theme'))
});
gulp.task('css', gulp.parallel('css-reveal', 'css-themes'));

gulp.task('config', () => {
    return gulp.src(psrcdir + '/' + configFile)
        .pipe(gulp.dest(pdestdir + ''))
});

gulp.task('index', () => {
    const cfg = loadConfig();
    return gulp.src(root + '/index.html')
        .pipe(replace('{{TITLE}}', cfg.title))
        .pipe(replace('{{LANG}}', cfg.lang))
        .pipe(replace('{{CONFIG}}', JSON.stringify(cfg)))
        .pipe(gulp.dest(pdestdir))
});

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
gulp.task('assets', () => {
    return gulp.src([psrcdir + '/assets/**/*'])
        .pipe(gulp.dest(pdestdir + '/assets'))
});

gulp.task('template', () => {
    const cfg = loadConfig();
    let templateName = 'default';
    if (cfg.template && cfg.template.name) {
        templateName = cfg.template.name;
    }
    return gulp.src([root + '/templates/' + templateName + '/**/*'])
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
    const browser = await puppeteer.launch();
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

gulp.task('cleanup', () => {
    return new Promise(async (resolve, reject) => {
        console.log('clean ' + pdestdir);
        fs.removeSync(pdestdir);
        resolve();
    });
});

//======================================================================

module.exports = {

    init(gspath, srcdir) {
        if (!fs.existsSync(srcdir)) {
            fs.mkdirSync(srcdir, { recursive: true });
        }
        fs.copySync(gspath + '/samples/start/', srcdir);
        console.log('Presentation created. See presentation.json for further configuration.');
    },

    serve(gspath, srcdir, destdir) {
        psrcdir = srcdir;
        pdestdir = destdir;
        console.log('Build...');
        gulp.series([
            gulp.task('build'), 
            gulp.task('serve'), 
            //gulp.task('cleanup') //TODO
        ])();
    },

    package(gspath, srcdir, destdir) {
        psrcdir = srcdir;
        pdestdir = destdir;
        console.log('Build...');
        gulp.series([
            gulp.task('build'), 
            gulp.task('package'), 
            gulp.task('cleanup')
        ])();
    },

    pdf(gspath, srcdir, destdir) {
        psrcdir = srcdir;
        pdestdir = destdir;
        console.log('Build...');
        gulp.series([
            gulp.task('build'), 
            gulp.task('pdf'), 
            gulp.task('cleanup')
        ])();
    }

};
