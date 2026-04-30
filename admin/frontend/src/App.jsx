import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AdminAuthContext, AdminAuthProvider } from './context/AdminAuthContext';
import AdminLoginPage from './pages/AdminLoginPage';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/UsersPage';
import GroupsPage from './pages/GroupsPage';
import AdminLayout from './components/AdminLayout';
import { Toaster } from 'react-hot-toast';

const ProtectedRoute = ({ children }) => {
    const { isAdmin } = useContext(AdminAuthContext);
    return isAdmin ? <AdminLayout>{children}</AdminLayout> : <Navigate to="/login" />;
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
                    <Route 
                        path="/users" 
                        element={
                            <ProtectedRoute>
                                <UsersPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route 
                        path="/groups" 
                        element={
                            <ProtectedRoute>
                                <GroupsPage />
                            </ProtectedRoute>
                        } 
                    />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AdminAuthProvider>
    );
}

export default App;
