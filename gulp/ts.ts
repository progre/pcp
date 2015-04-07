/// <reference path="../typings.d.ts" />
import Gulp = require('gulp');
import del = require('del');
import path = require('path');
var merge = require('merge2');
import vinyl = require('vinyl');
import runSequence = require('run-sequence');
import sourcemaps = require('gulp-sourcemaps');
import tslint = require('gulp-tslint');
import typescript = require('gulp-typescript');
var notify = require('gulp-notify');

var DEFINITELY_PATH = 'tmp-typings/';

function tsc(gulp: typeof Gulp, options: { srcPath: string[]; dstPath: string; }) {
    gulp.task('ts', callback => {
        runSequence('ts-build', 'ts-lint', callback);
    });
    gulp.task('ts-release', callback => {
        runSequence('ts-release-build', 'ts-lint', callback);
    });

    gulp.task('ts-lint',() =>
        gulp.src(['**/*.ts', '!**/*.d.ts', '!node_modules/**', '!typings/**'])
            .pipe(tslint())
            .pipe(tslint.report(tsLintReporter)));

    gulp.task('ts-build',() =>
        gulp.src(options.srcPath)
            .pipe(sourcemaps.init())
            .pipe(typescript(tsProject(), undefined, tsReporter()))
            .pipe(sourcemaps.write())
            .pipe(gulp.dest(options.dstPath)));
    gulp.task('ts-release-build',() => {
        var tsResult = gulp.src(options.srcPath)
            .pipe(typescript(tsProject(), undefined, tsReporter()));
        return merge([
            tsResult.js.pipe(gulp.dest(options.dstPath)),
            tsResult.dts.pipe(gulp.dest(DEFINITELY_PATH))
        ]);
    });

    gulp.task('ts-watch',() => {
        gulp.watch(options.srcPath,() =>
            runSequence('cutoff-line', 'ts', 'test'));
    });

    gulp.task('ts-clean', callback => {
        del(options.dstPath, callback);
    });
}

function tsProject() {
    return typescript.createProject({
        target: 'ES6',
        module: 'commonjs',
        noImplicitAny: true,
        declarationFiles: true
    });
}

function tsLintReporter(output: tslint.Output[], file: vinyl, options: tslint.Options) {
    var YELLOW = '\u001b[33m';
    var RESET = '\u001b[0m';
    var filePath = path.relative('', file.path);
    output.forEach(failure => {
        var startPosition = failure.startPosition;
        var message = filePath
            + '(' + startPosition.line + ',' + startPosition.character + ')'
            + ': ' + failure.failure;
        console.warn(YELLOW + message + RESET);
    });
    notify.onError({ sound: true })
        (filePath + ' ' + output.length + ' warn(s)');
}

function tsReporter() {
    return {
        error: notify.onError(error => {
            console.error(error.message);
            return error.relativeFilename + ' has error.';
        })
    };
}

export = tsc;
