import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import CurrencySelector from '../components/CurrencySelector';
import {
    Home, Car, LogOut, Menu, ShieldCheck, ChevronDown, ChevronUp, User, CheckCircle, Search, Plus, X, Edit2, Save
} from 'lucide-react';

const ProfilePage = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);
    const [loading, setLoading] = useState(false);

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

    const [balance, setBalance] = useState(user.balance || 0);
    const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState('');

    // 🔥 Kullanıcı Adı Güncelleme State'leri
    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [newUsername, setNewUsername] = useState(user.username || '');

    // 🔥 Arabaları Tutacağımız Listeler
    const [ownedCars, setOwnedCars] = useState<any[]>([]);
    const [onSaleCars, setOnSaleCars] = useState<any[]>([]);
    const [soldCars, setSoldCars] = useState<any[]>([]);

    // 🔥 Açılır Kapanır Menü (Accordion) State'leri
    const [isOwnedOpen, setIsOwnedOpen] = useState(true);
    const [isOnSaleOpen, setIsOnSaleOpen] = useState(false);
    const [isSoldOpen, setIsSoldOpen] = useState(false);

    const fetchUserStats = useCallback(async () => {
        setLoading(true);
        try {
            // Garajdaki araçları çekiyoruz
            const myCarsRes = await api.get(`/purchase/my-cars?username=${user.username}&status=ALL`);
            const allMyCars = myCarsRes.data.dtoList || myCarsRes.data.cars || myCarsRes.data || [];

            setOwnedCars(allMyCars.filter((c: any) => c.status === 'OWNED'));
            setOnSaleCars(allMyCars.filter((c: any) => c.status === 'ON_SALE'));

            // Satılan araçları çekiyoruz
            const soldRes = await api.get(`/purchase/sold-history?username=${user.username}`);
            setSoldCars(soldRes.data.dtoList || soldRes.data || []);
        } catch (e) {
            console.error("Failed to fetch profile stats:", e);
        } finally {
            setLoading(false);
        }
    }, [user.username]);

    useEffect(() => {
        fetchUserStats();
    }, [fetchUserStats]);

    const handleAddFunds = async () => {
        const amount = parseFloat(amountToAdd);
        if (isNaN(amount) || amount <= 0) return alert("Please enter a valid amount!");

        const amountInTL = amount / currencyRate;

        try {
            const res = await api.put(`/users/add-balance?username=${user.username}&amount=${amountInTL}`);
            setBalance(res.data);
            localStorage.setItem('user', JSON.stringify({ ...user, balance: res.data }));
            setIsFundsModalOpen(false);
            setAmountToAdd('');
            alert(`${amount} ${currencySymbol} successfully added to your balance.`);
        } catch (e) { alert("Failed to add funds! An error occurred."); }
    };

    // 🔥 Kullanıcı Adı Güncelleme Fonksiyonu
    const handleUpdateUsername = async () => {
        if (!newUsername || newUsername.trim() === '') return alert("Username cannot be empty!");
        if (newUsername === user.username) {
            setIsEditingUsername(false);
            return;
        }

        try {
            await api.put(`/users/update-username?currentUsername=${user.username}&newUsername=${newUsername}`);

            // LocalStorage'ı güncelle
            const updatedUser = { ...user, username: newUsername };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            alert("Username successfully updated! The page will reload.");
            window.location.reload();
        } catch (e: any) {
            alert("Failed to update username! It might already be taken or endpoint is missing.");
        }
    };

    // 🔥 Açılır Kapanır Kutu Komponenti (Accordion) - SAĞLAMLAŞTIRILDI
    const AccordionList = ({ title, count, isOpen, onClick, cars, color }: any) => (
        <div style={{ width: '100%', background: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', flexShrink: 0 }}>

            {/* ACCORDION HEADER */}
            <div onClick={onClick} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 25px', cursor: 'pointer', borderBottom: isOpen ? '1px solid #eee' : 'none', background: '#fff', transition: '0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, flexShrink: 0 }}></div>
                    <span style={{ fontWeight: 900, fontSize: '15px', color: '#000', letterSpacing: '0.5px' }}>{title}</span>
                    <span style={{ background: '#f5f5f5', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 900, color: '#000' }}>{count}</span>
                </div>
                {isOpen ? <ChevronUp size={20} color="#000" /> : <ChevronDown size={20} color="#999" />}
            </div>

            {/* ACCORDION CONTENT */}
            {isOpen && (
                <div style={{ padding: '20px 25px', background: '#fafafa', maxHeight: '400px', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', color: '#999', fontWeight: 900, padding: '20px 0' }}>LOADING...</div>
                    ) : cars.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#ccc', fontWeight: 900, padding: '20px 0' }}>NO CARS FOUND</div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {cars.map((car: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#fff', borderRadius: '10px', border: '1px solid #eee', flexWrap: 'wrap', gap: '15px' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ fontWeight: 900, fontSize: '15px', color: '#000' }}>
                                            {car.manufacturer.toUpperCase()} <span style={{ color: '#666', fontWeight: 700 }}>{car.model}</span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#888', fontWeight: 800, marginTop: '5px' }}>
                                            YEAR: {car.year} • COLOR: {car.color?.toUpperCase() || 'N/A'} • KM: {car.mileage?.toLocaleString() || '0'}
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 900, fontSize: '16px', color: '#000', textAlign: 'right', minWidth: '100px' }}>
                                        <div style={{ fontSize: '9px', color: '#999', marginBottom: '2px' }}>VALUE / PRICE</div>
                                        {currencySymbol} {(car.price * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="app-wrapper" style={{ height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: '#f5f5f5', fontFamily: "'Inter', sans-serif" }}>

            {/* 🛡️ SIDEBAR */}
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
                    <Link to="/profile" className="nav-item active" style={{...navItemStyle, color: '#000'}}>
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
                            <Link to="/admin" style={subLinkStyle}>• USER MANAGEMENT</Link>
                            <Link to="/admin/car-stats" style={subLinkStyle}>• FLEET ANALYSIS</Link>
                        </div>
                    )}
                </nav>
            </aside>

            {/* 🛡️ ANA İÇERİK */}
            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                <header className="top-header" style={headerStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Menu onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ cursor: 'pointer', color: '#fff' }} size={24} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Link to="/profile" style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textDecoration: 'none' }}>
                                USERNAME: {user.username?.toUpperCase()}
                            </Link>
                            {(isAdmin || isModerator) && (
                                <div style={{ background: '#f39c12', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #d35400' }}>
                                    <ShieldCheck size={12} /> {isAdmin ? 'ADMIN' : 'MODERATOR'}
                                </div>
                            )}
                        </div>

                        <div style={{ background: '#1a1a1a', padding: '6px 15px', borderRadius: '8px', border: '1px solid #333', color: '#fff', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>BALANCE: {currencySymbol} {(balance * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            <div onClick={() => setIsFundsModalOpen(true)} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '1px 5px', cursor: 'pointer', display:'flex', alignItems:'center' }}>
                                <Plus size={12}/>
                            </div>
                        </div>
                    </div>

                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>USER PROFILE</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                        <CurrencySelector onCurrencyChange={handleCurrencyChange} />
                        <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            LOGOUT <LogOut size={16}/>
                        </div>
                    </div>
                </header>

                {/* 🔥 SCROLLABLE ALAN DÜZELTİLDİ: Sıkışma önlendi, Wrapper ile merkeze alındı 🔥 */}
                <div className="scrollable-area" style={{ flex: 1, overflowY: 'auto', padding: '40px 20px' }}>
                    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* PROFİL KARTI */}
                        <div style={{ background: '#000', borderRadius: '20px', padding: '40px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'flex', flexWrap: 'wrap', gap: '40px', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#222', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '4px solid #333', flexShrink: 0 }}>
                                <User size={60} color="#fff" />
                            </div>
                            <div style={{ flex: 1, minWidth: '250px' }}>

                                {/* KULLANICI ADI DÜZENLEME KISMI */}
                                {isEditingUsername ? (
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                                        <input
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', fontWeight: 900, fontSize: '18px', outline: 'none', flex: 1, minWidth: '150px' }}
                                            placeholder="New username"
                                        />
                                        <button onClick={handleUpdateUsername} style={{ background: '#27ae60', color: '#fff', border: 'none', padding: '9px 15px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}><Save size={14}/> SAVE</button>
                                        <button onClick={() => { setIsEditingUsername(false); setNewUsername(user.username); }} style={{ background: '#e74c3c', color: '#fff', border: 'none', padding: '9px 15px', borderRadius: '8px', fontWeight: 900, cursor: 'pointer' }}><X size={14}/></button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap' }}>
                                        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, fontStyle: 'italic', letterSpacing: '1px', wordBreak: 'break-all' }}>{user.username?.toUpperCase()}</h1>
                                        <button onClick={() => setIsEditingUsername(true)} style={{ background: '#222', color: '#ccc', border: '1px solid #333', padding: '6px 12px', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', transition: '0.2s', flexShrink: 0 }}>
                                            <Edit2 size={12}/> EDIT
                                        </button>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ background: isAdmin ? '#e74c3c' : isModerator ? '#3498db' : '#f39c12', color: '#fff', padding: '5px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 900, letterSpacing: '1px' }}>
                                        {role.replace('ROLE_', '')} ACCOUNT
                                    </span>
                                    <span style={{ color: '#888', fontSize: '13px', fontWeight: 700 }}>System Member</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', minWidth: '150px' }}>
                                <div style={{ fontSize: '12px', color: '#888', fontWeight: 900, marginBottom: '5px' }}>CURRENT BALANCE</div>
                                <div style={{ fontSize: '28px', fontWeight: 900, color: '#27ae60' }}>
                                    {currencySymbol} {(balance * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </div>
                                <button onClick={() => setIsFundsModalOpen(true)} style={{ marginTop: '10px', background: '#fff', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: 900, fontSize: '11px', cursor: 'pointer', width: '100%' }}>
                                    ADD FUNDS
                                </button>
                            </div>
                        </div>

                        {/* ACCORDION LİSTELERİ */}
                        <AccordionList
                            title="OWNED CARS"
                            count={ownedCars.length}
                            color="#3498db"
                            isOpen={isOwnedOpen}
                            onClick={() => setIsOwnedOpen(!isOwnedOpen)}
                            cars={ownedCars}
                        />

                        <AccordionList
                            title="VEHICLES ON SALE"
                            count={onSaleCars.length}
                            color="#f39c12"
                            isOpen={isOnSaleOpen}
                            onClick={() => setIsOnSaleOpen(!isOnSaleOpen)}
                            cars={onSaleCars}
                        />

                        <AccordionList
                            title="SUCCESSFULLY SOLD"
                            count={soldCars.length}
                            color="#27ae60"
                            isOpen={isSoldOpen}
                            onClick={() => setIsSoldOpen(!isSoldOpen)}
                            cars={soldCars}
                        />

                    </div>
                </div>
            </div>

            {/* PARA EKLEME MODALI */}
            {isFundsModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#000', padding: '40px', borderRadius: '30px', border: '1px solid #333', width: '400px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 900, fontStyle: 'italic', margin: 0 }}>ADD FUNDS</h2>
                            <X onClick={() => setIsFundsModalOpen(false)} style={{ color: '#fff', cursor: 'pointer' }} size={24} />
                        </div>
                        <input type="number" placeholder={`Amount (${currencySymbol})`} value={amountToAdd} onChange={(e) => setAmountToAdd(e.target.value)} style={inputStyle} />
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button onClick={handleAddFunds} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#fff', color: '#000', fontWeight: 900, cursor: 'pointer', border: 'none' }}>CONFIRM</button>
                            <button onClick={() => { setIsFundsModalOpen(false); setAmountToAdd(''); }} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#222', color: '#fff', fontWeight: 900, cursor: 'pointer', border: 'none' }}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- STYLES ---
const sidebarStyle = { width: '260px', background: '#fff', color: '#000', display: 'flex', flexDirection: 'column', borderRight: '1px solid #eee' };
const navItemStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', color: '#333', textDecoration: 'none', fontSize: '13px', fontWeight: 700, borderRadius: '10px', marginBottom: '5px' };
const subLinkStyle = { display: 'block', padding: '8px 10px', color: '#666', textDecoration: 'none', fontSize: '12px', fontWeight: 600, marginBottom: '2px' };
const moderatorBtnStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '10px', background: 'transparent', color: '#333', textDecoration: 'none', fontSize: '13px', fontWeight: 700, marginTop: '20px' };
const headerStyle = { background: '#000', padding: '0 30px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333', flexShrink: 0 };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 700, fontSize: '14px' };

export default ProfilePage;