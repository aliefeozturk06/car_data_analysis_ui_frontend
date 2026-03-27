import React, { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api/axiosConfig';
import UserProfilePicture from './UserProfilePicture';
import { Send, X, ShieldCheck } from 'lucide-react';

interface Message {
    senderUsername: string;
    receiverUsername: string;
    content: string;
    timestamp?: string;
}

interface ChatWindowProps {
    currentUser: string;
    targetUser: string;
    onClose: () => void;
    isInline?: boolean;
    onNewMessage?: (msg: Message) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, targetUser, onClose, isInline = false, onNewMessage }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const getBaseUrl = () => (api.defaults.baseURL || 'http://localhost:8080/api').replace('/api', '');

    useEffect(() => {
        if (!currentUser || !targetUser) return;
        api.get(`/chat/history?user1=${currentUser}&user2=${targetUser}`)
            .then(res => setMessages(res.data))
            .catch(err => console.error("❌ History error:", err));

        const socket = new SockJS(`${getBaseUrl()}/ws-chat`);
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                client.subscribe(`/user/${currentUser}/queue/messages`, (message) => {
                    const receivedMsg: Message = JSON.parse(message.body);
                    if (receivedMsg.senderUsername === targetUser) {
                        setMessages(prev => [...prev, receivedMsg]);
                    }
                    if (onNewMessage) onNewMessage(receivedMsg);
                });
            },
        });
        client.activate();
        setStompClient(client);
        return () => { if (client) client.deactivate(); };
    }, [currentUser, targetUser]);

    useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const sendMessage = () => {
        if (stompClient?.connected && newMessage.trim()) {
            const chatMsg: Message = {
                senderUsername: currentUser,
                receiverUsername: targetUser,
                content: newMessage.trim(),
                timestamp: new Date().toISOString()
            };
            stompClient.publish({
                destination: '/app/chat.sendMessage',
                body: JSON.stringify(chatMsg)
            });

            setMessages(prev => [...prev, chatMsg]);
            setNewMessage("");

            if (onNewMessage) onNewMessage(chatMsg);
        }
    };

    const dynamicContainerStyle: React.CSSProperties = {
        ...chatContainerStyle,
        position: isInline ? 'relative' : 'fixed',
        bottom: isInline ? '0' : '20px',
        right: isInline ? '0' : '20px',
        width: isInline ? '100%' : '350px',
        height: isInline ? '100%' : '500px',
        borderRadius: isInline ? '0' : '24px',
        boxShadow: isInline ? 'none' : '0 15px 50px rgba(0,0,0,0.15)',
        zIndex: isInline ? 1 : 1000,
        border: isInline ? 'none' : '1px solid #eee'
    };

    return (
        <div style={dynamicContainerStyle}>
            <div style={chatHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <UserProfilePicture username={targetUser} size={isInline ? 45 : 35} />
                    <div>
                        <div style={{ fontWeight: 900, letterSpacing: '0.5px', fontSize: isInline ? '18px' : '14px' }}>@{targetUser.toUpperCase()}</div>
                        {isInline && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#27ae60', fontWeight: 800 }}>
                                <ShieldCheck size={12} /> SECURE CHANNEL
                            </div>
                        )}
                    </div>
                </div>
                {!isInline && (
                    <div onClick={onClose} style={{ cursor: 'pointer', background: '#333', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                        <X size={16} color="#fff" />
                    </div>
                )}
            </div>

            <div style={{ ...messageListStyle, background: isInline ? '#fdfdfd' : '#fcfcfc', padding: isInline ? '30px' : '20px' }}>
                {messages.length === 0 && <div style={{ textAlign: 'center', color: '#ccc', fontSize: '13px', marginTop: '40px', fontWeight: 700 }}>SAY HELLO TO @{targetUser.toUpperCase()}! 👋</div>}
                {messages.map((msg, i) => {
                    const isMine = msg.senderUsername === currentUser;
                    return (
                        <div key={i} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '15px' }}>
                            <div style={isMine ? myBubbleStyle : theirBubbleStyle}>
                                <div style={{ fontSize: '14px', fontWeight: 600, wordBreak: 'break-word' }}>{msg.content}</div>
                                {msg.timestamp && (
                                    <div style={{ fontSize: '8px', opacity: 0.5, textAlign: 'right', marginTop: '5px', fontWeight: 900 }}>
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            <div style={{ ...inputAreaStyle, padding: isInline ? '25px 35px' : '15px' }}>
                <input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    style={inputStyle}
                />
                <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !stompClient?.connected}
                    style={{ ...sendBtnStyle, opacity: newMessage.trim() ? 1 : 0.5 }}
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

const chatContainerStyle: React.CSSProperties = { background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const chatHeaderStyle: React.CSSProperties = { padding: '15px 25px', background: '#000', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 };
const messageListStyle: React.CSSProperties = { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' };
const myBubbleStyle: React.CSSProperties = { background: '#000', color: '#fff', padding: '12px 18px', borderRadius: '20px 20px 4px 20px', maxWidth: '70%', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' };
const theirBubbleStyle: React.CSSProperties = { background: '#f1f1f1', color: '#000', padding: '12px 18px', borderRadius: '20px 20px 20px 4px', maxWidth: '70%', border: '1px solid #e0e0e0' };
const inputAreaStyle: React.CSSProperties = { borderTop: '1px solid #eee', background: '#fff', display: 'flex', gap: '15px', alignItems: 'center' };
const inputStyle: React.CSSProperties = { flex: 1, border: '2px solid #f0f0f0', borderRadius: '15px', padding: '12px 20px', outline: 'none', fontSize: '14px', fontWeight: 600 };
const sendBtnStyle: React.CSSProperties = { background: '#000', color: '#fff', border: 'none', borderRadius: '15px', width: '48px', height: '48px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' };

export default ChatWindow;