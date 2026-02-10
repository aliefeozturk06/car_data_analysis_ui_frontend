import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import {
    Home, Car, LogOut, Menu, CheckCircle, Plus,
    ShieldCheck, ChevronDown, ChevronUp, User, Clock, RotateCcw, ChevronLeft, ChevronRight
} from 'lucide-react';

const ApprovalRequests = () => {
    // --- STATE'LER ---
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    // Sayfalama State'leri
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 10;

    // UI State
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);

    // Kullanıcı Bilgisi
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};
    const [balance] = useState(user.balance || 0);

    // 📡 MODERATÖR VERİSİNİ ÇEK
    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/purchase/moderator/all-pending-requests');
            setRequests(res.data || []);
            setCurrentPage(0);
        } catch (e) {
            console.error("İstekler çekilemedi:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleApprove = async (id: number) => {
        if (!window.confirm("Bu değişikliği onaylıyor musun?")) return;

        try {
            const response = await api.post(`/purchase/moderator/approve/${id}`);

            if (response.data === "OWNER_CHANGED") {
                alert("⚠️ Araç sahip değiştirmiştir!\n\nBundan ötürü onaylama geçersizdir. Talep isteği sistemden otomatik olarak kaldırılmıştır.");
            } else {
                alert("✅ Onaylandı! Araç başarıyla güncellendi.");
            }

            setRequests(prev => prev.filter((req: any) => req.id !== id));

        } catch (e: any) {
            console.error("Hata:", e);
            alert("İşlem başarısız! Hata: " + (e.response?.status || "Bilinmiyor"));
        }
    };

    // ❌ REDDET
    const handleReject = async (id: number) => {
        if (!window.confirm("Bu isteği reddetmek istediğine emin misin?")) return;
        try {
            await api.post(`/purchase/moderator/reject/${id}`);
            alert("🚫 İstek reddedildi.");
            setRequests(prev => prev.filter((req: any) => req.id !== id));
        } catch (e: any) {
            alert("İşlem başarısız! Hata: " + (e.response?.status || "Bilinmiyor"));
        }
    };

    // Sayfalama Mantığı
    const totalPages = Math.ceil(requests.length / itemsPerPage);
    const displayedRequests = requests.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    return (
        <div className="app-wrapper" style={{ height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: '#f5f5f5', fontFamily: "'Inter', sans-serif" }}>

            {/* 🛡️ SIDEBAR */}
            <aside
                className="sidebar"
                style={{
                    ...sidebarStyle,
                    width: isSidebarOpen ? '260px' : '0px',
                    opacity: isSidebarOpen ? 1 : 0,
                    overflow: 'hidden'
                }}
            >
                <nav style={{ marginTop: '50px', padding: '0 15px', width: '260px' }}>
                    <Link to="/" className="nav-item" style={navItemStyle}>
                        <Home size={22}/> HOME PAGE
                    </Link>

                    <div className="nav-item" style={{...navItemStyle, cursor: 'pointer', justifyContent: 'space-between', color: '#333'}} onClick={() => setIsCollectionOpen(!isCollectionOpen)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Car size={22}/> MY COLLECTION</div>
                        {isCollectionOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>

                    {isCollectionOpen && (
                        <div style={{ paddingLeft: '20px', display:'flex', flexDirection:'column', gap:'5px' }}>
                            <Link to="/my-cars" style={subLinkStyle}>• MY CARS</Link>
                            <Link to="/for-sale" style={subLinkStyle}>• FOR SALE</Link>
                            <Link to="/sold" style={subLinkStyle}>• SOLD</Link>
                        </div>
                    )}

                    <div style={activeModeratorLinkStyle}>
                        <ShieldCheck size={22}/> APPROVAL REQUESTS
                    </div>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                {/* HEADER */}
                <header className="top-header" style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Menu onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ cursor: 'pointer', color: '#fff' }} size={24} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>USERNAME: {user.username?.toUpperCase()}</div>

                            <div style={{ background: '#f39c12', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #d35400' }}>
                                <ShieldCheck size={12} /> MODERATOR
                            </div>
                        </div>

                        <div style={{ background: '#1a1a1a', padding: '6px 15px', borderRadius: '8px', border: '1px solid #333', color: '#fff', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>BALANCE: ${balance.toLocaleString()}</span>
                            <div style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '1px 5px', cursor: 'pointer', display:'flex', alignItems:'center' }}>
                                <Plus size={12}/>
                            </div>
                        </div>
                    </div>

                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>
                        INCOMING REQUESTS
                    </div>

                    <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#999', display:'flex', alignItems:'center', gap:'5px' }}>
                        LOGOUT <LogOut size={16}/>
                    </div>
                </header>

                {/* TABLE AREA */}
                <div className="scrollable-area" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                        <button onClick={fetchRequests} style={refreshBtnStyle}>
                            <RotateCcw size={18}/> REFRESH LIST
                        </button>
                    </div>

                    <div className="table-area" style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '3px solid #000', color: '#000', fontSize:'13px', textTransform:'uppercase' }}>
                                <th style={{ padding: '20px' }}>Request By</th>
                                <th style={{ padding: '20px' }}>Vehicle</th>
                                <th style={{ padding: '20px' }}>Changes (Old → New)</th>
                                <th style={{ padding: '20px' }}>Date</th>
                                <th style={{ padding: '20px', textAlign: 'center' }}>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{padding:'40px', textAlign:'center'}}>Loading...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '80px', textAlign: 'center', color: '#999' }}>
                                        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:'15px'}}>
                                            <CheckCircle size={50} color='#27ae60'/>
                                            <span style={{fontWeight:800, fontSize:'16px', color:'#000'}}>All requests handled!</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : displayedRequests.map((req: any) => (
                                <tr key={req.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    {/* KULLANICI */}
                                    <td style={{ padding: '20px', fontWeight: 700 }}>
                                        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                                            <div style={{background:'#eee', padding:'6px', borderRadius:'50%'}}><User size={14}/></div>
                                            @{req.username}
                                        </div>
                                    </td>

                                    {/* ARAÇ BİLGİSİ */}
                                    <td style={{ padding: '20px' }}>
                                        <div style={{fontWeight: 900, fontSize:'15px'}}>{req.manufacturer}</div>
                                        <div style={{color: '#666', fontSize:'12px'}}>{req.model}</div>
                                    </td>

                                    {/* DEĞİŞİKLİKLER (ESKİ -> YENİ KIYASLAMASI) */}
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

                                            {/* FİYAT DEĞİŞİMİ */}
                                            {req.newPrice && (
                                                <div style={badgeStyle}>
                                                    <span>Price:</span>
                                                    <div style={{textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:'1.2'}}>
                                                        {req.oldPrice && (
                                                            <span style={{textDecoration: 'line-through', color: '#999', fontSize: '9px'}}>
                                                                ${req.oldPrice.toLocaleString()}
                                                            </span>
                                                        )}
                                                        <span style={{fontWeight:800, color: req.oldPrice && req.newPrice > req.oldPrice ? '#27ae60' : (req.oldPrice && req.newPrice < req.oldPrice ? '#c0392b' : '#000')}}>
                                                            ${req.newPrice.toLocaleString()}
                                                            {req.oldPrice && (req.newPrice > req.oldPrice ? ' ▲' : req.newPrice < req.oldPrice ? ' ▼' : '')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* RENK DEĞİŞİMİ */}
                                            {req.newColor && (
                                                <div style={badgeStyle}>
                                                    <span>Color:</span>
                                                    <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                                        {req.oldColor && <span style={{color: '#999', fontSize: '10px'}}>{req.oldColor} →</span>}
                                                        <span style={{fontWeight:800}}>{req.newColor}</span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* KİLOMETRE DEĞİŞİMİ */}
                                            {req.newMileage && (
                                                <div style={badgeStyle}>
                                                    <span>Km:</span>
                                                    <div style={{textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', lineHeight:'1.2'}}>
                                                        {req.oldMileage && (
                                                            <span style={{textDecoration: 'line-through', color: '#999', fontSize: '9px'}}>
                                                                {req.oldMileage.toLocaleString()}
                                                            </span>
                                                        )}
                                                        <span style={{fontWeight:800}}>{req.newMileage.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* TARİH */}
                                    <td style={{ padding: '20px', color:'#888', fontSize:'12px' }}>
                                        <div style={{display:'flex', alignItems:'center', gap:'5px'}}><Clock size={12}/> Now</div>
                                    </td>

                                    {/* AKSİYONLAR */}
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                            <button onClick={() => handleApprove(req.id)} style={approveBtnStyle}>Approve</button>
                                            <button onClick={() => handleReject(req.id)} style={rejectBtnStyle}>Reject</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER */}
                <footer style={{ background: '#000', padding: '15px 30px', flexShrink: 0, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, width: '33%', textAlign: 'left' }}>
                        SHOWING PAGE {currentPage + 1} OF {totalPages || 1}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 900, width: '33%', textAlign: 'center' }}>
                        TOTAL PENDING: {requests.length}
                    </div>
                    <div style={{ display: 'flex', gap: '20px', width: '33%', justifyContent: 'flex-end' }}>
                        <button
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(p => p - 1)}
                            style={fBtnStyle(currentPage === 0)}
                        >
                            <ChevronLeft size={16}/> PREVIOUS
                        </button>
                        <button
                            disabled={currentPage >= totalPages - 1}
                            onClick={() => setCurrentPage(p => p + 1)}
                            style={fBtnStyle(currentPage >= totalPages - 1)}
                        >
                            NEXT <ChevronRight size={16}/>
                        </button>
                    </div>
                </footer>

            </div>
        </div>
    );
};

// --- STYLES ---
const sidebarStyle = {
    background: '#fff',
    color: '#000',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #eee',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap'
};

const navItemStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', color: '#333', textDecoration: 'none', fontSize: '13px', fontWeight: 700, borderRadius: '10px', marginBottom: '5px' };
const subLinkStyle = { display: 'block', padding: '8px 10px', color: '#666', textDecoration: 'none', fontSize: '12px', fontWeight: 600, marginBottom: '2px' };

const activeModeratorLinkStyle = {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 15px', borderRadius: '10px',
    background: 'transparent', color: '#000',
    fontSize: '13px', fontWeight: 900, marginTop: '20px', cursor: 'default'
};

const headerStyle = { background: '#000', color: '#fff', padding: '0 30px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333', flexShrink: 0 };
const badgeStyle = { background: '#fcfcfc', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', border: '1px solid #eee', display:'flex', justifyContent:'space-between', alignItems: 'center', gap:'10px' };
const refreshBtnStyle = { background: '#000', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 900, fontSize: '11px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' };
const approveBtnStyle = { background: '#000', color: '#fff', border: 'none', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '11px' };
const rejectBtnStyle = { background: '#fff', color: '#c0392b', border: '1px solid #c0392b', padding: '6px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '11px' };
const fBtnStyle = (disabled: boolean) => ({ background: 'transparent', border: 'none', color: disabled ? '#444' : '#fff', cursor: disabled ? 'default' : 'pointer', fontWeight: 900, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' });

export default ApprovalRequests;