$(document).ready(function() {

	var sio = io()
	sio.on('sensorData', function(data) {
		// console.log(JSON.stringify(data))
		$('.sensor-text').text('Temp: ' + data.temp.toFixed(1) + '°C\nHum: ' + data.hum.toFixed(1) + '%')
		$('.sensor-indicator').fadeOut(500).fadeIn(500)
	})

})