import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

interface Message {
    sender: 'user' | 'agent';
    text: string;
    timestamp: Date;
}

const Chat = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { sender: 'user', text: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:3000/api/query', { query: input }, { withCredentials: true });

            const agentMessage: Message = { sender: 'agent', text: response.data.response, timestamp: new Date() };
            setMessages(prev => [...prev, agentMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = { sender: 'agent', text: 'Sorry, something went wrong. Please check your connection or API status.', timestamp: new Date() };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            maxWidth: '1200px',
            margin: '0 auto',
            background: 'var(--bg-dark)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
        }}>
            <header style={{
                padding: '1.5rem',
                borderBottom: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(8px)',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div style={{ fontSize: '1.5rem' }}>📅</div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Meeting Scheduler</h1>
                    <span style={{ fontSize: '0.875rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
                        Online
                    </span>
                </div>
            </header>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
            }}>
                {messages.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        marginTop: '4rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{ fontSize: '3rem', opacity: 0.5 }}>👋</div>
                        <p>Welcome! Ask me to check your calendar or schedule a meeting.</p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                            {['Check availability today', 'Schedule a meeting at 4PM', 'What do I have tomorrow?'].map(suggestion => (
                                <button
                                    key={suggestion}
                                    onClick={() => setInput(suggestion)}
                                    style={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid #334155',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.875rem',
                                        padding: '0.5rem 1rem'
                                    }}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} style={{
                        display: 'flex',
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        width: '100%'
                    }}>
                        <div style={{
                            maxWidth: '70%',
                            padding: '1rem 1.5rem',
                            borderRadius: '1.5rem',
                            borderBottomRightRadius: msg.sender === 'user' ? '4px' : '1.5rem',
                            borderBottomLeftRadius: msg.sender === 'agent' ? '4px' : '1.5rem',
                            background: msg.sender === 'user'
                                ? 'linear-gradient(135deg, var(--primary), var(--accent))'
                                : 'var(--bg-card)',
                            color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.5
                        }}>
                            {msg.text}
                            <div style={{
                                fontSize: '0.7rem',
                                marginTop: '0.5rem',
                                opacity: 0.7,
                                textAlign: 'right'
                            }}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <div style={{
                            background: 'var(--bg-card)',
                            padding: '1rem',
                            borderRadius: '1.5rem',
                            borderBottomLeftRadius: '4px',
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center'
                        }}>
                            <span style={{ width: '8px', height: '8px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                            <span style={{ width: '8px', height: '8px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.16s' }}></span>
                            <span style={{ width: '8px', height: '8px', background: '#94a3b8', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out both 0.32s' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div style={{
                padding: '1.5rem',
                borderTop: '1px solid #334155',
                background: 'rgba(15, 23, 42, 0.9)',
                backdropFilter: 'blur(10px)'
            }}>
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-card)',
                    borderRadius: '1rem',
                    padding: '0.5rem',
                    border: '1px solid #334155',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && sendMessage()}
                        placeholder="Type your request here..."
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            padding: '1rem',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                    <button
                        onClick={sendMessage}
                        style={{
                            background: input.trim() ? 'var(--primary)' : '#334155',
                            color: 'white',
                            borderRadius: '0.75rem',
                            padding: '0 1.5rem',
                            transition: 'all 0.2s',
                            pointerEvents: input.trim() ? 'auto' : 'none'
                        }}
                    >
                        Send
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes bounce {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }
            `}</style>
        </div>
    );
};

export default Chat;
