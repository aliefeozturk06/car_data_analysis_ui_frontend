import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosConfig';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                username: username.trim(),
                password: password,
                role: 'ROLE_USER'
            };

            const response = await api.post('/auth/register', payload);

            if (response.status === 200 || response.status === 201) {
                alert("Registration Successful!");
                navigate('/login');
            }
        } catch (error: any) {
            const msg = error.response?.data?.message || "Registration failed.";
            alert(`ERROR: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
            {/* 🛡️ Login Kartı ile Birebir: Tüm ekstra 'box-sizing' ve 'text-align' temizlendi */}
            <div style={{ backgroundColor: '#000', padding: '60px', borderRadius: '40px', width: '450px', boxShadow: '0 30px 60px rgba(0,0,0,0.3)' }}>

                <h1 style={{ color: '#fff', fontSize: '26px', fontWeight: 900, fontStyle: 'italic', marginBottom: '10px' }}>CAR DATA ANALYSIS</h1>
                <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 700, marginBottom: '40px' }}>Create Account</h2>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                    <div>
                        <label style={{ color: '#fff', fontSize: '11px', fontWeight: 900, display: 'block', marginBottom: '10px' }}>CHOOSE USERNAME</label>
                        <input
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: '#fff', color: '#000', fontWeight: 600 }}
                        />
                    </div>

                    <div>
                        <label style={{ color: '#fff', fontSize: '11px', fontWeight: 900, display: 'block', marginBottom: '10px' }}>SET PASSWORD</label>
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
                        style={{
                            width: '100%',
                            padding: '18px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: '#fff',
                            color: '#000',
                            fontWeight: 900,
                            cursor: 'pointer',
                            marginTop: '10px',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'PROCESSING...' : 'SIGN UP'}
                    </button>
                </form>

                <p style={{ color: '#444', marginTop: '30px', fontSize: '12px', fontWeight: 800 }}>
                    Already an analyst? <Link to="/login" style={{ color: '#fff', textDecoration: 'none', borderBottom: '1px solid #fff', marginLeft: '5px' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;