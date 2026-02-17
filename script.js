// Переменные
let currentUser = '';
let messages = [];

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
    
    // Загружаем сообщения из localStorage
    loadMessages();
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
    
    // Отображаем сообщения
    displayMessages();
    scrollToBottom();
}

// Выйти из чата
function leaveChat() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        addSystemMessage(`${currentUser} покинул чат`);
        currentUser = '';
        
        document.getElementById('chat-screen').classList.remove('active');
        document.getElementById('login-screen').classList.add('active');
    }
}

// Отправить сообщение
function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (text === '') return;
    
    const message = {
        id: Date.now(),
        author: currentUser,
        text: text,
        timestamp: new Date().toISOString(),
        type: 'user'
    };
    
    messages.push(message);
    saveMessages();
    displayMessages();
    
    input.value = '';
    scrollToBottom();
}

// Добавить системное сообщение
function addSystemMessage(text) {
    const message = {
        id: Date.now(),
        text: text,
        timestamp: new Date().toISOString(),
        type: 'system'
    };
    
    messages.push(message);
    saveMessages();
    displayMessages();
}

// Отобразить сообщения
function displayMessages() {
    const container = document.getElementById('messages-container');
    container.innerHTML = '';
    
    messages.forEach(msg => {
        if (msg.type === 'system') {
            const div = document.createElement('div');
            div.className = 'system-message';
            div.textContent = msg.text;
            container.appendChild(div);
        } else {
            const div = document.createElement('div');
            div.className = 'message' + (msg.author === currentUser ? ' own' : '');
            
            const time = new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            div.innerHTML = `
                <div class="message-bubble">
                    <div class="message-author">${msg.author}</div>
                    <div class="message-text">${escapeHtml(msg.text)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            
            container.appendChild(div);
        }
    });
}

// Сохранить сообщения
function saveMessages() {
    // Сохраняем только последние 50 сообщений
    const recentMessages = messages.slice(-50);
    localStorage.setItem('chatMessages', JSON.stringify(recentMessages));
}

// Загрузить сообщения
function loadMessages() {
    const saved = localStorage.getItem('chatMessages');
    if (saved) {
        try {
            messages = JSON.parse(saved);
        } catch (e) {
            messages = [];
        }
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