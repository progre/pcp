/// <reference path="typings.d.ts" />
import childProcess = require('child_process');
import chalk = require('chalk');
import del = require('del');
import runSequence = require('run-sequence');
import gulp = require('gulp');
import mocha = require('gulp-mocha');

require('./gulp/ts')(gulp, {
    srcPath: ['src/**/*.ts'],
    dstPath: 'lib/'
});

gulp.task('default', callback => {
    runSequence('build', 'test', 'watch', callback);
});
gulp.task('release', callback => {
    runSequence('build-release', 'test', callback);
});
gulp.task('clean', callback => {
    runSequence(['global-clean', 'ts-clean'], callback);
});
gulp.task('global-clean', callback => {
    del('tmp/', callback);
});
gulp.task('build', callback => {
    runSequence('ts', callback);
});
gulp.task('build-release', ['clean'], callback => {
    runSequence('ts-release', callback);
});
gulp.task('test', callback => {
    childProcess.exec('npm rm pcp',(err, stdout, stderr) => {
        childProcess.exec('npm i ./',(err, stdout, stderr) => {
            del('tmp/',() => {
                gulp.src('typings/pcp/pcp-tests.ts', { read: false })
                    .pipe(mocha({ reporter: 'nyan' }))
                    .on('end', callback);
            });
        });
    });
});
gulp.task('watch', callback => {
    runSequence(['global-watch', 'ts-watch'], callback);
});
gulp.task('global-watch',() => {
    gulp.watch('test/**/*', ['cutoff-line', 'test']);
});
gulp.task('cutoff-line',() => {
    console.log();
    console.log();
    console.log(chalk.green('✄------------------------------------ｷﾘﾄﾘ線------------------------------------✄'));
    console.log();
    console.log();
});
