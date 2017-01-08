var io

function getSocket() {
	return io
}

function setSocket(ioObj) {
	io = ioObj

	io.on('connection', function(socket) {
		console.log(new Date() + ' ' + 'socket.js: Socket connection');
	});
}

module.exports = {getSocket: getSocket, setSocket: setSocket}