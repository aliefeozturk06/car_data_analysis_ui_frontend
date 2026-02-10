import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import HomePage from './pages/HomePage';
import MyCars from './pages/MyCars';
import ForSale from './pages/ForSale';
import Sold from './pages/Sold';

// 👇 İKİ FARKLI SAYFAYI İMPORT ETTİĞİMİZDEN EMİN OLALIM
import ApprovalWaiting from './pages/ApprovalWaiting';   // User için
import ApprovalRequests from './pages/ApprovalRequests'; // Moderatör için

import type { JSX } from "react";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" replace />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* --- ANA SAYFALAR --- */}
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/my-cars" element={<ProtectedRoute><MyCars /></ProtectedRoute>} />
                <Route path="/for-sale" element={<ProtectedRoute><ForSale /></ProtectedRoute>} />
                <Route path="/sold" element={<ProtectedRoute><Sold /></ProtectedRoute>} />

                {/* --- 🛑 KRİTİK AYRIM BURASI 🛑 --- */}

                {/* 1. KULLANICI LİNKİ: /approval-waiting */}
                {/* Bu linke gidince ApprovalWaiting.tsx açılmalı */}
                <Route
                    path="/approval-waiting"
                    element={<ProtectedRoute><ApprovalWaiting /></ProtectedRoute>}
                />

                {/* 2. MODERATÖR LİNKİ: /approval-requests */}
                {/* Bu linke gidince ApprovalRequests.tsx açılmalı */}
                <Route
                    path="/approval-requests"
                    element={<ProtectedRoute><ApprovalRequests /></ProtectedRoute>}
                />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;