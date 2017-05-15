'use strict';

/**
 * 模块依赖.
 */
 var _ = require('lodash'),
  chalk = require('chalk'),
  glob = require('glob'),
  fs = require('fs'),
  path = require('path');

/**
 * Get files by glob patterns
 */
var getGlobbedPaths = function (globPatterns, excludes) {
  // URL paths regex
  var urlRegex = new RegExp('^(?:[a-z]+:)?\/\/', 'i');

  // The output array
  var output = [];

  // If glob pattern is array then we use each pattern in a recursive way, otherwise we use glob
  if (_.isArray(globPatterns)) {
    globPatterns.forEach(function (globPattern) {
      output = _.union(output, getGlobbedPaths(globPattern, excludes));
    });
  } else if (_.isString(globPatterns)) {
    if (urlRegex.test(globPatterns)) {
      output.push(globPatterns);
    } else {
      var files = glob.sync(globPatterns);
      if (excludes) {
        files = files.map(function (file) {
          if (_.isArray(excludes)) {
            for (var i in excludes) {
              file = file.replace(excludes[i], '');
            }
          } else {
            file = file.replace(excludes, '');
          }
          return file;
        });
      }
      output = _.union(output, files);
    }
  }

  return output;
};

 /**
 * 效验环境
 */
var validateEnvironmentVariable = function () {
  var environmentFiles = glob.sync('./config/env/' + process.env.NODE_ENV + '.js');
  console.log();
  if (!environmentFiles.length) {
    if (process.env.NODE_ENV) {
      console.error(chalk.red('+ Error: No configuration file found for "' + process.env.NODE_ENV + '" environment using development instead'));
    } else {
      console.error(chalk.red('+ Error: NODE_ENV is not defined! Using default development environment'));
    }
    process.env.NODE_ENV = 'development';
  }
  // Reset console color
  console.log(chalk.white(''));
};

/**
 * Initialize global configuration files
 */
var initGlobalConfigFiles = function (config, assets) {
  // Appending files
  config.files = {
    server: {},
    client: {}
  };

  // Setting Globbed model files
  config.files.server.models = getGlobbedPaths(assets.server.models);

  // Setting Globbed route files
  config.files.server.routes = getGlobbedPaths(assets.server.routes);

  // Setting Globbed config files
  config.files.server.configs = getGlobbedPaths(assets.server.config);

  // Setting Globbed socket files
  config.files.server.sockets = getGlobbedPaths(assets.server.sockets);

  // Setting Globbed policies files
  config.files.server.policies = getGlobbedPaths(assets.server.policies);

  // Setting Globbed js files
  config.files.client.js = getGlobbedPaths(assets.client.lib.js, 'public/').concat(getGlobbedPaths(assets.client.js, ['public/']));

  // Setting Globbed css files
  config.files.client.css = getGlobbedPaths(assets.client.lib.css, 'public/').concat(getGlobbedPaths(assets.client.css, ['public/']));

  // Setting Globbed test files
  config.files.client.tests = getGlobbedPaths(assets.client.tests);
};

 /**
 * 初始化全局配置
 */
var initGlobalConfig = function () {
	// 效验环境
  	validateEnvironmentVariable();

  	// Get the default assets
  	var defaultAssets = require(path.join(process.cwd(), 'config/assets/default'));

  	// Get the current assets
	var environmentAssets = require(path.join(process.cwd(), 'config/assets/', process.env.NODE_ENV)) || {};

	// Merge assets
	var assets = _.merge(defaultAssets, environmentAssets);

	// Get the default config
	var defaultConfig = require(path.join(process.cwd(), 'config/env/default'));

	// Get the current config
	var environmentConfig = require(path.join(process.cwd(), 'config/env/', process.env.NODE_ENV)) || {};

  	// Merge config files
  	var config = _.merge(defaultConfig, environmentConfig);

  	// read package.json for MEAN.JS project information
	var pkg = require(path.resolve('./package.json'));
	config.meanjs = pkg;

	// We only extend the config object with the local.js custom/local environment if we are on
	// production or development environment. If test environment is used we don't merge it with local.js
	// to avoid running test suites on a prod/dev environment (which delete records and make modifications)
	if (process.env.NODE_ENV !== 'test') {
		config = _.merge(config, (fs.existsSync(path.join(process.cwd(), 'config/env/local.js')) && require(path.join(process.cwd(), 'config/env/local.js'))) || {});
	}

  	// Initialize global globbed files
  	initGlobalConfigFiles(config, assets);

  	return config;

};

 /**
 * 配置
 */
module.exports = initGlobalConfig();