'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');

var typescript;
var tsProject;
var sourcemaps;
gulp.task('typescript', function () {
    if (!typescript) {
        typescript = require('gulp-typescript');
        tsProject = typescript.createProject('tsconfig.json', {sortOutput: true});
        sourcemaps = require('gulp-sourcemaps');
    }
    var tsResult = tsProject.src()
        .pipe(sourcemaps.init())
        .pipe(typescript(tsProject));

    return tsResult.js
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('build'));
});

var sass;
gulp.task('sass', function () {
    if (!sass) {
        sass = require('gulp-sass');
    }
    return gulp.src('src/**/*.scss')
            .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
            .pipe(gulp.dest('build'));
});

gulp.task('copy-html', function () {
    return gulp.src('src/**/*.html')
            .pipe(gulp.dest('build'));
});

gulp.task('copy-css', function () {
    return gulp.src('src/**/*.css')
            .pipe(gulp.dest('build'));
});

gulp.task('copy-fonts', function () {
    return gulp.src(['src/**/*.eot', 'src/**/*.svg', 'src/**/*.ttf', 'src/**/*.woff', 'src/**/*.woff2'])
            .pipe(gulp.dest('build'));
});

gulp.task('copy-fill', function () {
    return gulp.src('src/**/*.fill')
            .pipe(gulp.dest('build'));
});

gulp.task('copy-json', function () {
    return gulp.src('src/**/*.json')
            .pipe(gulp.dest('build'));
});

gulp.task('copy-bower', function () {
    return gulp.src('src/modules/pages/static/resources/bower_components/**/**')
            .pipe(gulp.dest('build/modules/pages/static/resources/bower_components'));
});

var del;
gulp.task('clean', function () {
    if (!del) {
        del = require('del');
    }
    return del(['build']);
});

gulp.task('copy', ['copy-html', 'copy-css', 'copy-fonts', 'copy-fill', 'copy-bower']);

gulp.task('watch', function () {
    gulp.watch(['src/**/*.ts'], ['typescript']);
    gulp.watch(['src/**/*.scss', 'src/**/*.css'], ['sass']);
    gulp.watch(['src/**/**'], ['copy']);
});

gulp.task('build', function (callback) {
    runSequence('clean', ['typescript', 'sass', 'copy'], callback);
});

gulp.task('dev', ['build', 'watch']);

gulp.task('default', ['build']);
