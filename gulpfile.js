var gulp = require('gulp');

// Client includes
var browserify = require('browserify');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var sourcemaps = require('gulp-sourcemaps');
var nodeResolve = require('resolve');
var sass = require('gulp-sass');
var path = require('path');
var rename = require('gulp-rename');
var watchify = require('watchify');
var runSequence = require('run-sequence');

var production = (process.env.NODE_ENV === 'production');
console.log('Building for ' + (production ? 'production' : 'development'));

var webType = production ? 'prod' : 'local';
var dbType = production ? 'prod' : (process.env.DATABASE === 'production' ? 'prod': 'local');

/*
 * Start client section
 */
 
var jsWatchEnabled = false;

var watchGlobs = {};
var serverWatchGlobs = {};

var createCopyGulpTask = function(taskName, globs, destDir, isServer) {
  if (isServer) {
    serverWatchGlobs[taskName] = globs;
  } else {
    watchGlobs[taskName] = globs;
  }
  
  gulp.task(taskName, function() {
    return gulp.src(globs)
      .pipe(gulp.dest(destDir));
  });
};

// Copy all assets to the destination
createCopyGulpTask('copy-assets', 'client/assets/{**/*,*}', 'client/dist/assets', false);
createCopyGulpTask('copy-fonts', 'client/node_modules/font-awesome/fonts/*', 'client/dist/assets', false);

var pagesGlobs =  ['pages/*', 'devtools.js', 'manifest.json', 'devtools.html']
  .map(function(file) { return 'client/' + file; });
createCopyGulpTask('copy-pages', pagesGlobs, 'client/dist', false);

// Copy specific configuration files
gulp.task('copy-client-config', function() {
  var glob = 'client/js/Config.' + webType + '.js';
  serverWatchGlobs['copy-client-config'] = glob;
  
  return gulp.src(glob)
    .pipe(rename('Config.js'))
    .pipe(gulp.dest('client/js'));
});

// build-vendor based on 
// https://github.com/sogko/gulp-recipes/tree/master/browserify-separating-app-and-vendor-bundles

// Vendor packages to include for the local build
var jsVendorPackages = [
  'history',
  'lodash',
  'moment',
  'react',
  'react-bootstrap',
  'react-dom',
  'react-router'
];

// Packages that we think we might need but actually are not in
// any code path on the client side
var ignorePackages = [
  'cls-bluebird'
];

var handleError = function(error) {
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
};

gulp.task('build-vendor', function () {
  var b = browserify({ debug: true });
  if (production) {
    b.plugin('minifyify', {map: !production});
  }

  jsVendorPackages.forEach(function (id) {
    b.require(nodeResolve.sync(id, {
      basedir: path.join(__dirname, 'client')
    }), { expose: id });
  });

  return b.bundle()
    .on('error', handleError)
    .pipe(source('vendor.js'))
    .pipe(buffer())
    .pipe(gulp.dest('client/dist/js'));
});

var buildJavascript = function(sourceFile, destFile) {
  return function() {
    var b = browserify(sourceFile, { debug: true, cache: {}, packageCache: {} });
    if (jsWatchEnabled) {
      b.plugin(watchify);
    }
    
    b.transform(babelify, { presets: ['react'] });
    if (production) {
      b.plugin('minifyify', {map: !production});
    }

    jsVendorPackages.forEach(function(id) {
      b.external(id);
    });
    ignorePackages.forEach(function(id) {
      b.ignore(id);
    });
    
    var bundle = function(rebundle) {
      var stream = b.bundle()
        .on('error', handleError)
        .pipe(source(destFile))
        .pipe(buffer())
        .pipe(gulp.dest('client/dist/js'))
      
      if (rebundle) {
        stream.on('end', function() { console.log('Rebundled ' + destFile); });
      }
      
      return stream;
    };

    b.on('update', function() {
      bundle(true);
    });
    
    return bundle(false);
  };
};

gulp.task('build-web', buildJavascript('client/js/InitWeb.js', 'web.js'));

watchGlobs['build-and-copy-sass'] = 'client/assets/*.{scss,css}';
gulp.task('sass', function() {
  var stream = gulp.src(watchGlobs['build-and-copy-sass']);

  if (!production) {
    stream = stream.pipe(sourcemaps.init());
  }
  
  stream = stream.pipe(sass().on('error', sass.logError))

  if (!production) {
    stream = stream.pipe(sourcemaps.write());
  }
  
  return stream.pipe(gulp.dest('client/dist/assets'));
});

createCopyGulpTask('copy-sass', 'client/assets/*.css', 'server/public/assets', true);

gulp.task('build-and-copy-sass', function(cb) {
  runSequence('sass', 'copy-sass', cb);
});

gulp.task('build-client', ['copy-client-config', 'build-and-copy-sass', 'copy-assets', 'copy-fonts', 'copy-pages', 'build-vendor', 'build-web']);

gulp.task('start-watching-client', function(cb) {
  for (var taskName in watchGlobs) {
    var glob = watchGlobs[taskName];
    gulp.watch(glob, [taskName]);
  }
  
  cb();
});
  
gulp.task('watch-client', function(cb) {
  jsWatchEnabled = true;
  runSequence('build-client', 'start-watching-client', cb);
});

gulp.task('client', ['watch-client']); // Alias

/*
 * End client section
 */

/*
 * Start server section
 */

var nodemon = require('gulp-nodemon');
var livereload = require('gulp-livereload');
 
createCopyGulpTask('copy-client', 'client/dist/{assets/**/*,index.html,js/{vendor,web}.js}', 'server/public', true);

// Copy specific configuration files
gulp.task('copy-config', function() {
  var globs = 'server/app/config.' + dbType + '.js';
  serverWatchGlobs['copy-config'] = globs;

  return gulp.src(globs)
    .pipe(rename('config.js'))
    .pipe(gulp.dest('server/app/'));
});

var launchServer = function() {
  livereload.listen();
  nodemon({
    script: 'server/bin/www',
    ext: 'js ejs',
    watch: 'server',
    stdout: false
  }).on('readable', function () {
    this.stdout.on('data', function (chunk) {
      if(/^Express server listening on port/.test(chunk)){
        livereload.changed(__dirname + '/server');
      }
    });
    this.stdout.pipe(process.stdout);
    this.stderr.pipe(process.stderr);
  });
};

gulp.task('run-server', ['copy-client', 'copy-config'], launchServer);

gulp.task('start-watching-server', function(cb) {
  for (var taskName in serverWatchGlobs) {
    var glob = serverWatchGlobs[taskName];
    gulp.watch(glob, [taskName]);
  }
  
  cb();
});

gulp.task('watch-server', ['run-server'], function(cb) { runSequence('start-watching-server', cb); });
gulp.task('server', ['watch-server']); // Alias

gulp.task('watch-all', function(cb) { runSequence('watch-client', 'watch-server', cb); });

// Default development mode: use the live DB, but local server
gulp.task('all', function(cb) {
  webType = 'local';
  dbType = 'prod';
  runSequence('watch-all', cb);
});

// Other modes: all local (DB and web) and all live
gulp.task('all-local', function(cb) {
  webType = 'local';
  dbType = 'local';
  runSequence('watch-all', cb);
});
gulp.task('all-prod', function(cb) {
  webType = 'prod';
  dbType = 'prod';
  runSequence('watch-all', cb);
});
