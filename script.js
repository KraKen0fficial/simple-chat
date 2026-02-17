// Переменные
let currentUser = '';
let messagesLoaded = false;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем сохраненный ник
    const savedNickname = localStorage.getItem('chatNickname');
    if (savedNickname) {
        document.getElementById('nickname-input').value = savedNickname;
    }
    
    // Enter для входа
    document.getElementById('nickname-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            joinChat();
        }
    });
    
    // Enter для отправки сообщения
    document.getElementById('message-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});

// Войти в чат
function joinChat() {
    const nickname = document.getElementById('nickname-input').value.trim();
    
    if (nickname === '') {
        alert('Пожалуйста, введите ник!');
        return;
    }
    
    if (nickname.length < 2) {
        alert('Ник должен быть минимум 2 символа!');
        return;
    }
    
    currentUser = nickname;
    localStorage.setItem('chatNickname', nickname);
    
    // Переключаемся на экран чата
    document.getElementById('login-screen').classList.remove('active');
    document.getElementById('chat-screen').classList.add('active');
    document.getElementById('current-user').textContent = currentUser;
    
    // Добавляем системное сообщение
    addSystemMessage(`${currentUser} присоединился к чату`);
    
    // Начинаем слушать новые сообщения
    listenToMessages();
}

// Выйти из чата
function leaveChat() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        addSystemMessage(`${currentUser} покинул чат`);
        currentUser = '';
        messagesLoaded = false;
        
        document.getElementById('chat-screen').classList.remove('active');
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('messages-container').innerHTML = '';
    }
}

// Отправить сообщение
function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (text === '' || !currentUser) return;
    
    const message = {
        author: currentUser,
        text: text,
        timestamp: window.dbServerTimestamp(),
        type: 'user'
    };
    
    // Отправляем в Firebase
    const messagesRef = window.dbRef(window.db, 'messages');
    window.dbPush(messagesRef, message);
    
    input.value = '';
}

// Добавить системное сообщение
function addSystemMessage(text) {
    const message = {
        text: text,
        timestamp: window.dbServerTimestamp(),
        type: 'system'
    };
    
    const messagesRef = window.dbRef(window.db, 'messages');
    window.dbPush(messagesRef, message);
}

// Слушать новые сообщения
function listenToMessages() {
    const messagesRef = window.dbRef(window.db, 'messages');
    const messagesQuery = window.dbQuery(messagesRef, window.dbOrderByChild('timestamp'), window.dbLimitToLast(100));
    
    window.dbOnChildAdded(messagesQuery, (snapshot) => {
        const message = snapshot.val();
        
        // Пропускаем старые сообщения при первой загрузке
        if (!messagesLoaded) {
            displayMessage(message);
        } else {
            displayMessage(message);
            scrollToBottom();
        }
    });
    
    // Отмечаем, что сообщения загружены
    setTimeout(() => {
        messagesLoaded = true;
        scrollToBottom();
    }, 500);
}

// Отобразить сообщение
function displayMessage(msg) {
    const container = document.getElementById('messages-container');
    
    if (msg.type === 'system') {
        const div = document.createElement('div');
        div.className = 'system-message';
        div.textContent = msg.text;
        container.appendChild(div);
    } else {
        const div = document.createElement('div');
        div.className = 'message' + (msg.author === currentUser ? ' own' : '');
        
        let time = 'только что';
        if (msg.timestamp && typeof msg.timestamp === 'number') {
            time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        div.innerHTML = `
            <div class="message-bubble">
                <div class="message-author">${escapeHtml(msg.author)}</div>
                <div class="message-text">${escapeHtml(msg.text)}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        container.appendChild(div);
    }
}

// Прокрутить вниз
function scrollToBottom() {
    const container = document.getElementById('messages-container');
    container.scrollTop = container.scrollHeight;
}

// Экранирование HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}