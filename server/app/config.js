import dotenv from 'dotenv';
import path from 'path';

var file = process.env.DATABASE === 'production' ? '.env.prod' : '.env.local';

// When webpacking on Windows and using the resulting file on a Mac,
// __dirname with backslashes doesn't play well
var dirname = __dirname.replace(/\\/g, '/');

dotenv.config({ path: dirname + '/../' + file });
dotenv.config({ path: dirname + '/' + file });

var dbDetails = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'wrapapi',
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE || 'wrapapi'
};

var config = {
  host: process.env.WEB_HOST,
  db: 'mysql://' + dbDetails.user + ':' + dbDetails.password + '@' +
    dbDetails.host + ':' + dbDetails.port + '/' + dbDetails.database,
  dbDetails: dbDetails,
  sessionsSchema: {
    tableName: 'Sessions',
    columnNames: {
      session_id: 'id',
      expires: 'expires',
      data: 'data'
    }
  },
  mailFrom: process.env.MAIL_FROM || 'no-reply@wrapapi.com',
  smtp: {
    host: process.env.SMTP_SERVER,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  hashSecret: process.env.HASH_SECRET || 'SomeAbsurdlylongStringthatevenFiguringitoutwithMD5wouldn\'tbeeasywith',
  logPath: dirname + '/../logs/log.txt',
  requestsLogPath: dirname + '/../logs/requests.txt',
  sqlLogPath: dirname + '/../logs/sql.txt',
};

export default config;