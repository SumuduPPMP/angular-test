const express = require("express");
const path = require('path');
//const http = require("http");
const app = express();
//const server = http.createServer(app);
//const socket = require("socket.io");
//const io = socket(server);

app.use(express.static(__dirname + '/dist/angular-test'));
app.get('/*', function(req,res){
  res.sendFile(path.join(__dirname+
    '/dist/angular-test/index.html'));
});
app.listen(process.env.PORT ||8080);
