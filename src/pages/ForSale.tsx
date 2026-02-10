import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import { Home, Car, LogOut, Menu, ChevronUp, ChevronDown, ShieldCheck } from 'lucide-react';

const ForSale = () => {
    const [cars, setCars] = useState([]);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);

    // Kullanıcı Verisi
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};

    // 🛡️ ROL KONTROLÜ
    const isUser = user.role && (user.role === "ROLE_USER" || JSON.stringify(user.role).includes("USER"));
    const isModerator = user.role === "ROLE_MODERATOR" || (user.role && user.role.includes("MODERATOR"));

    // Sayfalama
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    // 📡 VERİ ÇEKME (Sadece ON_SALE olanlar)
    const fetchCars = useCallback(async () => {
        try {
            const res = await api.get(`/purchase/my-cars`, {
                params: {
                    username: user.username,
                    status: 'ON_SALE', // 🟢 Sadece satılıkları getir
                    page: currentPage,
                    size: 10
                }
            });

            // Backend List veya Page dönebilir, ikisini de yönetelim
            if (res.data && res.data.dtoList) {
                setCars(res.data.dtoList);
                setTotalPages(res.data.totalPages || 0);
                setTotalElements(res.data.totalElements || 0);
            } else if (Array.isArray(res.data)) {
                setCars(res.data);
                setTotalElements(res.data.length);
                setTotalPages(Math.ceil(res.data.length / 10));
            } else if (res.data && res.data.cars) {
                setCars(res.data.cars);
                setTotalPages(res.data.totalPages || 0);
                setTotalElements(res.data.totalElements || 0);
            }
        } catch (e) {
            console.error("Veri çekme hatası:", e);
            setCars([]);
        }
    }, [user.username, currentPage]);

    useEffect(() => { fetchCars(); }, [fetchCars]);

    return (
        <div className="app-wrapper" style={{ height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>

            {/* 🛡️ SIDEBAR (DİNAMİK AÇILIR/KAPANIR) */}
            <aside
                className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`}
                style={{
                    ...sidebarStyle,
                    // 🔥 BURASI EKLENDİ: Sidebar açılıp kapanma mantığı
                    width: isSidebarOpen ? '260px' : '0px',
                    opacity: isSidebarOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                }}
            >
                <nav style={{ marginTop: '50px', padding: '0 15px', minWidth: '260px' }}>

                    {/* 1. HOME PAGE */}
                    <Link to="/" className="nav-item" style={navItemStyle}>
                        <Home size={22}/> HOME PAGE
                    </Link>

                    {/* 2. MY COLLECTION (Açılır Menü) */}
                    <div
                        className="nav-item active"
                        style={{...navItemStyle, cursor: 'pointer', justifyContent: 'space-between', color: '#000'}}
                        onClick={() => setIsCollectionOpen(!isCollectionOpen)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Car size={22}/> MY COLLECTION</div>
                        {isCollectionOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>

                    {isCollectionOpen && (
                        <div style={{ paddingLeft: '20px', display:'flex', flexDirection:'column', gap:'5px' }}>
                            <Link to="/my-cars" style={subLinkStyle}>• MY CARS</Link>

                            {/* ⚠️ SADECE USER GÖRÜR ⚠️ */}
                            {isUser && (
                                <Link to="/approval-waiting" style={subLinkStyle}>• APPROVAL WAITING</Link>
                            )}

                            {/* AKTİF SAYFA: FOR SALE (BOLD) */}
                            <Link to="/for-sale" style={{...subLinkStyle, fontWeight: 900, color: '#000'}}>• FOR SALE</Link>

                            <Link to="/sold" style={subLinkStyle}>• SOLD</Link>
                        </div>
                    )}

                    {/* ⚠️ SADECE MODERATOR GÖRÜR (ARKA PLANSIZ, SADE) ⚠️ */}
                    {isModerator && (
                        <Link to="/approval-requests" style={moderatorBtnStyle}>
                            <ShieldCheck size={22}/> APPROVAL REQUESTS
                        </Link>
                    )}
                </nav>
            </aside>

            {/* 🛡️ MAIN CONTENT */}
            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                {/* HEADER (Menü İkonu Bağlandı) */}
                <header className="top-header" style={{ flexShrink: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* 🔥 Menü ikonuna onClick eklendi */}
                        <Menu onClick={() => setSidebarOpen(!isSidebarOpen)} size={24} style={{ cursor: 'pointer' }} />

                        <div style={{ fontSize: '12px', fontWeight: 800 }}>SELLER: {user.username?.toUpperCase()}</div>
                        <span style={{ background: '#000', color: '#fff', padding: '2px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 900 }}>LISTING</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic' }}>VEHICLES FOR SALE</div>
                    <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#666' }}>LOGOUT <LogOut size={16}/></div>
                </header>

                {/* SCROLLABLE AREA */}
                <div className="scrollable-area" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                    <div className="table-area" style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th style={{ padding: '20px' }}>MANUFACTURER</th>
                                <th style={{ padding: '20px' }}>MODEL</th>
                                <th style={{ padding: '20px' }}>PRICE</th>
                                <th style={{ padding: '20px' }}>STATUS</th>
                            </tr>
                            </thead>
                            <tbody>
                            {cars.length === 0 ? (
                                <tr><td colSpan={4} style={{ padding: '50px', textAlign: 'center', fontWeight: 900, color: '#ccc' }}>NO CARS ON SALE</td></tr>
                            ) : (
                                cars.map((car: any) => (
                                    <tr key={car.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                        <td style={{ padding: '20px', fontWeight: 900, fontSize: '18px' }}>{car.manufacturer}</td>
                                        <td style={{ padding: '20px' }}>{car.model}</td>
                                        <td style={{ padding: '20px', fontWeight: 900 }}>${car.price.toLocaleString()}</td>
                                        <td style={{ padding: '20px' }}>
                                            <span style={{
                                                color: '#e74c3c',
                                                fontWeight: 900,
                                                fontSize: '10px',
                                                border: '1px solid #e74c3c',
                                                padding: '5px 10px',
                                                borderRadius: '5px',
                                                display: 'inline-block'
                                            }}>
                                                WAITING BUYER
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER */}
                <footer style={{ background: '#000', padding: '15px 30px', flexShrink: 0, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, width: '33%', textAlign: 'left' }}>SHOWING PAGE {currentPage + 1} OF {totalPages || 1}</div>
                    <div style={{ fontSize: '11px', fontWeight: 900, width: '33%', textAlign: 'center' }}>ACTIVE LISTINGS: {totalElements}</div>
                    <div style={{ display: 'flex', gap: '20px', width: '33%', justifyContent: 'flex-end' }}>
                        <button disabled={currentPage === 0} onClick={() => setCurrentPage(prev => prev - 1)} style={fBtnStyle(currentPage === 0)}>PREVIOUS PAGE</button>
                        <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(prev => prev + 1)} style={fBtnStyle(currentPage >= totalPages - 1)}>NEXT PAGE</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

// --- STYLES ---
const sidebarStyle = { width: '260px', background: '#fff', color: '#000', display: 'flex', flexDirection: 'column', borderRight: '1px solid #eee' };

const navItemStyle = {
    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px',
    color: '#333', textDecoration: 'none', fontSize: '13px', fontWeight: 700,
    borderRadius: '10px', marginBottom: '5px'
};

const subLinkStyle = {
    display: 'block', padding: '8px 10px', color: '#666',
    textDecoration: 'none', fontSize: '12px', fontWeight: 600,
    marginBottom: '2px'
};

// 🔥 MODERATOR BUTONU (ŞEFFAF, SADE) 🔥
const moderatorBtnStyle = {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 15px',
    borderRadius: '10px',
    background: 'transparent', // ŞEFFAF
    color: '#333', // KOYU GRİ/SİYAH
    textDecoration: 'none', fontSize: '13px', fontWeight: 700,
    marginTop: '20px' // AYIRMAK İÇİN BOŞLUK
};

const fBtnStyle = (disabled: boolean) => ({ background: 'transparent', border: 'none', color: disabled ? '#444' : '#fff', cursor: disabled ? 'default' : 'pointer', fontWeight: 900, fontSize: '11px', transition: '0.3s' });

export default ForSale;