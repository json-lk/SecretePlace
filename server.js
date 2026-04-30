const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt'); // Import bcrypt
const { v4: uuidv4 } = require('uuid'); // Import uuid
const sharedsession = require("express-socket.io-session");
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV || 'development';

const io = socketIo(server, {
    cors: {
        origin: "https://none-mauve.vercel.app", 
        methods: ["GET", "POST"],
        credentials: true
    }
});

let users = [];
let chatRooms = [];
let messages = [];

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'secret-chat-key',
    resave: false,
    saveUninitialized: true, // Set to false in production usually to comply with laws
    cookie: { 
        secure: NODE_ENV === 'production', // true on Render
        httpOnly: true,
        sameSite: NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-site cookies
        maxAge: 100 * 365 * 24 * 60 * 60 * 1000 
    }
});

const loadData = () => {
    try {
        if (fs.existsSync('users.json')) users = JSON.parse(fs.readFileSync('users.json'));
        if (fs.existsSync('rooms.json')) chatRooms = JSON.parse(fs.readFileSync('rooms.json'));
        if (fs.existsSync('messages.json')) messages = JSON.parse(fs.readFileSync('messages.json'));
    } catch (e) { 
        users = []; chatRooms = []; messages = [];
    }
};
loadData();

// Change your saveData function to this:
const saveData = (file, data) => {
    const filePath = path.join(__dirname, file); // Ensures absolute path
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
        if (err) {
            console.error(`CRITICAL: Error saving ${file}:`, err);
        } else {
            console.log(`SUCCESS: Saved ${file} to ${filePath}`);
        }
    });
};

const getVisibleRooms = (user) => {
    if (!user) return [];
    const joinedRoomNames = [...new Set(messages
        .filter(m => m.sender === user.name)
        .map(m => m.roomName))];
    // Note: This logic means a room is visible if the user owns it OR has sent a message in it.
    // If a user joins a room but never sends a message, it won't appear in their sidebar on subsequent logins.
    // Consider adding a server-side "joinedRooms" array per user if you want to track explicit joins
    // regardless of message activity.
    return chatRooms.filter(r => r.owner === user.email || joinedRoomNames.includes(r.name));
};

app.set('trust proxy', 1); 
app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, 'Public')));

io.use(sharedsession(sessionMiddleware, {
    autoSave: true
}));


// --- 3. SOCKET LOGIC ---
io.on('connection', (socket) => {
    // Access session via socket.handshake.session
    const session = socket.handshake.session;

    if (session && session.user) {
        socket.emit('sessionRestore', { user: session.user });
        socket.emit('initRooms', getVisibleRooms(session.user));
    }

    socket.on('login', async (data) => {
        const user = users.find(u => u.email === data.email);
        if (user && await bcrypt.compare(data.password, user.password)) { // Compare hashed password
            session.user = { name: user.name, email: user.email };
            session.save(() => {
                socket.emit('loginResponse', { success: true, user: { name: user.name, email: user.email } }); // Don't send password hash to client
                socket.emit('initRooms', getVisibleRooms(session.user));
            });
        } else {
            socket.emit('loginResponse', { success: false, message: 'Invalid credentials.' });
        }
    });

    socket.on('signup', async (data) => { // Make async for bcrypt
        // Check if user already exists
        if (users.find(u => u.email === data.email)) {
            return socket.emit('signupResponse', { success: false, message: 'Email already exists!' });
        }

        // Create new user
        const newUser = {
            name: data.name,
            email: data.email,
            password: await bcrypt.hash(data.password, 10) // Hash the password
        };

        users.push(newUser);
        saveData('users.json', users);

        // Auto-login after signup
        // Only store non-sensitive user data in session
        session.user = { name: newUser.name, email: newUser.email }; 
        session.save(() => {
            socket.emit('signupResponse', { success: true, user: { name: newUser.name, email: newUser.email } });
            socket.emit('initRooms', getVisibleRooms(session.user));
        });
    });

    socket.on('createRoom', (roomData) => {
        // Double check session.user
        if (!session || !session.user) {
            return socket.emit('errorMsg', 'Login required before creating a room.');
        }

        const roomId = (roomData.id && roomData.id.trim()) ? roomData.id : uuidv4(); // Use UUID for robust IDs

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

    socket.on('joinRoom', (roomName) => {
        // Clear old rooms to prevent message duplication
        socket.rooms.forEach(room => { if(room !== socket.id) socket.leave(room); });
        
        socket.join(roomName);
        const roomHistory = messages.filter(m => m.roomName === roomName);
        socket.emit('chatHistory', roomHistory); 
    });

    socket.on('newMessage', (data) => {
        if (!session.user || !data.roomName) return;

        const secureData = {
            roomName: data.roomName,
            message: data.message,
            sender: session.user.name, // Use name from session for security
            timestamp: new Date()
        };

        messages.push(secureData);
        saveData('messages.json', messages);
        
        // Broadcast to everyone in the room (including sender)
        io.to(data.roomName).emit('receiveMessage', secureData);
    });

    // --- Profile & Logout ---
    socket.on('updateProfile', async (data) => { // Make async for bcrypt
        const idx = users.findIndex(u => u.email === data.oldEmail);
        if (idx !== -1) {
            users[idx] = { ...users[idx], name: data.newName, email: data.newEmail };
            if(data.newPassword) {
                users[idx].password = await bcrypt.hash(data.newPassword, 10); // Hash new password
            }
            saveData('users.json', users);
            session.user = { name: data.newName, email: data.newEmail };
            session.save(() => socket.emit('updateProfileResponse', { success: true, user: { name: data.newName, email: data.newEmail } }));
        }
    });

    socket.on('deleteAccount', async (data) => { // Make async for bcrypt
        if (!session || !session.user) {
            return socket.emit('errorMsg', 'Login required.');
        }

        // Verify password
        const user = users.find(u => u.email === session.user.email);
        if (!user || !(await bcrypt.compare(data.password, user.password))) { // Compare hashed password
            return socket.emit('errorMsg', 'Password is incorrect.');
        }

        // Delete user
        const idx = users.findIndex(u => u.email === session.user.email);
        if (idx !== -1) {
            users.splice(idx, 1);
            saveData('users.json', users);
        }

        // Delete user's rooms
        const userRoomIds = chatRooms
            .filter(r => r.owner === session.user.email)
            .map(r => r.id);
        const userRoomNames = chatRooms
            .filter(r => r.owner === session.user.email)
            .map(r => r.name);
        
        chatRooms = chatRooms.filter(r => r.owner !== session.user.email);
        saveData('rooms.json', chatRooms);

        // Delete messages from those rooms
        messages = messages.filter(m => !userRoomNames.includes(m.roomName)); // Optimized filtering
        saveData('messages.json', messages);

        // Logout
        delete session.user;
        session.save(() => socket.emit('deleteResponse'));
    });

    socket.on('logout', () => {
        delete session.user;
        session.save(() => socket.emit('logoutConfirm'));
    });

    socket.on('verify-room', (data) => {
        if (!session || !session.user) {
            return socket.emit('room-access-result', { success: false, message: 'Login required.' });
        }

        const room = chatRooms.find(r => r.name === data.name);
        if (!room) {
            return socket.emit('room-access-result', { success: false, message: 'Room not found.' });
        }

        // If room has password, verify it
        if (room.password && room.password !== data.password) {
            return socket.emit('room-access-result', { success: false, message: 'Incorrect password.' });
        }

        socket.emit('room-access-result', { success: true, room: room });
    });

    socket.on('deleteRoom', (data) => {
        if (!session || !session.user) {
            return socket.emit('errorMsg', 'Login required.');
        }

        const roomIndex = chatRooms.findIndex(r => r.id === data.roomId);
        if (roomIndex === -1) {
            return socket.emit('errorMsg', 'Room not found.');
        }

        const room = chatRooms[roomIndex];
        if (room.owner !== session.user.email) {
            return socket.emit('errorMsg', 'Only the room owner can delete it.');
        }

        // Remove room
        chatRooms.splice(roomIndex, 1);
        saveData('rooms.json', chatRooms);

        // Remove all messages in this room
        messages = messages.filter(m => m.roomName !== room.name);
        saveData('messages.json', messages);

        // Notify all users
        io.emit('roomDeleted', room.id);
    });

    socket.on('getRooms', () => {
        if (session && session.user) {
            socket.emit('initRooms', getVisibleRooms(session.user));
        }
    });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
