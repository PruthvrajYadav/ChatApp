import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { Users, MessageSquare, ShieldCheck, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const Dashboard = () => {
    const [stats, setStats] = useState({ users: 0, messages: 0, groups: 0 });
    const { token } = useContext(AdminAuthContext);

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
        <div className="space-y-10">
            <header>
                <h1 className="text-4xl font-extrabold tracking-tight">System Overview</h1>
                <p className="text-gray-400 mt-2">Real-time monitoring and system metrics from database</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Users size={24} />} label="Total Users" value={stats.users} trend="Total" color="blue" />
                <StatCard icon={<MessageSquare size={24} />} label="Messages" value={stats.messages} trend="Live" color="green" />
                <StatCard icon={<ShieldCheck size={24} />} label="Groups" value={stats.groups} trend="Total" color="purple" />
                <StatCard icon={<Activity size={24} />} label="Active Now" value={stats.active || 0} trend="Last 10m" color="orange" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl">
                    <h2 className="text-xl font-bold mb-8">Platform Growth</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="name" stroke="#9CA3AF" axisLine={false} tickLine={false} />
                                <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-800 p-8 rounded-3xl border border-gray-700 shadow-xl">
                    <h2 className="text-xl font-bold mb-8">Distribution Analysis</h2>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                                <XAxis dataKey="name" stroke="#9CA3AF" axisLine={false} tickLine={false} />
                                <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, trend, color }) => {
    const colors = {
        blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
        green: 'text-green-500 bg-green-500/10 border-green-500/20',
        purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
        orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    };

    return (
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-lg relative overflow-hidden group hover:border-gray-600 transition-all">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colors[color]} border`}>
                    {icon}
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend === 'Live' ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-green-500/10 text-green-500'}`}>
                    {trend}
                </span>
            </div>
            <p className="text-gray-400 text-sm font-medium">{label}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
    );
};

export default Dashboard;
