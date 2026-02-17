// Переменные
let currentUser = '';
let messages = [];
let syncInterval = null;

// API для работы с JSON (GitHub Gist как хранилище)
const STORAGE_KEY = 'simple_chat_messages';
const GIST_API = 'https://api.github.com/gists';
// Используем localStorage как fallback, если нет доступа к серверу
const USE_LOCAL_STORAGE = true;

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
    
    // Загружаем сообщения
    loadMessages().then(() => {
        // Добавляем системное сообщение
        addSystemMessage(`${currentUser} присоединился к чату`);
        displayMessages();
        scrollToBottom();
        
        // Запускаем синхронизацию каждые 2 секунды
        syncInterval = setInterval(syncMessages, 2000);
    });
}

// Выйти из чата
function leaveChat() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        addSystemMessage(`${currentUser} покинул чат`);
        
        // Останавливаем синхронизацию
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
        
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
                    <div class="message-author">${escapeHtml(msg.author)}</div>
                    <div class="message-text">${escapeHtml(msg.text)}</div>
                    <div class="message-time">${time}</div>
                </div>
            `;
            
            container.appendChild(div);
        }
    });
}

// Сохранить сообщения в JSON
function saveMessages() {
    // Сохраняем последние 100 сообщений
    const recentMessages = messages.slice(-100);
    const jsonData = JSON.stringify(recentMessages, null, 2);
    
    if (USE_LOCAL_STORAGE) {
        localStorage.setItem(STORAGE_KEY, jsonData);
    }
    
    // Экспорт JSON для скачивания (опционально)
    window.chatMessagesJSON = jsonData;
}

// Загрузить сообщения из JSON
async function loadMessages() {
    try {
        if (USE_LOCAL_STORAGE) {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                messages = JSON.parse(saved);
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки сообщений:', e);
        messages = [];
    }
}

// Синхронизация сообщений
async function syncMessages() {
    try {
        await loadMessages();
        displayMessages();
    } catch (e) {
        console.error('Ошибка синхронизации:', e);
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

// Экспорт JSON для скачивания
function downloadChatJSON() {
    const dataStr = window.chatMessagesJSON || JSON.stringify(messages, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat_messages_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}