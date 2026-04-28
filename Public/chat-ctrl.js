// if loading separately ensure they don't conflict or use the same instance.
const createChatBtn = document.getElementById('create-chat');
const createChatModal = document.getElementById('create-chatroom');
const createChatForm = document.getElementById('create-form');
const displayBox = document.getElementById('display-box');
const messageInput = document.getElementById('messages-input');
const sendmessage = document.getElementById('message-form');
const messagesContainer = document.querySelector('.messages');
const joinChatForm = document.getElementById('join-form');

document.querySelector('.chatroom').style.display = 'none';

let currentRoom = null;
let currentRoomId = null;

// --- ROOM MANAGEMENT ---
createChatBtn.addEventListener('click', () => createChatModal.classList.remove('hidden'));

createChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nameInput = document.getElementById('chat-name');
    const passInput = document.getElementById('chat-password');
    const idInput = document.getElementById('chat-id');

    // Basic client-side check
    if (!nameInput.value.trim()) return alert("Room name is required!");

    const roomData = {
        name: nameInput.value.trim(),
        password: passInput.value,
        id: idInput.value.trim()
    };

    console.log("Sending room data to server:", roomData);
    socket.emit('createRoom', roomData); 
});

// Add this listener somewhere in the file to handle the server's response:
socket.on('room-created-success', (newRoom) => {
    console.log("Room created successfully!", newRoom);
    addRoomToSidebar(newRoom); 
    openChatRoom(newRoom);     
    createChatModal.classList.add('hidden'); // Hide the modal
    createChatForm.reset();                 // Clear the form
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
    displayBox.innerHTML = ''; 
    rooms.forEach(addRoomToSidebar);
});


function addRoomToSidebar(room) {
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
    console.log("New message arriving:", data);
    // Use the function you already built to handle the DOM injection
    displaySingleMessage(data); 
});

// --- JOIN MODAL CONTROLS ---
const joinChatBtn = document.getElementById('join-button');
const joinChatModal = document.getElementById('join-chatroom');
const closeJoinBtn = document.getElementById('close-join');

// Open Join Modal
joinChatBtn.addEventListener('click', () => {
    joinChatModal.classList.remove('hidden');
});

// Close Join Modal
closeJoinBtn.addEventListener('click', () => {
    joinChatModal.classList.add('hidden');
});

// Close Create Chat Modal
const createChatCloseBtn = document.querySelector('#create-chatroom .close-but');
if (createChatCloseBtn) {
    createChatCloseBtn.addEventListener('click', () => {
        createChatModal.classList.add('hidden');
    });
}

// This array tracks ONLY the rooms the current user has joined
let joinedRooms = []; 

// Search for your join-form submit listener:
joinChatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
        name: joinChatForm.querySelector('input[type="text"]').value,
        password: joinChatForm.querySelector('input[type="password"]').value
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
        socket.emit('deleteRoom', { roomId: currentRoomId });
    }
});

// --- Updated roomDeleted Listener ---
socket.on('roomDeleted', (roomId) => {
    // 1. If the user is currently looking at the deleted room
    if (currentRoomId === roomId) {
        document.querySelector('.chatroom').style.display = 'none';
        
        // CLEAR MESSAGES from the UI immediately
        messagesContainer.innerHTML = ''; 
        
        // Reset current room tracking
        currentRoomId = null;
        currentRoom = null;
        
        alert("This room has been deleted by the owner.");
    }

    // 2. Remove the button from the sidebar
    // Note: You have two ways rooms are added (buttons and chatrum divs). 
    // This handles both based on your provided code:
    const roomButtons = displayBox.querySelectorAll('.buttons, .chatrum');
    roomButtons.forEach(btn => {
        // Check data-id attribute or ID we set in addRoomToSidebar
        if (btn.getAttribute('data-id') === roomId || btn.id === `room-btn-${roomId}`) {
            btn.remove();
        }
    });
});

socket.on('logoutConfirm', () => {
    localStorage.removeItem('currentUser');
    // Hide the chatroom UI immediately on logout
    if (document.querySelector('.chatroom')) {
        document.querySelector('.chatroom').style.display = 'none';
    }
    window.location.href = 'index.html';
});
// Add this to your script.js
socket.on('refreshHistory', () => {
    if (currentRoom) {
        // Re-join the room to trigger a fresh 'chatHistory' fetch
        socket.emit('joinRoom', currentRoom);
    }
});

socket.on('deleteResponse', () => {
    localStorage.removeItem('currentUser');
    // Hide the chatroom UI immediately on account deletion
    if (document.querySelector('.chatroom')) {
        document.querySelector('.chatroom').style.display = 'none';
    }
    location.reload();
});

socket.on('errorMsg', (msg) => {
    alert(msg);
});
// This listener is redundant as initRooms is emitted on sessionRestore/login/signup
// socket.on('getRooms', () => {
//     const user = JSON.parse(localStorage.getItem('currentUser'));
//     if (user) {
//         socket.emit('initRooms');
//     }
// });

// This listener is not emitted by the server in the provided server.js
// socket.on('refreshHistory', () => {
//     if (currentRoom) {
//         socket.emit('joinRoom', currentRoom);
//     }
// });
