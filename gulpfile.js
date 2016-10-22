'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var openUrl = require('open');
var lazypipe = require('lazypipe');
var rimraf = require('rimraf');
var Karma = require('karma').Server;

var config = {
  app: require('./bower.json').appPath||'app',
  dist:'dist'
};

var paths={
  scripts: [config.app + '/scripts/**/*.js'],
  styles: [config.app + '/styles/**/*.scss'],
  test: ['test/spec/**/*.js'],
  testRequire: [
    config.app + '/bower_components/angular/angular.js',
    config.app + '/bower_components/angular-mocks/angular-mocks.js',
    config.app + '/bower_components/angular-resource/angular-resource.js',
    config.app + '/bower_components/angular-cookies/angular-cookies.js',
    config.app + '/bower_components/angular-sanitize/angular-sanitize.js',
    config.app + '/bower_components/angular-route/angular-route.js',
    'test/mock/**/*.js',
    'test/spec/**/*.js'
  ],
  karma:'karma.conf.js',
  views:{
    main:config.app + '/index.html',
    files: [config.app + '/views/**/*.html']
  }
};

////////////////////////
// Reuseable pipelines//
////////////////////////

//js代码检查
var lintScripts = lazypipe()
  .pipe($.jshint,'.jshintrc')
  .pipe($.jshint.reporter,'jshint-stylish');

//sass编写css编译和自动添加前缀适应浏览器
var styles = lazypipe()
  .pipe($.sass,{
  outputStyle:'expanded',
  precision:10
  })
  .pipe($.autoprefixer,'last 1 version')
  .pipe(gulp.dest,'./.tmp/styles');

//把静态页面编入js
var htmls=lazypipe()
  .pipe($.ngHtml2js,{
    moduleName:"activity",
    prefix:"views/"
  })
  //.pipe($.htmlmin,{collapseWhitespace: true})
  .pipe($.concat,"template.min.js")
  // .pipe($.uglify)
  .pipe(gulp.dest,'./.tmp/scripts');

///////////
// Tasks //
///////////

gulp.task('styles',function(){
  return gulp.src(paths.styles)
    .pipe(styles());
})

gulp.task('html2js',function(){
  return gulp.src(paths.views.files)
    .pipe(htmls());
})

gulp.task('lint:scripts',function(){
  return gulp.src(paths.scripts)
    .pipe(lintScripts());
})

gulp.task('clean:tmp',function(cb){
  rimraf('./.tmp',cb);
})

gulp.task('start:server',function(){
  $.connect.server({
    root:[config.app,'.tmp'],
    livereload:true,
    port:9000
  });
})

gulp.task('start:server:test',function(){
  $.connect.server({
    root:['test',config.app,'.tmp'],
    livereload:true,
    port:9001
  });
})

gulp.task('start:client',['start:server','styles'],function(){
   var options = {
    uri: 'http://localhost:9000/#/activity',
    app: 'chrome'
  };
  gulp.src(paths.views.main)
  .pipe($.open(options));
})

gulp.task('watch',function(){
  $.watch(paths.styles)
    .pipe($.plumber())
    .pipe(styles())
    .pipe($.connect.reload());
    
  $.watch(paths.views.files,function(){
    gulp.src(paths.views.files)
    .pipe(htmls());
  })

  $.watch(paths.views.files)
    .pipe($.plumber())
    .pipe($.connect.reload());
  
  $.watch(paths.scripts)
    .pipe($.plumber())
    .pipe(lintScripts())
    .pipe($.connect.reload());

  $.watch(paths.test)
    .pipe($.plumber())
    .pipe(lintScripts());
  //新增bower的包
  gulp.watch('bower.json',['bower']);
});

gulp.task('serve',function (cb){
  $.sequence('clean:tmp',
    ['lint:scripts'],
    ['start:client'],
    'watch',
    cb
  );
})

gulp.task('serve:prod',function(){
  $.connect.server({
    root:[config.dest],
    livereload:true,
    port:9000
  })
})

gulp.task('test',['start:server:test'],function(){
  var testToFiles=paths.testRequire.concat(paths.scripts,paths.test);
  return gulp.src(testToFiles)
    .pipe(new Karma({
      configFile:__dirname+'/test/'+paths.karma
    }).start());
})

gulp.task('bower',function(){
  return gulp.src(paths.views.main)
    .pipe($.wiredep({
      directory:config.app+'/bower_components',
      ignorePath:'../'
    }))
    .pipe(gulp.dest(config.app+'/'));
})

///////////
// Build //
///////////

gulp.task('clean:dist',function(cb){
  rimraf('./dist',cb);
})

gulp.task('client:build',['html','styles'],function(){
  var jsFilter=$.filter('**/*.js',{restore:true});
  var cssFilter=$.filter('**/*.css',{restore:true});

  return gulp.src(paths.views.main)
    .pipe($.useref({searchPath:[config.app,'.tmp']}))
    .pipe(jsFilter)
    .pipe($.ngAnnotate()) //自动添加依赖注入
    .pipe($.uglify()) //压缩
    .pipe(jsFilter.restore)
    .pipe(cssFilter)
    .pipe($.cleanCss({cache: true}))
    .pipe(cssFilter.restore)
    .pipe($.rev())  //产生动态文件名字
    .pipe($.revReplace())  //在html中替换动态生成的名字
    .pipe(gulp.dest(config.dist));
})

gulp.task('html',function(){
  return gulp.src(config.app+'/views/**/*')
    .pipe(gulp.dest(config.dist+'/views'));
})

gulp.task('images',function(){
  return gulp.src(config.app+'/images/**/*')
    .pipe($.cache($.imagemin({
      optimizationLevel:5,
      progressive:true,
      interlaced:true
    })))
    .pipe(gulp.dest(config.dest+'/images'));
})

gulp.task('copy:extras',function(){
  return gulp.src(config.app+'/*/.*',{dot:true})
    .pipe(gulp.dest(config.dest));
})

gulp.task('copy:fonts',function(){
  return gulp.src(config.app+'/fonts/**/*')
    .pipe(gulp.dest(config.dist+'/fonts'));
})

gulp.task('build',['clean:dist'],function(){
  $.runSequence(['images','copy:extras','copy:fonts','client:build'])
});

gulp.task('default',['build']);
