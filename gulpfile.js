'use strict';

/**
 * 模块依赖.
 */
 var _ = require('lodash'),
 	defaultAssets = require('./config/assets/default'),
 	gulp = require('gulp'),
	gulpLoadPlugins = require('gulp-load-plugins'),
	runSequence = require('run-sequence'),
	plugins = gulpLoadPlugins({
		rename: {
			'gulp-angular-templatecache': 'templateCache'
		}
	});

// 设置 NODE_ENV to 'test'
gulp.task('env:test', function () {
  process.env.NODE_ENV = 'test';
});

// 设置 NODE_ENV to 'development'
gulp.task('env:dev', function () {
  process.env.NODE_ENV = 'development';
});

// 设置 NODE_ENV to 'production'
gulp.task('env:prod', function () {
  process.env.NODE_ENV = 'production';
});

 // Nodemon task
gulp.task('nodemon', function () {
  return plugins.nodemon({
    script: 'server.js',
    nodeArgs: ['--debug'],
    ext: 'js,html',
    watch: _.union(defaultAssets.server.views, defaultAssets.server.allJS, defaultAssets.server.config)
  });
});

// 监听文件变化
gulp.task('watch', function () {
  // 自动刷新模式
  // plugins.livereload.listen();

  // // 添加要监听的文件
  // gulp.watch(defaultAssets.server.views).on('change', plugins.livereload.changed);
  // gulp.watch(defaultAssets.server.allJS, ['jshint']).on('change', plugins.livereload.changed);
  // gulp.watch(defaultAssets.client.js, ['jshint']).on('change', plugins.livereload.changed);
  // gulp.watch(defaultAssets.client.css, ['csslint']).on('change', plugins.livereload.changed);
  // gulp.watch(defaultAssets.client.sass, ['sass', 'csslint']).on('change', plugins.livereload.changed);
  // gulp.watch(defaultAssets.client.less, ['less', 'csslint']).on('change', plugins.livereload.changed);

  // if (process.env.NODE_ENV === 'production') {
  //   gulp.watch(defaultAssets.server.gulpConfig, ['templatecache', 'jshint']);
  //   gulp.watch(defaultAssets.client.views, ['templatecache', 'jshint']).on('change', plugins.livereload.changed);
  // } else {
  //   gulp.watch(defaultAssets.server.gulpConfig, ['jshint']);
  //   gulp.watch(defaultAssets.client.views).on('change', plugins.livereload.changed);
  // }
});

 // CSS 效验
gulp.task('csslint', function (done) {
  return gulp.src(defaultAssets.client.css)
    .pipe(plugins.csslint('.csslintrc'))
    .pipe(plugins.csslint.reporter())
    .pipe(plugins.csslint.reporter(function (file) {
      if (!file.csslint.errorCount) {
        done();
      }
    }));
});

// js效验
gulp.task('jshint', function () {
  var assets = _.union(
    defaultAssets.server.gulpConfig,
    defaultAssets.server.allJS,
    defaultAssets.client.js,
    testAssets.tests.server,
    testAssets.tests.client,
    testAssets.tests.e2e
  );

  return gulp.src(assets)
    .pipe(plugins.jshint())
    .pipe(plugins.jshint.reporter('default'))
    .pipe(plugins.jshint.reporter('fail'));
});

// es效验
gulp.task('eslint', function () {
  var assets = _.union(
    defaultAssets.server.gulpConfig,
    defaultAssets.server.allJS,
    defaultAssets.client.js,
    testAssets.tests.server,
    testAssets.tests.client,
    testAssets.tests.e2e
  );

  return gulp.src(assets)
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.format());
});

// JS 压缩合并
gulp.task('uglify', function () {
  var assets = _.union(
    defaultAssets.client.js,
    defaultAssets.client.templates
  );

  return gulp.src(assets)
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.uglify({
      mangle: false
    }))
    .pipe(plugins.concat('application.min.js'))
    .pipe(gulp.dest('public/dist'));
});

 // 效验css和js.
gulp.task('lint', function (done) {
  // runSequence('less', 'sass', [/*'csslint',*/ 'eslint', 'jshint'], done);
});

// 效验文件，压缩合并.
gulp.task('build', function (done) {
  runSequence('env:dev', 'lint', ['uglify', 'cssmin'], done);
});

// 测试环境
gulp.task('test', function (done) {
  runSequence('env:test', 'lint', 'mocha', 'karma', 'nodemon', 'protractor', done);
});

gulp.task('test:server', function (done) {
  runSequence('env:test', 'lint', 'mocha', done);
});

gulp.task('test:client', function (done) {
  runSequence('env:test', 'lint', 'karma', done);
});

gulp.task('test:e2e', function (done) {
  runSequence('env:test', 'lint', 'dropdb', 'nodemon', 'protractor', done);
});

 // 开发环境
gulp.task('default', function (done) {
  runSequence('env:dev', ['nodemon', 'watch'], done);
});

// 调试环境
gulp.task('debug', function (done) {
  runSequence('env:dev', 'lint', ['nodemon', 'watch'], done);
});

// 生产环境
gulp.task('prod', function (done) {
  runSequence('templatecache', 'build', 'env:prod', 'lint', ['nodemon', 'watch'], done);
});
