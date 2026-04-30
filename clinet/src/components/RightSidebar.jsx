import React, { useContext, useEffect, useState } from 'react'
import assets, { imagesDummyData } from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'

const RightSidebar = () => {
    const { 
        selectedUser, message, showProfile, selectedGroup, users, 
        updateGroup, addMembers, setShowProfile, removeMember, promoteToAdmin,
        viewingUser, setViewingUser, setSelectedUser, setSelectedGroup, addFriend,
        exitGroup, deleteGroup
    } = useContext(ChatContext)
    const { logout, onlineUsers, authUser, updateProfile } = useContext(AuthContext)
    const [msgImg, setMsgimg] = useState([])
    const [isEditing, setIsEditing] = useState(false)
    const [newName, setNewName] = useState("")
    const [showAddMembers, setShowAddMembers] = useState(false)
    const [selectedImage, setSelectedImage] = useState(null)

    const wallpapers = [
        { name: "Default", value: "" },
        { name: "Violet Glow", value: "linear-gradient(to bottom right, #1e1b4b, #312e81, #1e1b4b)" },
        { name: "Midnight", value: "linear-gradient(to bottom right, #09090b, #18181b, #09090b)" },
        { name: "Emerald", value: "linear-gradient(to bottom right, #064e3b, #022c22, #064e3b)" },
        { name: "Ocean", value: "linear-gradient(to bottom right, #1e3a8a, #172554, #1e3a8a)" },
        { name: "Crimson", value: "linear-gradient(to bottom right, #450a0a, #7f1d1d, #450a0a)" },
    ]

    useEffect(() => {
        if (message) {
            setMsgimg(message.filter(msg => msg.image).map(msg => msg.image))
        }
    }, [message])

    const isCurrentUserAdmin = selectedGroup && selectedGroup.admins?.some(a => (a._id || a) === authUser._id);
    const isAdmin = isCurrentUserAdmin;
    const currentInfo = viewingUser || selectedUser || selectedGroup;

    if ((!showProfile && !viewingUser) || !currentInfo) return null;

    return (
        <div className='w-full h-full bg-stone-950/40 backdrop-blur-2xl text-white overflow-y-auto custom-scrollbar border-l border-white/5 relative animate-in fade-in slide-in-from-right-10 duration-300'>
            {/* Header */}
            <div className='sticky top-0 bg-stone-900/60 backdrop-blur-md h-16 flex items-center px-6 justify-between z-10 border-b border-white/5'>
                <div className='flex items-center gap-3'>
                    {viewingUser && (
                        <button 
                            onClick={() => setViewingUser(null)}
                            className='w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors text-violet-400'
                            title="Back"
                        >
                            ←
                        </button>
                    )}
                    <h2 className='text-sm font-bold uppercase tracking-widest text-gray-400'>
                        {viewingUser ? 'Member Details' : (selectedUser ? 'User Details' : 'Group Details')}
                    </h2>
                </div>
                <button onClick={() => {setShowProfile(false); setViewingUser(null)}} className='w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors'>&times;</button>
            </div>

            {/* Profile Section */}
            <div className='flex flex-col items-center py-10 px-6'>
                <div className='w-40 h-40 mb-6 relative group'>
                    <img src={(currentInfo?.profilePic || currentInfo?.groupProfile) || assets.avatar_icon} className='w-full h-full rounded-full object-cover shadow-2xl border-4 border-white/5 group-hover:border-violet-500/30 transition-all duration-500' alt='' />
                    {currentInfo?.fullName && onlineUsers.includes(currentInfo._id) && (
                        <div className='absolute bottom-2 right-2 w-5 h-5 bg-green-500 rounded-full border-4 border-stone-900'></div>
                    )}
                    {isAdmin && !viewingUser && (
                        <label htmlFor="group-upload" className='absolute bottom-2 right-2 w-10 h-10 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center cursor-pointer border-4 border-stone-900 shadow-xl transition-all active:scale-90'>
                            <input 
                                type="file" 
                                id="group-upload" 
                                hidden 
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.readAsDataURL(file);
                                        reader.onload = async () => {
                                            await updateGroup(selectedGroup._id, { groupProfile: reader.result });
                                        }
                                    }
                                }}
                            />
                            <span className='text-xs'>📸</span>
                        </label>
                    )}
                </div>
                
                {isEditing ? (
                    <div className='flex items-center gap-2 w-full'>
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} className='bg-white/5 border border-violet-500/30 rounded-xl px-4 py-2 w-full text-center outline-none focus:bg-white/10' />
                        <button onClick={async () => {await updateGroup(selectedGroup._id, {name: newName}); setIsEditing(false)}} className='bg-violet-600 p-2 rounded-xl text-white'>✓</button>
                    </div>
                ) : (
                    <div className='flex flex-col items-center text-center'>
                        <div className='flex items-center gap-2 mb-1'>
                            <h1 className='text-2xl font-black text-white'>
                                {viewingUser ? (
                                    authUser.friends?.some(f => String(f._id || f) === String(viewingUser._id)) ? viewingUser.fullName : (viewingUser.phoneNumber || viewingUser.fullName)
                                ) : (currentInfo?.fullName || currentInfo?.name)}
                            </h1>
                            {isAdmin && !viewingUser && <button onClick={() => {setIsEditing(true); setNewName(selectedGroup?.name)}} className='p-1 hover:bg-white/5 rounded-lg text-xs opacity-40 hover:opacity-100 transition-all'>✏️</button>}
                        </div>
                        <p className='text-xs text-gray-500 font-medium tracking-wide uppercase opacity-60'>
                            {viewingUser ? (viewingUser.phoneNumber || "Member") : (selectedGroup ? "Public Group" : (currentInfo?.phoneNumber || "Contact"))}
                        </p>

                        {viewingUser && !authUser.friends?.some(f => String(f._id || f) === String(viewingUser._id)) && String(viewingUser._id) !== String(authUser._id) && (
                            <button 
                                onClick={() => addFriend(viewingUser.phoneNumber)}
                                className='mt-4 flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-violet-600/20'
                            >
                                👤 Add to Contacts
                            </button>
                        )}

                        {currentInfo?.bio && <p className='text-gray-400 text-sm mt-3 px-4 italic'>"{currentInfo?.bio}"</p>}
                        
                        {viewingUser && viewingUser._id !== authUser._id && (
                            <button 
                                onClick={() => {
                                    setSelectedGroup(null);
                                    setSelectedUser(viewingUser);
                                    setViewingUser(null);
                                }}
                                className='mt-6 px-8 py-3 bg-[var(--accent-gradient)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-violet-600/20 hover:scale-105 active:scale-95 transition-all'
                            >
                                Message 💬
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Chat Wallpaper Section */}
            {!viewingUser && (
                <div className='px-6 py-6 border-t border-white/5'>
                    <h3 className='text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-1'>Personalize Chat Background</h3>
                    <div className='grid grid-cols-3 gap-2'>
                        {wallpapers.map((wp) => (
                            <div 
                                key={wp.name}
                                onClick={() => updateProfile({ wallpaper: wp.value })}
                                className={`aspect-square rounded-xl cursor-pointer border-2 transition-all hover:scale-105 active:scale-95 ${authUser.wallpaper === wp.value ? 'border-violet-500 shadow-lg shadow-violet-600/20' : 'border-white/5'}`}
                                style={{ background: wp.value || '#18181b', backgroundImage: wp.value }}
                            >
                                <div className='w-full h-full flex items-center justify-center bg-black/20 rounded-[10px] opacity-0 hover:opacity-100 transition-opacity'>
                                    <span className='text-[10px] font-bold text-white text-center px-1'>{wp.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Media Section */}
            <div className='px-6 py-6 border-t border-white/5'>
                <div className='flex items-center justify-between mb-4 px-1'>
                    <h3 className='text-[10px] font-bold text-gray-500 uppercase tracking-widest'>Shared Media</h3>
                    <span className='text-[10px] font-bold text-violet-400 bg-violet-600/10 px-2 py-1 rounded-lg'>{msgImg.length} files</span>
                </div>
                <div className='grid grid-cols-3 gap-2'>
                    {msgImg.slice(0, 6).map((url, i) => (
                        <img key={i} src={url} onClick={() => window.open(url)} className='aspect-square object-cover rounded-xl cursor-pointer hover:ring-2 hover:ring-violet-500/50 transition-all shadow-lg' alt='' />
                    ))}
                    {msgImg.length === 0 && <p className='text-[10px] text-gray-600 italic col-span-3 text-center py-4 bg-white/5 rounded-2xl'>No files shared in this chat</p>}
                </div>
            </div>

            {/* Settings Section */}
            <div className='px-6 py-6 border-t border-white/5'>
                <h3 className='text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-1'>Personal Settings</h3>
                <div className='flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5'>
                    <div className='flex flex-col gap-1'>
                        <p className='text-xs font-bold text-white'>Real-time Translation</p>
                        <p className='text-[10px] text-gray-500'>Translate English to Marathi</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={authUser.settings?.translationEnabled || false}
                            onChange={() => updateProfile({ settings: { ...authUser.settings, translationEnabled: !authUser.settings?.translationEnabled } })}
                        />
                        <div className="w-9 h-5 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
                    </label>
                </div>
            </div>

            {/* Group Members Section */}
            {selectedGroup && (
                <div className='px-6 py-6 border-t border-white/5'>
                    <div className='flex items-center justify-between mb-4 px-1'>
                        <h3 className='text-[10px] font-bold text-gray-500 uppercase tracking-widest'>Members</h3>
                        {isAdmin && (
                            <button onClick={() => setShowAddMembers(!showAddMembers)} className='text-[10px] font-bold text-violet-400 hover:text-violet-300'>+ Add Member</button>
                        )}
                    </div>

                    {showAddMembers && (
                        <div className='mb-4 animate-in zoom-in-95 duration-200'>
                            <div className='bg-white/5 rounded-2xl border border-white/10 max-h-[200px] overflow-y-auto custom-scrollbar'>
                                {users.filter(u => !selectedGroup.members.some(m => (m._id || m) === u._id)).map(user => (
                                    <div key={user._id} onClick={() => {addMembers(selectedGroup._id, [user._id]); setShowAddMembers(false)}} className='flex items-center gap-3 p-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-none'>
                                        <img src={user.profilePic || assets.avatar_icon} className='w-8 h-8 rounded-full object-cover' alt='' />
                                        <span className='text-sm font-bold'>{user.fullName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className='space-y-3'>
                        {selectedGroup.members?.map(m => {
                            // Find full user data from users list if member is not populated
                            const memberId = String(m._id || m);
                            const fullMember = users.find(u => String(u._id) === memberId) || m;
                            const isFriend = authUser.friends?.some(f => String(f._id || f) === memberId);
                            const isMe = memberId === String(authUser._id);
                            
                            // WhatsApp logic: Show name only if friend, else show number
                            const displayName = isMe ? "You" : (isFriend ? fullMember.fullName : (fullMember.phoneNumber || fullMember.fullName));

                            return (
                                <div 
                                    key={memberId} 
                                    onClick={() => setViewingUser(fullMember)}
                                    className='flex items-center gap-4 p-3 rounded-2xl hover:bg-violet-600/10 transition-all cursor-pointer group border border-transparent hover:border-violet-500/20'
                                >
                                    <img 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedImage(fullMember.profilePic || assets.avatar_icon);
                                        }}
                                        src={fullMember.profilePic || assets.avatar_icon} 
                                        className='w-10 h-10 rounded-full object-cover shadow-lg border border-white/10 group-hover:scale-110 transition-transform' 
                                        alt='' 
                                    />
                                    <div className='flex-1 min-w-0'>
                                        <div className='flex items-center justify-between'>
                                            <div className='flex items-center gap-2'>
                                                <p className='text-sm font-bold truncate group-hover:text-violet-400 transition-colors'>{displayName}</p>
                                                {(selectedGroup.admins || []).some(admin => String(admin._id || admin) === memberId) && (
                                                    <span className='text-[10px] text-green-500 font-medium ml-2'>Group Admin</span>
                                                )}
                                            </div>
                                            <span className='text-[10px] text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity'>View Profile →</span>
                                        </div>
                                        <div className='flex items-center justify-between'>
                                            <p className='text-[10px] text-gray-500 truncate mt-0.5'>{isFriend || isMe ? (fullMember.bio || "Available") : "Contact not saved"}</p>
                                            
                                            {isCurrentUserAdmin && memberId !== String(authUser._id) && (
                                                <div className='flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity' onClick={(e) => e.stopPropagation()}>
                                                    {!selectedGroup.admins?.some(a => String(a._id || a) === memberId) && (
                                                        <button 
                                                            onClick={() => promoteToAdmin(selectedGroup._id, memberId)} 
                                                            className='p-1 hover:bg-violet-600/20 rounded-md text-[10px] text-violet-400'
                                                            title="Promote to Admin"
                                                        >
                                                            ⭐
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => removeMember(selectedGroup._id, memberId)} 
                                                        className='p-1 hover:bg-red-500/20 rounded-md text-[10px] text-red-500'
                                                        title="Remove Member"
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Exit/Delete Group Section */}
            {!viewingUser && selectedGroup && (
                <div className='px-6 py-6 border-t border-white/5'>
                    {isCurrentUserAdmin ? (
                        <button 
                            onClick={() => {
                                if(window.confirm("Are you sure you want to delete this group?")) {
                                    deleteGroup(selectedGroup._id);
                                    setShowProfile(false);
                                }
                            }} 
                            className='w-full flex items-center justify-center gap-2 py-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl transition-all border border-red-500/10 font-bold text-xs uppercase tracking-widest'
                        >
                            🗑️ Delete Group
                        </button>
                    ) : (
                        <button 
                            onClick={() => {
                                if(window.confirm("Are you sure you want to exit this group?")) {
                                    exitGroup(selectedGroup._id);
                                    setShowProfile(false);
                                }
                            }} 
                            className='w-full flex items-center justify-center gap-2 py-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl transition-all border border-red-500/10 font-bold text-xs uppercase tracking-widest'
                        >
                            🚪 Exit Group
                        </button>
                    )}
                </div>
            )}

            {/* Logout/Action Section */}
            <div className='px-6 py-8 border-t border-white/5 mb-10'>
                <button onClick={() => logout()} className='w-full flex items-center justify-center gap-3 py-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl transition-all border border-red-500/10 font-bold text-xs uppercase tracking-widest'>
                    <span>🚪</span> Logout Account
                </button>
            </div>

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

export default RightSidebar