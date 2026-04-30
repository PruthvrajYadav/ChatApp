import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'
import toast from 'react-hot-toast'
import CreateGroupModal from './CreateGroupModal'
import SearchContactModal from './SearchContactModal'
import { SidebarSkeleton } from './Skeleton'

const Sidebar = () => {

    const {users,getMessages,selectedUser,setSelectedUser,unseenMessage,groups,selectedGroup,setSelectedGroup,getGroupMessages,setUnseenMessage,isLoading, typingUser, deleteChat}=useContext(ChatContext)
    const { logout, onlineUsers, authUser } = useContext(AuthContext)

    const [input, setInput] = useState("")
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('All')

    const [showMenu, setShowMenu] = useState(false)
    const [isFabOpen, setIsFabOpen] = useState(false)
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)

    const filterUSers = users.filter((user) => {
        const matchesSearch = user.fullName.toLowerCase().includes(input.toLowerCase());
        const matchesTab = activeTab === 'Unread' ? unseenMessage[user._id] > 0 : true;
        return matchesSearch && matchesTab;
    });

    const navigate = useNavigate()
    return (
        <div className={`bg-transparent h-full p-5 pt-8 border-r border-[var(--border-color)] overflow-y-auto text-[var(--text-color)] ${selectedUser || selectedGroup ? "max-md:hidden" : ''} `}>
            <div className='pb-5'>
                <div className='flex items-center justify-between mb-6'>
                    <div className='flex items-center gap-2'>
                        <div className='w-10 h-10 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/20'>
                            <img src={assets.logo_icon} alt="" className='w-6' />
                        </div>
                        <h1 className='text-xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent'>QuickChat</h1>
                    </div>

                    <div className='flex items-center gap-3'>
                        <div className='relative'>
                            <button 
                                onClick={() => setIsFabOpen(!isFabOpen)}
                                className={`w-8 h-8 bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 rounded-xl flex items-center justify-center transition-all ${isFabOpen ? 'rotate-[135deg] bg-violet-600 text-white shadow-lg shadow-violet-600/20' : ''}`}
                                title="New Chat/Group"
                            >
                                <span className='text-xl font-light'>+</span>
                            </button>

                            {isFabOpen && (
                                <div className='absolute top-full right-0 z-50 w-48 mt-2 p-2 rounded-2xl bg-stone-900 border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95'>
                                    <div onClick={() => {setIsGroupModalOpen(true); setIsFabOpen(false)}} className='flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer text-sm transition-colors group'>
                                        <div className='w-8 h-8 bg-white/5 group-hover:bg-violet-600/20 rounded-lg flex items-center justify-center transition-colors text-xs'>👥</div>
                                        New Group
                                    </div>
                                    <div onClick={() => {setIsSearchModalOpen(true); setIsFabOpen(false)}} className='flex items-center gap-3 p-3 hover:bg-white/5 rounded-xl cursor-pointer text-sm transition-colors group'>
                                        <div className='w-8 h-8 bg-white/5 group-hover:bg-violet-600/20 rounded-lg flex items-center justify-center transition-colors text-xs'>👤</div>
                                        New Contact
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className='relative'>
                            <img onClick={() => setShowMenu(prev => !prev)} src={assets.menu_icon} alt="" className='w-5 opacity-60 hover:opacity-100 cursor-pointer transition-all' />
                            {showMenu && (
                                <div className='absolute top-full right-0 z-50 w-40 mt-2 p-2 rounded-xl bg-stone-900 border border-white/10 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95'>
                                    <p onClick={() => { navigate('/profile'); setShowMenu(false) }} className='p-2 hover:bg-white/5 rounded-lg cursor-pointer text-sm transition-colors flex items-center gap-2'>👤 Edit Profile</p>

                                    <hr className='my-1 border-white/5' />
                                    <p onClick={() => { logout() }} className='p-2 hover:bg-red-500/10 text-red-400 rounded-lg cursor-pointer text-sm transition-colors flex items-center gap-2'>Logout</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className='bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl flex items-center gap-3 py-3 px-4 mb-4 focus-within:bg-white/10 transition-all'>
                    <img src={assets.search_icon} alt="" className='w-3.5 opacity-50' />
                    <input type="text" onChange={(e)=>setInput(e.target.value)} className='bg-transparent border-none outline-none text-white text-sm placeholder-gray-500 flex-1' placeholder='Search messages or users...' />
                </div>

                <div className='flex items-center gap-2 mb-6 bg-black/20 p-1 rounded-xl'>
                    {['All', 'Unread', 'Groups'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {(activeTab === 'All' || activeTab === 'Groups') && (
                    <div className='flex flex-col gap-4 mb-6'>
                    <div className='flex items-center justify-between px-1'>
                        <h2 className='text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]'>Groups</h2>
                        <button 
                            onClick={() => setIsGroupModalOpen(true)}
                            className='text-[10px] font-bold bg-violet-600/20 hover:bg-violet-600/40 text-violet-400 px-3 py-1.5 rounded-lg border border-violet-500/20 transition-all'
                        >
                            + New
                        </button>
                    </div>

                    <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
                    
                    <div className='flex flex-col gap-2'>
                        {groups.length === 0 && <p className='text-[10px] text-gray-500 italic px-2'>No groups joined</p>}
                        {groups.map((group, index) => (
                            <div 
                                key={index} 
                                onClick={() => {setSelectedUser(null); setSelectedGroup(group); getGroupMessages(group._id)}}
                                className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${selectedGroup?._id === group._id ? 'bg-violet-600/20 border border-violet-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                            >
                                <div className='relative'>
                                    <img 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedImage(group.groupProfile || assets.avatar_icon);
                                        }}
                                        src={group.groupProfile || assets.avatar_icon} 
                                        alt="" 
                                        className='w-10 h-10 rounded-full object-cover border border-white/10 hover:scale-110 transition-transform cursor-pointer' 
                                    />
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-sm font-bold text-white truncate'>{group.name}</p>
                                    <p className='text-[10px] text-gray-500 truncate'>{group.members.length} members</p>
                                </div>
                                {unseenMessage[group._id] > 0 && (
                                    <span className='bg-violet-600 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shadow-lg shadow-violet-600/20'>
                                        {unseenMessage[group._id]}
                                    </span>
                                )}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(window.confirm('Delete this group chat?')) deleteChat(group._id, true);
                                    }}
                                    className='opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all ml-1'
                                    title="Delete Chat"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                    </div>
                )}

                {(activeTab === 'All' || activeTab === 'Unread') && (
                    <>
                        <div className='px-1 mb-3'>
                    <h2 className='text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]'>Direct Messages</h2>
                </div>

                <div className='flex flex-col gap-2'>
                    {isLoading ? (
                        <SidebarSkeleton />
                    ) : filterUSers.length === 0 ? (
                        <p className='text-center text-[10px] text-gray-500 mt-5'>No users found</p>
                    ) : (
                        filterUSers.map((user, index) => (
                            <div 
                                onClick={() => { setSelectedUser(user); setSelectedGroup(null); getMessages(user._id); setUnseenMessage(prev=>({...prev,[user._id]:0}))}}
                                key={index} 
                                className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${selectedUser?._id === user._id ? 'bg-violet-600/20 border border-violet-500/30' : 'hover:bg-[var(--input-bg)] border border-transparent'}`}
                            >
                                <div className='relative'>
                                    <img 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedImage(user?.profilePic || assets.avatar_icon);
                                        }}
                                        src={user?.profilePic || assets.avatar_icon} 
                                        alt="" 
                                        className='w-10 h-10 rounded-full object-cover border border-white/10 hover:scale-110 transition-transform cursor-pointer' 
                                    />
                                    {onlineUsers.includes(user._id) && (
                                        <span className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-stone-900 rounded-full'></span>
                                    )}
                                </div>
                                <div className='flex-1 min-w-0'>
                                    <p className='text-sm font-bold text-white truncate'>
                                        {String(user._id) === String(authUser._id) ? "You" : (
                                            authUser.friends?.some(f => String(f._id || f) === String(user._id)) ? user.fullName : (user.phoneNumber || user.fullName)
                                        )}
                                    </p>
                                    <p className={`text-[10px] truncate ${typingUser === user._id ? 'text-green-400 font-bold animate-pulse' : (onlineUsers.includes(user._id) ? 'text-green-400 font-medium' : 'text-gray-500')}`}>
                                        {typingUser === user._id ? 'typing...' : (user.status || (onlineUsers.includes(user._id) ? 'Online' : 'Offline'))}
                                    </p>
                                </div>
                                {unseenMessage[user._id] > 0 && (
                                    <span className='bg-violet-600 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-full shadow-lg shadow-violet-600/20'>
                                        {unseenMessage[user._id]}
                                    </span>
                                )}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(window.confirm('Delete this chat?')) deleteChat(user._id);
                                    }}
                                    className='opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-all ml-1'
                                    title="Delete Chat"
                                >
                                    ✕
                                </button>
                            </div>
                        ))
                    )}
                </div>
                </>
                )}
            </div>


            <SearchContactModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
            
            {selectedImage && (
                <div 
                    className='fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300'
                    onClick={() => setSelectedImage(null)}
                >
                    <button className='absolute top-6 right-6 text-white text-4xl hover:text-gray-300 transition-colors'>&times;</button>
                    <img 
                        src={selectedImage} 
                        className='max-w-full max-h-[80vh] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300' 
                        alt="Preview" 
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}

export default Sidebar