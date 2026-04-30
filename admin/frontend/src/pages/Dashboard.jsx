import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { Users, MessageSquare, Users as GroupIcon, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState({ users: 0, messages: 0, groups: 0 });
    const { token, logout } = useContext(AdminAuthContext);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await axios.get('http://localhost:6001/api/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setStats(res.data.stats);
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
            }
        };
        fetchStats();
    }, [token]);

    const chartData = [
        { name: 'Users', count: stats.users },
        { name: 'Messages', count: stats.messages },
        { name: 'Groups', count: stats.groups },
    ];

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <header className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-extrabold tracking-tight">Admin Dashboard</h1>
                <button 
                    onClick={logout}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
                >
                    <LogOut size={18} /> Logout
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <StatCard icon={<Users size={32} />} label="Total Users" value={stats.users} color="bg-blue-600" />
                <StatCard icon={<MessageSquare size={32} />} label="Total Messages" value={stats.messages} color="bg-green-600" />
                <StatCard icon={<GroupIcon size={32} />} label="Total Groups" value={stats.groups} color="bg-purple-600" />
            </div>

            <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-xl">
                <h2 className="text-2xl font-bold mb-6">Activity Overview</h2>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className={`p-6 rounded-2xl flex items-center gap-6 ${color} shadow-lg transition-transform hover:scale-105`}>
        <div className="p-4 bg-white/20 rounded-xl">{icon}</div>
        <div>
            <p className="text-white/80 text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    </div>
);

export default Dashboard;
