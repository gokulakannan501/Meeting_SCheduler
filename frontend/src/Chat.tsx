import React, { useState } from 'react';
import axios from 'axios';

interface Message {
    sender: 'user' | 'agent';
    text: string;
}

const Chat = () => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            // Note: In production, configure proxy or CORS properly.
            // Here we assume backend is at localhost:3000
            const response = await axios.post('http://localhost:3000/api/query', { query: input }, { withCredentials: true });

            const agentMessage: Message = { sender: 'agent', text: response.data.response };
            setMessages(prev => [...prev, agentMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = { sender: 'agent', text: 'Sorry, something went wrong.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', display: 'flex', flexDirection: 'column', height: '100vh' }}>
            <h1>Meeting Scheduler</h1>
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ textAlign: msg.sender === 'user' ? 'right' : 'left', margin: '10px 0' }}>
                        <span style={{
                            background: msg.sender === 'user' ? '#007bff' : '#f1f1f1',
                            color: msg.sender === 'user' ? 'white' : 'black',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            display: 'inline-block'
                        }}>
                            {msg.text}
                        </span>
                    </div>
                ))}
                {loading && <div style={{ textAlign: 'left' }}>Thinking...</div>}
            </div>
            <div style={{ display: 'flex' }}>
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendMessage()}
                    style={{ flex: 1, padding: '10px', marginRight: '10px' }}
                    placeholder="Type your request..."
                />
                <button onClick={sendMessage} style={{ padding: '10px 20px' }}>Send</button>
            </div>
        </div>
    );
};

export default Chat;
