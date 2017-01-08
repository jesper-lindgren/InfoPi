var winston = require('winston')
var log = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({'timestamp': true})
  ]
})

log.info('Logging level is set at ' + process.env.LOG_LEVEL)
log.level = process.env.LOG_LEVEL || 'debug'

module.exports = log