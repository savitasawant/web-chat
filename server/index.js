const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const cors = require('cors');

const PORT = process.env.PORT || 5000;

const router = require('./router');
const userModule = require('./users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', (socket) => {
    // console.log('We have new connection!');

    socket.on('join', ({name, room}, callback) => {
       const { error, user } = userModule.addUser({id : socket.id, name, room});

       if(error) return callback(error);

       socket.emit('message', {user: 'admin', text: `${user.name}, welcome to the room ${user.room}`});

       socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name}, has joined!`})

       socket.join(user.room);

       io.to(user.room).emit('roomData', {room:user.room, users: userModule.getUsersInRoom(user.room)})

       callback();
    });

    socket.on('sendMessage', (message, callback) => {
        const user = userModule.getUser(socket.id);

        io.to(user.room).emit('message', {user: user.name, text: message});
        io.to(user.room).emit('roomData', {room: user.room, users: userModule.getUsersInRoom(user.room)});

        callback();
    })

    socket.on('disconnect', () => {
        // console.log('User had left!');

        const user = userModule.removeUser(socket.id);

        if(user){
            io.to(user.room).emit('message', {user: 'admin', text:`${user.name} has left.`});
        }
    })
})

app.use(router);
app.use(cors());

server.listen(PORT, ()=> {
    console.log(`Server has started on port ${PORT}`);
})