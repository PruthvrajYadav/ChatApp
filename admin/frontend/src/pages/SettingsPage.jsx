import { Shield, Key, Bell, Database } from 'lucide-react';

const SettingsPage = () => {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Admin Settings</h1>
                <p className="text-gray-400 mt-1">Manage your administrative preferences</p>
            </div>

            <div className="max-w-3xl space-y-6">
                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Shield className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Security Credentials</h2>
                            <p className="text-sm text-gray-400">Update your admin login details</p>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-2">Admin Email</label>
                            <input 
                                type="email" 
                                readOnly 
                                value="admin@chatapp.com"
                                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-500 cursor-not-allowed"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold transition">
                            <Key size={18} />
                            Change Password
                        </button>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-xl opacity-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-500/10 rounded-xl">
                                <Bell className="text-purple-500" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">System Notifications</h2>
                                <p className="text-sm text-gray-400">Manage admin alerts and reports</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold bg-gray-700 px-3 py-1 rounded-full uppercase tracking-widest">Coming Soon</span>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-xl opacity-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-500/10 rounded-xl">
                                <Database className="text-orange-500" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Database Backup</h2>
                                <p className="text-sm text-gray-400">Download system data snapshots</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold bg-gray-700 px-3 py-1 rounded-full uppercase tracking-widest">Coming Soon</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
