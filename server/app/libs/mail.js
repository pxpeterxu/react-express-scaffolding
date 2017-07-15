import nodemailer from 'nodemailer';
import fs from 'fs';
import ejs from 'ejs';
import path from 'path';
import _ from 'lodash';
import juice from 'juice';
import sass from 'node-sass';
import promisify from 'es6-promisify';

import config from '../config';
import logger from './logger';

let templateDir = path.join(__dirname.replace(/\\/g, '/'), '..', 'templates', 'mail');
// When compiling on Windows and using on Linux,
// the above .replace() is needed

// Nodemailer configuration
let defaultSendParams = {
  from: config.mailFrom
};

let transporter = nodemailer.createTransport(config.smtp, defaultSendParams);
let sendMail = promisify(transporter.sendMail.bind(transporter));

let cachedTemplates = {};

function compileTemplate(file) {
  return ejs.compile(fs.readFileSync(file, 'utf-8'));
}

/**
 * Compile a SCSS or CSS file, or returns '' if it doesn't
 * actually exist
 * @param filePath
 * @return CSS file (compiled from SCSS if needed)
 */
function compileStyle(file) {
  if (!fs.existsSync(file)) return '';

  let extension = path.extname(file);
  if (extension === '.scss') {
    return sass.renderSync({
      file: file
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
function send(to, template, data, options) {
  if (!(template in cachedTemplates)) {
    logger.debug('Loading template "' + template + '"');

    let dir = path.join(templateDir, template);

    let templates = {
      html: compileTemplate(path.join(dir, 'html.ejs')),
      text: compileTemplate(path.join(dir, 'text.ejs')),
      subject: compileTemplate(path.join(dir, 'subject.ejs')),
      style: compileStyle(path.join(dir, 'style.scss')),
    };

    cachedTemplates[template] = templates;
    logger.debug('Loaded template "' + template + '"');
  }

  let tplData = _.assign({
    _: _,
    config: config
  }, data);

  let tpl = cachedTemplates[template];
  let html = juice.inlineContent(tpl.html(tplData), tpl.style);
  let text = tpl.text(tplData);
  let subject = tpl.subject(tplData);

  return sendMail(Object.assign({
    to: to,
    subject: subject,
    text: text,
    html: html
  }, options));
}

const exported = {
  send: send,
  transporter: transporter
};

export default exported;
export { send, transporter };
