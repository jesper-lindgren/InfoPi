// var app = require('../../app.js');
// var io = require('socket.io')(app.server);
var noble = require('noble');
var _ = require('underscore');
var socklib = require('../../lib/socket.js')

// BLE sensor system
var serviceUuids = ['aa80']; // The CC2650 sensortag

var batteryServiceUUID = '180f'; // Battery service uuid
var humiditySensorUUID = 'f000aa2004514000b000000000000000' // Humidity sensor uuid
var CC2560serviceUUIDs = [batteryServiceUUID, humiditySensorUUID]
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

  // Log the available services
  _.each(services, function(s) {
      console.log(new Date() + ' ' + 'Found service with uuid: ' + s.uuid);
  });

  services.forEach(function(service) {
    if (service.uuid === batteryServiceUUID) {
      console.log(new Date() + ' ' + 'Found a battery service UUID');
      var characteristicsUUIDs = [batteryServiceValueCharacteristicsUuid];
      service.discoverCharacteristics(characteristicsUUIDs, function(err, characteristics) {
        console.log(new Date() + ' ' + 'Got characteristics for battery service');
        requestNotify(characteristics[0]); // This is the battery level char (only one present)
      });
    }

    if (service.uuid === humiditySensorUUID) {
      var DATA_UUID = 'f000aa2104514000b000000000000000';
      var CONFIG_UUID = 'f000aa2204514000b000000000000000';
      var PERIOD_UUID = 'f000aa2304514000b000000000000000';

      console.log(new Date() + ' ' + 'Found a humidity service UUID');
      var characteristicsUUIDs = [DATA_UUID, CONFIG_UUID, PERIOD_UUID];
      service.discoverCharacteristics([], function(err, characteristics) {
        console.log(new Date() + ' ' + 'Got characteristics for humidity sensor');

        var dataChar = null;
        var configChar = null;
        var periodChar = null;

        _.each(characteristics, function(c) {
          switch (c.uuid) {
            case DATA_UUID:
              dataChar = c;
              break;
            case CONFIG_UUID:
              configChar = c;
              break;
            case PERIOD_UUID:
              periodChar = c;
              break;
            default:
              console.log(new Date() + ' ' + _.pick(c, ['uuid', 'name', 'type', 'properties', 'descriptors']));
              break;
          }
        });

        // Only proceed if we found all chars
        if (dataChar && configChar && periodChar) {
          
          configChar.write(new Buffer([0x01]), true, function(err) {
            console.log(new Date() + ' ' + 'Enabled humidity sensor with ' + (err ? 'error' : 'no error'));
          });

          dataChar.on('notify', function(state) {
            console.log(new Date() + ' ' + 'Humidity sensor dataChar notify is : ' + (state ? 'on' : 'off'));
          });

          dataChar.on('read', function(data, isNotification) {
            var dataVal = (data[1] << 8) + data[0];
            var dataCalc = (dataVal / 65536) * 165 - 40;
            
            var humidityVal = (data[3] << 8) + data[2];
            var humidityCalc = (humidityVal / 65536) * 100;

            // console.log(dataVal, dataCalc, humidityVal, humidityCalc);
            console.log(new Date() + ' ' + 'New humidity sensor data, temp: ' + dataCalc.toFixed(1) + '°C, humidity: ' + humidityCalc.toFixed(1) + '%');
			socklib.getSocket().sockets.emit('sensorData', {temp: dataCalc, hum: humidityCalc});
          });

          dataChar.notify(true, function(err) {
            if (err) console.log(new Date() + ' ' + 'Enabled notifications for humudity sensor data char with ' + (err ? 'error' : 'no error'));

          })

        }
      });
    }

  });
}

var ble_connect = function(err) {
  if (err) throw err;

  // Continue scanning once connected
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

  // this.peripheral.discoverServices(CC2560serviceUUIDs, ble_setup_service);
  this.peripheral.discoverServices([], ble_setup_service);
}

var ble_discover = function(peripheral) {
  // Stop scanning while connecting
  noble.stopScanning();

  console.log(new Date() + ' ' + '(scan) found peripheral: ' + peripheral.advertisement.localName + ' - UUID: ' + peripheral.uuid);
  // peripheral_print(peripheral);

  // Only connect to the p if not already connected
  if (deviceMapping[peripheral.uuid] != peripheral.advertisement.localName) {

    deviceMapping[peripheral.uuid] = peripheral.advertisement.localName;
    peripheral.connect(ble_connect.bind({peripheral: peripheral}));

    peripheral.on('disconnect', function(err) {
      console.log(new Date() + ' '+ 'Disconnected from ' + peripheral.uuid);
    });
  }
}

// Start scanning
noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
    console.log(new Date() + ' started scan');
    noble.startScanning(serviceUuids, allowDuplicates);
  }
});

noble.on('discover', ble_discover);

var peripheral_print = function(p) {
  console.log(new Date() + ' ' + 'Peripheral: ');
  console.log(_.pick(p, ['id', 'address', 'addressType', 'connectable', 'advertisement', 'rssi']));
  p.discoverAllServicesAndCharacteristics(function(error, services, characteristics) {
    console.log(services);
    _.each(services, function(s) {
      s.discoverCharacteristics(function(err, chars) {
        console.log(chars);
      })
    })
    // console.log(characteristics);
  });
}

module.exports = {}