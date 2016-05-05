'use strict';

const gulp = require('gulp');
const runSequence = require('run-sequence');

let babel;
gulp.task('babel', () => {
    if (!babel) {
        babel = require('gulp-babel');
    }
    return gulp.src('src/**/*.js')
            .pipe(babel({presets: ['es2015']}))
            .pipe(gulp.dest('build'));
});

let sass;
gulp.task('sass', () => {
    if (!sass) {
        sass = require('gulp-sass');
    }
    return gulp.src('src/**/*.scss')
            .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
            .pipe(gulp.dest('build'));
});

gulp.task('copy-html', () => {
    return gulp.src('src/**/*.html')
            .pipe(gulp.dest('build'));
});

gulp.task('copy-css', () => {
    return gulp.src('src/**/*.css')
            .pipe(gulp.dest('build'));
});

gulp.task('copy-fonts', () => {
    return gulp.src(['src/**/*.eot', 'src/**/*.svg', 'src/**/*.ttf', 'src/**/*.woff', 'src/**/*.woff2'])
            .pipe(gulp.dest('build'));
});

gulp.task('copy-fill', () => {
    return gulp.src('src/**/*.fill')
            .pipe(gulp.dest('build'));
});

gulp.task('copy-json', () => {
    return gulp.src('src/**/*.json')
            .pipe(gulp.dest('build'));
});

gulp.task('copy-bower', () => {
    return gulp.src('src/modules/pages/static/resources/bower_components/**/**')
            .pipe(gulp.dest('build/modules/pages/static/resources/bower_components'));
});

let del;
gulp.task('clean', () => {
    if (!del) {
        del = require('del');
    }
    return del(['build']);
});

gulp.task('copy', ['copy-html', 'copy-css', 'copy-fonts', 'copy-fill', 'copy-bower']);

gulp.task('build', (callback) => {
    runSequence('clean', ['babel', 'sass', 'copy'], callback);
});

gulp.task('default', ['build']);
