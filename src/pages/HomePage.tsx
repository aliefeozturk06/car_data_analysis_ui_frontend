import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import CurrencySelector from '../components/CurrencySelector'; // ✅ 1. IMPORT EKLENDİ
import {
    Home, Car, LogOut, Menu, Plus, Search, RotateCcw,
    ChevronLeft, ChevronRight, X, ShieldCheck, ChevronUp, ChevronDown
} from 'lucide-react';

const HomePage = () => {
    const [cars, setCars] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);
    const [loading, setLoading] = useState(false);

    // ✅ 2. PARA BİRİMİ STATE'LERİ EKLENDİ
    const [currencyRate, setCurrencyRate] = useState(parseFloat(localStorage.getItem('currencyRate') || "1"));
    const [currencySymbol, setCurrencySymbol] = useState(localStorage.getItem('currencySymbol') || "₺");

    // ✅ 3. PARA BİRİMİ DEĞİŞTİRME FONKSİYONU EKLENDİ
    const handleCurrencyChange = (rate: number, symbol: string) => {
        setCurrencyRate(rate);
        setCurrencySymbol(symbol);
    };

    // 🛠️ FİLTRE STATE
    const initialFilters = {
        page: 0, size: 10,
        manufacturer: '', model: '',
        minYear: '', maxYear: '',
        color: '',
        minPrice: '', maxPrice: ''
    };
    const [filters, setFilters] = useState(initialFilters);

    // Multi-Sort State
    const [sorts, setSorts] = useState<Record<string, 'asc' | 'desc' | null>>({});

    // 🛡️ KULLANICI BİLGİLERİ
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};
    const [balance, setBalance] = useState(user.balance || 0);

    // ROL KONTROLLERİ
    const isModerator = user.role === 'ROLE_MODERATOR' || (user.role && user.role.includes("MODERATOR"));

    // MODAL STATES
    const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState('');

    const [newCar, setNewCar] = useState({
        manufacturer: '', model: '', year: 2024, price: 0, color: '', mileage: 0
    });

    // 📡 VERİ ÇEKME FONKSİYONU (GÜNCELLENDİ)
    const fetchCars = useCallback(async () => {
        setLoading(true);

        const sortParams = Object.entries(sorts)
            .filter(([_, dir]) => dir !== null)
            .map(([field, dir]) => `${field},${dir}`);

        // 🔥 FİLTRE DÜZELTMESİ: Girilen parayı TL'ye çevirip gönderiyoruz
        // Örn: Dolar seçiliyken 100 yazıldıysa -> 100 / 0.03 = 3333 TL olarak aranır.
        const searchFilters = {
            ...filters,
            minPrice: filters.minPrice ? Math.floor(Number(filters.minPrice) / currencyRate) : '',
            maxPrice: filters.maxPrice ? Math.floor(Number(filters.maxPrice) / currencyRate) : ''
        };

        try {
            const res = await api.get('/cars', {
                params: { ...searchFilters, sort: sortParams }, // filters yerine searchFilters kullanıldı
                paramsSerializer: { indexes: null }
            });
            setCars(res.data.cars || []);
            setTotalPages(res.data.totalPages || 0);
        } catch (e) {
            console.error("Analiz Hatası!", e);
        } finally {
            setLoading(false);
        }
    }, [filters, sorts, currencyRate]); // ⚠️ currencyRate dependency'e eklendi

    useEffect(() => {
        fetchCars();
    }, [filters.page, sorts, fetchCars]);

    // SAYFALAMA
    const handlePrevPage = () => filters.page > 0 && setFilters(p => ({ ...p, page: p.page - 1 }));
    const handleNextPage = () => filters.page < totalPages - 1 && setFilters(p => ({ ...p, page: p.page + 1 }));

    // SIRALAMA MANTIĞI
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

    const handleReset = () => {
        setFilters(initialFilters);
        setSorts({});
    };

    // 💰 SATIN ALMA İŞLEMİ
    const handleBuyCar = async (carId: number, carPrice: number) => {
        if (balance < carPrice) return alert("Yetersiz bakiye! Lütfen para yükleyin.");
        if (!window.confirm("Bu aracı koleksiyonunuza katmak üzeresiniz. Onaylıyor musunuz?")) return;

        try {
            await api.post(`/purchase/buy?username=${user.username}&carId=${carId}`);
            const newBalance = balance - carPrice;
            setBalance(newBalance);
            localStorage.setItem('user', JSON.stringify({ ...user, balance: newBalance }));
            alert("Tebrikler! Araç artık sizin.");
            fetchCars();
        } catch (e) {
            alert("Satın alma işlemi başarısız oldu. Araç satılmış olabilir.");
        }
    };

    const handleAddFunds = async () => {
        const amount = parseFloat(amountToAdd);
        if (isNaN(amount) || amount <= 0) return alert("Geçerli bir miktar giriniz!");

        const amountInTL = amount / currencyRate;

        try {
            const res = await api.put(`/users/add-balance?username=${user.username}&amount=${amountInTL}`);
            setBalance(res.data);
            localStorage.setItem('user', JSON.stringify({ ...user, balance: res.data }));
            setIsFundsModalOpen(false);
            setAmountToAdd('');
            alert(`${amount} ${currencySymbol} başarıyla yüklendi.`);
        } catch (e) { alert("Para yükleme başarısız!"); }
    };

    // 🚗 YENİ ARAÇ EKLEME (GÜNCELLENDİ)
    const handleAddNewCar = async () => {
        try {
            // 🛡️ KUR DÜZELTMESİ: Girilen fiyatı TL'ye çevirip öyle kaydediyoruz
            const carToPost = {
                ...newCar,
                price: Math.floor(newCar.price / currencyRate)
            };

            await api.post(`/cars?username=${user.username}`, carToPost);
            alert("Yeni araç sisteme başarıyla eklendi!");
            setIsAddModalOpen(false);
            fetchCars();
        } catch (e) { alert("Araç eklenirken hata oluştu!"); }
    };

    const getSortIndicator = (field: string) => {
        const dir = sorts[field];
        if (dir === 'asc') return '↑';
        if (dir === 'desc') return '↓';
        return '↕';
    };

    return (
        <div className="app-wrapper" style={{ height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: '#f5f5f5', fontFamily: "'Inter', sans-serif" }}>

            {/* 🛡️ SIDEBAR (DİNAMİK AÇILIR/KAPANIR YAPILDI) */}
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
                {/* İçerik genişliğini sabitledik ki kapanırken yazılar kaymasın */}
                <nav style={{ marginTop: '50px', padding: '0 15px', minWidth: '260px' }}>

                    {/* 1. HOME PAGE */}
                    <Link to="/" className="nav-item active" style={navItemStyle}><Home size={22}/> HOME PAGE</Link>

                    {/* 2. MY COLLECTION (Açılır Menü) */}
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
                            {/* Herkes görür */}
                            <Link to="/my-cars" style={subLinkStyle}>• MY CARS</Link>

                            {/* ⚠️ SADECE USER BURADA GÖRÜR ⚠️ */}
                            {!isModerator && (
                                <Link to="/approval-waiting" style={subLinkStyle}>• APPROVAL WAITING</Link>
                            )}

                            {/* Herkes görür */}
                            <Link to="/for-sale" style={subLinkStyle}>• FOR SALE</Link>
                            <Link to="/sold" style={subLinkStyle}>• SOLD</Link>
                        </div>
                    )}

                    {/* ⚠️ SADECE MODERATOR GÖRÜR - ARKA PLANSIZ, SADE VE ŞIK ⚠️ */}
                    {isModerator && (
                        <Link to="/approval-requests" style={activeModeratorLinkStyle}>
                            <ShieldCheck size={22}/> APPROVAL REQUESTS
                        </Link>
                    )}

                </nav>
            </aside>

            {/* 🛡️ ANA İÇERİK */}
            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                {/* 🔥 HEADER (SİYAH TASARIM) 🔥 */}
                <header className="top-header" style={headerStyle}>
                    {/* SOL KISIM */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Menu onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ cursor: 'pointer', color: '#fff' }} size={24} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>USERNAME: {user.username?.toUpperCase()}</div>
                            {isModerator && (
                                <div style={{ background: '#f39c12', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #d35400' }}>
                                    <ShieldCheck size={12} /> MODERATOR
                                </div>
                            )}
                        </div>

                        <div style={{ background: '#1a1a1a', padding: '6px 15px', borderRadius: '8px', border: '1px solid #333', color: '#fff', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {/* Bakiyeyi kura göre güncelleme */}
                            <span>BALANCE: {currencySymbol} {(balance * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            <div onClick={() => setIsFundsModalOpen(true)} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '1px 5px', cursor: 'pointer', display:'flex', alignItems:'center' }}>
                                <Plus size={12}/>
                            </div>
                        </div>
                    </div>

                    {/* ORTA KISIM */}
                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>CAR DATA ANALYSIS</div>

                    {/* SAĞ KISIM */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>

                        {/* ✅ 4. HEADER'A PARA BİRİMİ SEÇİCİSİ EKLENDİ */}
                        <CurrencySelector onCurrencyChange={handleCurrencyChange} />

                        <div onClick={() => setIsAddModalOpen(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '11px', color: '#fff' }}>
                            <Plus size={16}/> ADD CAR
                        </div>
                        <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#999', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            LOGOUT <LogOut size={16}/>
                        </div>
                    </div>
                </header>

                {/* İÇERİK (FİLTRELER VE TABLO) */}
                <div className="scrollable-area" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>

                    {/* FİLTRELER */}
                    <div style={{ background: '#000', padding: '25px', borderRadius: '20px', marginBottom: '30px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) 200px', gap: '20px', marginBottom: '20px' }}>
                            <div><label style={labelStyle}>MANUFACTURER</label><input name="manufacturer" value={filters.manufacturer} onChange={handleFilterChange} placeholder="BMW..." style={inputStyle} /></div>
                            <div><label style={labelStyle}>MODEL</label><input name="model" value={filters.model} onChange={handleFilterChange} placeholder="M3..." style={inputStyle} /></div>
                            <div><label style={labelStyle}>COLOR</label><input name="color" value={filters.color} onChange={handleFilterChange} placeholder="Red..." style={inputStyle} /></div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button onClick={handleReset} style={secondaryBtnStyle}><RotateCcw size={16} /> RESET</button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 200px', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{flex: 1}}><label style={labelStyle}>YEAR (MIN)</label><input name="minYear" value={filters.minYear} onChange={handleFilterChange} placeholder="2010" style={inputStyle} /></div>
                                <div style={{flex: 1}}><label style={labelStyle}>YEAR (MAX)</label><input name="maxYear" value={filters.maxYear} onChange={handleFilterChange} placeholder="2024" style={inputStyle} /></div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{flex: 1}}><label style={labelStyle}>PRICE MIN ({currencySymbol})</label><input name="minPrice" value={filters.minPrice} onChange={handleFilterChange} placeholder="0" style={inputStyle} /></div>
                                <div style={{flex: 1}}><label style={labelStyle}>PRICE MAX ({currencySymbol})</label><input name="maxPrice" value={filters.maxPrice} onChange={handleFilterChange} placeholder="1000000" style={inputStyle} /></div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button onClick={fetchCars} disabled={loading} style={{ ...primaryBtnStyle, opacity: loading ? 0.7 : 1 }}>
                                    {loading ? 'ANALYZING...' : <><Search size={18} /> APPLY ANALYSIS</>}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* TABLO */}
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
                            {cars.map((car: any) => (
                                <tr key={car.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                    <td style={{ padding: '20px', fontWeight: 900, fontSize: '18px' }}>{car.manufacturer}</td>
                                    <td style={{ padding: '20px', color: '#666' }}>{car.model}</td>
                                    <td style={{ padding: '20px', fontWeight: 700 }}>{car.year}</td>

                                    {/* ✅ 5. FİYAT GÖSTERİMİ GÜNCELLENDİ (ÇARPIM İŞLEMİ) */}
                                    <td style={{ padding: '20px', fontWeight: 900, fontSize: '18px' }}>
                                        {currencySymbol} {(car.price * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>

                                    <td style={{ padding: '20px', color: '#666', fontWeight: 700 }}>{car.color?.toUpperCase()}</td>
                                    <td style={{ padding: '20px' }}>
                                        <button className="auth-button" style={{ padding: '8px 20px', fontSize: '11px', width: 'auto' }} onClick={() => handleBuyCar(car.id, car.price)}>BUY</button>
                                    </td>
                                </tr>
                            ))}
                            {cars.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#999', fontWeight: 700 }}>NO CARS FOUND FOR SALE.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER */}
                <footer style={{ background: '#000', padding: '15px 30px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff', borderTop: '1px solid #333', zIndex: 10 }}>
                    <div style={{ fontSize: '11px', fontWeight: 900 }}>SHOWING PAGE {filters.page + 1} OF {totalPages || 1}</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handlePrevPage} disabled={filters.page === 0} style={{ ...pBtnStyle, opacity: filters.page === 0 ? 0.3 : 1 }}><ChevronLeft size={18} /> PREVIOUS</button>
                        <button onClick={handleNextPage} disabled={filters.page >= totalPages - 1} style={{ ...pBtnStyle, opacity: filters.page >= totalPages - 1 ? 0.3 : 1 }}>NEXT <ChevronRight size={18} /></button>
                    </div>
                </footer>
            </div>

            {/* MODALLAR AYNEN KORUNDU */}
            {isAddModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#000', padding: '40px', borderRadius: '30px', border: '1px solid #333', width: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 900, fontStyle: 'italic', margin: 0 }}>ADD NEW VEHICLE</h2>
                            <X onClick={() => setIsAddModalOpen(false)} style={{ color: '#fff', cursor: 'pointer' }} size={24} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div><label style={labelStyle}>MANUFACTURER</label><input style={inputStyle} value={newCar.manufacturer} onChange={(e) => setNewCar({...newCar, manufacturer: e.target.value})} placeholder="e.g. Porsche" /></div>
                            <div><label style={labelStyle}>MODEL</label><input style={inputStyle} value={newCar.model} onChange={(e) => setNewCar({...newCar, model: e.target.value})} placeholder="e.g. 911 GT3" /></div>
                            <div><label style={labelStyle}>YEAR</label><input style={inputStyle} type="number" value={newCar.year} onChange={(e) => setNewCar({...newCar, year: parseInt(e.target.value)})} /></div>
                            <div><label style={labelStyle}>COLOR</label><input style={inputStyle} value={newCar.color} onChange={(e) => setNewCar({...newCar, color: e.target.value})} placeholder="e.g. Shark Blue" /></div>
                            <div><label style={labelStyle}>MILEAGE</label><input style={inputStyle} type="number" value={newCar.mileage} onChange={(e) => setNewCar({...newCar, mileage: parseInt(e.target.value)})} /></div>

                            {/* 🔥 LABEL GÜNCELLENDİ: Para Birimi Simgesi Eklendi */}
                            <div><label style={labelStyle}>PRICE ({currencySymbol})</label><input style={inputStyle} type="number" value={newCar.price} onChange={(e) => setNewCar({...newCar, price: parseInt(e.target.value)})} /></div>
                        </div>
                        <button onClick={handleAddNewCar} style={{ width: '100%', padding: '18px', borderRadius: '15px', background: '#fff', color: '#000', fontWeight: 900, cursor: 'pointer', border: 'none', marginTop: '30px' }}>CONFIRM AND ADD</button>
                    </div>
                </div>
            )}

            {isFundsModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#000', padding: '40px', borderRadius: '30px', border: '1px solid #333', width: '400px', textAlign: 'center' }}>
                        <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 900, marginBottom: '30px', fontStyle: 'italic' }}>ADD FUNDS</h2>
                        {/* ✅ PLACEHOLDER GÜNCELLENDİ */}
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

// 🔥 MODERATOR BUTONU (DİĞERLERİ GİBİ SADE) 🔥
const activeModeratorLinkStyle = {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 15px',
    borderRadius: '10px',
    background: 'transparent', // ŞEFFAF
    color: '#000', // SİYAH YAZI
    fontSize: '13px', fontWeight: 900,
    marginTop: '20px',
    textDecoration: 'none',
    cursor: 'pointer'
};

// 🔥 SİYAH HEADER STİLİ 🔥
const headerStyle = {
    background: '#000', // Siyah Arka Plan
    padding: '0 30px',
    height: '70px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #333',
    flexShrink: 0
};

const labelStyle = { color: '#fff', fontSize: '10px', fontWeight: 900, display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 700, fontSize: '14px' };
const primaryBtnStyle = { background: '#fff', color: '#000', border: 'none', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const secondaryBtnStyle = { background: '#222', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const pBtnStyle = { background: '#fff', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontWeight: 900, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' };

export default HomePage;