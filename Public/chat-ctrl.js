// Note: 'socket' is already defined in the other script, 
// if loading separately ensure they don't conflict or use the same instance.
const createChatBtn = document.getElementById('create-chat');
const createChatModal = document.getElementById('create-chatroom');
const createChatForm = document.getElementById('create-form');
const displayBox = document.getElementById('display-box');
const messageInput = document.getElementById('messages-input');
const sendmessage = document.getElementById('message-form');
const messagesContainer = document.querySelector('.messages');

let currentRoom = null;
let currentRoomId = null;

// --- ROOM MANAGEMENT ---
createChatBtn.addEventListener('click', () => createChatModal.classList.remove('hidden'));
document.querySelector('.chatroom').style.display = 'none';

createChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const roomData = {
        name: document.getElementById('chat-name').value,
        password: document.getElementById('chat-password').value,
        id: document.getElementById('chat-id').value
    };
    socket.emit('createRoom', roomData); 
});

socket.on('errorMsg', (msg) => {
    alert(msg);
});

// Add this listener somewhere in the file to handle the server's response:
socket.on('room-created-success', (newRoom) => {
    addRoomToSidebar(newRoom);
    openChatRoom(newRoom);
    createChatModal.classList.add('hidden');
    createChatForm.reset();
});

socket.on('chatHistory', (history) => {
    messagesContainer.innerHTML = '';
    history.forEach(data => {
        displaySingleMessage(data);
    }); 
});

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

// When server sends existing rooms or a new one is created
socket.on('initRooms', (rooms) => {
    const displayBox = document.getElementById('display-box');
    
    // VERY IMPORTANT: Clear the box first
    displayBox.innerHTML = ''; 

    if (rooms.length === 0) {
        console.log("No rooms found for this user.");
        return;
    }

    rooms.forEach(room => {
        addRoomToSidebar(room);
    });
});


function addRoomToSidebar(room) {
    const displayBox = document.getElementById('display-box');

    // Create the container
    const roomDiv = document.createElement('div');
    roomDiv.className = 'chat-room-item'; 
    roomDiv.id = `room-${room.id}`;

    // Create the button
    const btn = document.createElement('button');
    btn.textContent = room.name; // Make sure this isn't empty!
    btn.className = 'room-button';
    
    btn.onclick = () => openChatRoom(room);

    roomDiv.appendChild(btn);
    displayBox.appendChild(roomDiv);
}

function openChatRoom(room) {
    currentRoom = room.name;
    currentRoomId = room.id; // Store the ID so we know which one to delete
    
    document.querySelector('.chatroom .header .logo').textContent = room.name;
    document.querySelector('.chatroom').style.display = 'flex';
    messagesContainer.innerHTML = '';
    socket.emit('joinRoom', room.name);

    const user = JSON.parse(localStorage.getItem('currentUser'));
    const deleteBtn = document.getElementById('delroom');

    if (user && room.owner === user.email) {
        deleteBtn.style.display = 'block';
    }else{
        deleteBtn.style.display = 'none';
    }
}

// --- MESSAGING ---
sendmessage.addEventListener('submit', (e) => {
    e.preventDefault(); 
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return alert("Login to chat!");
    if (!messageInput.value.trim() || !currentRoom) return;

    const data = {
        roomName: currentRoom,
        message: messageInput.value,
        sender: user.name
    };

    socket.emit('newMessage', data);
    messageInput.value = '';
});

socket.on('receiveMessage', (data) => {
    console.log("Message received:", data); // Debugging line
    const user = JSON.parse(localStorage.getItem('currentUser'));
    const isMe = data.sender === user?.name;
    
    const msgDiv = document.createElement('div');
    // Ensure these classes exist in your CSS!
    msgDiv.classList.add('message', isMe ? 'my-message' : 'other-message');
    
    msgDiv.innerHTML = `
        <div>
            <div class="you" style="font-weight:bold">${isMe ? 'You' : data.sender}</div>
            <div class="text">${data.message}</div>
        </div>
    `;
    
    messagesContainer.appendChild(msgDiv);
    
    // Auto-scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
});


// Refresh the chat if the server deleted old messages
socket.on('refreshHistory', () => {
    if (currentRoom) {
        socket.emit('joinRoom', currentRoom);
    }
});

// --- JOIN MODAL CONTROLS ---
const joinChatBtn = document.getElementById('join-button');
const joinChatModal = document.getElementById('join-chatroom');
const joinChatForm = document.getElementById('join-form');
const closeJoinBtn = document.getElementById('close-join');

// Open Join Modal
joinChatBtn.addEventListener('click', () => {
    joinChatModal.classList.remove('hidden');
});

// Close Join Modal
closeJoinBtn.addEventListener('click', () => {
    joinChatModal.classList.add('hidden');
});

// This array tracks ONLY the rooms the current user has joined
let joinedRooms = []; 

// Search for your join-form submit listener:
joinChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        name: joinChatForm.querySelector('#chat-name').value,
        pass: joinChatForm.querySelector('#chat-password').value
    };
    socket.emit('verify-room', data);
});

// Add this listener to handle the verification result:
socket.on('room-access-result', (response) => {
    if (response.success) {
        addRoomToSidebar(response.room);
        openChatRoom(response.room);
        document.getElementById('join-chatroom').classList.add('hidden');
        joinChatForm.reset();
    } else {
        alert(response.message);
    }
});

function addRoomToSidebar(room) {
    const displayBox = document.getElementById('display-box');
    
    // Prevent duplicates
    if (document.getElementById(`room-btn-${room.id}`)) return;

    const roomDiv = document.createElement('div');
    roomDiv.classList.add('chatrum');
    roomDiv.id = `room-btn-${room.id}`;
    roomDiv.setAttribute('data-id', room.id);
    
    const roomBtn = document.createElement('button');
    roomBtn.classList.add('buttons');
    roomBtn.textContent = room.name;
    
    roomBtn.addEventListener('click', () => {
        openChatRoom(room);
    });

    roomDiv.appendChild(roomBtn);
    displayBox.appendChild(roomDiv);
}



// --- CHATROOM WINDOW CONTROLS ---
const chatroomExitBtn = document.getElementById('exit');
const chatroomSettingsBtn = document.getElementById('delroom'); // This is your 🗑 button
const chatroomUI = document.querySelector('.chatroom');

// "Minimize" or Exit the chatroom view
chatroomExitBtn.addEventListener('click', () => {
    // This hides the chatroom flexbox
    chatroomUI.style.display = 'none';
});

// Settings / Delete button logic

chatroomSettingsBtn.addEventListener('click', () => {
    if (!currentRoomId) return;

    const confirmDelete = confirm(`Are you sure you want to delete "${currentRoom}"? This will remove it for everyone.`);
    
    if (confirmDelete) {
        socket.emit('deleteRoom', currentRoomId);
    }
});

// Listen for the server telling us a room was deleted
socket.on('roomDeleted', (roomId) => {
    // 1. If user is in the deleted room, kick them out and clear messages
    if (currentRoomId === roomId) {
        document.querySelector('.chatroom').style.display = 'none';
        messagesContainer.innerHTML = ''; 
        currentRoomId = null;
        currentRoom = null;
        alert("This room has been deleted.");
    }

    // 2. Remove from sidebar (looking for both class types)
    const roomElement = document.getElementById(`room-btn-${roomId}`) || 
                        displayBox.querySelector(`[data-id="${roomId}"]`);
    if (roomElement) roomElement.remove();
});

socket.on('logoutConfirm', () => {
    localStorage.removeItem('currentUser')
    displayBox.innerHTML = ''; // Clear the sidebar
    window.localStorage.reload(); // Refresh the page to reset the UI
});