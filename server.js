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
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname +
    '/dist/angular-test/index.html'));
});


const users = {};

const socketToRoom = {};


io.on('connection', socket => {
  socket.on("join room", roomID => {
    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === 4) {
        socket.emit("room full");
        return;
      }
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }
    console.log("roomid is: " + roomID + "  users: " + users[roomID]);
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
    // send users in room(without receiver) to requested user
    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", payload => {
    console.log("user joined")
    io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
  });

  socket.on("returning signal", payload => {
    io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
  });

  socket.on('user disconnect', user_id => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];

    room = room.filter(id => id !== socket.id);
    users[roomID] = room;

    room.forEach((user) => {
      io.to(user).emit("user disconnect", user_id);
    })
  })

//   socket.on('disconnect', () => {
//     const roomID = socketToRoom[socket.id];
//     let room = users[roomID];
//     console.log(room)
// console.log(socket.id)
//     room = room.filter(id => id !== socket.id);
//     users[roomID] = room;

//     room.forEach((user) => {
//       io.to(user).emit("anyway disconnect", socket.id);
//     })
//   });

  /////////
  // socket.on('user disconnect', user_id =>{
  //   const roomID = socketToRoom[socket.id];
  //     let room = users[roomID];
  //     if (room) {
  //       console.log("leave call: " + user_id);
  //       socket.broadcast.emit("user disconnect",user_id);
  //       //io.sockets.emit('users_count', clients);
  //         room = room.filter(id => id !== socket.id);
  //         users[roomID] = room;
  //     }

  // })

  socket.on('disconnect', () => {
      const roomID = socketToRoom[socket.id];
      let room = users[roomID];
      if (room) {
        socket.broadcast.emit("anyway disconnect",socket.id);
          room = room.filter(id => id !== socket.id);
          users[roomID] = room;
      }
  });
  /////

  socket.on('sharescreen active', user_id => {
    //get room Id
    const roomID = socketToRoom[socket.id];
    //get room userrs_id array
    let room = users[roomID];
    console.log(user_id);
    console.log(socket.id);

    const index = room.indexOf(user_id);
    if (index !== -1) {
      //remove screen shareing id from users
      room = room.filter(id => id !== socket.id);
    }

    room.forEach((user) => {
      io.to(user).emit("sharescreen active", user_id);
    })
    // reset the users array
    room = users[roomID];
  })

  socket.on('sharescreen ended', user_id => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];

    const index = room.indexOf(user_id);
    if (index !== -1) {
      //remove screen shareing id from users
      room = room.filter(id => id !== socket.id);
    }
    room.forEach((user) => {
      io.to(user).emit("sharescreen ended", user_id);
    })
    // reset the users array
    room = users[roomID];
    // if (room) {
    //   socket.broadcast.emit("sharescreen ended",user_id);
    // }
  })

  socket.on('without camera', stream_id => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    //if (room) {
    socket.broadcast.emit("videoless stream", stream_id);
    //}
  })

  /////////////////////// chat //////////////////////////////

  socket.on('send message', message => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];

    const index = room.indexOf(socket.id);
    if (index !== -1) {
      //remove screen shareing id from users
      room = room.filter(id => id !== socket.id);
    }
    room.forEach((user) => {
      io.to(user).emit("receive message", message);
    })
    // reset the users array
    room = users[roomID];
    // if (room) {
    //   console.log(message)
    //   socket.broadcast.emit("receive message",message);
    // }
  })

  /////////////////////// users count //////////////////////////////
  // socket.on('user count', room_id => {
  //   const roomID = socketToRoom[socket.id];
  //   let room = users[roomID];
  //   console.log(roomID,room, room.length)
  // })

});

setInterval(() => io.emit('time', new Date()), 1000);

const port = process.env.PORT || 3000;
server.listen(port, () => console.log('server is running on port 8080'));
 //app.listen(process.env.PORT ||8080);



