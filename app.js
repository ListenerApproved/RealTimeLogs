var http = require('http')
  , socketio = require('socket.io')
  , fs = require('fs')
  , util = require('util')
  , spawn = require('child_process').spawn
  , connect = require('connect')
  , lineCount = 1
  , buffer = []
  , startTime = new Date(Date.now());

///// Config file stuff
var config = require('/etc/rtlogs/config.js')
config.servers.forEach(function (elem) {
  streamLog(elem.server,elem.group,elem.log)
  console.log(elem.server)
});

///// Server creation stuff
var connect = connect(connect.static(__dirname + '/public/'));
var app = http.createServer(connect);
app.listen(8080);
var io = socketio.listen(app);
io.set("log level", 1); //Set the log level of socket.io

function handler (req, res) {
  fs.readFile(__dirname + '/public/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  var now = new Date()
  var one_day=1000*60*60*24
  var packagedTime = new Date()
  packagedTime.setTime(now.getTime()-startTime.getTime());
  socket.emit('system', { text: 'Connection Accepted', server: 'socket.io', group: 'socket.io' });
  socket.emit('system', { servers: config.servers, time: packagedTime.getTime()} )
  socket.emit('buffer', { buffer: buffer })
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

///// Actual Streamer
function streamLog(server,group,file) {
  fileWatcher = spawn('ssh', [server,'tail', '-f', '-n', '0', file]);

  fileWatcher.stdout.on('data', function (data) {
    io.sockets.emit('log', { text: " " + data, server: server, group: group, lineCount: lineCount });
    buffer.push({ text: " " + data, server: server, group: group, lineCount: lineCount });
    if (buffer.length > 100) {
      buffer.shift()
    }
    lineCount++;
  });

  fileWatcher.on('exit', function (code) {
    console.log("ERROR: file watcher died " + code);
  });
}
