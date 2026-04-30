import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { User, Search, RefreshCw, ShieldCheck, ShieldAlert, Shield, Eye, X, MessageSquare, Users, Calendar, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
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

    const calculateTrustScore = (user) => {
        let score = 0;
        if (user.profilePic) score += 30;
        if (user.bio && user.bio !== "Hey there! I am using QuickChat") score += 20;
        if (user.messageCount > 10) score += 25;
        if (user.friendsCount >= 2) score += 25;
        return score;
    };

    const getTrustLevel = (score) => {
        if (score >= 70) return { label: 'Highly Trusted', color: 'text-green-400', bg: 'bg-green-400/10', icon: <ShieldCheck size={14} /> };
        if (score >= 40) return { label: 'Likely Real', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: <Shield size={14} /> };
        return { label: 'Suspicious/Fake', color: 'text-red-400', bg: 'bg-red-400/10', icon: <ShieldAlert size={14} /> };
    };

    const filteredUsers = users.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="pb-10 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
                    <p className="text-gray-400 mt-1 text-sm md:text-base">Analyze user authenticity and monitor activity</p>
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
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-5">User Profile</th>
                                <th className="px-6 py-5">Trust Analysis</th>
                                <th className="px-6 py-5">Activity</th>
                                <th className="px-6 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        No users found matching your search
                                    </td>
                                </tr>
                            ) : filteredUsers.map((user) => {
                                const trustScore = calculateTrustScore(user);
                                const trust = getTrustLevel(trustScore);
                                return (
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
                                                    <div className="text-[10px] text-gray-500 truncate uppercase tracking-widest">{user._id.slice(-6)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${trust.bg} ${trust.color} text-[10px] font-bold uppercase tracking-wider`}>
                                                {trust.icon}
                                                {trust.label}
                                            </div>
                                            <div className="mt-2 w-24 h-1 bg-gray-900 rounded-full overflow-hidden">
                                                <div className={`h-full ${trust.color.replace('text', 'bg')}`} style={{ width: `${trustScore}%` }}></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                                    <MessageSquare size={12} className="text-gray-500" />
                                                    {user.messageCount || 0} Messages
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-300">
                                                    <Users size={12} className="text-gray-500" />
                                                    {user.friendsCount || 0} Friends
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button 
                                                onClick={() => setSelectedUser(user)}
                                                className="p-2 bg-gray-900 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-all border border-gray-700 hover:border-blue-500/50 shadow-sm"
                                                title="View Profile"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* User Profile Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-gray-800 border border-gray-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="relative h-32 bg-gradient-to-r from-blue-600 to-violet-600">
                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute -bottom-12 left-8 p-1 bg-gray-800 rounded-3xl border-4 border-gray-800">
                                <div className="w-24 h-24 rounded-2xl bg-blue-500/20 flex items-center justify-center overflow-hidden border border-gray-700">
                                    {selectedUser.profilePic ? (
                                        <img src={selectedUser.profilePic} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={40} className="text-blue-500" />
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-16 pb-8 px-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white">{selectedUser.fullName}</h2>
                                    <div className="flex items-center gap-2 mt-1 text-gray-400 text-sm">
                                        <ShieldCheck size={14} className="text-blue-400" />
                                        User Profile Details
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-lg bg-gray-900 border border-gray-700 text-xs font-bold ${getTrustLevel(calculateTrustScore(selectedUser)).color}`}>
                                    Score: {calculateTrustScore(selectedUser)}
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                                    <h4 className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">About / Bio</h4>
                                    <p className="text-sm text-gray-300 leading-relaxed italic">
                                        "{selectedUser.bio || 'No bio provided'}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                                        <div className="flex items-center gap-3 text-gray-400 mb-1">
                                            <Mail size={14} className="text-blue-400" />
                                            <span className="text-[10px] uppercase tracking-widest font-bold">Email</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-200 truncate">{selectedUser.email}</p>
                                    </div>
                                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                                        <div className="flex items-center gap-3 text-gray-400 mb-1">
                                            <Phone size={14} className="text-green-400" />
                                            <span className="text-[10px] uppercase tracking-widest font-bold">Phone</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-200">{selectedUser.phoneNumber || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                                        <div className="flex items-center gap-3 text-gray-400 mb-1">
                                            <Calendar size={14} className="text-violet-400" />
                                            <span className="text-[10px] uppercase tracking-widest font-bold">Joined</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-200">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50">
                                        <div className="flex items-center gap-3 text-gray-400 mb-1">
                                            <RefreshCw size={14} className="text-yellow-400" />
                                            <span className="text-[10px] uppercase tracking-widest font-bold">Activity</span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-200">{selectedUser.messageCount} Msgs Sent</p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => setSelectedUser(null)}
                                className="w-full mt-8 py-4 bg-gray-900 hover:bg-gray-700 text-white rounded-2xl font-bold text-sm transition-all border border-gray-700"
                            >
                                Close Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
