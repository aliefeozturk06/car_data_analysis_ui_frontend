import React, { useEffect, useState, useCallback } from 'react';
import { adminService, type UserAdminResponseDTO } from '../api/adminService';
import { Link } from 'react-router-dom';
import CurrencySelector from '../components/CurrencySelector';
import {
    Home, Car, LogOut, Menu, ShieldCheck, ChevronDown, ChevronUp, Users, Wallet, ShieldAlert, User, X
} from 'lucide-react';

const AdminDashboard = () => {
    const [users, setUsers] = useState<UserAdminResponseDTO[]>([]);
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

    const fetchUsers = useCallback(async () => {
        try {
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to load users:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleRoleChange = async (userId: number, currentRole: string, newRole: string) => {
        if (currentRole === newRole) return;

        const isConfirmed = window.confirm(`User role will be changed to ${newRole.replace('ROLE_', '')}. Are you sure?`);
        if (!isConfirmed) return;

        try {
            await adminService.updateUserRole(userId, newRole);
            alert("Role successfully updated!");
            fetchUsers();
        } catch (error) {
            console.error("Failed to update role:", error);
            alert("An error occurred while updating the role.");
        }
    };

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

    const sortedUsers = [...users].sort((a, b) => {
        for (const [field, dir] of Object.entries(sorts)) {
            if (!dir) continue;

            let valA = a[field as keyof UserAdminResponseDTO];
            let valB = b[field as keyof UserAdminResponseDTO];

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
        }
        return 0;
    });

    const totalUsers = users.length;
    const totalBalance = users.reduce((acc, u) => acc + (u.balance || 0), 0);
    const totalStaff = users.filter(u => u.role === 'ROLE_ADMIN' || u.role === 'ROLE_MODERATOR').length;

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
                    <Link to="/profile" className="nav-item" style={navItemStyle}>
                        <User size={22}/> PROFILE
                    </Link>

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
                            <Link to="/admin" style={{...subLinkStyle, fontWeight: 900, color: '#000'}}>
                                • USER MANAGEMENT
                            </Link>
                            <Link to="/admin/car-stats" style={subLinkStyle}>
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
                            <Link to="/profile" style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textDecoration: 'none' }}>
                                USERNAME: {user.username?.toUpperCase()}
                            </Link>
                            {isAdmin && (
                                <div style={{ background: '#f39c12', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #d35400' }}>
                                    <ShieldCheck size={12} /> ADMIN
                                </div>
                            )}
                        </div>

                        <div style={{ background: '#1a1a1a', padding: '6px 15px', borderRadius: '8px', border: '1px solid #333', color: '#fff', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>BALANCE: {currencySymbol} {(balance * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>

                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>USER MANAGEMENT</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                        <CurrencySelector onCurrencyChange={handleCurrencyChange} />
                        <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            LOGOUT <LogOut size={16}/>
                        </div>
                    </div>
                </header>

                <div className="scrollable-area" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>

                    {loading ? (
                        <div style={{ padding: '40px', fontWeight: 900, textAlign: 'center' }}>LOADING...</div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                                <div style={cardStyle}>
                                    <div style={cardHeaderStyle}><Users size={20} /> TOTAL USERS</div>
                                    <div style={cardValueStyle}>{totalUsers}</div>
                                </div>
                                <div style={cardStyle}>
                                    <div style={cardHeaderStyle}><Wallet size={20} /> SYSTEM BALANCE</div>
                                    <div style={{...cardValueStyle, color: '#27ae60'}}>
                                        {currencySymbol} {(totalBalance * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <div style={cardStyle}>
                                    <div style={cardHeaderStyle}><ShieldAlert size={20} /> TOTAL STAFF</div>
                                    <div style={cardValueStyle}>{totalStaff}</div>
                                </div>
                            </div>

                            <div className="table-area" style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ borderBottom: '1px solid #eee' }}>
                                    <tr>
                                        <th onClick={() => handleSort('id')} style={{ padding: '20px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', color: '#000', cursor: 'pointer' }}>
                                            ID {getSortIndicator('id')}
                                        </th>
                                        <th onClick={() => handleSort('username')} style={{ padding: '20px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', color: '#000', cursor: 'pointer' }}>
                                            USERNAME {getSortIndicator('username')}
                                        </th>
                                        <th onClick={() => handleSort('balance')} style={{ padding: '20px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', color: '#000', cursor: 'pointer' }}>
                                            BALANCE {getSortIndicator('balance')}
                                        </th>
                                        <th onClick={() => handleSort('role')} style={{ padding: '20px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', color: '#000', cursor: 'pointer' }}>
                                            CURRENT ROLE {getSortIndicator('role')}
                                        </th>
                                        <th style={{ padding: '20px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px', color: '#000' }}>
                                            ACTION
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {sortedUsers.map((u) => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid #f9f9f9', transition: '0.2s' }}>
                                            <td style={{ padding: '20px', fontWeight: 900, color: '#888', fontSize: '13px' }}>#{u.id}</td>
                                            <td style={{ padding: '20px', fontWeight: 900, fontSize: '14px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <User size={16} color="#000" /> {u.username.toUpperCase()}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px', fontWeight: 900, color: '#27ae60', fontSize: '14px' }}>
                                                {currencySymbol} {((u.balance || 0) * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </td>
                                            <td style={{ padding: '20px' }}>
                                                    <span style={{
                                                        padding: '5px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px',
                                                        backgroundColor: u.role === 'ROLE_ADMIN' ? '#000' : u.role === 'ROLE_MODERATOR' ? '#3498db' : '#f5f5f5',
                                                        color: u.role === 'ROLE_ADMIN' || u.role === 'ROLE_MODERATOR' ? '#fff' : '#666',
                                                        border: u.role === 'ROLE_USER' ? '1px solid #ccc' : 'none'
                                                    }}>
                                                        {(u.role || 'USER').replace('ROLE_', '')}
                                                    </span>
                                            </td>
                                            <td style={{ padding: '20px' }}>
                                                <select
                                                    value={u.role || 'ROLE_USER'}
                                                    onChange={(e) => handleRoleChange(u.id, u.role, e.target.value)}
                                                    style={{
                                                        padding: '8px 12px', border: '2px solid #000', borderRadius: '6px',
                                                        fontWeight: 900, fontSize: '11px', cursor: 'pointer', outline: 'none',
                                                        backgroundColor: '#fff', letterSpacing: '0.5px'
                                                    }}
                                                    disabled={u.role === 'ROLE_ADMIN'}
                                                >
                                                    <option value="ROLE_USER">SET USER</option>
                                                    <option value="ROLE_MODERATOR">SET MODERATOR</option>
                                                    {u.role === 'ROLE_ADMIN' && <option value="ROLE_ADMIN">ADMIN</option>}
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                <footer style={{ background: '#000', padding: '15px 30px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', borderTop: '1px solid #333', zIndex: 10 }}>
                    <div style={{ fontSize: '11px', fontWeight: 900 }}>TOTAL USERS: {totalUsers}</div>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#888' }}>ADMINISTRATION PRIVILEGES</div>
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

const cardStyle: React.CSSProperties = {
    flex: 1, backgroundColor: '#000', borderRadius: '15px',
    padding: '25px', display: 'flex', flexDirection: 'column', gap: '10px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
};

const cardHeaderStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 900, color: '#888',
    letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px'
};

const cardValueStyle: React.CSSProperties = {
    fontSize: '28px', fontWeight: 900, color: '#fff'
};

export default AdminDashboard;