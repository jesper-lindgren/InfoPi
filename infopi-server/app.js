var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var log = require('./lib/logs.js');

log.info('Starting InfoPi server app');

var index = require('./routes/index');
var users = require('./routes/users');
var development = require('./routes/development')

var app = express();
// Socket.io
var server = require('http').Server(app);
var socklib = require('./lib/socket.js');
var io = require('socket.io')(server);
socklib.setSocket(io)

// User requires
var Tail = require('tail').Tail;
var ble_handler = require('./src/ble/ble_handler.js'); // The ble subsystem will start automatically

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Socket.io passing to middleware
app.use(function(req, res, next) {
  res.io = io;
  next();
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/development', development);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// // Setup FIFO Tailing for movement detection
// tail = new Tail('/var/www/html/FIFO');

// tail.on('line', function(data) {
//   console.log('new data!: ', data);
// });

// tail.on('error', function(error) {
//   console.log('ERROR: ', error);
// })

module.exports = {app: app, server: server};