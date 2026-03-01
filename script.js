const defaultWords = [
    'Shadow', 'Neon', 'Ghost', 'Nova', 'Pixel', 'Echo', 'Vibe', 'Cloud', 'Wave', 'Pulse'
];

const configTextarea = document.getElementById('firebase-config');
const nicknameInput = document.getElementById('nickname-input');
const joinBtn = document.getElementById('join-btn');
const randomNickBtn = document.getElementById('random-nick-btn');
const saveConfigBtn = document.getElementById('save-config-btn');
const resetConfigBtn = document.getElementById('reset-config-btn');
const statusText = document.getElementById('status-text');
const currentUserTag = document.getElementById('current-user');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages-container');

let firebaseApi = null;
let db = null;
let currentUser = '';
let connected = false;

const defaultConfig = {
    apiKey: 'PUT_YOUR_API_KEY',
    authDomain: 'your-project.firebaseapp.com',
    databaseURL: 'https://your-project-default-rtdb.firebaseio.com',
    projectId: 'your-project-id',
    storageBucket: 'your-project.appspot.com',
    messagingSenderId: '123456789',
    appId: '1:123456789:web:yourappid'
};

init();

function init() {
    const savedConfig = localStorage.getItem('firebaseConfig');
    const savedNick = localStorage.getItem('anonNickname');

    configTextarea.value = savedConfig || JSON.stringify(defaultConfig, null, 2);
    nicknameInput.value = savedNick || generateAnonymousNickname();
    currentUserTag.textContent = 'Гость';

    randomNickBtn.addEventListener('click', () => {
        nicknameInput.value = generateAnonymousNickname();
    });

    joinBtn.addEventListener('click', joinChat);
    sendBtn.addEventListener('click', sendMessage);

    nicknameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinChat();
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    saveConfigBtn.addEventListener('click', () => {
        const parsed = parseConfig(configTextarea.value);
        if (!parsed) return;
        localStorage.setItem('firebaseConfig', JSON.stringify(parsed));
        toast('Firebase конфиг сохранен.');
    });

    resetConfigBtn.addEventListener('click', () => {
        localStorage.removeItem('firebaseConfig');
        configTextarea.value = JSON.stringify(defaultConfig, null, 2);
        toast('Конфиг сброшен.');
    });
}

async function joinChat() {
    const nickname = nicknameInput.value.trim();
    if (nickname.length < 2) {
        toast('Ник должен быть минимум 2 символа.');
        return;
    }

    const firebaseConfig = parseConfig(configTextarea.value);
    if (!firebaseConfig) return;

    currentUser = nickname;
    localStorage.setItem('anonNickname', nickname);
    localStorage.setItem('firebaseConfig', JSON.stringify(firebaseConfig));

    joinBtn.disabled = true;
    joinBtn.textContent = 'Подключение...';

    try {
        if (!firebaseApi) {
            firebaseApi = await importFirebase();
        }

        const app = firebaseApi.initializeApp(firebaseConfig);
        db = firebaseApi.getDatabase(app);
        connected = true;

        currentUserTag.textContent = `🟢 ${currentUser}`;
        statusText.textContent = 'Подключено';
        messageInput.disabled = false;
        sendBtn.disabled = false;

        messagesContainer.innerHTML = '';
        listenToMessages();
        await pushSystemMessage(`${currentUser} зашел(ла) в чат`);
        toast('Вы в анонимном чате.');
    } catch (error) {
        statusText.textContent = 'Ошибка подключения';
        toast(`Ошибка: ${error.message}`);
    } finally {
        joinBtn.disabled = false;
        joinBtn.textContent = 'Войти в чат';
    }
}

async function importFirebase() {
    const [{ initializeApp }, dbModule] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js')
    ]);

    return {
        initializeApp,
        ...dbModule
    };
}

function listenToMessages() {
    const messagesRef = firebaseApi.ref(db, 'messages');
    const messagesQuery = firebaseApi.query(
        messagesRef,
        firebaseApi.orderByChild('timestamp'),
        firebaseApi.limitToLast(100)
    );

    firebaseApi.onChildAdded(messagesQuery, (snapshot) => {
        const msg = snapshot.val();
        displayMessage(msg);
        scrollToBottom();
    });
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !connected || !currentUser) return;

    const payload = {
        author: currentUser,
        text,
        type: 'user',
        timestamp: firebaseApi.serverTimestamp()
    };

    const messagesRef = firebaseApi.ref(db, 'messages');
    await firebaseApi.push(messagesRef, payload);
    messageInput.value = '';
}

async function pushSystemMessage(text) {
    if (!connected) return;
    const payload = {
        text,
        type: 'system',
        timestamp: firebaseApi.serverTimestamp()
    };

    const messagesRef = firebaseApi.ref(db, 'messages');
    await firebaseApi.push(messagesRef, payload);
}

function displayMessage(msg) {
    if (!msg) return;

    if (msg.type === 'system') {
        const div = document.createElement('div');
        div.className = 'system-message';
        div.textContent = msg.text || 'Системное сообщение';
        messagesContainer.appendChild(div);
        return;
    }

    const div = document.createElement('div');
    div.className = `message ${msg.author === currentUser ? 'own' : ''}`;

    const time = typeof msg.timestamp === 'number'
        ? new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        : 'сейчас';

    div.innerHTML = `
        <div class="message-bubble">
            <div class="message-author">${escapeHtml(msg.author || 'Аноним')}</div>
            <div class="message-text">${escapeHtml(msg.text || '')}</div>
            <div class="message-time">${time}</div>
        </div>
    `;

    messagesContainer.appendChild(div);
}

function parseConfig(raw) {
    try {
        const parsed = JSON.parse(raw);
        if (!parsed.databaseURL || !parsed.apiKey) {
            throw new Error('Нужны минимум apiKey и databaseURL');
        }
        return parsed;
    } catch (error) {
        toast(`Невалидный JSON конфига: ${error.message}`);
        return null;
    }
}

function generateAnonymousNickname() {
    const word = defaultWords[Math.floor(Math.random() * defaultWords.length)];
    const id = Math.floor(100 + Math.random() * 900);
    return `${word}${id}`;
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, (m) => map[m]);
}

function toast(message) {
    statusText.textContent = message;
}
