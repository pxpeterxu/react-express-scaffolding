'use strict';

var gulp = require('gulp');

// Client includes
var browserify = require('browserify');
var babelify = require('babelify');
var coffeeify = require('coffeeify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var nodeResolve = require('resolve');
var sass = require('gulp-sass');
var path = require('path');
var rename = require('gulp-rename');
var watchify = require('watchify');
var runSequence = require('run-sequence');

// Server includes
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var del = require('del');
var babel = require('gulp-babel');
var cache = require('gulp-cached');

// Extension-only
var zip = require('gulp-zip');

// Webpack
var fs = require('fs');
var webpack = require('webpack');
var gutil = require('gulp-util');

var production = (process.env.NODE_ENV === 'production');
var webType = production ? 'prod' : 'local';
var dbType = production ? 'prod' :
  (process.env.DATABASE !== 'production' ? 'local' : 'prod');

/*
 * Start general helpers section
 */

function createCopyGulpTask(taskName, globs, destDir, watchGlobsVar) {
  if (watchGlobsVar) {
    watchGlobsVar[taskName] = globs;
  }

  gulp.task(taskName, function() {
    return gulp.src(globs)
      .pipe(cache(taskName))
      .pipe(gulp.dest(destDir));
  });
}

function getWatchTask(globs) {
  return function(cb) {
    for (var taskName in globs) {  // eslint-disable-line
      var glob = globs[taskName];
      gulp.watch(glob, [taskName]);
    }
    cb();
  };
}

/**
 * Get a gulp task to delete all items at a certain path
 * @param {string|string[]} globs
 * @return Promise.<void>
 */
function getDelTask(globs) {
  return function() {
    globs = globs instanceof Array ? globs : [globs];
    return del(globs);
  };
}

var jsWatchEnabled = false;

gulp.task('clean', getDelTask('dist'));

/*
 * End general helpers section
 */

/*
 * Start client section
 */

var clientWatchGlobs = {};
var serverWatchGlobs = {};

// Copy all assets to the destination
createCopyGulpTask('copy-assets', 'client/assets/{**/*,*}', 'dist/client/assets', clientWatchGlobs);
createCopyGulpTask('copy-fonts', 'node_modules/font-awesome/fonts/*', 'dist/client/assets', clientWatchGlobs);

// Copy specific configuration files
gulp.task('copy-client-config', function() {
  var glob = 'client/js/Config.' + webType + '.js';
  serverWatchGlobs['copy-client-config'] = glob;
  console.log(glob);

  return gulp.src(glob)
    .pipe(rename('Config.js'))
    .pipe(gulp.dest('client/js'));
});

// build-vendor based on
// https://github.com/sogko/gulp-recipes/tree/master/browserify-separating-app-and-vendor-bundles

// Vendor packages to include for the local build
var jsVendorPackages = require('./vendorPackages.json');

// Packages that we think we might need but actually are not in
// any code path on the client side
var ignorePackages = [];

function handleError(error) {
  var stack = error.stack;

  // Trim the parser junk that makes you have to scroll up a lot
  var firstParseIndex = stack.indexOf('Parser.pp.');
  if (firstParseIndex !== -1) {
    var trimmedStack = stack.substring(0, firstParseIndex);
    console.log(trimmedStack);
  } else {
    console.log(stack);
  }

  this.emit('end');
}

gulp.task('build-vendor', function() {
  var b = browserify({ debug: true });
  if (production) {
    b.plugin('minifyify', { map: !production });
  }

  jsVendorPackages.forEach(function(id) {
    b.require(nodeResolve.sync(id, {
      basedir: path.join(__dirname, 'client')
    }), { expose: id });
  });

  return b.bundle()
    .on('error', handleError)
    .pipe(source('vendor.js'))
    .pipe(buffer())
    .pipe(gulp.dest('dist/client/js'));
});

function buildJavascript(sourceFile, destFile, destDir) {
  destDir = destDir || 'dist/client/js';

  return function() {
    var b = browserify(sourceFile, { debug: true, cache: {}, packageCache: {} });
    if (jsWatchEnabled) {
      b.plugin(watchify);
    }

    b.transform(coffeeify, { sourceMap: !production });
    b.transform(babelify, {
      presets: ['react', 'es2015', 'flow'],
      plugins: ['transform-class-properties']
    });
    if (production) {
      b.plugin('minifyify', { map: !production });
    }

    jsVendorPackages.forEach(function(id) {
      b.external(id);
    });
    ignorePackages.forEach(function(id) {
      b.ignore(id);
    });

    function bundle(rebundle) {
      var stream = b.bundle()
        .on('error', handleError)
        .pipe(source(destFile))
        .pipe(buffer())
        .pipe(gulp.dest(destDir));

      if (rebundle) {
        stream.on('end', function() { console.log('Rebundled ' + destFile); });
      }

      return stream;
    }

    b.on('update', function() {
      bundle(true);
    });

    return bundle(false);
  };
}

gulp.task('build-web', ['copy-client-config'], buildJavascript('client/js/InitWeb.js', 'web.js'));

/* eslint-disable dot-notation */
clientWatchGlobs['sass'] = 'client/assets/styles.scss';
gulp.task('sass', function() {
  var stream = gulp.src(clientWatchGlobs['sass']);

  if (!production) {
    stream = stream.pipe(sourcemaps.init());
  }

  stream = stream.pipe(sass().on('error', sass.logError));

  if (!production) {
    stream = stream.pipe(sourcemaps.write());
  }

  return stream
    .pipe(gulp.dest('dist/client/assets'))
    .pipe(gulp.dest('dist/app/server/public/assets'));
});

gulp.task('clean-client', getDelTask('dist/client'));
gulp.task('build-client', ['sass', 'copy-assets', 'copy-fonts', 'build-web', 'build-vendor']);
gulp.task('start-watching-client', getWatchTask(clientWatchGlobs));

gulp.task('watch-client', function(cb) {
  jsWatchEnabled = true;
  runSequence('build-client', 'start-watching-client', cb);
});

/*
 * End client section
 */

/*
 * Start server section
 */

var nodemon = require('gulp-nodemon');
var livereload = require('gulp-livereload');

/**
 * Create a task that will build Javascript/ES6/Flow files through Babel
 * @param {string} name          task name
 * @param {Array}  globs         globs to use as JS file inputs
 * @param {string} destination   directory for output files
 */
function createBuildServerGulpTask(name, globs, destination) {
  serverWatchGlobs[name] = globs;

  gulp.task(name, function() {
    return gulp.src(globs)
      .pipe(cache(name))
      .pipe(sourcemaps.init())
      .pipe(babel({
        presets: [
          'react',
          'flow',
          ['env', { targets: { node: 6 } }]
        ],
        plugins: ['transform-class-properties']
      }))
      .on('error', handleError)
      .pipe(sourcemaps.write('.'))
      .pipe(gulp.dest(destination));
  });
}

createCopyGulpTask('copy-client', 'dist/client/{assets/**/*,docs/*,js/*}', 'dist/app/server/public', serverWatchGlobs);

gulp.task('copy-and-rename-client', function(cb) {
  runSequence('build-views-and-rename', 'copy-client', cb);
});

/**
 * Launch the server with a given script/URL being the main script
 * @param {string} script  script to call
 */
function launchServer(script) {
  livereload.listen();
  nodemon({
    script: script,
    ext: 'js ejs coffee css jpg png',
    env: {
      NODE_ENV: webType === 'prod' ? 'production' : 'development',
      DATABASE: dbType === 'prod' ? 'production' : 'development'
    },
    delay: 0.2,
    watch: ['server', 'client'],
    stdout: false
  }).on('readable', function() {
    this.stdout.on('data', function(chunk) {
      if (/^Express server listening on port/.test(chunk)) {
        livereload.changed(path.join(__dirname, 'server'));
      }
    });
    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  });
}

//
// These jobs are used for packing server components for distribution
// to private cloud hosting licensors
//
var packedWatchGlobs = {};
createCopyGulpTask('copy-packed', 'dist/app/{server/{logs/.gitignore,{public,app/templates}/**/*},.ebextensions/**/*,package.json}', 'dist/packed', packedWatchGlobs);
gulp.task('clean-packed', getDelTask('dist/{app.zip,packed}'));

gulp.task('build-packed', function(cb) {
  runSequence('clean-packed', ['webpack-server', 'copy-packed'], cb);
});

gulp.task('zip-packed', function() {
  gulp.src('dist/packed/{.ebextensions,**}/**/*')
    .pipe(zip('app.zip'))
    .pipe(gulp.dest('dist'));
});

// This is used for packing all the server components into
// a single file for distribution
gulp.task('webpack-server', function(callback) {
  var plugins = [
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(true),
    new webpack.optimize.UglifyJsPlugin()
  ];

  var nodeModules = {};
  fs.readdirSync('node_modules')
    .filter(function(x) {
      return ['.bin'].indexOf(x) === -1;
    })
    .forEach(function(mod) {
      nodeModules[mod] = 'commonjs ' + mod;
    });

  var callbackCalled = false;
  webpack({
    context: __dirname,
    entry: {
      www: './server/bin/www-packed.js'
    },
    target: 'node',
    node: {
      __dirname: true,
      __filename: false
    },
    externals: nodeModules,
    module: {
      loaders: [{
        test: /\.json$/,
        loader: 'json-loader'
      }, {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['react', 'es2015', 'flow'],
          plugins: ['transform-class-properties']
        }
      }]
    },
    plugins: plugins,
    output: {
      filename: '[name].js',
      path: 'dist/packed'
    },
    profile: true,
    devtool: false
  }, function(err, stats) {
    if (err) throw new gutil.PluginError('webpack', err);
    var output = stats.toString({
      chunks: false,
      warnings: false
    });
    if (output) {
      gutil.log('[webpack]', output);
    } else {
      gutil.log('[webpack] Rebundled');
    }

    if (!callbackCalled) {
      callbackCalled = true;
      callback();
    }
  });
});

createCopyGulpTask('copy-server', '{server/{certs/ca.pem,keys/ca.{public,private}.key,logs/.gitignore,app/templates/**/*},.ebextensions/**/*,package.json}', 'dist/app', serverWatchGlobs);
createCopyGulpTask('copy-env', 'server/.env*', 'dist/app/server', serverWatchGlobs);
createBuildServerGulpTask('build-server-js', '{common/**/*.js,server/{{app,es6,bin,scripts}/**/*.js,*.js},client/{js,templates,libs}/**/*.js}', 'dist/app');

gulp.task('clean-server', getDelTask('dist/app'));
gulp.task('build-server', ['copy-server', 'copy-env', 'build-server-js', 'copy-and-rename-client']);

//
// Version suffixing
//
gulp.task('build-views', function buildViews() {
  var viewsGlob = 'server/views/*.ejs';
  clientWatchGlobs['build-views'] = viewsGlob;

  var ret = gulp.src(viewsGlob);
  if (production) {
    ret = ret.pipe(revReplace({
      replaceInExtensions: ['.html'],
      manifest: gulp.src('dist/client/js/rev-manifest.json')
    }));
  } else {
    ret = ret.pipe(cache('build-views'));
  }

  return ret.pipe(gulp.dest('dist/app/server/views'));
});

var revRenameGlob = 'dist/client/{js/{web,vendor}.js,assets/styles.css}';
gulp.task('rev-rename', function() {
  if (production) {
    return gulp.src(revRenameGlob)
      .pipe(rev())
      .pipe(gulp.dest('dist/client'))
      .pipe(rev.manifest())  // Used for rev-replace-references
      .pipe(gulp.dest('dist/client/js'));
  }
  return null;
});

gulp.task('build-views-and-rename', ['rev-rename'], function(cb) {
  runSequence('build-views', cb);
});

gulp.task('run-proxy', ['build-server'], launchServer.bind(null, 'dist/app/server/bin/proxy.js'));
gulp.task('run-server', ['build-server'], launchServer.bind(null, 'dist/app/server/bin/www.js'));
gulp.task('run-everything', ['build-server'], launchServer.bind(null, 'dist/app/server/bin/all.js'));

gulp.task('start-watching-server', getWatchTask(serverWatchGlobs));

gulp.task('watch-server', ['run-server'], function(cb) { runSequence('start-watching-server', cb); });
gulp.task('watch-everything', ['run-everything'], function(cb) { runSequence('start-watching-server', cb); });
gulp.task('watch-proxy', ['run-proxy'], function(cb) { runSequence('start-watching-server', cb); });

gulp.task('server', ['watch-server']); // Alias

/**
 * Get a task for a top-level development command
 * @param {string} watchTasks  tasks to run to build + watch files
 * @param {string} runTask     gulp task to run to run server
 */
function getDevTask(watchTasks, runTask) {
  return function(cb) {
    // Set NODE_ENV for long stack traces
    process.env.NODE_ENV = production ? 'production' : 'development';
    process.env.BLUEBIRD_WARNINGS = 0; // Bluebird emits warnings for throw "String" which is annoying
    console.log('Building for ' + process.env.NODE_ENV + ' using:');
    console.log('Web (domain): ' + webType);
    console.log('Database: ' + dbType);

    runSequence(watchTasks, runTask, cb);
  };
}

gulp.task('dev', getDevTask('watch-client', 'watch-server'));

/**
 * Get a task to start a development task in a certain environment
 * (by setting environment variables, webType, dbType)
 * @param {string} webType   'local' or 'prod'
 * @param {string} dbType    'local' or 'prod'
 * @param {string} devTask   development environment task
 */
function getEnvironmentTask(web, db, devTask) {
  return function setEnvironment(cb) {
    webType = web;
    dbType = db;
    production = web === 'prod';
    runSequence(devTask, cb);
  };
}

// Default development mode: use the live DB, but local server
gulp.task('all', getEnvironmentTask('local', 'prod', 'dev'));
gulp.task('all-local', getEnvironmentTask('local', 'local', 'dev'));
gulp.task('all-prod', getEnvironmentTask('prod', 'prod', 'dev'));
