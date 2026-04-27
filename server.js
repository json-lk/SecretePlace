const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// --- 1. IMPROVED SESSION (Stays logged in) ---
const sessionMiddleware = session({
    secret: 'secret-chat-key',
    resave: true,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        httpOnly: true,
        maxAge: 100 * 365 * 24 * 60 * 60 * 1000 // Persistent for a long time
    }
});

app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, 'public')));

io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

let users = [];
let chatRooms = [];
let messages = [];

// --- 2. DATA LOADING ---
const loadData = () => {
    try {
        if (fs.existsSync('users.json')) users = JSON.parse(fs.readFileSync('users.json'));
        if (fs.existsSync('rooms.json')) chatRooms = JSON.parse(fs.readFileSync('rooms.json'));
        if (fs.existsSync('messages.json')) messages = JSON.parse(fs.readFileSync('messages.json'));
        console.log("Data loaded successfully!");
    } catch (e) { 
        console.log("Error loading data", e); 
        users = []; chatRooms = []; messages = [];
    }
};
loadData();

const saveData = (file, data) => {
    fs.writeFile(file, JSON.stringify(data, null, 2), (err) => {
        if (err) console.error(`Error saving ${file}:`, err);
    });
};

io.on('connection', (socket) => {
    socket.request.session.reload((err) => {
        const session = socket.request.session;

        if (err || !session.user) {
            console.log("No session found for this connection.");
            return;
        }

        console.log('Session restored for:', session.user.name);

        // 2. Tell the client they are logged in
        socket.emit('sessionRestore', { user: session.user });

        // 3. Send the rooms they should see
        const joinedRoomNames = [...new Set(messages
            .filter(m => m.sender === session.user.name)
            .map(m => m.roomName))];
    
        const visibleRooms = chatRooms.filter(r => 
            r.owner === session.user.email || joinedRoomNames.includes(r.name)
        );

        socket.emit('initRooms', visibleRooms);
    });

    // ... (rest of your socket.on listeners like signup, login, etc. go here)

    // --- 3. FIX: LOAD ROOMS FOR CREATORS & JOINERS ---
    const sendAvailableRooms = () => {
        if (session.user) {
            // This finds rooms where the user is the owner 
            // OR rooms where the user has sent at least one message (meaning they joined)
            const joinedRoomNames = [...new Set(messages
                .filter(m => m.sender === session.user.name)
                .map(m => m.roomName))];

            const visibleRooms = chatRooms.filter(r => 
                r.owner === session.user.email || joinedRoomNames.includes(r.name)
            );

            socket.emit('initRooms', visibleRooms);
        }
    };

    if (session.user) {
        socket.emit('sessionRestore', { user: session.user });
        sendAvailableRooms(); 
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
            session.user = { name: user.name, email: user.email };
            session.save();
            socket.emit('loginResponse', { success: true, user: session.user });
            sendAvailableRooms();
        } else {
            socket.emit('loginResponse', { success: false, message: 'Invalid credentials.' });
        }
    });

    socket.on('createRoom', (roomData) => {
        if (!session.user) return;
        const roomId = (roomData.id && roomData.id.trim() !== "") ? roomData.id : Date.now().toString();

        if (chatRooms.find(r => r.id === roomId || r.name === roomData.name)) {
            return socket.emit('errorMsg', 'Room name or ID already exists!');
        }

        const newRoom = { 
            name: roomData.name,
            password: roomData.password,
            id: roomId, 
            owner: session.user.email 
        };

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
    
        // 1. Existing logic: Send chat history
        const roomHistory = messages.filter(m => m.roomName === roomName);
        socket.emit('chatHistory', roomHistory); 

        // 2. New logic: Tell others someone joined
        if (socket.request.session.user) {
            const userName = socket.request.session.user.name;
        
            // Broadcast to everyone in the room EXCEPT the person who just joined
            socket.to(roomName).emit('user-update', `${userName} joined the chat`);
        }
    });

    socket.on('newMessage', (data) => {
        if (!session.user) return;
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

    socket.on('logout', () => {
        session.destroy();
        socket.emit('logoutConfirm');
    });
});

// --- AUTO-DELETE LOGIC ---
const EXPIRE_TIME = 20*60*1000;
setInterval(() => {
    const now = new Date();
    const initialCount = messages.length;
    messages = messages.filter(msg => (now - new Date(msg.timestamp)) < EXPIRE_TIME);
    if (messages.length !== initialCount) {
        saveData('messages.json', messages);
        io.emit('refreshHistory'); 
    }
}, 30*1000);

server.listen(3000, '0.0.0.0', () => {
    console.log('Server is running on http://localhost:3000');
});