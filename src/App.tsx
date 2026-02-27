import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import MyCars from './pages/MyCars';
import ForSale from './pages/ForSale';
import Sold from './pages/Sold';
import ApprovalWaiting from './pages/ApprovalWaiting';
import ApprovalRequests from './pages/ApprovalRequests';
import AdminDashboard from './pages/AdminDashboard';
import UserCarStats from './pages/UserCarStats';

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

                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/my-cars" element={<ProtectedRoute><MyCars /></ProtectedRoute>} />
                <Route path="/for-sale" element={<ProtectedRoute><ForSale /></ProtectedRoute>} />
                <Route path="/sold" element={<ProtectedRoute><Sold /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />


                <Route
                    path="/approval-waiting"
                    element={<ProtectedRoute><ApprovalWaiting /></ProtectedRoute>}
                />

                <Route
                    path="/approval-requests"
                    element={<ProtectedRoute><ApprovalRequests /></ProtectedRoute>}
                />

                <Route
                    path="/admin"
                    element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>}
                />

                <Route
                    path="/admin/car-stats"
                    element={<ProtectedRoute><UserCarStats /></ProtectedRoute>}
                />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;