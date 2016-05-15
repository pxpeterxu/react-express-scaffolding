'use strict';

var config = {
  siteName: 'SITE NAME GOES HERE',
  
  port: 60543,
  host: 'http://example.com',
  
  db: 'mysql://user:password@db.example.com:3306/database',
  dbDetails: {
    host: 'db.example.com',
    port: 3306,
    user: 'user',
    password: 'password',
    database: 'database'
  },
  sessionsSchema: {
    tableName: 'Sessions',
    columnNames: {
      session_id: 'id',
      expires: 'expires',
      data: 'data'
    }
  },
  mailFrom: 'no-reply@example.com',
  smtp: {
    host: 'smtp.dynect.net',
    port: 587,
    auth: {
      user: 'user',
      pass: 'password'
    }
  },
  hashSecret: 'ThisISarandomstring that you can setrandomly!',
  logPath: __dirname + '/../logs/log.txt',
  requestsLogPath: __dirname + '/../logs/requests.txt',
  sqlLogPath: __dirname + '/../logs/sql.txt'
};

module.exports = config;
