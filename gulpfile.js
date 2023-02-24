const yargs = require('yargs')

const {rollup} = require('rollup')
const terser = require('@rollup/plugin-terser').default
const babel = require('@rollup/plugin-babel').default
const commonjs = require('@rollup/plugin-commonjs')
const resolve = require('@rollup/plugin-node-resolve').default

const gulp = require('gulp')
//const zip = require('gulp-zip')
const connect = require('gulp-connect')

const root = yargs.argv.root || '.'
const port = yargs.argv.port || 8000
const host = yargs.argv.host || 'localhost'
const srcdir = yargs.argv.src || '/home/burgetr/tmp/gitshow'


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
            file: './dist/gitshow.js',
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
            file: './dist/gitshow.esm.js',
            format: 'es',
            banner: banner,
            sourcemap: true
        });
    });
})
gulp.task('js', gulp.parallel('js-es5', 'js-es6'));

gulp.task('build', gulp.parallel('js'))

/*gulp.task('package', gulp.series(() =>

    gulp.src(
        [
            './index.html',
            './dist/**',
            './lib/**',
            './images/**',
            './plugin/**',
            './**.md'
        ],
        { base: './' }
    )
    .pipe(zip('reveal-js-presentation.zip')).pipe(gulp.dest('./'))

))*/

gulp.task('reload', () => gulp.src(['*.html', '*.md'])
    .pipe(connect.reload()));

gulp.task('serve', () => {

    connect.server({
        root: [root, srcdir],
        port: port,
        host: host,
        livereload: true
    })

    gulp.watch(['*.html', '*.md'], gulp.series('reload'))
    gulp.watch([srcdir + '/*.html', srcdir + '/*.md', srcdir + '/*.js'], gulp.series('reload'))

    gulp.watch(['js/**'], gulp.series('js', 'reload'))

})
