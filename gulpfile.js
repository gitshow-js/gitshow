const yargs = require('yargs')
const fs = require('fs')

const {rollup} = require('rollup')
const terser = require('@rollup/plugin-terser').default
const babel = require('@rollup/plugin-babel').default
const commonjs = require('@rollup/plugin-commonjs')
const resolve = require('@rollup/plugin-node-resolve').default

const gulp = require('gulp')
const zip = require('gulp-zip')
const connect = require('gulp-connect')
const replace = require('gulp-replace')

const puppeteer = require('puppeteer');

const root = yargs.argv.root || '.'
const port = yargs.argv.port || 8000
const host = yargs.argv.host || 'localhost'
const srcdir = yargs.argv.src || '.'
const destdir = yargs.argv.dest || './dist'


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

const configFile = srcdir + '/presentation.json';

loadConfig = function() {
    return JSON.parse(fs.readFileSync(configFile));
}

// Creates a bundle with broad browser support, exposed
// as UMD
gulp.task('js-es5', () => {
    return rollup({
        cache: cache.umd,
        input: 'js/index.js',
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
            file: destdir + '/gitshow.js',
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
            file: destdir + '/gitshow.esm.js',
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
    return gulp.src(['node_modules/reveal.js/dist/**.css'])
        .pipe(gulp.dest(destdir + '/css'))
});
gulp.task('css-themes', () => {
    return gulp.src(['node_modules/reveal.js/dist/theme/**/*'])
        .pipe(gulp.dest(destdir + '/css/theme'))
});
gulp.task('css', gulp.parallel('css-reveal', 'css-themes'));

gulp.task('build', gulp.parallel('css', 'js'));

