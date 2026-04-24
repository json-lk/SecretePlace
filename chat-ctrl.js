const createChatBtn = document.getElementById('create-chat');
const createChatModal = document.getElementById('create-chatroom');
const createChatForm = document.getElementById('create-form');
const chatRooms = []; 
const displayBox = document.getElementById('display-box'); 

createChatBtn.addEventListener('click', () => {
    createChatModal.classList.remove('hidden');
});

createChatModal.querySelector('.close-but').addEventListener('click', () => {
    createChatModal.classList.add('hidden');
});

createChatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const chatName = document.getElementById('chat-name').value;
    const chatPassword = document.getElementById('chat-password').value;
    const chatId = document.getElementById('chat-id').value;

    const chatRoom = {
        name: chatName,
        password: chatPassword,
        id: chatId,
        messages: [] 
    };

    chatRooms.push(chatRoom);
    addChatRoomToDisplay(chatRoom);
    
    await saveChatRoomsToFile(chatRooms.json); // Save chat rooms to the JSON file
    
    createChatForm.reset();
    createChatModal.classList.add('hidden');
});

function addChatRoomToDisplay(chatRoom) {
    const chatRoomButton = document.createElement('button');
    chatRoomButton.textContent = chatRoom.name;
    chatRoomButton.classList.add('buttons');
    chatRoomButton.addEventListener('click', () => openChatRoom(chatRoom));
    displayBox.appendChild(chatRoomButton);
}

function openChatRoom(chatRoom) {
    const chatroomHeader = document.querySelector('.chatroom .header .logo');
    chatroomHeader.textContent = chatRoom.name;

    const messagesContainer = document.querySelector('.chatroom .messages');
    messagesContainer.innerHTML = ''; 
    chatRoom.messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'other-message');
        messageDiv.innerHTML = `<div><div class="you">User</div><div class="text">${message}</div></div>`;
        messagesContainer.appendChild(messageDiv);
    });

    const chatroom = document.querySelector('.chatroom');
    chatroom.style.display = 'flex';
}

function sendMessage(chatRoom, message) {
    chatRoom.messages.push(message);
    openChatRoom(chatRoom);
}



// Function to save chat rooms to a JSON file
const joinChatBtn = document.getElementById('join-button');
const joinChatModal = document.getElementById('join-chatroom');
const joinChatForm = document.getElementById('join-form');


joinChatBtn.addEventListener('click', () => {
    joinChatModal.classList.remove('hidden');
});

joinChatModal.querySelector('.close-but').addEventListener('click', () => {
    joinChatModal.classList.add('hidden');
});