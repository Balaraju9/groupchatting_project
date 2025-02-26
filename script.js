const socket = io('https://groupchattingapp-qh2y.onrender.com');//idi change chesay
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');


let puaboutserver = 0;

let userName = prompt('What is your name?');
document.getElementById('overlay').style.display = 'none';

while (userName === null || userName.trim() === '') {
  userName = prompt('What is your name?');

  if (userName === null) {
    userName = prompt('Your name is compulsory for identity.');
  } else if (userName.trim() === '') {
    userName = prompt('Please enter a valid name. Spaces are not allowed.');
  }
}
document.getElementById('overlay').style.display = 'none';
userName = userName.trim();
messageInput.focus();
console.log(userName);

appendMessage('You joined', 'right');
socket.emit('new-user', userName);
socket.on('connect', () => {
  if (puaboutserver === 1) {
    appendMessage('Server on </>', 'nothing');
    location.reload();
    puaboutserver = 0;
  }
});

socket.on('user-connected', (name) => {
  appendMessage(`${name} joined the chat 🗪`, 'left'); // Align to the left
});

const fileInput = document.getElementById('file-input');

// Handle file selection
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    // Emit the file data to the server
    socket.emit('send-file', {
      fileName: file.name,
      fileType: file.type,
      fileData: reader.result,
      fileuser: socket.id,
      userName: ""  
    });

    appendMessage(`You sent a file: ${file.name}`, 'right');
  };
  reader.readAsDataURL(file); // Read file as Base64
});

socket.on('receive-file', (data) => {
  const fileContainer = document.createElement('div');
  fileContainer.classList.add('file-message');

  let filePreview;
  if (data.fileName.match(/\.(jpeg|jpg|png|gif)$/)) {
    // If it's an image, show the preview
    filePreview = document.createElement('img');
    filePreview.src = data.fileData;
    filePreview.classList.add('file-preview');
  } else {
    // Show file icon for non-image files
    filePreview = document.createElement('img');
    filePreview.src = 'file-icon.png'; // Replace with actual file icon
    filePreview.classList.add('file-icon');
  }

  const fileInfo = document.createElement('div');
  fileInfo.classList.add('file-info');

  const fileName = document.createElement('p');
  fileName.textContent = data.fileName;
  fileName.classList.add('file-name');

  const downloadButton = document.createElement('a');
  downloadButton.href = data.fileData;
  downloadButton.download = data.fileName;
  downloadButton.textContent = 'Download';
  downloadButton.classList.add('download-btn');

  fileInfo.appendChild(fileName);
  fileInfo.appendChild(downloadButton);

  fileContainer.appendChild(filePreview);
  fileContainer.appendChild(fileInfo);

  appendMessage(`${data.userName} sent this ⬇️ file`, 'left'); 
  messageContainer.appendChild(fileContainer);
});

socket.on('chat-message', (data) => {
  appendMessage(`${data.name}: ${data.message}`, 'left');
});

socket.on('user-disconnected', (name) => {
  appendMessage(`${name} disconnected 🛫`, 'left'); // Align to the left
});

socket.on('disconnect', () => { 
  appendMessage('Disconnected from server. Server might be off.', 'balu');
});

socket.on('update-user-list', (userList) => {
  const userListContainer = document.querySelector('#user-list ul');
  const countofusersbalu=document.getElementById('countofusers');
  userListContainer.innerHTML = ''; // Clear the existing list
  let pu=0;


  userList.forEach((user) => {
    const userElement = document.createElement('li');
    userElement.textContent = user;
    ++pu;
    userListContainer.appendChild(userElement);
  });
  countofusersbalu.innerText=`${pu}`
});

messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value;

  appendMessage(`You: ${message}`, 'right'); // Align your message to the right
  socket.emit('send-chat-message', message);
  messageInput.value = '';
});

function appendMessage(message, type) {
  const messageElement = document.createElement('div');
  messageElement.innerText = message;
  if (message.includes('Disconnected from server. Server might be off.')) {
    puaboutserver = 1;
  }

  // Add appropriate class based on message type
  if (message.includes('joined the chat 🗪') || message.includes('Disconnected from server. Server might be off.') || message.includes('Server on </>')) {
    messageElement.className = 'message status';
  } else if (message.includes('joined')) {
    messageElement.className = 'message system';
  } else {
    messageElement.className = `message ${type}`;
  }

  messageContainer.append(messageElement);
  messageContainer.scrollTop = messageContainer.scrollHeight;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      messageInput.focus();
    }
  });
}
