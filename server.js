require("dotenv").config();
const express = require("express");
const path = require('path');
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const { emit } = require("process");
const io = socket(server);


  app.use(express.static(__dirname + '/dist/angular-test'));
app.get('/*', function(req,res){
  res.sendFile(path.join(__dirname+
    '/dist/angular-test/index.html'));
});


const users = {};

const socketToRoom = {};


io.on('connection', socket => {
  socket.on("join room", roomID => {
      console.log("roomid is: " + roomID + "  aaa: " + users[roomID]);
      if (users[roomID]) {
          const length = users[roomID].length;
          if (length === 5) {
              socket.emit("room full");
              return;
          }
          users[roomID].push(socket.id);
      } else {
          users[roomID] = [socket.id];
      }
      socketToRoom[socket.id] = roomID;
      const usersInThisRoom = users[roomID].filter(id => id !== socket.id);

      socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", payload => {
      io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
  });

  socket.on("returning signal", payload => {
      io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
  });

  socket.on('user disconnect', user_id =>{
    const roomID = socketToRoom[socket.id];
      let room = users[roomID];
      if (room) {
        console.log("leave call: " + user_id);
        socket.broadcast.emit("user disconnect",user_id);
        //io.sockets.emit('users_count', clients);
          room = room.filter(id => id !== socket.id);
          users[roomID] = room;
      }

  })

  // socket.on('disconnect', () => {
  //     const roomID = socketToRoom[socket.id];
  //     // socket.emit("disconnected",{ room: roomID, userId: socket.id });
  //     let room = users[roomID];
  //     if (room) {
  //       console.log("close tab: " + user_id);
  //         room = room.filter(id => id !== socket.id);
  //         users[roomID] = room;
  //     }
  // });
});
// setInterval(() => io.emit('time', new Date().toTimeString()), 1000);

const port = process.env.PORT ||3000;
 server.listen(port, () => console.log('server is running on port 8080'));
 //app.listen(process.env.PORT ||8080);



