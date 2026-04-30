import React, { useContext, useState } from 'react'
import { ChatContext } from '../../context/ChatContext'
import assets from '../assets/assets'

const ForwardModal = ({ isOpen, onClose, messageData }) => {
    const { users, groups, forwardMessage } = useContext(ChatContext)
    const [selectedTargets, setSelectedTargets] = useState([]) // {id, isGroup}
    const [search, setSearch] = useState("")

    if (!isOpen) return null

    const toggleTarget = (id, isGroup) => {
        const exists = selectedTargets.find(t => t.id === id)
        if (exists) {
            setSelectedTargets(prev => prev.filter(t => t.id !== id))
        } else {
            setSelectedTargets(prev => [...prev, { id, isGroup }])
        }
    }

    const handleForward = async () => {
        if (selectedTargets.length === 0) return

        const userIds = selectedTargets.filter(t => !t.isGroup).map(t => t.id)
        const groupIds = selectedTargets.filter(t => t.isGroup).map(t => t.id)

        if (userIds.length > 0) await forwardMessage(messageData, userIds, false)
        if (groupIds.length > 0) await forwardMessage(messageData, groupIds, true)

        onClose()
    }

    const filteredUsers = users.filter(u => u.fullName.toLowerCase().includes(search.toLowerCase()))
    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300'>
            <div className='bg-stone-900/90 backdrop-blur-2xl border border-white/10 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]'>
                {/* Header */}
                <div className='p-6 border-b border-white/5 flex items-center justify-between'>
                    <div>
                        <h2 className='text-xl font-bold text-white'>Forward Message</h2>
                        <p className='text-xs text-gray-500 mt-1'>Select chats to forward this message</p>
                    </div>
                    <button onClick={onClose} className='w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors text-white text-xl'>&times;</button>
                </div>

                {/* Search */}
                <div className='px-6 py-4'>
                    <div className='bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 px-4 py-3 focus-within:bg-white/10 transition-all'>
                        <img src={assets.search_icon} className='w-4 opacity-50' alt="" />
                        <input 
                            type="text" 
                            placeholder='Search people or groups...' 
                            className='bg-transparent border-none outline-none text-white text-sm w-full'
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className='flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar'>
                    <div className='space-y-6'>
                        {/* Groups Section */}
                        {filteredGroups.length > 0 && (
                            <div className='space-y-2'>
                                <h3 className='text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2'>Recent Groups</h3>
                                {filteredGroups.map(group => (
                                    <div 
                                        key={group._id} 
                                        onClick={() => toggleTarget(group._id, true)}
                                        className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${selectedTargets.find(t => t.id === group._id) ? 'bg-violet-600/20 border border-violet-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                                    >
                                        <img src={group.groupProfile || assets.avatar_icon} className='w-10 h-10 rounded-full object-cover' alt="" />
                                        <div className='flex-1'>
                                            <p className='text-sm font-bold text-white'>{group.name}</p>
                                            <p className='text-[10px] text-gray-500'>{group.members.length} members</p>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTargets.find(t => t.id === group._id) ? 'bg-violet-600 border-violet-600' : 'border-white/20'}`}>
                                            {selectedTargets.find(t => t.id === group._id) && <span className='text-white text-[10px]'>✓</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* People Section */}
                        <div className='space-y-2'>
                            <h3 className='text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2'>Recent People</h3>
                            {filteredUsers.map(user => (
                                <div 
                                    key={user._id} 
                                    onClick={() => toggleTarget(user._id, false)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${selectedTargets.find(t => t.id === user._id) ? 'bg-violet-600/20 border border-violet-500/30' : 'hover:bg-white/5 border border-transparent'}`}
                                >
                                    <img src={user.profilePic || assets.avatar_icon} className='w-10 h-10 rounded-full object-cover' alt="" />
                                    <div className='flex-1'>
                                        <p className='text-sm font-bold text-white'>{user.fullName}</p>
                                        <p className='text-[10px] text-gray-500'>{user.email}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTargets.find(t => t.id === user._id) ? 'bg-violet-600 border-violet-600' : 'border-white/20'}`}>
                                        {selectedTargets.find(t => t.id === user._id) && <span className='text-white text-[10px]'>✓</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className='p-6 border-t border-white/5 bg-stone-900/50'>
                    <button 
                        onClick={handleForward}
                        disabled={selectedTargets.length === 0}
                        className='w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95'
                    >
                        Forward {selectedTargets.length > 0 && `(${selectedTargets.length})`}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ForwardModal
