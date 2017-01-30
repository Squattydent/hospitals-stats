var gulp = require('gulp');
var notify = require('gulp-notify');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var minifyCSS = require('gulp-minify-css');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var watchify = require('watchify');
var debug = require('gulp-debug');

var path_sources = "./application/";
var path_node_modules = "./node_modules/";
var path_app_root = path_sources + "app.js";
var path_static_root = "./public/";
var path_static_build = path_static_root + "build/";


function rebuild_css(is_debug) {
  if (is_debug){
    console.log("CSS WATCH");
    gulp.watch(path_sources + '**/*.css', function(){rebuild_css(true)});
  }
  console.log("REBUILDING CSS");
  return gulp.src(path_sources + '**/*.css')
    .pipe(gulpif(is_debug, sourcemaps.init()))
    .pipe(minifyCSS())
    .pipe(concat('all_styles.min.css'))
    .pipe(gulpif(is_debug, sourcemaps.write('./', {sourceRoot: '/static/dashboard/build/sources/'})))
    .pipe(gulp.dest(path_static_build));
}

function rebuild_app(is_debug){
  var b = browserify({
    debug: is_debug,
    cache: {},
    packageCache: {},
    fullPaths: true,
    paths: [path_node_modules, path_sources]
  });
  if (is_debug){
    console.log("APP WATCH");
    b = watchify(b);
    b.on('update', function(){
      shared_build_app(b, is_debug);
    });
    b.on('time', function (time) {
        console.log("APP REBUILT IN " + time/1000 + "s");
    })
  }
  b.add(path_app_root);
  shared_build_app(b, is_debug);
}

function shared_build_app(b, is_debug) {
  console.log("APP REBUILDING...");
  b.bundle()
    .pipe(source("all_scripts.min.js"))
    .pipe(buffer())
    //.pipe(gulpif(!is_debug, sourcemaps.init({loadMaps: true})))
    .pipe(gulpif(!is_debug, uglify()))
    //.pipe(gulpif(!is_debug, sourcemaps.write('./', {sourceRoot: '/static/dashboard/build/'})))
    .pipe(gulp.dest(path_static_build))
    .pipe(debug({title: 'APP REBUILT:'}))
}

gulp.task('default', function() {
  rebuild_css(true);
  rebuild_app(true);
});


gulp.task('release', function() {
  rebuild_css(false);
  rebuild_app(false);
});
