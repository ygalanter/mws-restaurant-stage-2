const gulp = require('gulp');
const webp = require('gulp-webp');
 
gulp.task('default', () => {
   console.log("hello world");
 }
);

 
gulp.task('jpg2webp', () =>
    gulp.src('img/*')
        .pipe(webp())
        .pipe(gulp.dest('img'))
);