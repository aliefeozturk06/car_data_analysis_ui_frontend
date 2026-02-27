import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { Link } from 'react-router-dom';
import CurrencySelector from '../components/CurrencySelector';
import { Home, Car, LogOut, Menu, Plus, Search, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ShieldCheck, RefreshCw, XCircle, DollarSign, Clock, X, Edit2, User } from 'lucide-react'; // User ikonu eklendi

const MyCars = () => {
    const [myCars, setMyCars] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);

    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isCollectionOpen, setIsCollectionOpen] = useState(true);

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

    const role = user.role || "";
    const isUser = role === "ROLE_USER" || JSON.stringify(role).includes("USER");
    const isAdmin = role === "ROLE_ADMIN" || JSON.stringify(role).includes("ADMIN");
    const isModerator = role === "ROLE_MODERATOR" || JSON.stringify(role).includes("MODERATOR");

    const [isFundsModalOpen, setIsFundsModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [amountToAdd, setAmountToAdd] = useState('');

    const [editingCar, setEditingCar] = useState<any>(null);
    const [updateForm, setUpdateForm] = useState({ price: 0, mileage: 0, color: '' });

    const [newCar, setNewCar] = useState({
        manufacturer: '', model: '', year: 2024, price: 0, color: '', mileage: 0
    });

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
                params: {
                    ...searchFilters,
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
            console.error("Failed to fetch garage data!", e);
        } finally {
            setLoading(false);
        }
    }, [filters, sorts, user.username, currencyRate]);

    useEffect(() => {
        fetchMyCars();
    }, [filters.page, sorts, fetchMyCars]);

    const handleSellCar = async (carId: number) => {
        if (!window.confirm("Are you sure you want to sell this car?")) return;
        try {
            await api.put(`/purchase/list-for-sale?username=${user.username}&carId=${carId}`);
            alert("The car is now on sale!");
            fetchMyCars();
        } catch (e) { alert("Failed to put the car on sale."); }
    };

    const handleCancelSale = async (carId: number) => {
        if (!window.confirm("Are you sure you want to cancel the sale and return the car to your garage?")) return;
        try {
            await api.put(`/purchase/cancel-sale?username=${user.username}&carId=${carId}`);
            alert("Sale canceled. The car is back in your garage.");
            fetchMyCars();
        } catch (e) { alert("Failed to cancel the sale."); }
    };

    const handleCancelRequest = async (carId: number) => {
        if (!window.confirm("Are you sure you want to cancel this waiting approval request?")) return;
        try {
            await api.post(`/purchase/cancel-update-request?username=${user.username}&carId=${carId}`);
            alert("Request successfully canceled.");
            fetchMyCars();
        } catch (e) { alert("Failed to cancel the request!"); }
    };

    const handleAddNewCar = async () => {
        try {
            const carToPost = {
                ...newCar,
                price: Math.floor(newCar.price / currencyRate)
            };
            await api.post(`/cars?username=${user.username}`, carToPost);
            alert("New car added successfully!");
            setIsAddModalOpen(false);
            fetchMyCars();
        } catch (e) { alert("Failed to add the new car!"); }
    };

    const handleUpdateOpen = (car: any) => {
        setEditingCar(car);
        setUpdateForm({
            price: Math.floor(car.price * currencyRate),
            mileage: car.mileage || 0,
            color: car.color
        });
        setIsUpdateModalOpen(true);
    };

    const handleUpdateSubmit = async () => {
        if (!editingCar) return;

        const priceVal = Number(updateForm.price);
        const mileageVal = Number(updateForm.mileage);

        if (priceVal < 0 || mileageVal < 0) {
            alert("Price and Mileage cannot be less than 0!");
            return;
        }
        if (!updateForm.color || updateForm.color.trim() === "") {
            alert("Please enter a valid color!");
            return;
        }

        try {
            const priceInTL = Math.floor(priceVal / currencyRate);
            const payload = {
                carId: editingCar.id,
                username: user.username,
                newPrice: priceInTL,
                newColor: updateForm.color,
                newMileage: mileageVal
            };

            const res = await api.post('/purchase/create-update-request', payload);

            alert(res.data);

            setIsUpdateModalOpen(false);
            fetchMyCars();

        } catch (e: any) {
            console.error("Error Detail:", e);
            let errorMessage = "An unknown error occurred.";
            if (e.response) {
                const data = e.response.data;
                const status = e.response.status;
                if (typeof data === 'string' && data.length > 0) {
                    errorMessage = data;
                } else if (typeof data === 'object' && data !== null) {
                    errorMessage = data.message || data.error || JSON.stringify(data);
                    if (errorMessage === "{}") errorMessage = `Server Error (Code: ${status})`;
                } else {
                    errorMessage = `Server Error (Code: ${status})`;
                }
            } else if (e.request) {
                errorMessage = "Server unreachable. Please check your network connection.";
            } else {
                errorMessage = e.message;
            }
            alert(`Process Unsuccessful!\n\nReason: ${errorMessage}`);
        }
    };

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
                    {/* 🔥 PROFILE ARTIK EN TEPEDE 🔥 */}
                    <Link to="/profile" className="nav-item" style={navItemStyle}>
                        <User size={22}/> PROFILE
                    </Link>

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
                            <Link to="/my-cars" style={{...subLinkStyle, fontWeight: 900, color: '#000'}}>• MY CARS</Link>

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
                <header className="top-header" style={{ flexShrink: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Menu onClick={() => setSidebarOpen(!isSidebarOpen)} style={{ cursor: 'pointer' }} size={24} />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Link to="/profile" style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textDecoration: 'none' }}>
                                COLLECTION: {user.username?.toUpperCase()}
                            </Link>
                            {(isAdmin || isModerator) && (
                                <div style={{ background: '#f39c12', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #d35400' }}>
                                    <ShieldCheck size={12} /> {isAdmin ? 'ADMIN' : 'MODERATOR'}
                                </div>
                            )}
                        </div>

                        <div style={{ background: '#1a1a1a', padding: '6px 15px', borderRadius: '8px', border: '1px solid #333', color: '#fff', fontSize: '13px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>BALANCE: {currencySymbol} {(balance * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            <button onClick={() => setIsFundsModalOpen(true)} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '1px 5px', cursor: 'pointer' }}><Plus size={14}/></button>
                        </div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 900, fontStyle: 'italic' }}>MY PRIVATE GARAGE</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <CurrencySelector onCurrencyChange={handleCurrencyChange} />
                        <div onClick={() => setIsAddModalOpen(true)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '11px', background: '#000', color: '#fff', padding: '8px 15px', borderRadius: '8px' }}>
                            <Plus size={16}/> ADD CAR
                        </div>
                        <div onClick={() => { localStorage.clear(); window.location.href='/login'; }} style={{ cursor: 'pointer', fontSize: '11px', fontWeight: 900, color: '#666' }}>LOGOUT <LogOut size={16}/></div>
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
                            <button onClick={fetchMyCars} disabled={loading} style={{ ...primaryBtnStyle, width: '200px' }}>
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
                                    <td style={{ padding: '20px', fontWeight: 900, fontSize: '18px' }}>
                                        {currencySymbol} {(car.price * currencyRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
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
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {car.hasPendingUpdate ? (
                                                <button onClick={() => handleCancelRequest(car.id)} style={{ ...btnStyle, background: '#e67e22', color: '#fff' }}>
                                                    <XCircle size={14}/> CANCEL REQ
                                                </button>
                                            ) : (
                                                <button onClick={() => handleUpdateOpen(car)} style={{ ...btnStyle, background: (isAdmin || isModerator) ? '#3498db' : '#eee', color: (isAdmin || isModerator) ? '#fff' : '#000' }}>
                                                    {(isAdmin || isModerator) ? <><Edit2 size={14}/> EDIT</> : <><RefreshCw size={14}/> REQUEST</>}
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

            {isFundsModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalBoxStyle}>
                        <h2 style={modalTitleStyle}>ADD FUNDS</h2>
                        <input type="number" placeholder={`Amount (${currencySymbol})`} value={amountToAdd} onChange={(e) => setAmountToAdd(e.target.value)} style={inputStyle} />
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
                            <div><label style={labelStyle}>PRICE ({currencySymbol})</label><input style={inputStyle} type="number" onChange={(e) => setNewCar({...newCar, price: parseInt(e.target.value)})} /></div>
                        </div>
                        <button onClick={handleAddNewCar} style={{ ...primaryBtnStyle, marginTop: '30px' }}>CONFIRM AND ADD</button>
                    </div>
                </div>
            )}

            {isUpdateModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={{ ...modalBoxStyle, background: '#fff', border: 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ ...modalTitleStyle, color: '#000' }}>
                                {(isAdmin || isModerator) ? 'EDIT VEHICLE' : 'UPDATE REQUEST'}
                            </h2>
                            <X onClick={() => setIsUpdateModalOpen(false)} style={{ color: '#000', cursor: 'pointer' }} size={24} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{...labelStyle, color: '#000'}}>COLOR</label>
                                <input
                                    value={updateForm.color}
                                    onChange={(e) => setUpdateForm({...updateForm, color: e.target.value})}
                                    style={{...inputStyle, background: '#f5f5f5', border: '1px solid #ddd'}}
                                />
                            </div>

                            <div>
                                <label style={{...labelStyle, color: '#000'}}>MILEAGE</label>
                                <input
                                    type="number"
                                    value={updateForm.mileage}
                                    onChange={(e) => setUpdateForm({...updateForm, mileage: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                                    style={{...inputStyle, background: '#f5f5f5', border: '1px solid #ddd'}}
                                />
                            </div>

                            <div>
                                <label style={{...labelStyle, color: '#000'}}>PRICE ({currencySymbol})</label>
                                <input
                                    type="number"
                                    value={updateForm.price}
                                    onChange={(e) => setUpdateForm({...updateForm, price: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                                    style={{...inputStyle, background: '#f5f5f5', border: '1px solid #ddd'}}
                                />
                            </div>

                            <button onClick={handleUpdateSubmit} style={{ ...primaryBtnStyle, background: (isAdmin || isModerator) ? '#3498db' : '#000', color: '#fff', marginTop: '10px' }}>
                                {(isAdmin || isModerator) ? 'SAVE CHANGES' : 'SEND REQUEST'}
                            </button>
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
const moderatorBtnStyle = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '10px', background: 'transparent', color: '#333', textDecoration: 'none', fontSize: '13px', fontWeight: 700, marginTop: '20px' };
const labelStyle = { color: '#fff', fontSize: '10px', fontWeight: 900, display: 'block', marginBottom: '8px' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 700, fontSize: '14px' };
const primaryBtnStyle = { background: '#fff', color: '#000', border: 'none', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const secondaryBtnStyle = { background: '#222', color: '#fff', border: 'none', borderRadius: '10px', padding: '12px', width: '100%', cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const pBtnStyle = { background: '#fff', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontWeight: 900, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' };
const btnStyle = { padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 900, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalBoxStyle: React.CSSProperties = { background: '#000', padding: '40px', borderRadius: '30px', border: '1px solid #333', width: '400px' };
const modalTitleStyle: React.CSSProperties = { color: '#fff', fontSize: '22px', fontWeight: 900, marginBottom: '30px', fontStyle: 'italic', margin: 0 };

export default MyCars;