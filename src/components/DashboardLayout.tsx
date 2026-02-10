import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, User, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';

const DashboardLayout = () => {
    const location = useLocation();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);

    // Pagination state'i buradan yönetiliyor, sayfalar bunu güncelleyecek
    const [pagination, setPagination] = useState({
        currentPage: 0,
        totalPages: 1,
        totalElements: 0,
        onPageChange: (newPage: number) => {} // Boş fonksiyon (Placeholder)
    });

    const userString = localStorage.getItem('user');
    const userData = userString ? JSON.parse(userString) : {};

    // Kullanıcının rolünü güvenli şekilde kontrol ediyoruz
    const isUser = userData.role && (userData.role === "ROLE_USER" || JSON.stringify(userData.role).includes("USER"));

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    const isActive = (path: string) => location.pathname === path;

    const navItemStyle = (path: string) => ({
        display: 'block', padding: '15px 30px', textDecoration: 'none',
        color: isActive(path) ? '#000' : '#666', fontWeight: 900,
        backgroundColor: isActive(path) ? '#eee' : 'transparent',
        fontSize: '11px', transition: '0.2s', letterSpacing: '0.5px'
    });

    return (
        <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

            {/* 🛡️ SIDEBAR */}
            <div style={{ position: 'fixed', top: 0, left: isSidebarOpen ? 0 : '-300px', width: '300px', height: '100%', backgroundColor: '#fff', zIndex: 2000, transition: '0.4s', borderRight: '1px solid #eee' }}>
                <div style={{ padding: '25px', display: 'flex', justifyContent: 'flex-end' }}>
                    <X onClick={() => setSidebarOpen(false)} style={{ cursor: 'pointer' }} size={24} />
                </div>
                <nav>
                    <Link to="/" style={navItemStyle('/')} onClick={() => setSidebarOpen(false)}>HOME PAGE</Link>

                    <div onClick={() => setIsCollectionOpen(!isCollectionOpen)} style={{ padding: '30px 30px 10px', fontSize: '10px', fontWeight: 900, color: '#000', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                        MY COLLECTION {isCollectionOpen ? <ChevronDown size={14}/> : <ChevronUp size={14}/>}
                    </div>

                    {isCollectionOpen && (
                        <div>
                            <Link to="/my-cars" style={navItemStyle('/my-cars')} onClick={() => setSidebarOpen(false)}>• MY CARS</Link>

                            {/* 🔥 Sadece USER rolündekiler "Onay Bekleyenler"i görür */}
                            {isUser && (
                                <Link to="/approval-waiting" style={navItemStyle('/approval-waiting')} onClick={() => setSidebarOpen(false)}>
                                    • APPROVAL WAITING
                                </Link>
                            )}

                            <Link to="/for-sale" style={navItemStyle('/for-sale')} onClick={() => setSidebarOpen(false)}>• FOR SALE</Link>
                            <Link to="/sold" style={navItemStyle('/sold')} onClick={() => setSidebarOpen(false)}>• SOLD</Link>
                        </div>
                    )}
                </nav>
            </div>

            {/* Overlay (Sidebar açılınca arkadaki karartı) */}
            {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1999 }} />}

            {/* 🥪 HEADER */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', height: '65px', backgroundColor: '#000', color: '#fff', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                    <Menu onClick={() => setSidebarOpen(true)} style={{ cursor: 'pointer' }} size={26} />
                    <div style={{ fontSize: '12px', fontWeight: 900 }}><User size={18} /> {userData.username?.toUpperCase()}</div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, fontStyle: 'italic' }}>CAR DATA ANALYSIS</div>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontWeight: 900 }}>LOGOUT <LogOut size={18} /></button>
            </header>

            {/* 🥪 İÇERİK (Outlet context ile pagination verisini alt sayfalara gönderiyor) */}
            <main style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f5f5f5' }}>
                <Outlet context={{ setPagination }} />
            </main>

            {/* 🥪 FOOTER (Artık Canlı! ⚡️) */}
            <footer style={{ background: '#000', padding: '15px 35px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: 900 }}>PAGE {pagination.currentPage + 1} OF {pagination.totalPages || 1}</div>
                <div style={{ fontSize: '11px', fontWeight: 900 }}>TOTAL ITEMS: {pagination.totalElements}</div>

                <div style={{ display: 'flex', gap: '30px' }}>
                    <button
                        style={{...footerBtnStyle, opacity: pagination.currentPage === 0 ? 0.3 : 1, cursor: pagination.currentPage === 0 ? 'default' : 'pointer'}}
                        onClick={() => {
                            if (pagination.currentPage > 0) {
                                pagination.onPageChange(pagination.currentPage - 1);
                            }
                        }}
                    >
                        PREVIOUS PAGE
                    </button>

                    <button
                        style={{...footerBtnStyle, opacity: pagination.currentPage + 1 >= pagination.totalPages ? 0.3 : 1, cursor: pagination.currentPage + 1 >= pagination.totalPages ? 'default' : 'pointer'}}
                        onClick={() => {
                            if (pagination.currentPage < pagination.totalPages - 1) {
                                pagination.onPageChange(pagination.currentPage + 1);
                            }
                        }}
                    >
                        NEXT PAGE
                    </button>
                </div>
            </footer>
        </div>
    );
};

const footerBtnStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: '#fff', fontWeight: 900, fontSize: '11px' };

export default DashboardLayout;