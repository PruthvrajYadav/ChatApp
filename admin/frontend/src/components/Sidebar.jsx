import { LayoutDashboard, Users, MessageSquare, LogOut, Settings, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AdminAuthContext } from '../context/AdminAuthContext';

const Sidebar = ({ onClose }) => {
    const location = useLocation();
    const { logout } = useContext(AdminAuthContext);

    const menuItems = [
        { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/users', icon: <Users size={20} />, label: 'User Management' },
        { path: '/groups', icon: <MessageSquare size={20} />, label: 'Group Management' },
        { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
    ];

    return (
        <div className="w-64 bg-gray-800 h-screen sticky top-0 border-r border-gray-700 flex flex-col shadow-2xl">
            <div className="p-6 flex items-center justify-between">
                <h1 className="text-2xl font-black text-blue-500 tracking-tighter">ADMIN CORE</h1>
                <button onClick={onClose} className="lg:hidden p-1 hover:bg-gray-700 rounded-lg">
                    <X size={20} />
                </button>
            </div>
            
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                            location.pathname === item.path 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                    >
                        {item.icon}
                        <span className="font-medium">{item.label}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-700">
                <button 
                    onClick={() => { logout(); onClose?.(); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-xl transition-all"
                >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
