$(document).ready(function() {

	var sio = io()
	sio.on('sensorData', function(data) {
		// console.log(JSON.stringify(data))
		$('.sensor-text').text('Sensor: ' + data.sensor + ', Type: ' + data.type + ' Temp: ' + data.data.temp.toFixed(1) + '°C\nHum: ' + data.data.hum.toFixed(1) + '%')
		$('.sensor-indicator').fadeOut(500).fadeIn(500)
	})

})