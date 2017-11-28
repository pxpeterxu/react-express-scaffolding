'use strict';

var path = require('path');

//
// This script runs flow with lowercase paths, which corresponds
// to the automatically-run flow that the VS Code plugin creates
//

var childProcess = require('child_process');
var dir = process.cwd();
var clientRoot = dir.charAt(0).toLowerCase() + dir.slice(1);

var flowPath = path.join(__dirname, '/../node_modules/.bin/flow');

childProcess.execSync(flowPath + ' status ' + clientRoot, { stdio: [0, 1, 2] });
