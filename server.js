const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const sessionMiddleware = session({
    secret: 'secret-chat-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: true }
});

app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, 'public')));

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

let users = [];
let chatRooms = [];
let messages = [];

const loadData = () => {
    try {
        if (fs.existsSync('users.json')) users = JSON.parse(fs.readFileSync('users.json'));
        if (fs.existsSync('rooms.json')) chatRooms = JSON.parse(fs.readFileSync('rooms.json'));
        if (fs.existsSync('messages.json')) messages = JSON.parse(fs.readFileSync('messages.json'));
    } catch (e) { console.log("Error loading data", e); }
};
loadData();

const saveData = (file, data) => {
    fs.writeFile(file, JSON.stringify(data, null, 2), (err) => {
        if (err) console.error(`Error saving ${file}:`, err);
    });
};

io.on('connection', (socket) => {
    const session = socket.request.session;
    console.log('User connected:', socket.id);

    const sendUserRooms = () => {
        if (session.user) {
            const userOwnedRooms = chatRooms.filter(r => r.owner === session.user.email);
            socket.emit('initRooms', userOwnedRooms);
        }
    };

    // Corrected Restore Logic
    if (session.user) {
        socket.emit('sessionRestore', { user: session.user });
        sendUserRooms();
    }

    socket.on('signup', (userData) => {
        if (users.find(u => u.email === userData.email)) {
            return socket.emit('signupResponse', { success: false, message: 'Email already exists!' });
        }
        users.push(userData);
        saveData('users.json', users);
        
        session.user = { name: userData.name, email: userData.email };
        session.save();
        socket.emit('signupResponse', { success: true, user: session.user });
    });

    socket.on('login', (data) => {
        const user = users.find(u => u.email === data.email && u.password === data.password);
        if (user) {
            session.user = { name: user.name, email: user.email }; // Fixed variable name
            session.save();
            socket.emit('loginResponse', { success: true, user: session.user });
            sendUserRooms();
        } else {
            socket.emit('loginResponse', { success: false, message: 'Invalid credentials.' });
        }
    });

    socket.on('logout', () => {
        session.user = null;
        session.save();
        socket.emit('logoutConfirm'); // Added quotes
    });

    socket.on('createRoom', (roomData) => {
        if (!session.user) return socket.emit('errorMsg', 'Login required.');
        
        if (chatRooms.find(r => r.id === roomData.id || r.name === roomData.name)) {
            return socket.emit('errorMsg', 'Room already exists!');
        }

        const newRoom = { ...roomData, owner: session.user.email };
        chatRooms.push(newRoom);
        saveData('rooms.json', chatRooms); 
        socket.emit('room-created-success', newRoom);
    });

    socket.on('verify-room', (data) => {
        const room = chatRooms.find(r => r.name === data.name);
        if (room && room.password === data.pass) {
            socket.emit('room-access-result', { success: true, room: room });
        } else {
            socket.emit('room-access-result', { success: false, message: "Invalid credentials" });
        }
    });

    socket.on('joinRoom', (roomName) => {
        socket.join(roomName);
        // Send history to user
        const roomHistory = messages.filter(m => m.roomName === roomName);
        socket.emit('chatHistory', roomHistory); 
    });

    socket.on('newMessage', (data) => {
        if (!session.user) return; // Added '!' to allow chatting

        const secureData = {
            roomName: data.roomName,
            message: data.message,
            sender: session.user.name,
            timestamp: new Date()
        };
        
        messages.push(secureData);
        saveData('messages.json', messages);
        io.to(data.roomName).emit('receiveMessage', secureData);
    });

    socket.on('deleteRoom', (roomId) => {
        if (!session.user) return;
        const room = chatRooms.find(r => r.id === roomId);
        
        if (room && room.owner === session.user.email) {
            chatRooms = chatRooms.filter(r => r.id !== roomId);
            saveData('rooms.json', chatRooms);
            io.emit('roomDeleted', roomId);
        }
    });
});

server.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on http://localhost:3000');
});