const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify'); //Minify JavaScript with UglifyJS3.
const obfuscate = require('gulp-obfuscate');
const header = require('gulp-header');
const rename = require('gulp-rename');
const version = require('./package.json').version;

const header_text_js =
`/*
 *
 * Add a draw board to your comment form
 *
 * V${version}
 *
 * Copyright (C) flatblowfish
 * Github:   https://github.com/flatblowfish
 * Website:  https://blog.maplesugar.top
 *
 */
`;

gulp.task('js-minify', function() {
    // return: used to signal async completion
    return gulp.src('src/cave-draw.js')
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(uglify({
            // https://github.com/mishoo/UglifyJS#mangle-options
            mangle: {
                toplevel: false // 混淆变量名
            },
            // https://github.com/mishoo/UglifyJS#compress-options
            compress: {
                drop_console: true
            }
        }).on('error', function(e){
            console.log(e);
        }))
        // 混淆后，参数为css的名称也被混淆了，直接不能运行了
        // .pipe(obfuscate())
        .pipe(header(header_text_js))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest('dist'));
});

// 如果在命令行输入gulp 会直接执行当前目录的名为default的任务
gulp.task('default', gulp.series('js-minify', function (done) {
    console.log('success: all task complete!');
    // used to signal async completion
    // gulp automatically passes a callback function to your task as its first argument. Just call that function when you're done
    done();
}));
