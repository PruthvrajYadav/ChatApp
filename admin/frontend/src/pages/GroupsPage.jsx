import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminAuthContext } from '../context/AdminAuthContext';
import { Trash2, Users as GroupIcon, Calendar, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

const GroupsPage = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useContext(AdminAuthContext);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_ADMIN_API_URL}/groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setGroups(res.data.groups);
            }
        } catch (error) {
            toast.error('Failed to fetch groups');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, [token]);

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Group Management</h1>
                <p className="text-gray-400 mt-1">Monitor all active chat groups</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                    <div key={group._id} className="bg-gray-800 rounded-2xl border border-gray-700 p-6 hover:border-blue-500/50 transition shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold shadow-lg">
                                {group.groupProfile ? (
                                    <img src={group.groupProfile} className="w-full h-full rounded-2xl object-cover" />
                                ) : (
                                    group.name[0].toUpperCase()
                                )}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold mb-2 truncate">{group.name}</h3>
                        
                        <div className="space-y-3 mt-6 pt-6 border-t border-gray-700/50">
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <GroupIcon size={16} className="text-blue-500" />
                                <span>{group.members?.length || 0} Members</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <Calendar size={16} className="text-purple-500" />
                                <span>Created: {new Date(group.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            {group.members?.slice(0, 5).map((member, idx) => (
                                <div key={idx} className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-[10px] font-bold overflow-hidden" title={member.fullName}>
                                    {member.fullName[0]}
                                </div>
                            ))}
                            {group.members?.length > 5 && (
                                <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-[10px] font-bold">
                                    +{group.members.length - 5}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GroupsPage;
