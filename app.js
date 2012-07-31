var http = require('http'),
		socketio = require('socket.io'),
		fs = require('fs'),
		util = require('util'),
		spawn = require('child_process').spawn,
		connect = require('connect');

var lineCount = 1,
		buffer = [],
		startTime = new Date();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;

///// Config file stuff
var config;
!function requireAndValidateConfig() {
	try {
		config = require('/etc/rtlogs/config.js');
	} catch(e) {
		console.error('Could not load configuration file [ %s ]', '/etc/rtlogs/config.js');
		process.exit(0);
	} finally {
		var validConfig = (config && Array.isArray(config.servers) && config.servers.length > 0);
		if(!validConfig) {
			console.error('Configuration file has no servers defined');
			process.exit(0);
		}
	}
}();

config.servers.forEach(function(elem) {
	streamLog(elem.server, elem.group, elem.log)
	console.log(elem.server)
});

///// Server creation stuff
var connect = connect(
	connect.static(__dirname + '/public/')
);

var app = http.createServer(connect);
app.listen(8080);

var io = socketio.listen(app);
io.set("log level", 1); //Set the log level of socket.io

io.sockets.on('connection', function(socket) {
	var packagedTime = new Date();

	packagedTime.setTime(Date.now() - startTime.getTime());

	socket.emit('system', {
		text: 'Connection Accepted',
		server: 'socket.io',
		group: 'socket.io'
	});

	socket.emit('system', {
		servers: config.servers,
		time: packagedTime.getTime()
	})

	socket.emit('buffer', { buffer: buffer })

	socket.on('my other event', function(data) {
		console.log(data);
	});
});

///// Actual Streamer


function streamLog(server, group, file) {
	fileWatcher = spawn('ssh', [server, 'tail', '-f', '-n', '0', file]);

	fileWatcher.stdout.setEncoding('utf8');

	fileWatcher.stdout.on('data', function(data) {
		var lines = ("" + data).split('\n');

		lines.forEach(function(line) {
			if(line === "") return;

			var logEntry = { text: line, server: server, group: group, lineCount: lineCount };

			io.sockets.emit('log', logEntry);
			buffer.push(logEntry);

			if (buffer.length > 100) {
				// use copy-on-write.
				// Shift reindexes the array, slice(-100) COWs the last 100 elements
				buffer = buffer.slice(-100);
			}

			lineCount++;
		});
	});

	fileWatcher.on('exit', function(code) {
		console.log("ERROR: file watcher died " + code);
	});
}