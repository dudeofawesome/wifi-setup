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

gulp.task('copy-fill', () => {
    return gulp.src('src/**/*.html')
            .pipe(gulp.dest('build'));
});

gulp.task('copy-bower', () => {
    return gulp.src('src/modules/pages/static/resources/bower_components')
            .pipe(gulp.dest('build/modules/pages/static/resources/bower_components'));
});

let del;
gulp.task('clean', () => {
    if (!del) {
        del = require('del');
    }
    return del(['build']);
});

gulp.task('build', (callback) => {
    runSequence('clean', ['babel', 'sass'], callback);
});

gulp.task('default', ['build']);
