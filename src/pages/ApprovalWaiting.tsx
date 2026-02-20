import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import CurrencySelector from '../components/CurrencySelector';
import { Home, Car, LogOut, Menu, ChevronUp, ChevronDown, RotateCcw, XCircle, ShieldCheck } from 'lucide-react';

const ApprovalWaiting = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);

    const [currencyRate, setCurrencyRate] = useState(parseFloat(localStorage.getItem('currencyRate') || "1"));
    const [currencySymbol, setCurrencySymbol] = useState(localStorage.getItem('currencySymbol') || "₺");

    const handleCurrencyChange = (rate: number, symbol: string) => {
        setCurrencyRate(rate);
        setCurrencySymbol(symbol);
    };

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};

    const role = user.role || "";
    const isUser = role === "ROLE_USER" || JSON.stringify(role).includes("USER");
    const isAdmin = role === "ROLE_ADMIN" || JSON.stringify(role).includes("ADMIN");
    const isModerator = role === "ROLE_MODERATOR" || JSON.stringify(role).includes("MODERATOR");

    const fetchPendingRequests = useCallback(async () => {
        if (!user.username) return;
        setLoading(true);
        try {
            const res = await api.get(`/purchase/my-pending-requests?username=${user.username}`);
            setRequests(res.data || []);
        } catch (e) {
            console.error("Failed to fetch data!", e);
        } finally {
            setLoading(false);
        }
    }, [user.username]);

    useEffect(() => {
        fetchPendingRequests();
    }, [fetchPendingRequests]);

    const handleCancel = async (carId: number) => {
        if (!window.confirm("Are you sure you want to cancel the request?")) return;
        try {
            await api.post(`/purchase/cancel-update-request?username=${user.username}&carId=${carId}`);
            alert("Request successfully canceled.");
            setRequests(prev => prev.filter((req: any) => req.carId !== carId));
        } catch (e) {
            alert("Cancellation unsuccessful!");
        }
    };

    return (
        <div className="app-wrapper" style={{ height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>

            <aside className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`} style={sidebarStyle}>
                <nav style={{ marginTop: '50px', padding: '0 15px', minWidth: '260px' }}>
                    <Link to="/" className="nav-item" style={navItemStyle}><Home size={22}/> HOME PAGE</Link>

                    <div className="nav-item active" style={{...navItemStyle, cursor: 'pointer', justifyContent: 'space-between'}} onClick={() => setIsCollectionOpen(!isCollectionOpen)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Car size={22}/> MY COLLECTION</div>
                        {isCollectionOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>

                    {isCollectionOpen && (
                        <div style={{ paddingLeft: '20px', display:'flex', flexDirection:'column', gap:'5px' }}>
                            <Link to="/my-cars" style={subLinkStyle}>• MY CARS</Link>

                            {isUser && (
                                <Link to="/approval-waiting" style={{...subLinkStyle, background: '#eee', color:'#000', fontWeight:800, borderRadius:'6px'}}>• APPROVAL WAITING</Link>
                            )}

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
                        <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>USER: {user.username?.toUpperCase()}</div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>APPROVAL WAITING</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <CurrencySelector onCurrencyChange={handleCurrencyChange} />
                        <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            LOGOUT <LogOut size={16}/>
                        </div>
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
                                requests.map((req: any) => (
                                    <tr key={req.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                        <td style={{ padding: '20px', fontWeight: 900, fontSize: '18px' }}>
                                            {(req.manufacturer || 'Unknown').toUpperCase()} <span style={{color:'#999', fontSize:'14px'}}>{req.model}</span>
                                        </td>
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

const sidebarStyle: React.CSSProperties = { width: '260px', background: '#fff', color: '#000', display: 'flex', flexDirection: 'column', borderRight: '1px solid #eee', transition: 'all 0.3s ease', overflow: 'hidden' };
const navItemStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', color: '#333', textDecoration: 'none', fontSize: '13px', fontWeight: 700, borderRadius: '10px', marginBottom: '5px' };
const subLinkStyle = { display: 'block', padding: '8px 10px', color: '#666', textDecoration: 'none', fontSize: '12px', fontWeight: 600, marginBottom: '2px' };
const moderatorBtnStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '10px', background: 'transparent', color: '#333', textDecoration: 'none', fontSize: '13px', fontWeight: 700, marginTop: '20px' };

const headerStyle = { background: '#000', padding: '0 30px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333', flexShrink: 0 };

export default ApprovalWaiting;