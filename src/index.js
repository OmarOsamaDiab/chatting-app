const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 3000
const io = socketio(server)
const publicDirectory = path.join(__dirname, '../public')
const { generateMessages, generateLocationMessages } = require('./utils/messages')
const { getUser, getUsersInRoom, removeUser, addUser } = require('./utils/users')
app.use(express.static(publicDirectory))


io.on('connection', (s) => {
    s.on('send-message', (message, cb) => {
        const user = getUser(s.id)
        if (!user) return cb('error')
        io.to(user.room).emit("message", generateMessages(user.username, message))
        cb('delivered')
    })


    s.on('disconnect', () => {
        const user = removeUser(s.id)

        if (user) {
            io.to(user.room).emit("message", generateMessages('Admin', `${user.username} has left`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })


    s.on('send-location', (pos, cb) => {
        const user = getUser(s.id)
        if (!user) return cb('error')
        io.to(user.room).emit('locationMessage', generateLocationMessages(user.username, `https://google.com/maps?q=${pos.lat},${pos.long}`))
        cb('delivered')
    })


    s.on('join', ({ username, room }, cb) => {
        const { error, user } = addUser({ id: s.id, username, room })

        if (error) {
            return cb(error)
        }

        s.join(user.room)

        s.emit('message', generateMessages('Admin', 'welcome'))
        s.broadcast.to(user.room).emit('message', generateMessages('Admin', `a ${username} has joined`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        cb()
    })
})
server.listen(port, () => {
    console.log(`server is running on ${port}`)
})