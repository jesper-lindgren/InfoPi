var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

// User requires
var Tail = require('tail').Tail;
var noble = require('noble');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

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

// BLE sensor system
var serviceUuids = ['aa80']; // The CC2650 sensortag

var batteryServiceUUID = '180f'; // Battery service uuid
var batteryServiceValueCharacteristicsUuid = '2a19'; // The value char uuid

var allowDuplicates = false;
var exitHandlerBound = false;
var maxPeripherals = 8;
var peripherals = [];
var deviceMapping = {};

var exitHandler = function exitHandler() {
  console.log(new Date() + ' ' + 'Stops scanning');
  noble.stopScanning();

  peripherals.forEach(function(peripheral) {
    console.log(new Date() + ' ' + 'Disconnecting from ' + peripheral.uuid + '...');
    peripheral.disconnect(function() {
      console.log('disconnected')
    });
  });

  // End process after 2 seconds
  setTimeout(function() {
    process.exit();
  }, 2000);
}

var requestNotify = function(characteristic) {
  characteristic.on('read', function(data, isNotification) {
    var int_value = data[0];
    console.log(new Date() + ' ' + 'From ' + deviceMapping[this._peripheralUuid] + ': int_value is ' + int_value);
  });

  characteristic.notify(true, function(err) {
    console.log(new Date() + ' ' + 'Turned on notifications ' + (err ? 'with error' : 'without error'));
  });
}

var ble_setup_service = function(err, services) {
  if (err) throw err;
  services.forEach(function(service) {
    if (service.uuid === batteryServiceUUID) {
      console.log(new Date() + ' ' + 'Found a battery service UUID');
      var characteristicsUUIDs = [batteryServiceValueCharacteristicsUuid];
      service.discoverCharacteristics(characteristicsUUIDs, function(err, characteristics) {
        console.log(new Date() + ' ' + 'Got characteristics');
        requestNotify(characteristics[0]); // This is the battery level char
      });
    }
  });
}

var ble_connect = function(err) {
  if (err) throw err;

  // Workaround: Continue scanning
  noble.startScanning(serviceUuids, allowDuplicates);

  console.log(new Date() + ' ' + 'Connection to ' + this.peripheral.uuid);
  peripherals[peripherals.length] = this.peripheral;

  if (peripherals.length >= maxPeripherals) {
    console.log(new Date() + ' ' + 'Stopping BLE scan. Reached ' + maxPeripherals + ' peripherals');
    noble.stopScanning();
  }

  if (!exitHandlerBound) {
    exitHandlerBound = true;
    process.on('SIGINT', exitHandler);
  }

  this.peripheral.discoverServices([], ble_setup_service);
}

var ble_discover = function(peripheral) {
  console.log(new Date() + ' ' + '(scan) found peripheral: ' + peripheral.advertisement.localName + ' - UUID: ' + peripheral.uuid);
  deviceMapping[peripheral.uuid] = peripheral.advertisement.localName;
  peripheral.connect(ble_connect.bind({peripheral: peripheral}));

  peripheral.on('disconnect', function(err) {
    console.log(new Date() + ' '+ 'Disconnected from ' + peripheral.uuid);
  });
}

// Start scanning
noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    console.log(new Date() + ' started scan');
    noble.startScanning(serviceUuids, allowDuplicates);
  }
});

noble.on('discover', ble_discover);


// noble.on('discover', function(p) {
//   if (connectedIDs[p.id] == 'known') {
//     console.log(new Date() + ' ' + p.id + ' discovered again');
//   } else {
//     console.log(new Date() + ' ' + p.id + ' discovered first time');
//     connectedIDs[p.id] = 'known';
//     p.connect(function(err) {
//       if (err) console.log(new Date() + ' ' + err);
//       else {
//         console.log(new Date() + ' ' + p.id + ' connected');
//       }
//     });
//   }
// });


// BLE setup
// var serviceUuids = ['aa80']; // The aa80 is the CC2650 sensortag UUID
// var allowDuplicates = true
// noble.on('stateChange', function(state) {
//   console.log('stateChange: ' + state);

//   if (state === 'poweredOn') {
//     console.log('Starting BLE scanning');
//     noble.startScanning(serviceUuids, allowDuplicates);
//   }
//   else {
//     console.log('Stopping BLE scanning');
//     noble.stopScanning();
//   }
// })

// noble.on('discover', function(peripheral) {
//   peripheral.connect(function(error) {
//     noble.startScanning(serviceUuids, allowDuplicates);

//     console.log('connected to peripheral: ' + peripheral.uuid);
//     peripheral.discoverServices(['180f'], function(error, services) {
//       var batteryService = services[0];
//       console.log('discoveredBatter service');

//       batteryService.discoverCharacteristics(['2a19'], function(error, characteristics) {
//         var batteryLevelCharacteristic = characteristics[0];
//         console.log('discovered Battery Level characteristic');

//         batteryLevelCharacteristic.on('read', function(data, isNotification) {
//           console.log('battery level is now: ', data.readUInt8(0) + '%');
//         });

//         // true to enable notify
//         batteryLevelCharacteristic.notify(true, function(error) {
//           console.log('battery level notification on');
//         });
//       });
//     });
//   });
// });

// noble.on('discover', function(peripheral) {
//   console.log('Found device with local name: ' + peripheral.advertisement.localName);
//   console.log('advertising the following service uuid\'s: ' + peripheral.advertisement.serviceUuids);
//   console.log('Connecting to peripheral...')
//   peripheral.connect(function(error) {
//     // Start scanning again (workaround)
//     noble.startScanning(serviceUuids);

//     if (error) {
//       console.log('connect error: ' + error);
//     }
//     console.log('... connected to peripheral: ' + peripheral.uuid);

//     peripheral.on('disconnect', function(error) {
//       console.log('Peripheral disconnected');
//     })

//     // Discover all battery information services
//     peripheral.discoverServices(['180f'], function(error, services) {
//       if (error) {
//         console.log('error: ' + error)
//       }
//       // else {
//         console.log('Discovered service with uuid:' + services[0].uuid);
//         services[0].discoverCharacteristics(null, function(error, characteristics) {
//           console.log('Discovered the following characteristics for service ' + services[0].uuid);
//           for (var j in characteristics) {
//             console.log('      ' + j + ' uuid: ' + characteristics[j].uuid + ' with properties: ');
//             for (var k in characteristics[j].properties) {
//               console.log('      ' + characteristics[j].properties[k]);
//             }
//             characteristics[j].read(function(error, data) {
//               // data is a buffer
//               console.log('      value: ' + data[0]);
//             });
//           }

//           // Disconnect the peripheral

//         });
//       // }
//     });
//   });
// });

// // Setup FIFO Tailing for movement detection
// tail = new Tail('/var/www/html/FIFO');

// tail.on('line', function(data) {
//   console.log('new data!: ', data);
// });

// tail.on('error', function(error) {
//   console.log('ERROR: ', error);
// })

module.exports = app;