import { createContext, useState, useEffect } from 'react';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [token, setToken] = useState(localStorage.getItem('adminToken') || null);

    useEffect(() => {
        if (token) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    }, [token]);

    const login = (newToken) => {
        localStorage.setItem('adminToken', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('adminToken');
        setToken(null);
    };

    return (
        <AdminAuthContext.Provider value={{ isAdmin, token, login, logout }}>
            {children}
        </AdminAuthContext.Provider>
    );
};
