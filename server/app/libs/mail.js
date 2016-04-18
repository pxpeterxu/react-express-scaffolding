var nodemailer = require('nodemailer');
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');
var _ = require('lodash');
var Promise = require('bluebird');

var config = require('../config');
var logger = require('./logger');

var templateDir = path.join(__dirname, '..', 'templates', 'mail');

// Nodemailer configuration
var defaultSendParams = {
  from: config.mailFrom
};

var transporter = nodemailer.createTransport(config.smtp, defaultSendParams);
var sendMail = Promise.promisify(transporter.sendMail.bind(transporter));

var cachedTemplates = {};

var compileTemplate = function(file) {
  return ejs.compile(fs.readFileSync(file, 'utf-8'));
};

/**
 * Send an email based on an email template
 * @param to        email address to send to (array, or comma-separated list)
 * @param template  name of the email template to use (in app/templates)
 * @param data      data to be passed to the template
 * @return Promise.<info> from nodemailer.sendMail
 */
var send = function(to, template, data, callback) {
  if (!(template in cachedTemplates)) {
    logger.debug('Loading template "' + template + '"');
    
    var dir = path.join(templateDir, template);
    
    var templates = {
      html: compileTemplate(path.join(dir, 'html.ejs')),
      text: compileTemplate(path.join(dir, 'text.ejs')),
      subject: compileTemplate(path.join(dir, 'subject.ejs'))
    };
    
    cachedTemplates[template] = templates;
    logger.debug('Loaded template "' + template + '"');
  }
  
  var tplData = _.assign({ config: config }, data);
  
  var tpl = cachedTemplates[template];
  var html = tpl.html(tplData);
  var text = tpl.text(tplData);
  var subject = tpl.subject(tplData);
  
  return sendMail({
    to: to,
    subject: subject,
    text: text,
    html: html
  });
};

module.exports = {
  send: send,
  transporter: transporter
};
