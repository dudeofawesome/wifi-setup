'use strict';

var gulp = require('gulp');
var runSequence = require('run-sequence');

var typescript;
var sourcemaps;
var tsProject;
gulp.task('build:typescript', function () {
    if (!typescript) {
        typescript = require('gulp-typescript');
        sourcemaps = require('gulp-sourcemaps');
    }
    if (!tsProject) {
        tsProject = typescript.createProject('tsconfig.json');
    }
    var tsResult = gulp.src([
            'src/**/*.ts',
            '!src/**/tests/*.test.ts',
            '!node_modules/**/*',
            'typings/main/**/*.d.ts'
        ])
        .pipe(sourcemaps.init())
        .pipe(typescript(tsProject));

    return tsResult.js
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('build'));
});

var tsProjectTests;
gulp.task('build:typescript:tests', function () {
    if (!typescript) {
        typescript = require('gulp-typescript');
        sourcemaps = require('gulp-sourcemaps');
    }
    if (!tsProjectTests) {
        tsProjectTests = typescript.createProject('tsconfig-tests.json');
    }
    var tsResult = gulp.src([
            'src/**/tests/*.test.ts',
            '!node_modules/**/*',
            'typings/main/**/*.d.ts'
        ])
        .pipe(sourcemaps.init())
        .pipe(typescript(tsProjectTests));

    return tsResult.js
            .pipe(sourcemaps.write())
            .pipe(gulp.dest('build'));
});

gulp.task('build:tests', ['build:typescript:tests']);

gulp.task('build:dev', ['build:typescript', 'build:tests']);

var exec;
gulp.task('build:deploy', ['default'], function (callback) {
    if (!exec) {
        exec = require('child_process').exec;
    }
    var commands =
        'cd ../; mkdir wifi-setup-deploy; ' +
        'cd wifi-setup-deploy; ' +
        'git clone ../wifi-setup; cd wifi-setup; ' +
        'NODE_ENV="production" npm install --production; ' +
        'cp -R ../../wifi-setup/build/ ./build;';

    exec(commands, function (err, stdout) {
        console.log(stdout);
        callback(err);
    });
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

gulp.task('copy:html', function () {
    return gulp.src('src/**/*.html')
            .pipe(gulp.dest('build'));
});

gulp.task('copy:css', function () {
    return gulp.src('src/**/*.css')
            .pipe(gulp.dest('build'));
});

gulp.task('copy:fonts', function () {
    return gulp.src(['src/**/*.eot', 'src/**/*.svg', 'src/**/*.ttf', 'src/**/*.woff', 'src/**/*.woff2'])
            .pipe(gulp.dest('build'));
});

gulp.task('copy:fill', function () {
    return gulp.src('src/**/*.fill')
            .pipe(gulp.dest('build'));
});

gulp.task('copy:json', function () {
    return gulp.src('src/**/*.json')
            .pipe(gulp.dest('build'));
});

gulp.task('copy:bower', function () {
    return gulp.src('src/modules/pages/static/resources/bower_components/**/**')
            .pipe(gulp.dest('build/modules/pages/static/resources/bower_components'));
});

var mocha;
gulp.task('test', function () {
    if (!mocha) {
        mocha = require('gulp-mocha');
    }
    return gulp.src(['build/**/tests/*.test.js', 'build/modules/test/*.test.js'], {read: false})
            .pipe(mocha({reporter: 'list'}));
});

var del;
gulp.task('clean', function () {
    if (!del) {
        del = require('del');
    }
    return del(['build']);
});

gulp.task('clean:deploy', function () {
    if (!del) {
        del = require('del');
    }
    return del(['../wifi-setup-deploy'], {force: true});
});

gulp.task('copy', ['copy:html', 'copy:css', 'copy:fonts', 'copy:fill', 'copy:bower']);

gulp.task('watch', function () {
    gulp.watch(['src/**/*.ts'], ['build:typescript']);
    gulp.watch(['src/**/*.scss', 'src/**/*.css'], ['sass']);
    gulp.watch(['src/**/**'], ['copy']);
});

gulp.task('postinstall', function (callback) {
    if (!exec) {
        exec = require('child_process').exec;
    }
    exec('bower install; typings install; gulp', function (err, stdout) {
        console.log(stdout);
        callback(err);
    });
});

gulp.task('build', function (callback) {
    runSequence('clean', ['build:typescript', 'sass', 'copy'], callback);
});

gulp.task('dev', ['build', 'watch']);

gulp.task('default', ['build']);
