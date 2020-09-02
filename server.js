const express = require("express");
const path = require('path');
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);

app.use(express.static(__dirname + '/dist/angular-test'));
app.get('/*', function(req,res){
  res.sendFile(path.join(__dirname+
    '/dist/angular-test/index.html'));
});

const users = {};

const socketToRoom = {};

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});


io.on('connection', socket => {

  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
   socket.emit("test","testing 1 2 3");
  //   socket.on("join room", roomID => {
  //       console.log("user joioned for room id: " + roomID);
  //       if (users[roomID]) {
  //           const length = users[roomID].length;
  //           if (length === 4) {
  //               socket.emit("room full");
  //               return;
  //           }
  //           users[roomID].push(socket.id);
  //       } else {
  //           users[roomID] = [socket.id];
  //       }
  //       socketToRoom[socket.id] = roomID;
  //       const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
  //       socket.emit("all users", usersInThisRoom);
  //   });

  //   socket.on("sending signal", payload => {
  //       io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
  //   });

  //   socket.on("returning signal", payload => {
  //       io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
  //   });

  //   socket.on('disconnect', () => {
  //       const roomID = socketToRoom[socket.id];
  //       let room = users[roomID];
  //       if (room) {
  //           room = room.filter(id => id !== socket.id);
  //           users[roomID] = room;
  //           console.log("user disconnected")
  //           // socket.emit('user-disconnected', socket.id)
  //       }
  //   });

});
// setInterval(() => io.emit('time', new Date().toTimeString()), 1000);

// var port =  3001; // Use the port that Heroku provides or default to 3000
// server.listen(port, function() {
//   console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
// });

 server.listen(process.env.PORT ||8080, () => console.log('server is running on port 3000'));
 //app.listen(process.env.PORT ||8080);



