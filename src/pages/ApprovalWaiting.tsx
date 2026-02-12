import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import CurrencySelector from '../components/CurrencySelector'; // ✅ 1. IMPORT EKLENDİ
import { Home, Car, LogOut, Menu, ChevronUp, ChevronDown, RotateCcw, XCircle } from 'lucide-react';

const ApprovalWaiting = () => {
    // --- STATE'LER ---
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    // UI State
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);

    // ✅ 2. PARA BİRİMİ STATE'LERİ EKLENDİ
    const [currencyRate, setCurrencyRate] = useState(parseFloat(localStorage.getItem('currencyRate') || "1"));
    const [currencySymbol, setCurrencySymbol] = useState(localStorage.getItem('currencySymbol') || "₺");

    // ✅ 3. PARA BİRİMİ DEĞİŞTİRME FONKSİYONU EKLENDİ
    const handleCurrencyChange = (rate, symbol) => {
        setCurrencyRate(rate);
        setCurrencySymbol(symbol);
    };

    // Kullanıcı Bilgisi
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};

    // 🕵️‍♂️ Rol Kontrolü (Sadece USER ise true döner)
    const isUser = user.role === 'ROLE_USER' || (user.roles && user.roles.includes('ROLE_USER')) || (user.roles && user.roles.includes('USER'));

    // 🛠️ VERİ ÇEKME
    const fetchPendingRequests = useCallback(async () => {
        if (!user.username) return;
        setLoading(true);
        try {
            const res = await api.get(`/purchase/my-pending-requests?username=${user.username}`);
            setRequests(res.data || []);
        } catch (e) {
            console.error("Veri çekilemedi!", e);
        } finally {
            setLoading(false);
        }
    }, [user.username]);

    useEffect(() => {
        fetchPendingRequests();
    }, [fetchPendingRequests]);

    // ❌ İSTEK İPTAL ETME
    const handleCancel = async (carId) => {
        if (!window.confirm("Bu isteği iptal etmek istiyor musun?")) return;
        try {
            await api.post(`/purchase/cancel-update-request?username=${user.username}&carId=${carId}`);
            alert("İstek iptal edildi.");
            setRequests(prev => prev.filter((req) => req.carId !== carId));
        } catch (e) {
            alert("İptal başarısız!");
        }
    };

    return (
        <div className="app-wrapper" style={{ height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>

            {/* 🛡️ SIDEBAR */}
            <aside className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
                <nav style={{ marginTop: '50px' }}>
                    <Link to="/" className="nav-item"><Home size={22}/> HOME PAGE</Link>

                    <div className="nav-item active" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }} onClick={() => setIsCollectionOpen(!isCollectionOpen)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Car size={22}/> MY COLLECTION</div>
                        {isCollectionOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>

                    {isCollectionOpen && (
                        <div style={{ paddingLeft: '20px' }}>
                            <Link to="/my-cars" className="nav-item" style={{ fontSize: '11px' }}>• MY CARS</Link>

                            {/* 🔥 KRİTİK AYAR: SADECE USER GÖRÜR 🔥 */}
                            {isUser && (
                                <Link to="/approval-waiting" className="nav-item active" style={{ fontSize: '11px', background: '#eee', color:'#000', fontWeight:800 }}>• APPROVAL WAITING</Link>
                            )}

                            <Link to="/for-sale" className="nav-item" style={{ fontSize: '11px' }}>• FOR SALE</Link>
                            <Link to="/sold" className="nav-item" style={{ fontSize: '11px' }}>• SOLD</Link>
                        </div>
                    )}
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                {/* HEADER */}
                <header className="top-header" style={{ flexShrink: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Menu onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ cursor: 'pointer' }} size={24} />
                        <div style={{ fontSize: '12px', fontWeight: 800 }}>USER: {user.username?.toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic' }}>APPROVAL WAITING</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

                        {/* ✅ 4. HEADER'A PARA BİRİMİ SEÇİCİSİ EKLENDİ */}
                        <CurrencySelector onCurrencyChange={handleCurrencyChange} />

                        <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#666' }}>LOGOUT <LogOut size={16}/></div>
                    </div>
                </header>

                <div className="scrollable-area" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                        <button
                            onClick={fetchPendingRequests}
                            style={{ background: '#000', color: '#fff', padding: '12px 25px', borderRadius: '12px', fontWeight: 900, fontSize: '12px', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}
                        >
                            <RotateCcw size={18}/> REFRESH LIST
                        </button>
                    </div>

                    {/* TABLO */}
                    <div className="table-area" style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '20px' }}>VEHICLE</th>
                                <th style={{ padding: '20px' }}>NEW PRICE</th>
                                <th style={{ padding: '20px' }}>NEW COLOR</th>
                                <th style={{ padding: '20px' }}>STATUS</th>
                            </tr>
                            </thead>
                            <tbody>
                            {loading ? (
                                <tr><td colSpan={4} style={{ padding: '50px', textAlign: 'center', fontWeight: 900 }}>ANALYZING...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '50px', textAlign: 'center', fontWeight: 900, color: '#ccc' }}>NO PENDING REQUESTS</td></tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                        <td style={{ padding: '20px', fontWeight: 900, fontSize: '18px' }}>
                                            {(req.manufacturer || 'Unknown').toUpperCase()} <span style={{color:'#999', fontSize:'14px'}}>{req.model}</span>
                                        </td>

                                        {/* ✅ 5. FİYAT GÖSTERİMİ GÜNCELLENDİ (ÇARPIM İŞLEMİ) */}
                                        <td style={{ padding: '20px', fontWeight: 900 }}>
                                            {req.newPrice ?
                                                `${currencySymbol} ${(req.newPrice * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                                : <span style={{color:'#ccc'}}>-</span>}
                                        </td>

                                        <td style={{ padding: '20px', color: '#666', fontWeight: 700 }}>
                                            {req.newColor ? req.newColor.toUpperCase() : <span style={{color:'#ccc'}}>-</span>}
                                        </td>
                                        <td style={{ padding: '20px' }}>
                                            <div style={{display:'flex', flexDirection:'column', gap:'5px', alignItems:'flex-start'}}>
                                                <span style={{
                                                    color: '#f39c12',
                                                    fontWeight: 900,
                                                    fontSize: '10px',
                                                    border: '2px solid #f39c12',
                                                    padding: '5px 12px',
                                                    borderRadius: '6px'
                                                }}>PENDING</span>
                                                <span
                                                    onClick={() => handleCancel(req.carId)}
                                                    style={{fontSize:'10px', color:'#999', cursor:'pointer', display:'flex', alignItems:'center', gap:'3px', fontWeight:700}}
                                                >
                                                    <XCircle size={10}/> Cancel
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER */}
                <footer style={{ background: '#000', padding: '15px 30px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', borderTop: '1px solid #333' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900 }}>PAGE 1 OF 1</div>
                    <div style={{ fontSize: '11px', fontWeight: 900 }}>TOTAL PENDING: {requests.length}</div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <button disabled style={{ background: 'transparent', border: 'none', color: '#444', fontWeight: 900, fontSize: '11px' }}>PREVIOUS PAGE</button>
                        <button disabled style={{ background: 'transparent', border: 'none', color: '#444', fontWeight: 900, fontSize: '11px' }}>NEXT PAGE</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ApprovalWaiting;