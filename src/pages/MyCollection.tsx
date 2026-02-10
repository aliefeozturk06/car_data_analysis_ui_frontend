import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import { Home, Car, LogOut, Menu, Plus, Search, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

const MyCollection = () => {
    const [myCars, setMyCars] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);

    // 🛠️ ANALİZ VE SAYFALAMA STATE (HomePage ile Birebir Aynı)
    const initialFilters = {
        page: 0, size: 10,
        manufacturer: '', model: '', minYear: '', maxYear: '',
        color: '', priceMin: '', priceMax: ''
    };
    const [filters, setFilters] = useState(initialFilters);
    const [sorts, setSorts] = useState<Record<string, 'asc' | 'desc' | null>>({});

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [balance, setBalance] = useState(user.balance || 0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState('');

    // SADECE SENİN ARABALARINI ÇEKEN FETCH FONKSİYONU
    const fetchMyCars = useCallback(async () => {
        setLoading(true);
        const sortParams = Object.entries(sorts)
            .filter(([_, dir]) => dir !== null)
            .map(([field, dir]) => `${field},${dir}`);

        try {
            // Backend endpoint: /purchase/my-cars
            const res = await api.get('/purchase/my-cars', {
                params: { ...filters, username: user.username, sort: sortParams }
            });
            setMyCars(res.data.cars || []);
            setTotalPages(res.data.totalPages || 0);
        } catch (e) {
            console.error("Garaj verisi çekilemedi!", e);
        } finally {
            setLoading(false);
        }
    }, [filters, sorts, user.username]);

    useEffect(() => {
        fetchMyCars();
    }, [filters.page, sorts, fetchMyCars]);

    // ARABA SATMA FONKSİYONU (Buy'ın Tersi)
    const handleSellCar = async (carId: number, carPrice: number) => {
        if (!window.confirm("Bu canavarı satmak istediğine emin misin?")) return;
        try {
            await api.post(`/purchase/sell?username=${user.username}&carId=${carId}`);
            const newBalance = balance + carPrice; // Satınca para gelir
            setBalance(newBalance);
            localStorage.setItem('user', JSON.stringify({ ...user, balance: newBalance }));
            alert("Araç başarıyla satıldı, para hesabına geçti!");
            fetchMyCars();
        } catch (e) { alert("Satış işlemi başarısız."); }
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
        if (isNaN(amount) || amount <= 0) return alert("Miktar gir!");
        try {
            const res = await api.put(`/users/add-balance?username=${user.username}&amount=${amount}`);
            setBalance(res.data);
            localStorage.setItem('user', JSON.stringify({ ...user, balance: res.data }));
            setIsModalOpen(false); setAmountToAdd('');
        } catch (e) { alert("Hata!"); }
    };

    const getSortIndicator = (field: string) => {
        const dir = sorts[field];
        if (dir === 'asc') return '↑';
        if (dir === 'desc') return '↓';
        return '↕';
    };

    return (
        <div className="app-wrapper" style={{ height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
            {/* SİDEBAR (Aynısı, My Collection Aktif) */}
            <aside className={`sidebar ${!isSidebarOpen ? 'closed' : ''}`}>
                <nav style={{ marginTop: '50px' }}>
                    <Link to="/" className="nav-item"><Home size={22}/> HOME PAGE</Link>
                    <Link to="/my-collection" className="nav-item active"><Car size={22}/> MY COLLECTION</Link>
                </nav>
            </aside>

            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                {/* 1. HEADER (SABİT - HomePage ile Birebir) */}
                <header className="top-header" style={{ flexShrink: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Menu onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ cursor: 'pointer' }} size={24} />
                        <div style={{ fontSize: '12px', fontWeight: 800 }}>USERNAME: {user.username?.toUpperCase()}</div>
                        <div style={{ background: '#1a1a1a', padding: '6px 15px', borderRadius: '8px', border: '1px solid #333', color: '#fff', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>BALANCE: ${balance.toLocaleString()}</span>
                            <button onClick={() => setIsModalOpen(true)} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '1px 5px', cursor: 'pointer' }}><Plus size={14}/></button>
                        </div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic' }}>MY PRIVATE GARAJE</div>
                    <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#666' }}>LOGOUT <LogOut size={16}/></div>
                </header>

                {/* 2. ORTA KISIM (SCROLLABLE) */}
                <div className="scrollable-area" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>

                    {/* FİLTRE PANELİ (Kendi garajında analiz yapman için korundu) */}
                    <div style={{ background: '#000', padding: '25px', borderRadius: '20px', marginBottom: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 200px', gap: '20px', marginBottom: '20px' }}>
                            <div><label style={labelStyle}>MANUFACTURER</label><input name="manufacturer" value={filters.manufacturer} onChange={handleFilterChange} placeholder="Search My Brands..." style={inputStyle} /></div>
                            <div><label style={labelStyle}>MODEL</label><input name="model" value={filters.model} onChange={handleFilterChange} placeholder="Search My Models..." style={inputStyle} /></div>
                            <div><label style={labelStyle}>COLOR</label><input name="color" value={filters.color} onChange={handleFilterChange} placeholder="Color..." style={inputStyle} /></div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button onClick={() => {setFilters(initialFilters); setSorts({});}} style={secondaryBtnStyle}><RotateCcw size={16} /> RESET GARAJE</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={fetchMyCars} disabled={loading} style={{ ...primaryBtnStyle, width: '200px' }}>
                                {loading ? 'SCANNING...' : <><Search size={18} /> SCAN GARAJE</>}
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
                                <tr><td colSpan={6} style={{ padding: '50px', textAlign: 'center', fontWeight: 900, color: '#ccc' }}>NO VEHICLES IN YOUR GARAJE</td></tr>
                            ) : myCars.map((car: any) => (
                                <tr key={car.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                    <td style={{ padding: '20px', fontWeight: 900, fontSize: '18px' }}>{car.manufacturer}</td>
                                    <td style={{ padding: '20px', color: '#666' }}>{car.model}</td>
                                    <td style={{ padding: '20px', fontWeight: 700 }}>{car.year}</td>
                                    <td style={{ padding: '20px', fontWeight: 900, fontSize: '18px' }}>${car.price.toLocaleString()}</td>
                                    <td style={{ padding: '20px', color: '#666', fontWeight: 700 }}>{car.color?.toUpperCase()}</td>
                                    <td style={{ padding: '20px' }}>
                                        <button className="auth-button" style={{ padding: '8px 20px', fontSize: '11px', width: 'auto', backgroundColor: '#f00' }} onClick={() => handleSellCar(car.id, car.price)}>SELL</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. FOOTER (SABİT - HomePage ile Birebir) */}
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

            {/* Bakiye Modal (HomePage ile Birebir) */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#000', padding: '40px', borderRadius: '30px', border: '1px solid #333', width: '400px', textAlign: 'center' }}>
                        <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 900, marginBottom: '30px', fontStyle: 'italic' }}>ADD FUNDS</h2>
                        <input type="number" placeholder="Amount ($)" value={amountToAdd} onChange={(e) => setAmountToAdd(e.target.value)} style={inputStyle} />
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

// --- STYLES (HomePage ile Birebir Aynı) ---
const labelStyle = { color: '#fff', fontSize: '10px', fontWeight: 900, display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 700, fontSize: '14px' };
const primaryBtnStyle = { background: '#fff', color: '#000', border: 'none', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const secondaryBtnStyle = { background: '#222', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const pBtnStyle = { background: '#fff', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontWeight: 900, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' };

export default MyCollection;