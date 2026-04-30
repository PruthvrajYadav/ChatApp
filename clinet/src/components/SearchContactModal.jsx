import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';
import toast from 'react-hot-toast';
import assets from '../assets/assets';

const SearchContactModal = ({ isOpen, onClose }) => {
    const [phone, setPhone] = useState('');
    const [searching, setSearching] = useState(false);
    const [foundUser, setFoundUser] = useState(null);

    const { axios } = useContext(AuthContext);
    const { setSelectedUser, setSelectedGroup, getMessages, setUsers, users } = useContext(ChatContext);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!phone) return;
        setSearching(true);
        setFoundUser(null);
        try {
            const { data } = await axios.get(`/api/auth/search?phoneNumber=${phone}`);
            if (data.success) {
                setFoundUser(data.user);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Search failed");
        } finally {
            setSearching(false);
        }
    };

    const handleAddFriend = async () => {
        if (!foundUser) return;
        
        try {
            const { data } = await axios.post('/api/auth/add', { friendId: foundUser._id });
            if (data.success) {
                toast.success("Contact added!");
                // Add to sidebar list
                setUsers(prev => [foundUser, ...prev]);
                setSelectedUser(foundUser);
                setSelectedGroup(null);
                getMessages(foundUser._id);
                onClose();
                setPhone('');
                setFoundUser(null);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Failed to add contact");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-md bg-stone-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Add New Contact</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">✕</button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                        <input 
                            type="tel" 
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter friend's phone number..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500/50 transition-all"
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={searching}
                            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-600/20"
                        >
                            {searching ? '...' : 'Find'}
                        </button>
                    </form>

                    {foundUser && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                            <img src={foundUser.profilePic || assets.avatar_icon} alt="" className="w-12 h-12 rounded-full object-cover" />
                            <div className="flex-1">
                                <p className="text-white font-bold">{foundUser.fullName}</p>
                                <p className="text-gray-500 text-xs">{foundUser.status || "Hey there!"}</p>
                            </div>
                            <button 
                                onClick={handleAddFriend}
                                className="bg-violet-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-violet-500 transition-colors"
                            >
                                Add & Chat
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchContactModal;
