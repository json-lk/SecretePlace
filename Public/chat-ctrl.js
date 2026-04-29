// Note: 'socket' is already defined in the other script, 
// if loading separately ensure they don't conflict or use the same instance.
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
const closeJoinBtn = document.getElementById('close-join');
const closeCreateBtn = document.getElementById('close-create');
const authModal = document.querySelector('.auth');

let currentRoom = null;
let currentRoomId = null;
let joinedRooms = []; 

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

// Close Join Modal
closeJoinBtn.addEventListener('click', () => joinChatModal.classList.add('hidden'));

closeCreateBtn.addEventListener('click', () => createChatModal.classList.add('hidden'));

joinChatModal.addEventListener('click', (e) => {
  if (e.target === authModal) {
    authModal.classList.add('hidden');
  }
});

// Search for your join-form submit listener:
joinChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        name: joinChatForm.querySelector('#chat-name').value,
        pass: joinChatForm.querySelector('#chat-password').value
    };
    socket.emit('verify-room', data);
});

// Add this listener somewhere in the file to handle the server's response:
socket.on('room-created-success', (newRoom) => {
    addRoomToSidebar(newRoom);
    openChatRoom(newRoom);
    document.getElementById('create-chatroom').classList.add('hidden');
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
    messagesContainer.scrolltop = messagesContainer.scrollHeight;
}

// When server sends existing rooms or a new one is created
socket.on('initRooms', (rooms) => {
    displayBox.innerHTML = ''; 
    rooms.forEach(addChatRoomToDisplay);
});

socket.on('roomCreated', (room) => {
    addChatRoomToDisplay(room);
});

function addChatRoomToDisplay(room) {
    const btn = document.createElement('button');
    btn.textContent = room.name;
    btn.classList.add('buttons');
    btn.setAttribute('data-id', room.id); // Add this line!
    btn.onclick = () => openChatRoom(room);
    displayBox.appendChild(btn);
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

// --- JOIN MODAL CONTROLS ---



// This array tracks ONLY the rooms the current user has joined


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
    
    // Check if button already exists to prevent duplicates on UI
    if (document.getElementById(`room-btn-${room.name}`)) return;

    const roomDiv = document.createElement('div');
    roomDiv.classList.add('chatrum');
    roomDiv.id = `room-btn-${room.name}`;
    
    const roomBtn = document.createElement('button');
    roomBtn.textContent = room.name;
    
    roomBtn.addEventListener('click', () => {
        openChatRoom(room);
    });

    roomDiv.appendChild(roomBtn);
    displayBox.appendChild(roomDiv);

    location.reload(); // Refresh the page to update the sidebar with the new room
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
    // 1. Hide the chatroom if that's the one we are currently looking at
    if (currentRoomId === roomId) {
        document.querySelector('.chatroom').style.display = 'none';
        currentRoomId = null;
        currentRoom = null;
    }

    // 2. Remove the button from the sidebar
    // We look for all buttons in the display box and remove the one that matches
    const roomButtons = displayBox.querySelectorAll('.buttons');
    roomButtons.forEach(btn => {
        // We check if the button text matches or we can add a data-id to the button when creating it
        if (btn.getAttribute('data-id') === roomId) {
            btn.remove();
        }
    });
});

socket.on('logoutConfirm', () => {
    localStorage.removeItem('currentUser')
    displayBox.innerHTML = ''; // Clear the sidebar
    window.localStorage.reload(); // Refresh the page to reset the UI
});
