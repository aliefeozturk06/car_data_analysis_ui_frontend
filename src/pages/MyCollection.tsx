import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import CurrencySelector from '../components/CurrencySelector';
import { Home, Car, LogOut, Menu, Plus, Search, RotateCcw, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ShieldCheck } from 'lucide-react';

const MyCollection = () => {
    const [myCars, setMyCars] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);
    const [loading, setLoading] = useState(false);

    const [currencyRate, setCurrencyRate] = useState(parseFloat(localStorage.getItem('currencyRate') || "1"));
    const [currencySymbol, setCurrencySymbol] = useState(localStorage.getItem('currencySymbol') || "₺");

    const handleCurrencyChange = (rate: number, symbol: string) => {
        setCurrencyRate(rate);
        setCurrencySymbol(symbol);
    };

    const initialFilters = {
        page: 0, size: 10,
        manufacturer: '', model: '', minYear: '', maxYear: '',
        color: '', priceMin: '', priceMax: ''
    };
    const [filters, setFilters] = useState(initialFilters);
    const [sorts, setSorts] = useState<Record<string, 'asc' | 'desc' | null>>({});

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};
    const [balance, setBalance] = useState(user.balance || 0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState('');

    const role = user.role || "";
    const isUser = role === "ROLE_USER" || JSON.stringify(role).includes("USER");
    const isAdmin = role === "ROLE_ADMIN" || JSON.stringify(role).includes("ADMIN");
    const isModerator = role === "ROLE_MODERATOR" || JSON.stringify(role).includes("MODERATOR");

    const fetchMyCars = useCallback(async () => {
        setLoading(true);
        const sortParams = Object.entries(sorts)
            .filter(([_, dir]) => dir !== null)
            .map(([field, dir]) => `${field},${dir}`);

        const searchFilters = {
            ...filters,
            priceMin: filters.priceMin ? Math.floor(Number(filters.priceMin) / currencyRate) : '',
            priceMax: filters.priceMax ? Math.floor(Number(filters.priceMax) / currencyRate) : ''
        };

        try {
            const res = await api.get('/purchase/my-cars', {
                params: { ...searchFilters, username: user.username, sort: sortParams },
                paramsSerializer: { indexes: null }
            });
            setMyCars(res.data.cars || []);
            setTotalPages(res.data.totalPages || 0);
        } catch (e) {
            console.error("Failed to fetch garage info!", e);
        } finally {
            setLoading(false);
        }
    }, [filters, sorts, user.username, currencyRate]);

    useEffect(() => {
        fetchMyCars();
    }, [filters.page, sorts, fetchMyCars]);

    const handleSellCar = async (carId: number, carPrice: number) => {
        if (!window.confirm("Are you sure you want to sell this car?")) return;
        try {
            await api.post(`/purchase/sell?username=${user.username}&carId=${carId}`);
            const newBalance = balance + carPrice;
            setBalance(newBalance);
            localStorage.setItem('user', JSON.stringify({ ...user, balance: newBalance }));
            alert("Car successfully sold! The amount has been added to your balance.");
            fetchMyCars();
        } catch (e) { alert("Sell operation was unsuccessful."); }
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

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 0 }));
    };

    const handleAddFunds = async () => {
        const amount = parseFloat(amountToAdd);
        if (isNaN(amount) || amount <= 0) return alert("Please enter a valid amount!");

        const amountInTL = amount / currencyRate;

        try {
            const res = await api.put(`/users/add-balance?username=${user.username}&amount=${amountInTL}`);
            setBalance(res.data);
            localStorage.setItem('user', JSON.stringify({ ...user, balance: res.data }));
            setIsModalOpen(false); setAmountToAdd('');
            alert(`${amount} ${currencySymbol} successfully added to your balance.`);
        } catch (e) { alert("Failed to add funds! An error occurred."); }
    };

    const getSortIndicator = (field: string) => {
        const dir = sorts[field];
        if (dir === 'asc') return '↑';
        if (dir === 'desc') return '↓';
        return '↕';
    };

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
                        className="nav-item active"
                        style={{...navItemStyle, cursor: 'pointer', justifyContent: 'space-between', color: '#000'}}
                        onClick={() => setIsCollectionOpen(!isCollectionOpen)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Car size={22}/> MY COLLECTION</div>
                        {isCollectionOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>

                    {isCollectionOpen && (
                        <div style={{ paddingLeft: '20px', display:'flex', flexDirection:'column', gap:'5px' }}>
                            <Link to="/my-collection" style={{...subLinkStyle, fontWeight: 900, color: '#000'}}>• MY CARS</Link>

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
                            <Link to="/profile" style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textDecoration: 'none', cursor: 'pointer' }}>
                                USERNAME: {user.username?.toUpperCase()}
                            </Link>                            {(isAdmin || isModerator) && (
                                <div style={{ background: '#f39c12', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #d35400' }}>
                                    <ShieldCheck size={12} /> {isAdmin ? 'ADMIN' : 'MODERATOR'}
                                </div>
                            )}
                        </div>

                        <div style={{ background: '#1a1a1a', padding: '6px 15px', borderRadius: '8px', border: '1px solid #333', color: '#fff', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* 🔥 Bakiye Gösterimi Kura Göre Güncellendi */}
                            <span>BALANCE: {currencySymbol} {(balance * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            <div onClick={() => setIsModalOpen(true)} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '1px 5px', cursor: 'pointer', display:'flex', alignItems:'center' }}>
                                <Plus size={12}/>
                            </div>
                        </div>
                    </div>

                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>MY PRIVATE GARAGE</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                        {/* ✅ HEADER'A PARA BİRİMİ SEÇİCİSİ EKLENDİ */}
                        <CurrencySelector onCurrencyChange={handleCurrencyChange} />

                        <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            LOGOUT <LogOut size={16}/>
                        </div>
                    </div>
                </header>

                <div className="scrollable-area" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>

                    <div style={{ background: '#000', padding: '25px', borderRadius: '20px', marginBottom: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 200px', gap: '20px', marginBottom: '20px' }}>
                            <div><label style={labelStyle}>MANUFACTURER</label><input name="manufacturer" value={filters.manufacturer} onChange={handleFilterChange} placeholder="Search My Brands..." style={inputStyle} /></div>
                            <div><label style={labelStyle}>MODEL</label><input name="model" value={filters.model} onChange={handleFilterChange} placeholder="Search My Models..." style={inputStyle} /></div>
                            <div><label style={labelStyle}>COLOR</label><input name="color" value={filters.color} onChange={handleFilterChange} placeholder="Color..." style={inputStyle} /></div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button onClick={() => {setFilters(initialFilters); setSorts({});}} style={secondaryBtnStyle}><RotateCcw size={16} /> RESET GARAGE</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={fetchMyCars} disabled={loading} style={{ ...primaryBtnStyle, width: '200px', opacity: loading ? 0.7 : 1 }}>
                                {loading ? 'SCANNING...' : <><Search size={18} /> SCAN GARAGE</>}
                            </button>
                        </div>
                    </div>

                    <div className="table-area" style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
                                <th onClick={() => handleSort('manufacturer')} style={{ padding: '20px', cursor:'pointer' }}>MANUFACTURER {getSortIndicator('manufacturer')}</th>
                                <th onClick={() => handleSort('model')} style={{ padding: '20px', cursor:'pointer' }}>MODEL {getSortIndicator('model')}</th>
                                <th onClick={() => handleSort('year')} style={{ padding: '20px', cursor:'pointer' }}>YEAR {getSortIndicator('year')}</th>
                                <th onClick={() => handleSort('price')} style={{ padding: '20px', cursor:'pointer' }}>PRICE {getSortIndicator('price')}</th>
                                <th onClick={() => handleSort('color')} style={{ padding: '20px', cursor:'pointer' }}>COLOR {getSortIndicator('color')}</th>
                                <th style={{ padding: '20px' }}>ACTION</th>
                            </tr>
                            </thead>
                            <tbody>
                            {myCars.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '50px', textAlign: 'center', fontWeight: 900, color: '#ccc' }}>NO VEHICLES IN YOUR GARAGE</td></tr>
                            ) : myCars.map((car: any) => (
                                <tr key={car.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                    <td style={{ padding: '20px', fontWeight: 900, fontSize: '18px' }}>{car.manufacturer}</td>
                                    <td style={{ padding: '20px', color: '#666' }}>{car.model}</td>
                                    <td style={{ padding: '20px', fontWeight: 700 }}>{car.year}</td>

                                    {/* 🔥 FİYAT GÖSTERİMİ KURA GÖRE GÜNCELLENDİ */}
                                    <td style={{ padding: '20px', fontWeight: 900, fontSize: '18px' }}>
                                        {currencySymbol} {(car.price * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>

                                    <td style={{ padding: '20px', color: '#666', fontWeight: 700 }}>{car.color?.toUpperCase()}</td>
                                    <td style={{ padding: '20px' }}>
                                        <button style={{ background: '#e63946', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 900, fontSize: '11px' }} onClick={() => handleSellCar(car.id, car.price)}>SELL</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <footer style={{
                    background: '#000', padding: '15px 30px', flexShrink: 0,
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', color: '#fff', borderTop: '1px solid #333', zIndex: 10
                }}>
                    <div style={{ fontSize: '11px', fontWeight: 900 }}>
                        SHOWING PAGE {filters.page + 1} OF {totalPages || 1}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => filters.page > 0 && setFilters(p => ({ ...p, page: p.page - 1 }))} disabled={filters.page === 0} style={{ ...pBtnStyle, opacity: filters.page === 0 ? 0.3 : 1 }}>
                            <ChevronLeft size={18} /> PREVIOUS
                        </button>
                        <button onClick={() => filters.page < totalPages - 1 && setFilters(p => ({ ...p, page: p.page + 1 }))} disabled={filters.page >= totalPages - 1} style={{ ...pBtnStyle, opacity: filters.page >= totalPages - 1 ? 0.3 : 1 }}>
                            NEXT <ChevronRight size={18} />
                        </button>
                    </div>
                </footer>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#000', padding: '40px', borderRadius: '30px', border: '1px solid #333', width: '400px', textAlign: 'center' }}>
                        <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 900, marginBottom: '30px', fontStyle: 'italic' }}>ADD FUNDS</h2>
                        <input type="number" placeholder={`Amount (${currencySymbol})`} value={amountToAdd} onChange={(e) => setAmountToAdd(e.target.value)} style={inputStyle} />
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button onClick={handleAddFunds} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#fff', color: '#000', fontWeight: 900, cursor: 'pointer', border: 'none' }}>CONFIRM</button>
                            <button onClick={() => { setIsModalOpen(false); setAmountToAdd(''); }} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: '#222', color: '#fff', fontWeight: 900, cursor: 'pointer', border: 'none' }}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const sidebarStyle = { width: '260px', background: '#fff', color: '#000', display: 'flex', flexDirection: 'column', borderRight: '1px solid #eee' };
const navItemStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', color: '#333', textDecoration: 'none', fontSize: '13px', fontWeight: 700, borderRadius: '10px', marginBottom: '5px' };
const subLinkStyle = { display: 'block', padding: '8px 10px', color: '#666', textDecoration: 'none', fontSize: '12px', fontWeight: 600, marginBottom: '2px' };
const moderatorBtnStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '10px', background: 'transparent', color: '#000', fontSize: '13px', fontWeight: 900, marginTop: '20px', textDecoration: 'none', cursor: 'pointer' };
const headerStyle = { background: '#000', padding: '0 30px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #333', flexShrink: 0 };
const labelStyle = { color: '#fff', fontSize: '10px', fontWeight: 900, display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 700, fontSize: '14px' };
const primaryBtnStyle = { background: '#fff', color: '#000', border: 'none', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const secondaryBtnStyle = { background: '#222', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const pBtnStyle = { background: '#fff', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontWeight: 900, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' };

export default MyCollection;