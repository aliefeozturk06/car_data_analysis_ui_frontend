import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import { Home, Car, LogOut, Menu, Plus, Search, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ShieldCheck, RefreshCw, XCircle, DollarSign, Clock, X } from 'lucide-react';

const MyCars = () => {
    // Veri State'leri
    const [myCars, setMyCars] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    // UI State'leri
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);

    // Filtre ve Sıralama
    const initialFilters = {
        page: 0, size: 10,
        manufacturer: '', model: '', minYear: '', maxYear: '',
        color: '', priceMin: '', priceMax: ''
    };
    const [filters, setFilters] = useState(initialFilters);
    const [sorts, setSorts] = useState<Record<string, 'asc' | 'desc' | null>>({});

    // Kullanıcı
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};
    const [balance, setBalance] = useState(user.balance || 0);

    // Rol Kontrolü
    const isUser = user.role && (user.role === "ROLE_USER" || JSON.stringify(user.role).includes("USER"));
    const isModerator = user.role === "ROLE_MODERATOR" || (user.role && user.role.includes("MODERATOR"));

    // Modallar
    const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState('');

    // Formlar
    const [editingCar, setEditingCar] = useState<any>(null);
    const [updateForm, setUpdateForm] = useState({ price: 0, mileage: 0, color: '' });

    const [newCar, setNewCar] = useState({
        manufacturer: '', model: '', year: 2024, price: 0, color: '', mileage: 0
    });

    // 📡 VERİ ÇEKME
    const fetchMyCars = useCallback(async () => {
        setLoading(true);
        const sortParams = Object.entries(sorts)
            .filter(([_, dir]) => dir !== null)
            .map(([field, dir]) => `${field},${dir}`);

        try {
            const res = await api.get('/purchase/my-cars', {
                params: {
                    ...filters,
                    username: user.username,
                    status: 'ALL',
                    sort: sortParams
                },
                paramsSerializer: { indexes: null }
            });

            if (res.data && res.data.dtoList) {
                setMyCars(res.data.dtoList);
                setTotalPages(res.data.totalPages || 0);
            } else if (Array.isArray(res.data)) {
                setMyCars(res.data);
                setTotalPages(1);
            } else if (res.data && res.data.cars) {
                setMyCars(res.data.cars);
                setTotalPages(res.data.totalPages || 0);
            }
        } catch (e) {
            console.error("Garaj verisi çekilemedi!", e);
        } finally {
            setLoading(false);
        }
    }, [filters, sorts, user.username]);

    useEffect(() => {
        fetchMyCars();
    }, [filters.page, sorts, fetchMyCars]);

    // 💰 SATIŞA ÇIKAR
    const handleSellCar = async (carId: number) => {
        if (!window.confirm("Bu aracı vitrine koymak istediğine emin misin?")) return;
        try {
            await api.put(`/purchase/list-for-sale?username=${user.username}&carId=${carId}`);
            alert("Araç satışa çıkarıldı!");
            fetchMyCars();
        } catch (e) { alert("Satış işlemi başarısız."); }
    };

    // 🚫 SATIŞI İPTAL ET
    const handleCancelSale = async (carId: number) => {
        if (!window.confirm("Satışı iptal edip aracı garaja geri çekmek istiyor musun?")) return;
        try {
            await api.put(`/purchase/cancel-sale?username=${user.username}&carId=${carId}`);
            alert("Satış iptal edildi, araç garajında.");
            fetchMyCars();
        } catch (e) { alert("İptal işlemi başarısız."); }
    };

    const handleCancelRequest = async (carId: number) => {
        if (!window.confirm("Bekleyen güncelleme isteğini geri çekmek istiyor musun?")) return;
        try {
            await api.post(`/purchase/cancel-update-request?username=${user.username}&carId=${carId}`);
            alert("İstek iptal edildi.");
            fetchMyCars();
        } catch (e) { alert("İstek iptali başarısız!"); }
    };

    // 🚗 YENİ ARAÇ EKLE
    const handleAddNewCar = async () => {
        try {
            await api.post(`/cars?username=${user.username}`, newCar);
            alert("Yeni araç eklendi!");
            setIsAddModalOpen(false);
            fetchMyCars();
        } catch (e) { alert("Ekleme başarısız!"); }
    };

    // 🔧 GÜNCELLEME İSTEĞİ AÇ
    const handleUpdateOpen = (car: any) => {
        setEditingCar(car);
        setUpdateForm({
            price: car.price,
            mileage: car.mileage || 0,
            color: car.color
        });
        setIsUpdateModalOpen(true);
    };

    // 🔥🔥 GÜNCELLEME GÖNDER (DÜZELTİLMİŞ & GÜÇLENDİRİLMİŞ) 🔥🔥
    const handleUpdateSubmit = async () => {
        if (!editingCar) return;

        // 1. Veri Doğrulama (Validation)
        const priceVal = Number(updateForm.price);
        const mileageVal = Number(updateForm.mileage);

        if (priceVal < 0 || mileageVal < 0) {
            alert("Fiyat ve Kilometre 0'dan küçük olamaz!");
            return;
        }
        if (!updateForm.color || updateForm.color.trim() === "") {
            alert("Lütfen geçerli bir renk giriniz!");
            return;
        }

        try {
            // 2. Payload Hazırlama
            const payload = {
                carId: editingCar.id,
                username: user.username,
                newPrice: priceVal,
                newColor: updateForm.color,
                newMileage: mileageVal
            };

            console.log("📤 Gönderilen İstek:", payload); // Konsolda kontrol et

            // 3. İstek Gönderme
            const res = await api.post('/purchase/create-update-request', payload);

            // 4. Başarılı Sonuç
            console.log("✅ Sunucu Cevabı:", res.data);
            alert(res.data || "İstek başarıyla yöneticiye iletildi!");
            setIsUpdateModalOpen(false);
            fetchMyCars();

        } catch (e: any) {
            console.error("❌ Hata Detayı:", e);

            // 5. Gelişmiş Hata Mesajı Çıkarma
            let errorMessage = "Bilinmeyen bir hata oluştu.";

            if (e.response) {
                // Backend bir cevap döndü (400, 500 vb.)
                const data = e.response.data;
                const status = e.response.status;

                if (typeof data === 'string' && data.length > 0) {
                    errorMessage = data;
                } else if (typeof data === 'object' && data !== null) {
                    // { message: "..." } veya { error: "..." } formatını kontrol et
                    errorMessage = data.message || data.error || JSON.stringify(data);

                    // Eğer boş obje dönerse status kodunu göster
                    if (errorMessage === "{}") errorMessage = `Sunucu Hatası (Kod: ${status})`;
                } else {
                    errorMessage = `Sunucu Hatası (Kod: ${status})`;
                }
            } else if (e.request) {
                errorMessage = "Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.";
            } else {
                errorMessage = e.message;
            }

            alert(`⚠️ İŞLEM BAŞARISIZ!\n\nSebep: ${errorMessage}`);
        }
    };

    // 💵 PARA YÜKLE
    const handleAddFunds = async () => {
        const amount = parseFloat(amountToAdd);
        if (isNaN(amount) || amount <= 0) return alert("Miktar gir!");
        try {
            const res = await api.put(`/users/add-balance?username=${user.username}&amount=${amount}`);
            setBalance(res.data);
            localStorage.setItem('user', JSON.stringify({ ...user, balance: res.data }));
            setIsFundsModalOpen(false); setAmountToAdd('');
        } catch (e) { alert("Hata!"); }
    };

    // YARDIMCI FONKSİYONLAR
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

    const getSortIndicator = (field: string) => {
        const dir = sorts[field];
        if (dir === 'asc') return '↑';
        if (dir === 'desc') return '↓';
        return '↕';
    };

    return (
        <div className="app-wrapper" style={{ height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>

            {/* 🛡️ SIDEBAR (AÇILIR/KAPANIR) */}
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

                    {/* My Collection Menüsü */}
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
                            {/* MY CARS: ARKA PLANSIZ, SADECE BOLD */}
                            <Link to="/my-cars" style={{...subLinkStyle, fontWeight: 900, color: '#000'}}>• MY CARS</Link>

                            {isUser && <Link to="/approval-waiting" style={subLinkStyle}>• APPROVAL WAITING</Link>}
                            <Link to="/for-sale" style={subLinkStyle}>• FOR SALE</Link>
                            <Link to="/sold" style={subLinkStyle}>• SOLD</Link>
                        </div>
                    )}

                    {/* MODERATOR BUTONU */}
                    {isModerator && (
                        <Link to="/approval-requests" style={moderatorBtnStyle}>
                            <ShieldCheck size={22}/> APPROVAL REQUESTS
                        </Link>
                    )}
                </nav>
            </aside>

            {/* ANA İÇERİK */}
            <div className="main-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

                {/* HEADER */}
                <header className="top-header" style={{ flexShrink: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {/* Menü İkonu */}
                        <Menu onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ cursor: 'pointer' }} size={24} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800 }}>COLLECTION: {user.username?.toUpperCase()}</div>
                            {isModerator && (
                                <div style={{ background: '#f39c12', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #d35400' }}>
                                    <ShieldCheck size={12} /> MODERATOR
                                </div>
                            )}
                        </div>

                        <div style={{ background: '#1a1a1a', padding: '6px 15px', borderRadius: '8px', border: '1px solid #333', color: '#fff', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>BALANCE: ${balance.toLocaleString()}</span>
                            <button onClick={() => setIsFundsModalOpen(true)} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '1px 5px', cursor: 'pointer' }}><Plus size={14}/></button>
                        </div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic' }}>MY PRIVATE GARAGE</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div onClick={() => setIsAddModalOpen(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '11px', background: '#000', color: '#fff', padding: '8px 15px', borderRadius: '8px' }}>
                            <Plus size={16}/> ADD CAR
                        </div>
                        <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#666' }}>LOGOUT <LogOut size={16}/></div>
                    </div>
                </header>

                {/* SCROLLABLE AREA */}
                <div className="scrollable-area" style={{ flex: 1, overflowY: 'auto', padding: '30px' }}>

                    {/* FİLTRELER */}
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
                            <button onClick={fetchMyCars} disabled={loading} style={{ ...primaryBtnStyle, width: '200px' }}>
                                {loading ? 'SCANNING...' : <><Search size={18} /> SCAN GARAGE</>}
                            </button>
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
                                <th style={{ padding: '20px' }}>STATUS</th>
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
                                    <td style={{ padding: '20px', fontWeight: 900, fontSize: '18px' }}>${car.price.toLocaleString()}</td>

                                    {/* STATUS KOLONU */}
                                    <td style={{ padding: '20px' }}>
                                        <div style={{display:'flex', gap:'5px', flexDirection:'column'}}>
                                            <span style={{
                                                color: car.status === 'ON_SALE' ? '#666' : '#000',
                                                fontWeight: 900, fontSize: '10px',
                                                border: car.status === 'ON_SALE' ? '2px solid #ccc' : '2px solid #000',
                                                padding: '3px 8px', borderRadius: '4px', width:'fit-content',
                                                background: car.status === 'ON_SALE' ? '#f5f5f5' : 'transparent'
                                            }}>
                                                {car.status === 'ON_SALE' ? 'FOR SALE' : 'OWNED'}
                                            </span>
                                            {car.hasPendingUpdate && (
                                                <span style={{ color: '#e67e22', fontSize: '9px', fontWeight: 900, display:'flex', alignItems:'center', gap:'3px' }}>
                                                    <Clock size={10}/> UPDATE PENDING
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* ACTION KOLONU */}
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {car.hasPendingUpdate ? (
                                                <button onClick={() => handleCancelRequest(car.id)} style={{ ...btnStyle, background: '#e67e22', color: '#fff' }}>
                                                    <XCircle size={14}/> CANCEL REQ
                                                </button>
                                            ) : (
                                                <button onClick={() => handleUpdateOpen(car)} style={{ ...btnStyle, background: '#eee', color: '#000' }}>
                                                    <RefreshCw size={14}/> {isModerator ? 'EDIT' : 'REQUEST'}
                                                </button>
                                            )}
                                            {car.status === 'ON_SALE' ? (
                                                <button onClick={() => handleCancelSale(car.id)} style={{ ...btnStyle, background: '#e63946', color: '#fff' }}>
                                                    <XCircle size={14}/> CANCEL SALE
                                                </button>
                                            ) : (
                                                <button onClick={() => handleSellCar(car.id)} style={{ ...btnStyle, background: '#000', color: '#fff' }}>
                                                    <DollarSign size={14}/> SELL
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FOOTER */}
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

            {/* MODALLAR */}
            {isFundsModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalBoxStyle}>
                        <h2 style={modalTitleStyle}>ADD FUNDS</h2>
                        <input type="number" placeholder="Amount ($)" value={amountToAdd} onChange={(e) => setAmountToAdd(e.target.value)} style={inputStyle} />
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button onClick={handleAddFunds} style={{ ...primaryBtnStyle, flex: 1 }}>CONFIRM</button>
                            <button onClick={() => { setIsFundsModalOpen(false); setAmountToAdd(''); }} style={{ ...secondaryBtnStyle, flex: 1 }}>CANCEL</button>
                        </div>
                    </div>
                </div>
            )}

            {isAddModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalBoxStyle, width: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <h2 style={{ ...modalTitleStyle, marginBottom: 0 }}>ADD NEW VEHICLE</h2>
                            <X onClick={() => setIsAddModalOpen(false)} style={{ color: '#fff', cursor: 'pointer' }} size={24} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div><label style={labelStyle}>MANUFACTURER</label><input style={inputStyle} onChange={(e) => setNewCar({...newCar, manufacturer: e.target.value})} /></div>
                            <div><label style={labelStyle}>MODEL</label><input style={inputStyle} onChange={(e) => setNewCar({...newCar, model: e.target.value})} /></div>
                            <div><label style={labelStyle}>YEAR</label><input style={inputStyle} type="number" onChange={(e) => setNewCar({...newCar, year: parseInt(e.target.value)})} /></div>
                            <div><label style={labelStyle}>COLOR</label><input style={inputStyle} onChange={(e) => setNewCar({...newCar, color: e.target.value})} /></div>
                            <div><label style={labelStyle}>MILEAGE</label><input style={inputStyle} type="number" onChange={(e) => setNewCar({...newCar, mileage: parseInt(e.target.value)})} /></div>
                            <div><label style={labelStyle}>PRICE ($)</label><input style={inputStyle} type="number" onChange={(e) => setNewCar({...newCar, price: parseInt(e.target.value)})} /></div>
                        </div>
                        <button onClick={handleAddNewCar} style={{ ...primaryBtnStyle, marginTop: '30px' }}>CONFIRM AND ADD</button>
                    </div>
                </div>
            )}

            {/* 🔥 GÜNCELLENEN UPDATE MODAL (INPUTLAR SAYI OLMAZSA 0 OLSUN) 🔥 */}
            {isUpdateModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalBoxStyle, background: '#fff', border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ ...modalTitleStyle, color: '#000' }}>UPDATE VEHICLE</h2>
                            <X onClick={() => setIsUpdateModalOpen(false)} style={{ color: '#000', cursor: 'pointer' }} size={24} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* Color Input */}
                            <div>
                                <label style={{...labelStyle, color: '#000'}}>COLOR</label>
                                <input
                                    value={updateForm.color}
                                    onChange={(e) => setUpdateForm({...updateForm, color: e.target.value})}
                                    style={{...inputStyle, background: '#f5f5f5', border: '1px solid #ddd'}}
                                />
                            </div>

                            {/* Mileage Input: Boş string durumunu yönet */}
                            <div>
                                <label style={{...labelStyle, color: '#000'}}>MILEAGE</label>
                                <input
                                    type="number"
                                    value={updateForm.mileage}
                                    onChange={(e) => setUpdateForm({...updateForm, mileage: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                                    style={{...inputStyle, background: '#f5f5f5', border: '1px solid #ddd'}}
                                />
                            </div>

                            {/* Price Input: Boş string durumunu yönet */}
                            <div>
                                <label style={{...labelStyle, color: '#000'}}>PRICE</label>
                                <input
                                    type="number"
                                    value={updateForm.price}
                                    onChange={(e) => setUpdateForm({...updateForm, price: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                                    style={{...inputStyle, background: '#f5f5f5', border: '1px solid #ddd'}}
                                />
                            </div>

                            <button onClick={handleUpdateSubmit} style={{ ...primaryBtnStyle, background: '#000', color: '#fff', marginTop: '10px' }}>SEND REQUEST</button>
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

const moderatorBtnStyle = {
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '12px 15px',
    borderRadius: '10px',
    background: 'transparent', // ARKA PLAN YOK
    color: '#333', // DİĞERLERİYLE AYNI RENK
    textDecoration: 'none', fontSize: '13px', fontWeight: 700, // DİĞERLERİYLE AYNI FONT
    marginTop: '20px' // Sadece ayırmak için boşluk
};

const labelStyle = { color: '#fff', fontSize: '10px', fontWeight: 900, display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 700, fontSize: '14px' };
const primaryBtnStyle = { background: '#fff', color: '#000', border: 'none', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const secondaryBtnStyle = { background: '#222', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const pBtnStyle = { background: '#fff', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontWeight: 900, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' };
const btnStyle = { padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 900, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' };

// Modal Styles
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalBoxStyle: React.CSSProperties = { background: '#000', padding: '40px', borderRadius: '30px', border: '1px solid #333', width: '400px' };
const modalTitleStyle: React.CSSProperties = { color: '#fff', fontSize: '22px', fontWeight: 900, marginBottom: '30px', fontStyle: 'italic', margin: 0 };

export default MyCars;