// 1. Initialize Socket
const URL = "https://non-e.onrender.com"; 
const socket = io(URL, {
    withCredentials: true,
    transports: ["websocket", "polling"]
});

// --- SELECTORS ---
const createChatBtn = document.getElementById('create-chat');
const createChatModal = document.getElementById('create-chatroom');
const createChatForm = document.getElementById('create-form');
const displayBox = document.getElementById('display-box');
const messageInput = document.getElementById('messages-input');
const sendmessage = document.getElementById('message-form');
const messagesContainer = document.querySelector('.messages');
const joinChatBtn = document.getElementById('join-button');
const joinChatModal = document.getElementById('join-chatroom');
const joinChatForm = document.getElementById('join-form');
const chatroomUI = document.querySelector('.chatroom');
const chatroomSettingsBtn = document.getElementById('delroom');

let currentRoom = null;
let currentRoomId = null;

// --- INITIALIZATION ---
// When the page loads, if the user is in localStorage, the sessionRestore 
// in your other script will trigger 'getRooms' on the server.
socket.emit('getRooms');

// --- ROOM MANAGEMENT ---

createChatBtn.addEventListener('click', () => createChatModal.classList.remove('hidden'));
joinChatBtn.addEventListener('click', () => joinChatModal.classList.remove('hidden'));

createChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const roomData = {
        name: document.getElementById('chat-name').value,
        password: document.getElementById('chat-password').value,
        id: document.getElementById('chat-id').value
    };
    socket.emit('createRoom', roomData); 
});

joinChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        name: joinChatForm.querySelector('#chat-name').value,
        password: joinChatForm.querySelector('#chat-password').value // Fixed 'pass' to 'password' to match server
    };
    socket.emit('verify-room', data);
});

chatroomSettingsBtn.addEventListener('click', () => {
    if (!currentRoomId) return;
    const confirmDelete = confirm(`Delete "${currentRoom}"? This will erase all messages from the database.`);
    if (confirmDelete) {
        socket.emit('deleteRoom', { roomId: currentRoomId });
    }
});

// --- MESSAGING LOGIC ---

sendmessage.addEventListener('submit', (e) => {
    e.preventDefault(); 
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return alert("Please login first!");
    if (!messageInput.value.trim() || !currentRoom) return;

    socket.emit('newMessage', {
        roomName: currentRoom,
        message: messageInput.value
    });
    messageInput.value = '';
});

// --- UI FUNCTIONS ---

function displaySingleMessage(data) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const isMe = data.sender === user?.name;
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', isMe ? 'my-message' : 'other-message');
    msgDiv.innerHTML = `
        <div>
            <div class="you" style="font-weight:bold">${isMe ? 'You' : data.sender}</div>
            <div class="text">${data.message}</div>
        </div>
    `;
    messagesContainer.appendChild(msgDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addChatRoomToDisplay(room) {
    // Prevent duplicates in UI
    if (document.querySelector(`[data-id="${room.id}"]`)) return;

    const btn = document.createElement('button');
    btn.textContent = room.name;
    btn.classList.add('buttons');
    btn.setAttribute('data-id', room.id); 
    btn.onclick = () => openChatRoom(room);
    displayBox.appendChild(btn);
}

function openChatRoom(room) {
    currentRoom = room.name;
    currentRoomId = room.id; 
    
    document.querySelector('.chatroom .header .logo').textContent = room.name;
    chatroomUI.style.display = 'flex';
    messagesContainer.innerHTML = 'Loading messages...';
    
    socket.emit('joinRoom', room.name);

    const user = JSON.parse(localStorage.getItem('currentUser'));
    // Show delete button only if current user is the owner
    chatroomSettingsBtn.style.display = (user && room.owner === user.email) ? 'block' : 'none';
}

// --- SOCKET LISTENERS ---

socket.on('initRooms', (rooms) => {
    displayBox.innerHTML = ''; 
    rooms.forEach(addChatRoomToDisplay);
});

socket.on('room-created-success', (newRoom) => {
    addChatRoomToDisplay(newRoom);
    openChatRoom(newRoom);
    createChatModal.classList.add('hidden');
    createChatForm.reset();
});

socket.on('room-access-result', (response) => {
    if (response.success) {
        addChatRoomToDisplay(response.room);
        openChatRoom(response.room);
        joinChatModal.classList.add('hidden');
        joinChatForm.reset();
    } else {
        alert(response.message);
    }
});

socket.on('chatHistory', (history) => {
    messagesContainer.innerHTML = '';
    history.forEach(displaySingleMessage); 
});

socket.on('receiveMessage', (data) => {
    displaySingleMessage(data);
});

socket.on('roomDeleted', (roomId) => {
    if (currentRoomId === roomId) {
        chatroomUI.style.display = 'none';
        currentRoomId = null;
        currentRoom = null;
        alert("This room has been deleted by the owner.");
    }
    const btn = document.querySelector(`[data-id="${roomId}"]`);
    if (btn) btn.remove();
});

socket.on('errorMsg', (msg) => alert(msg));