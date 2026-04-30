import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { Trash2, User, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AdminAuthContext);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_ADMIN_API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUsers(res.data.users);
            }
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        
        try {
            const res = await axios.delete(`${import.meta.env.VITE_ADMIN_API_URL}/users/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                toast.success('User deleted');
                fetchUsers();
            }
        } catch (error) {
            toast.error('Failed to delete user');
        }
    };

    const filteredUsers = users.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">User Management</h1>
                    <p className="text-gray-400 mt-1">Manage and monitor all registered users</p>
                </div>
                <button 
                    onClick={fetchUsers}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition border border-gray-700"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Phone</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-gray-700/30 transition">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-500/20">
                                                {user.profilePic ? (
                                                    <img src={user.profilePic} className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <User size={20} className="text-blue-500" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-medium">{user.fullName}</div>
                                                <div className="text-xs text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">{user.phoneNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(user._id)}
                                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;
