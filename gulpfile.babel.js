import gulp from 'gulp';
import babel from 'gulp-babel';
import sourcemaps from 'gulp-sourcemaps';

gulp.task('build', () =>
  gulp.src('src/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel({ presets: ['es2015', 'es2016', 'react'] }))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('dist'))
);
