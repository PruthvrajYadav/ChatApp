import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AdminAuthContext, AdminAuthProvider } from './context/AdminAuthContext';
import AdminLoginPage from './pages/AdminLoginPage';
import Dashboard from './pages/Dashboard';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
    const { isAdmin } = useContext(AdminAuthContext);
    return isAdmin ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AdminAuthProvider>
            <Router>
                <Toaster position="top-right" />
                <Routes>
                    <Route path="/login" element={<AdminLoginPage />} />
                    <Route 
                        path="/" 
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } 
                    />
                </Routes>
            </Router>
        </AdminAuthProvider>
    );
}

export default App;
