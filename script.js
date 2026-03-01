let currentUser = null;
let currentRoom = null;
let messagesLoaded = false;
let unsubscribeMessages = null;

const adjectives = ['Тихий', 'Яркий', 'Ночной', 'Лунный', 'Быстрый', 'Квантовый', 'Смелый', 'Тёплый', 'Северный', 'Скрытый'];
const animals = ['Лис', 'Кит', 'Енот', 'Сокол', 'Дельфин', 'Панда', 'Осьминог', 'Тигр', 'Койот', 'Феникс'];

function randomFrom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function randomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 85%, 65%)`;
}

function randomRoomCode() {
    return `room-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeRoomName(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-');
}

function generateIdentity() {
    return {
        name: `${randomFrom(adjectives)} ${randomFrom(animals)} #${Math.floor(100 + Math.random() * 900)}`,
        color: randomColor()
    };
}

function setStatus(text, isError = false) {
    const status = document.getElementById('status-text');
    status.textContent = text;
    status.style.color = isError ? '#ff9fa6' : '';
}

function refreshIdentityPreview() {
    const identity = generateIdentity();
    localStorage.setItem('chatIdentity', JSON.stringify(identity));
    const preview = document.getElementById('nickname-preview');
    preview.textContent = `${identity.name}`;
    preview.style.borderColor = identity.color;
    preview.style.boxShadow = `0 0 0 3px ${identity.color}22`;
}

function generateRoom() {
    const room = randomRoomCode();
    document.getElementById('room-input').value = room;
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = sanitizeRoomName(params.get('r'));

    const savedIdentity = localStorage.getItem('chatIdentity');
    if (savedIdentity) {
        try {
            const identity = JSON.parse(savedIdentity);
            document.getElementById('nickname-preview').textContent = identity.name;
            document.getElementById('nickname-preview').style.borderColor = identity.color;
            document.getElementById('nickname-preview').style.boxShadow = `0 0 0 3px ${identity.color}22`;
        } catch {
            refreshIdentityPreview();
        }
    } else {
        refreshIdentityPreview();
    }

    if (roomFromUrl) {
        document.getElementById('room-input').value = roomFromUrl;
    } else {
        generateRoom();
    }

    document.getElementById('message-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    document.getElementById('room-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinChat();
        }
    });
});

function rerollIdentity() {
    refreshIdentityPreview();
}

function joinChat() {
    const savedIdentity = localStorage.getItem('chatIdentity');
    if (!savedIdentity) {
        refreshIdentityPreview();
    }

    currentUser = JSON.parse(localStorage.getItem('chatIdentity'));
    currentRoom = sanitizeRoomName(document.getElementById('room-input').value) || randomRoomCode();
    document.getElementById('room-input').value = currentRoom;

    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('chat-screen').classList.add('active');
    document.getElementById('current-user').textContent = currentUser.name;
    document.getElementById('current-room').textContent = currentRoom;
    document.getElementById('message-input').focus();

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('r', currentRoom);
    window.history.replaceState({}, '', newUrl);

    setStatus('Вы в сети. Можно делиться ссылкой на комнату.');
    addSystemMessage(`${currentUser.name} вошёл в комнату`);
    listenToMessages();
}

function copyShareLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('r', currentRoom || sanitizeRoomName(document.getElementById('room-input').value));

    navigator.clipboard.writeText(url.toString())
        .then(() => setStatus('Ссылка на комнату скопирована.'))
        .catch(() => setStatus('Не удалось скопировать ссылку автоматически.', true));
}

function leaveChat() {
    if (!currentUser) {
        return;
    }

    if (confirm('Выйти из анонимного чата?')) {
        addSystemMessage(`${currentUser.name} покинул комнату`);
        if (unsubscribeMessages) {
            unsubscribeMessages();
            unsubscribeMessages = null;
        }

        currentUser = null;
        currentRoom = null;
        messagesLoaded = false;
        document.getElementById('messages-container').innerHTML = '';
        document.getElementById('chat-screen').classList.remove('active');
        document.getElementById('login-screen').classList.add('active');
    }
}

function getMessagesRef() {
    return window.dbRef(window.db, `rooms/${currentRoom}/messages`);
}

function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();

    if (!text || !currentUser || !currentRoom) {
        return;
    }

    const message = {
        author: currentUser.name,
        color: currentUser.color,
        text,
        timestamp: window.dbServerTimestamp(),
        type: 'user'
    };

    window.dbPush(getMessagesRef(), message)
        .then(() => setStatus('Сообщение отправлено.'))
        .catch(() => setStatus('Ошибка отправки. Проверьте Firebase конфиг.', true));

    input.value = '';
}

function addSystemMessage(text) {
    if (!currentRoom) {
        return;
    }

    const message = {
        text,
        timestamp: window.dbServerTimestamp(),
        type: 'system'
    };

    window.dbPush(getMessagesRef(), message).catch(() => {
        setStatus('Ошибка соединения с БД.', true);
    });
}

function listenToMessages() {
    if (unsubscribeMessages) {
        return;
    }

    const messagesQuery = window.dbQuery(getMessagesRef(), window.dbOrderByChild('timestamp'), window.dbLimitToLast(100));

    unsubscribeMessages = window.dbOnChildAdded(messagesQuery, (snapshot) => {
        displayMessage(snapshot.val());
        if (messagesLoaded) {
            scrollToBottom();
        }
    }, () => {
        setStatus('Не удалось подключиться к Firebase.', true);
    });

    setTimeout(() => {
        messagesLoaded = true;
        scrollToBottom();
    }, 500);
}

function displayMessage(msg) {
    const container = document.getElementById('messages-container');

    if (msg.type === 'system') {
        const div = document.createElement('div');
        div.className = 'system-message';
        div.textContent = msg.text;
        container.appendChild(div);
        return;
    }

    const div = document.createElement('div');
    div.className = `message${msg.author === currentUser?.name ? ' own' : ''}`;

    let time = 'только что';
    if (msg.timestamp && typeof msg.timestamp === 'number') {
        time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const color = msg.color || '#8aa0ff';
    div.innerHTML = `
        <div class="message-bubble">
            <div class="message-author">
                <span class="author-dot" style="background:${escapeHtml(color)}"></span>
                ${escapeHtml(msg.author || 'Аноним')}
            </div>
            <div class="message-text">${escapeHtml(msg.text || '')}</div>
            <div class="message-time">${time}</div>
        </div>
    `;

    container.appendChild(div);
}

function scrollToBottom() {
    const container = document.getElementById('messages-container');
    container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
}
