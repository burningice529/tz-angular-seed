'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var lazypipe = require('lazypipe');
var rimraf = require('rimraf');

var config = {
  app: 'app',
  dist: 'dist'
};

var paths = {
  scripts: [config.app + '/scripts/**/*.js'],
  styles: [config.app + '/styles/**/*.scss'],
  views: {
    main: config.app + "/index.html",
    files: [config.app + "/views/**/*.html"]
  }
}
var lintScripts = lazypipe()
  .pipe($.jshint,'.jshintrc')
  .pipe($.jshint.reporter,'jshint-stylish');
//sass编写
var styles = lazypipe()
  .pipe($.sass, {
    outputStyle: 'expanded',
    precision: 10
  })
  .pipe(gulp.dest, './.tmp/styles');
//html转成js文件
var htmls = lazypipe()
  .pipe($.ngHtml2js, {
    moduleName: "nbf_sms",
    prefix: "views/"
  })
  .pipe($.concat, "template.min.js")
  .pipe(gulp.dest, './.tmp/scripts');

//tasks
gulp.task('styles', function () {
  return gulp.src(paths.styles)
    .pipe(styles());
})

gulp.task('html2js', function () {
  return gulp.src(paths.views.files)
    .pipe(htmls());
})
gulp.task('lint:scripts',function(){
  return gulp.src(paths.scripts)
    .pipe(lintScripts());
})
//清理tmp目录
gulp.task('clean:tmp', function (cb) {
  rimraf('./.tmp', cb);
})
//清理dist目录
gulp.task('clean:dist', function (cb) {
  rimraf('./dist', cb);
})
//bower自动加载包
gulp.task('bower', function () {
  return gulp.src(paths.views.main)
    .pipe($.wiredep({
      directory: config.app + '/bower_components',
      ignorePath: '../'
    }))
    .pipe(gulp.dest(config.app + '/'));
})
//开启服务
gulp.task('start:server', function () {
  $.connect.server({
    root: [config.app, '.tmp', 'data'],
    livereload: true,
    port: 9000
  })
})

gulp.task('start:client', ['start:server', 'styles', 'html2js'], function () {
  var options = {
    uri: 'http://127.0.0.1:9000/#/',
    app: 'chrome'
  };
  gulp.src(paths.views.main)
    .pipe($.open(options));
})


gulp.task('watch', function () {
  $.watch(paths.styles)
    .pipe($.plumber())
    .pipe(styles())
    .pipe($.connect.reload());

  $.watch(paths.views.files, function () {
    gulp.src(paths.views.files)
      .pipe(htmls());
  })

  $.watch(paths.views.files)
    .pipe($.plumber())
    .pipe($.connect.reload());

  $.watch(paths.scripts)
    .pipe($.plumber())
    .pipe($.connect.reload());

  //新增bower的包
  gulp.watch('bower.json', ['bower']);

});

gulp.task('serve', function (cb) {
  $.sequence('clean:tmp',
    ['start:client'],
    'watch',
    cb
  );
})
//默认任务
gulp.task('default', ['serve']);

//发布代码
gulp.task('build', ['clean:dist'], function (cb) {
  $.sequence(
    'images',
    ['copy:fonts'],
    ['copy:skin'],
    ['client:build'],
    cb
  );
})

//拷贝压缩图片
gulp.task('images',function(){
  return gulp.src(config.app+'/images/**/*')
    .pipe(
      $.cache(
        $.imagemin({
          optimizationLevel:5,
          progressive:true,
          interlaced:true
        })
      )
    )
    .pipe(
      gulp.dest(config.dist+'/images')
    );
})

//拷贝fonts
gulp.task('copy:fonts',function(){
  return gulp.src(config.app+'/fonts/**/*')
    .pipe(gulp.dest(config.dist+'/fonts'));
})
//拷贝fonts
gulp.task('copy:skin',function(){
  return gulp.src(config.app+'/skin/**/*')
    .pipe(gulp.dest(config.dist+'/skin'));
})
//发布任务
gulp.task('client:build',['styles','html2js'],function(){
  var jsFilter=$.filter('**/*.js',{restore:true});
  var cssFilter=$.filter('**/*.css',{restore:true});

  return gulp.src(paths.views.main)
    .pipe($.useref({searchPath:[config.app,'.tmp']}))
    .pipe(jsFilter)
    .pipe($.stripDebug())
    .pipe($.uglify()) //压缩
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe($.cleanCss({cache: true}))
    .pipe(cssFilter.restore)
    .pipe($.rev())  //产生动态文件名字
    .pipe($.revReplace())  //在html中替换动态生成的名字
    .pipe(gulp.dest(config.dist));
})