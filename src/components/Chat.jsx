import React, { useEffect, useRef, useState } from 'react';
import { getAllMessages } from '../api';
import SlidePanel from './SlidePanel';

function Chat({ setIsPanelOpen, username, isAuthenticated }) {
  console.log("Chat компонент монтирован");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [isPanelOpenLocal, setIsPanelOpenLocal] = useState(false);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);

  // Обработка кликов вне панели
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsPanelOpen(false);
        setIsPanelOpenLocal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Загрузка истории сообщений при изменении username
  useEffect(() => {
    if (!username) return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    getAllMessages(token)
      .then(data => setMessages(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Ошибка при загрузке истории:', error);
        setMessages([]);
      });
  }, [username]);

  // WebSocket подключение — только после username
  useEffect(() => {
    if (!username) return;

    const token = localStorage.getItem('access_token') || '';
    const ws = new WebSocket(`ws://localhost:8080/chat?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket соединение установлено');
      ws.send(JSON.stringify({ content: 'ping' }));
    };

    ws.onmessage = (event) => {
      const newMsg = JSON.parse(event.data);
      if (newMsg?.username && newMsg?.content) {
        setMessages(prev => [...prev, newMsg]);
      }
    };

    ws.onerror = (err) => console.error('WebSocket ошибка:', err);
    ws.onclose = (e) =>
      console.warn('WebSocket закрыт. Код:', e.code, 'Причина:', e.reason);

    return () => {
      console.log('Закрытие WebSocket перед пересозданием');
      ws.close();
    };
  }, [username]);

  // Отправка сообщения
  const sendMessage = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket не готов');
      return;
    }
    if (message.trim()) {
      wsRef.current.send(JSON.stringify({ username, content: message }));
      setMessage('');
    }
  };

  // Автоскролл вниз при новых сообщениях
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div ref={panelRef}>
      <button
        onClick={() => {
          setIsPanelOpen(true);
          setIsPanelOpenLocal(true);
        }}
        style={styles.openButton}
      >
        Чат
      </button>
      <SlidePanel
        isOpen={isPanelOpenLocal}
        onClose={() => {
          setIsPanelOpen(false);
          setIsPanelOpenLocal(false);
        }}
      >
        <div style={styles.chatContainer}>
          <div style={{ ...styles.messages, flexGrow: isAuthenticated ? 1 : 2 }}>
            {messages.map((msg, idx) =>
              msg.content?.trim() ? (
                <div key={idx}>
                  <strong>{msg.username}: </strong>{msg.content}
                </div>
              ) : null
            )}
            <div ref={messagesEndRef} />
          </div>
          {isAuthenticated && (
            <div style={styles.inputContainer}>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Введите сообщение"
                style={styles.input}
              />
              <button onClick={sendMessage} style={styles.sendButton}>
                Отправить
              </button>
            </div>
          )}
        </div>
      </SlidePanel>
    </div>
  );
}

const styles = {
  openButton: {
    position: 'fixed',
    bottom: '30px',
    left: '30px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#FF7043',
    color: 'white',
    fontSize: '24px',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  messages: {
    flex: 1,
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
    padding: '10px',
    marginBottom: '10px',
    wordWrap: 'break-word',
    whiteSpace: 'normal',
  },
  inputContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    background: '#fff',
    borderTop: '1px solid #ccc',
    width: '100%',
    boxSizing: 'border-box',
  },
  input: {
    flex: 1,
    padding: '10px',
    marginRight: '10px',
    maxWidth: 'calc(100% - 120px)',
    boxSizing: 'border-box',
  },
  sendButton: {
    padding: '10px',
    backgroundColor: '#FF7043',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    width: '100px',
    boxSizing: 'border-box',
  },
};

export default Chat;
