import { useState, useContext } from 'react';
import axios from 'axios';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AdminAuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${import.meta.env.VITE_ADMIN_API_URL}/login`, { email, password });
            if (res.data.success) {
                login(res.data.token);
                toast.success('Admin Login Successful');
                navigate('/');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login Failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 border border-gray-700">
                <h2 className="text-3xl font-bold text-white mb-6 text-center">Admin Panel</h2>
                <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Email</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                        placeholder="admin@chatapp.com"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2">Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
                        placeholder="••••••••"
                        required
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition duration-200"
                >
                    Login as Admin
                </button>
            </form>
        </div>
    );
};

export default AdminLoginPage;
