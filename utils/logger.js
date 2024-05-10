const {createLogger, format, transports} = require("winston");
const TelegramLogger = require('winston-telegram');

const logger = createLogger({
    level: 'debug',
    format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        //format.json(),
        //format.align(),
        format.printf(debug => `${[debug.timestamp]}: ${debug.message}`)
      ),
    transports: [
      // new transports.File({ filename: './logs/error.log', level: 'error' }),
      // new transports.File({ filename: './logs/combined.log' }),

      new TelegramLogger({
        name: 'error-channel',
        token: '7084040583:AAG7Lsk-jrcmOOf9ZtqXzCgCx9L_VCZvSs4',
        chatId: '-4185808757',
        level: 'error',
        unique: true,
        template: '[{level}] {message}'
      }),
      new TelegramLogger({
        
        name: 'debug-channel',
        token: '7084040583:AAG7Lsk-jrcmOOf9ZtqXzCgCx9L_VCZvSs4',
        chatId: '-4185808757',
        level: 'debug',
        unique: true,
        template: `{message}`
      })
    ]
  });

  module.exports = logger;