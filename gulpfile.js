// #####################################################################################################################
// #IMPORTS#
var gulp = require('gulp');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var fs = require('fs');
var gulpif = require('gulp-if');
var autoprefixer = require('autoprefixer');
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var minifyCss = require('gulp-clean-css');
var sourcemaps = require('gulp-sourcemaps');
// var eslint = require('gulp-eslint');
var webpack = require('webpack');

var argv = require('minimist')(process.argv.slice(2)); // eslint-disable-line

// #####################################################################################################################
// #SETTINGS#
var options = {
    debug: argv.debug
};
var PROJECT_ROOT = __dirname + '/djangocms_icon/static/djangocms_icon';
var PROJECT_PATH = {
    js: PROJECT_ROOT + '/js',
    sass: PROJECT_ROOT + '/sass',
    css: PROJECT_ROOT + '/css',
};

var PROJECT_PATTERNS = {
    js: [
        PROJECT_PATH.js + '/*.js',
        '!' + PROJECT_PATH.js + '/dist/*.js'
    ],
    sass: [
        PROJECT_PATH.sass + '/**/*.{scss,sass}'
    ],
    icons: [
        PROJECT_PATH.icons + '/src/*.svg'
    ]
};

// gulp.task('lint', ['lint:javascript']);
// gulp.task('lint:javascript', function () {
//     // DOCS: http://eslint.org
//     return gulp.src(PROJECT_PATTERNS.js)
//         .pipe(gulpif(!process.env.CI, plumber()))
//         .pipe(eslint())
//         .pipe(eslint.format())
//         .pipe(eslint.failAfterError())
//         .pipe(gulpif(!process.env.CI, plumber.stop()));
// });
//
var webpackBundle = function (opts) {
    var webpackOptions = opts || {};

    webpackOptions.PROJECT_PATH = PROJECT_PATH;
    webpackOptions.debug = options.debug;

    return function (done) {
        var config = require('./webpack.config')(webpackOptions);

        webpack(config, function (err, stats) {
            if (err) {
                throw new gutil.PluginError('webpack', err);
            }
            gutil.log('[webpack]', stats.toString({ maxModules: Infinity, colors: true, optimizationBailout: true }));
            if (typeof done !== 'undefined' && (!opts || !opts.watch)) {
                done();
            }
        });
    };
};

gulp.task('bundle:watch', webpackBundle({ watch: true }));
gulp.task('bundle', webpackBundle());
gulp.task('sass', function() {
    gulp
        .src(PROJECT_PATTERNS.sass)
        .pipe(gulpif(options.debug, sourcemaps.init()))
        .pipe(sass())
        .on('error', function(error) {
            gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.messageFormatted));
        })
        .pipe(
            postcss([
                autoprefixer({
                    cascade: false
                })
            ])
        )
        .pipe(
            minifyCss({
                rebase: false
            })
        )
        .pipe(gulpif(options.debug, sourcemaps.write()))
        .pipe(gulp.dest(PROJECT_PATH.css));
});

gulp.task('watch', ['sass'], function () {
    gulp.start('bundle:watch');
    gulp.watch(PROJECT_PATTERNS.sass, ['sass']);
    // gulp.watch(PROJECT_PATTERNS.js, ['lint']);
});

gulp.task('default', ['watch']);
