var log = require('./logs.js');

var io

function getSocket() {
	return io
}

function setSocket(ioObj) {
	io = ioObj

	io.on('connection', function(socket) {
		log.info('Socket connection from ' + socket.request.connection.remoteAddress + ':' + socket.request.connection.remotePort)
	});
}

module.exports = {getSocket: getSocket, setSocket: setSocket}