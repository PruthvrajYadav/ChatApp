import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { User, Search, RefreshCw } from 'lucide-react';
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

    const filteredUsers = users.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
                    <p className="text-gray-400 mt-1 text-sm md:text-base">Monitor and view all registered users</p>
                </div>
                <button 
                    onClick={fetchUsers}
                    className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl transition border border-gray-700 shadow-lg"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-gray-800 rounded-3xl border border-gray-700 shadow-2xl overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-700">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name or email..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border border-gray-700 rounded-2xl focus:outline-none focus:border-blue-500 text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-5">User Profile</th>
                                <th className="px-6 py-5">Contact Info</th>
                                <th className="px-6 py-5 text-right">Join Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                                        No users found matching your search
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => (
                                <tr key={user._id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:border-blue-500/40 transition-all shrink-0 overflow-hidden">
                                                {user.profilePic ? (
                                                    <img src={user.profilePic} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={22} className="text-blue-500" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-gray-100 truncate">{user.fullName}</div>
                                                <div className="text-xs text-gray-500 truncate">{user._id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="text-sm font-medium text-gray-300">{user.email}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{user.phoneNumber}</div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="text-sm font-bold text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</div>
                                        <div className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-tighter">Verified User</div>
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
