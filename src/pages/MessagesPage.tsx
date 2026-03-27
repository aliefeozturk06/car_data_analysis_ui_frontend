import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import CurrencySelector from '../components/CurrencySelector';
import UserProfilePicture from '../components/UserProfilePicture';
import ChatWindow from '../components/ChatWindow';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
    Home, Car, LogOut, Menu, Search, ChevronUp, ChevronDown, User, MessageSquare, ShieldCheck
} from 'lucide-react';

const MessagesPage = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);
    const [currencyRate, setCurrencyRate] = useState(parseFloat(localStorage.getItem('currencyRate') || "1"));
    const [currencySymbol, setCurrencySymbol] = useState(localStorage.getItem('currencySymbol') || "₺");

    const [recentChats, setRecentChats] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};
    const currentUser = user.username || null;
    const balance = user.balance || 0;

    const role = user.role || "";
    const isUser = role === "ROLE_USER" || JSON.stringify(role).includes("USER");
    const isAdmin = role === "ROLE_ADMIN" || JSON.stringify(role).includes("ADMIN");
    const isModerator = role === "ROLE_MODERATOR" || JSON.stringify(role).includes("MODERATOR");

    const getBaseUrl = () => (api.defaults.baseURL || 'http://localhost:8080/api').replace('/api', '');

    const handleCurrencyChange = (rate: number, symbol: string) => {
        setCurrencyRate(rate); setCurrencySymbol(symbol);
    };

    const handleUpdateSidebar = useCallback((msg: any) => {
        setRecentChats(prev => {
            const otherUser = msg.senderUsername === currentUser ? msg.receiverUsername : msg.senderUsername;
            const existingIndex = prev.findIndex(c =>
                (c.senderUsername === otherUser || c.receiverUsername === otherUser)
            );

            let newList = [...prev];
            if (existingIndex !== -1) {
                newList.splice(existingIndex, 1);
            }
            return [msg, ...newList];
        });
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;
        fetchRecentChats();

        const socket = new SockJS(`${getBaseUrl()}/ws-chat`);
        const client = new Client({
            webSocketFactory: () => socket,
            onConnect: () => {
                client.subscribe(`/user/${currentUser}/queue/messages`, (message) => {
                    const newMsg = JSON.parse(message.body);
                    handleUpdateSidebar(newMsg);
                });
            },
        });
        client.activate();
        return () => { if (client) client.deactivate(); };
    }, [currentUser, handleUpdateSidebar]);

    const fetchRecentChats = async () => {
        try {
            const res = await api.get(`/chat/recent?username=${currentUser}`);
            setRecentChats(res.data);
        } catch (err) { console.error("Recent chats error:", err); }
    };

    const handleSearchStart = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim() && searchTerm.toLowerCase() !== currentUser?.toLowerCase()) {
            setSelectedUser(searchTerm.trim());
            setSearchTerm("");
        }
    };

    return (
        <div className="app-wrapper" style={{ height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: '#f5f5f5', fontFamily: "'Inter', sans-serif" }}>

            <aside className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`} style={{ ...sidebarStyle, width: isSidebarOpen ? '260px' : '0px', opacity: isSidebarOpen ? 1 : 0, overflow: 'hidden', transition: 'all 0.3s ease' }}>
                <nav style={{ marginTop: '50px', padding: '0 15px', minWidth: '260px' }}>
                    <Link to="/profile" className="nav-item" style={navItemStyle}><User size={22}/> PROFILE</Link>
                    <Link to="/messages" className="nav-item active" style={{...navItemStyle, color: '#000'}}><MessageSquare size={22}/> MESSAGES</Link>
                    <Link to="/" className="nav-item" style={navItemStyle}><Home size={22}/> HOME PAGE</Link>
                    <div className="nav-item" style={{...navItemStyle, cursor: 'pointer', justifyContent: 'space-between', background:'transparent', color:'#333'}} onClick={() => setIsCollectionOpen(!isCollectionOpen)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Car size={22}/> MY COLLECTION</div>
                        {isCollectionOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>
                    {isCollectionOpen && (
                        <div style={{ paddingLeft: '20px', display:'flex', flexDirection:'column', gap:'5px' }}>
                            <Link to="/my-cars" style={subLinkStyle}>• MY CARS</Link>
                            {isUser && <Link to="/approval-waiting" style={subLinkStyle}>• APPROVAL WAITING</Link>}
                            <Link to="/for-sale" style={subLinkStyle}>• FOR SALE</Link>
                            <Link to="/sold" style={subLinkStyle}>• SOLD</Link>
                        </div>
                    )}
                    {(isAdmin || isModerator) && <Link to="/approval-requests" style={navItemStyle}><ShieldCheck size={22}/> APPROVAL REQUESTS</Link>}
                    {isAdmin && (
                        <div style={{ marginTop: '10px' }}>
                            <div style={{ padding: '15px 15px 5px', fontSize: '10px', fontWeight: 900, color: '#e74c3c', letterSpacing: '1px' }}>ADMINISTRATION</div>
                            <Link to="/admin" style={subLinkStyle}>• USER MANAGEMENT</Link>
                            <Link to="/admin/car-stats" style={subLinkStyle}>• FLEET ANALYSIS</Link>
                        </div>
                    )}
                </nav>
            </aside>

            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <header className="top-header" style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Menu onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ cursor: 'pointer', color: '#fff' }} size={24} />
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>USERNAME: {currentUser?.toUpperCase()}</div>
                        <div style={{ background: '#1a1a1a', padding: '6px 15px', borderRadius: '8px', border: '1px solid #333', color: '#fff', fontSize: '13px', fontWeight: 900 }}>
                            BALANCE: {currencySymbol} {(balance * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>SECURE MESSAGING</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                        <CurrencySelector onCurrencyChange={handleCurrencyChange} />
                        <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#999' }}>LOGOUT <LogOut size={16}/></div>
                    </div>
                </header>

                <div style={{ flex: 1, display: 'flex', backgroundColor: '#fff', overflow: 'hidden' }}>
                    <div style={{ width: '380px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
                        <form onSubmit={handleSearchStart} style={{ padding: '25px' }}>
                            <div style={searchBarWrapper}>
                                <Search size={16} color="#999" />
                                <input placeholder="Find user to chat..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={searchInputStyle} />
                            </div>
                        </form>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            {recentChats.length === 0 ? <div style={emptyInboxStyle}>No recent messages</div> :
                                recentChats.map((chat, i) => {
                                    const other = chat.senderUsername === currentUser ? chat.receiverUsername : chat.senderUsername;
                                    const isMe = chat.senderUsername === currentUser;
                                    return (
                                        <div key={i} onClick={() => setSelectedUser(other)} style={{ ...chatItemStyle, backgroundColor: selectedUser === other ? '#f5f5f5' : 'transparent', borderRight: selectedUser === other ? '4px solid #000' : 'none' }}>
                                            <UserProfilePicture username={other} size={45} />
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                    <span style={{ fontWeight: 900, fontSize: '13px' }}>@{other.toUpperCase()}</span>
                                                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#999' }}>
                                                        {chat.timestamp ? new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "now"}
                                                    </span>
                                                </div>
                                                <div style={lastMsgSnippetStyle}>
                                                    <span style={{ color: '#000', fontWeight: 900 }}>{isMe ? "Siz: " : ""}</span>
                                                    {chat.content}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>

                    <div style={{ flex: 1, backgroundColor: '#fcfcfc', position: 'relative' }}>
                        {selectedUser ? (
                            <ChatWindow
                                currentUser={currentUser || ""}
                                targetUser={selectedUser}
                                onClose={() => setSelectedUser(null)}
                                isInline={true}
                                onNewMessage={handleUpdateSidebar}
                            />
                        ) : (
                            <div style={emptyStateStyle}>
                                <MessageSquare size={80} color="#eee" strokeWidth={1.5} />
                                <h3 style={{ marginTop: '20px', fontWeight: 900, color: '#ccc' }}>SELECT A CONVERSATION</h3>
                            </div>
                        )}
                    </div>
                </div>
                <footer style={{ background: '#000', padding: '15px 30px', flexShrink: 0, color: '#fff', borderTop: '1px solid #333', fontSize: '11px', fontWeight: 900, textAlign: 'center' }}>ALI EFE PRODUCTIONS - MESSAGES V1.0</footer>
            </div>
        </div>
    );
};

const sidebarStyle = { background: '#fff', color: '#000', display: 'flex', flexDirection: 'column', borderRight: '1px solid #eee' };
const navItemStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', color: '#333', textDecoration: 'none', fontSize: '13px', fontWeight: 700, borderRadius: '10px', marginBottom: '5px' };
const subLinkStyle = { display: 'block', padding: '8px 10px', color: '#666', textDecoration: 'none', fontSize: '12px', fontWeight: 600, marginBottom: '2px' };
const headerStyle = { background: '#000', padding: '0 30px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333', flexShrink: 0 };
const searchBarWrapper = { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f5f5f5', padding: '12px 15px', borderRadius: '12px' };
const searchInputStyle = { border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 700, width: '100%' };
const chatItemStyle = { padding: '20px 25px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', transition: '0.2s', borderBottom: '1px solid #f9f9f9' };
const lastMsgSnippetStyle = { fontSize: '11px', color: '#888', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' };
const emptyStateStyle: React.CSSProperties = { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' };
const emptyInboxStyle: React.CSSProperties = { padding: '40px', textAlign: 'center', color: '#bbb', fontSize: '12px', fontWeight: 700 };

export default MessagesPage;