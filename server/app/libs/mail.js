import nodemailer from 'nodemailer';
import fs from 'fs';
import ejs from 'ejs';
import path from 'path';
import _ from 'lodash';
import glob from 'glob';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import sass from 'node-sass';
import juice from 'juice';
import moment from 'moment';
import wordwrap from 'wordwrap';
import promisify from 'es6-promisify';

import config from '../config';

const wrap = wordwrap(0, 75);

const templateDir = path.join(__dirname, '..', 'templates', 'mail');
const cachedTemplates = {};

// Nodemailer configuration
const defaultSendParams = {
  from: config.mailFrom
};

export const transporter = nodemailer.createTransport(config.smtp, defaultSendParams);
export const sendMail = promisify(transporter.sendMail.bind(transporter));

/**
 * Compile a template file at filePath into a function
 * that can be called with the input data to get resulting
 * text or HTML
 * @param filePath  path to the file (without extension)
 * @return function(templateData) { return rendered; }
 */
function compileTemplate(filePath) {
  const files = glob.sync(filePath + '*');
  if (!files || !files.length) {
    return function() { return ''; };
  }
  const file = files[0];

  const extension = path.extname(file);
  if (extension === '.ejs') {
    // EJS
    try {
      return ejs.compile(fs.readFileSync(file, 'utf-8'), { filename: file });
    } catch (err) {
      console.error(`Error while compiling ${file}`);
      throw err;
    }
  } else if (extension === '.js') {
    // React
    /* eslint-disable global-require import/no-dynamic-require */
    let reactObj = require(file);
    if (reactObj && reactObj.default) {
      reactObj = reactObj.default;
    }

    return function renderReact(tplData) {
      return ReactDOMServer.renderToStaticMarkup(
        React.createElement(reactObj, tplData)
      );
    };
  }

  return function() { return ''; };
}

/**
 * Compile a SCSS or CSS file, or returns '' if it doesn't
 * actually exist
 * @param filePath
 * @return CSS file (compiled from SCSS if needed)
 */
function compileStyle(filePath) {
  const files = glob.sync(filePath + '*');
  if (!files || !files.length) return '';
  const file = files[0];

  const extension = path.extname(file);
  if (extension === '.scss') {
    return sass.renderSync({
      file: file,
      includePaths: [
        path.join(__dirname, '/../../../client/assets'),
        path.join(__dirname, '/../../../../../client/assets'), // Escape the `dist` directory
      ],
    }).css.toString();
  } else if (extension === '.css') {
    return fs.readFileSync(file);
  } else {
    return '';
  }
}

/**
 * Send an email based on an email template
 * @param to        email address to send to (array, or comma-separated list)
 * @param template  name of the email template to use (in app/templates)
 * @param data      data to be passed to the template
 * @param options   additional options to be passed to nodemailer
 * @return Promise.<info> from nodemailer.sendMail
 */
export function send(to, template, data, options = {}) {
  if (!(template in cachedTemplates)) {
    const dir = path.join(templateDir, template);

    const templateFuncs = {
      html: compileTemplate(path.join(dir, 'html')),
      text: compileTemplate(path.join(dir, 'text')),
      subject: compileTemplate(path.join(dir, 'subject')),
      style: compileStyle(path.join(dir, 'style')),
      styleTag: compileStyle(path.join(dir, 'styleTag'))
    };
    cachedTemplates[template] = templateFuncs;
  }

  const tpl = cachedTemplates[template];
  const tplData = _.assign({
    config,
    moment,
    _,
    style: tpl.styleTag,
    email: to
  }, data);

  const html = juice.inlineContent(tpl.html(tplData), tpl.style)
    .replace(/class="([^"]+)"/g, 'class="$1" summary="$1"');
    // Duplicate all classes in title tags for use in CSS
    // selectors (Gmail strips classes)
  const text = wrap(tpl.text(tplData));
  const subject = tpl.subject(tplData).trim();


  return sendMail(Object.assign({
    to,
    subject,
    text,
    html
  }, options));
}

export default {
  send
};
