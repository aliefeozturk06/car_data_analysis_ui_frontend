import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Backend AuthRequestDTO (username, password) bekliyor
            const response = await api.post('/auth/login', { username, password });

            // Record yapısından gelen veriler (Java: AuthResponseDTO)
            const { token, username: backendUsername, role, balance } = response.data;

            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify({
                    username: backendUsername,
                    role: role,
                    balance: balance || 0
                }));

                // State temizliği ve ana sayfaya yönlendirme
                window.location.href = '/';
            }
        } catch (err: any) {
            console.error("Login error:", err);
            alert("Login Failed! Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
            <div style={{ backgroundColor: '#000', padding: '60px', borderRadius: '40px', width: '450px', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>
                <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: 900, fontStyle: 'italic', marginBottom: '10px' }}>CAR DATA ANALYSIS</h1>
                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '40px' }}>Sign In</h2>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <div>
                        <label style={{ color: '#fff', fontSize: '11px', fontWeight: 900, display: 'block', marginBottom: '10px' }}>USERNAME</label>
                        <input
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 600 }}
                        />
                    </div>
                    <div>
                        <label style={{ color: '#fff', fontSize: '11px', fontWeight: 900, display: 'block', marginBottom: '10px' }}>PASSWORD</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 600 }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', padding: '18px', borderRadius: '12px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 900, cursor: 'pointer', marginTop: '10px', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'LOGGING IN...' : 'LOG IN'}
                    </button>
                </form>

                <p style={{ color: '#444', marginTop: '30px', fontSize: '12px', fontWeight: 800 }}>
                    New analyst? <Link to="/register" style={{ color: '#fff', textDecoration: 'none', borderBottom: '1px solid #fff', marginLeft: '5px' }}>Create Account</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;