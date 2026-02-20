import React, { useEffect, useState, useCallback } from 'react';
import { adminService, type UserCarStatsDTO } from '../api/adminService';
import { Link } from 'react-router-dom';
import CurrencySelector from '../components/CurrencySelector';
import {
    Home, Car, LogOut, Menu, ShieldCheck, ChevronDown, ChevronUp, BarChart2, User, Clock, CheckCircle, Search
} from 'lucide-react';

const UserCarStats = () => {
    const [stats, setStats] = useState<UserCarStatsDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [sorts, setSorts] = useState<Record<string, 'asc' | 'desc' | null>>({});

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};

    const role = user.role || "";
    const isUser = role === "ROLE_USER" || JSON.stringify(role).includes("USER");
    const isAdmin = role === "ROLE_ADMIN" || JSON.stringify(role).includes("ADMIN");
    const isModerator = role === "ROLE_MODERATOR" || JSON.stringify(role).includes("MODERATOR");

    const [balance, setBalance] = useState(user.balance || 0);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);

    const [currencyRate, setCurrencyRate] = useState(parseFloat(localStorage.getItem('currencyRate') || "1"));
    const [currencySymbol, setCurrencySymbol] = useState(localStorage.getItem('currencySymbol') || "₺");

    const handleCurrencyChange = (rate: number, symbol: string) => {
        setCurrencyRate(rate);
        setCurrencySymbol(symbol);
    };

    const fetchStats = useCallback(async () => {
        try {
            const data = await adminService.getUserCarStats();
            setStats(data);
        } catch (error) {
            console.error("There is an error occured while getting the values:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const handleSort = (field: string) => {
        setSorts(prev => {
            const current = prev[field];
            const newSorts = { ...prev };
            if (!current) newSorts[field] = 'asc';
            else if (current === 'asc') newSorts[field] = 'desc';
            else delete newSorts[field];
            return newSorts;
        });
    };

    const getSortIndicator = (field: string) => {
        const dir = sorts[field];
        if (dir === 'asc') return '↑';
        if (dir === 'desc') return '↓';
        return '↕';
    };

    const sortedStats = [...stats].sort((a, b) => {
        for (const [field, dir] of Object.entries(sorts)) {
            if (!dir) continue;
            let valA = a[field as keyof UserCarStatsDTO];
            let valB = b[field as keyof UserCarStatsDTO];
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();
            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
        }
        return 0;
    });

    return (
        <div className="app-wrapper" style={{ height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: '#f5f5f5', fontFamily: "'Inter', sans-serif" }}>

            <aside
                className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`}
                style={{
                    ...sidebarStyle,
                    width: isSidebarOpen ? '260px' : '0px',
                    opacity: isSidebarOpen ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                }}
            >
                <nav style={{ marginTop: '50px', padding: '0 15px', minWidth: '260px' }}>
                    <Link to="/" className="nav-item" style={navItemStyle}><Home size={22}/> HOME PAGE</Link>

                    <div
                        className="nav-item"
                        style={{...navItemStyle, cursor: 'pointer', justifyContent: 'space-between', background:'transparent', color:'#333'}}
                        onClick={() => setIsCollectionOpen(!isCollectionOpen)}
                    >
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

                    {(isAdmin || isModerator) && (
                        <Link to="/approval-requests" style={moderatorBtnStyle}>
                            <ShieldCheck size={22}/> APPROVAL REQUESTS
                        </Link>
                    )}

                    {isAdmin && (
                        <div style={{ marginTop: '10px' }}>
                            <div style={{ padding: '15px 15px 5px', fontSize: '10px', fontWeight: 900, color: '#e74c3c', letterSpacing: '1px' }}>
                                ADMINISTRATION
                            </div>
                            <Link to="/admin" style={subLinkStyle}>
                                • USER MANAGEMENT
                            </Link>
                            <Link to="/admin/car-stats" style={{...subLinkStyle, fontWeight: 900, color: '#000'}}>
                                • FLEET ANALYSIS
                            </Link>
                        </div>
                    )}
                </nav>
            </aside>

            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                <header className="top-header" style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Menu onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ cursor: 'pointer', color: '#fff' }} size={24} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>USERNAME: {user.username?.toUpperCase()}</div>
                            <div style={{ background: '#f39c12', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #d35400' }}>
                                <BarChart2 size={12} /> SYSTEM ANALYST
                            </div>
                        </div>
                        <div style={{ background: '#1a1a1a', padding: '6px 15px', borderRadius: '8px', border: '1px solid #333', color: '#fff', fontSize: '13px', fontWeight: 900 }}>
                            BALANCE: {currencySymbol} {(balance * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                    </div>

                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>USER FLEET STATISTICS</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                        <CurrencySelector onCurrencyChange={handleCurrencyChange} />
                        <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            LOGOUT <LogOut size={16}/>
                        </div>
                    </div>
                </header>

                <div className="scrollable-area" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>
                    {loading ? (
                        <div style={{ padding: '40px', fontWeight: 900, textAlign: 'center' }}>SCANNING DATABASE...</div>
                    ) : (
                        <div className="table-area" style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ borderBottom: '1px solid #eee' }}>
                                <tr>
                                    <th onClick={() => handleSort('username')} style={{ padding: '20px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', color: '#000', cursor: 'pointer' }}>
                                        USERNAME {getSortIndicator('username')}
                                    </th>
                                    <th onClick={() => handleSort('ownedCount')} style={{ padding: '20px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', color: '#000', cursor: 'pointer' }}>
                                        OWNED CARS {getSortIndicator('ownedCount')}
                                    </th>
                                    <th onClick={() => handleSort('waitingCount')} style={{ padding: '20px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', color: '#000', cursor: 'pointer' }}>
                                        WAITING APPROVAL {getSortIndicator('waitingCount')}
                                    </th>
                                    <th onClick={() => handleSort('onSaleCount')} style={{ padding: '20px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', color: '#000', cursor: 'pointer' }}>
                                        ON SALE {getSortIndicator('onSaleCount')}
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {sortedStats.map((s, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #f9f9f9', transition: '0.2s' }}>
                                        <td style={{ padding: '20px', fontWeight: 900, fontSize: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <User size={16} color="#000" /> {s.username.toUpperCase()}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px', fontWeight: 900, fontSize: '14px', color: '#27ae60' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <CheckCircle size={14} /> {s.ownedCount}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px', fontWeight: 900, fontSize: '14px', color: '#f39c12' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={14} /> {s.waitingCount}
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px', fontWeight: 900, fontSize: '14px', color: '#e74c3c' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Search size={14} /> {s.onSaleCount}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <footer style={{ background: '#000', padding: '15px 30px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', borderTop: '1px solid #333', zIndex: 10 }}>
                    <div style={{ fontSize: '11px', fontWeight: 900 }}>TOTAL ACCOUNTS: {stats.length}</div>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#888' }}>ADMINISTRATION FLEET ANALYSIS</div>
                </footer>
            </div>
        </div>
    );
};

const sidebarStyle = { width: '260px', background: '#fff', color: '#000', display: 'flex', flexDirection: 'column', borderRight: '1px solid #eee' };
const navItemStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', color: '#333', textDecoration: 'none', fontSize: '13px', fontWeight: 700, borderRadius: '10px', marginBottom: '5px' };
const subLinkStyle = { display: 'block', padding: '8px 10px', color: '#666', textDecoration: 'none', fontSize: '12px', fontWeight: 600, marginBottom: '2px' };
const moderatorBtnStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '10px', background: 'transparent', color: '#333', textDecoration: 'none', fontSize: '13px', fontWeight: 700, marginTop: '20px' };

const headerStyle = {
    background: '#000', padding: '0 30px', height: '70px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #333', flexShrink: 0
};

export default UserCarStats;