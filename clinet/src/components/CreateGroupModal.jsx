import React, { useContext, useState } from 'react'
import { ChatContext } from '../../context/ChatContext'
import assets from '../assets/assets'
import toast from 'react-hot-toast'

const CreateGroupModal = ({ isOpen, onClose }) => {
    const { users, createGroup } = useContext(ChatContext)
    const [groupName, setGroupName] = useState("")
    const [selectedUsers, setSelectedUsers] = useState([])
    const [groupProfile, setGroupProfile] = useState(null)

    if (!isOpen) return null

    const handleUserSelect = (userId) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(prev => prev.filter(id => id !== userId))
        } else {
            setSelectedUsers(prev => [...prev, userId])
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!groupName.trim()) return toast.error("Group name is required")
        if (selectedUsers.length < 1) return toast.error("Select at least one member")

        await createGroup({
            name: groupName,
            members: selectedUsers,
            groupProfile: groupProfile
        })
        
        onClose()
        setGroupName("")
        setSelectedUsers([])
        setGroupProfile(null)
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setGroupProfile(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
            <div className='bg-[#1a1a1a] w-full max-w-md rounded-2xl border border-gray-800 shadow-2xl overflow-hidden animate-in zoom-in duration-200'>
                <div className='p-6 border-b border-gray-800 flex items-center justify-between bg-violet-600/10'>
                    <h2 className='text-xl font-bold text-white'>Create New Group</h2>
                    <button onClick={onClose} className='text-gray-400 hover:text-white text-2xl'>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className='p-6 flex flex-col gap-5'>
                    {/* Profile Pic */}
                    <div className='flex flex-col items-center gap-3'>
                        <div className='relative group'>
                            <img 
                                src={groupProfile || assets.avatar_icon} 
                                alt="" 
                                className='w-20 h-20 rounded-full object-cover border-2 border-violet-500/50' 
                            />
                            <label htmlFor="group-pic" className='absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all'>
                                <span className='text-[10px] text-white font-bold'>CHANGE</span>
                            </label>
                            <input type="file" id="group-pic" hidden onChange={handleImageChange} accept='image/*' />
                        </div>
                        <p className='text-[10px] text-gray-500'>Group Profile Picture</p>
                    </div>

                    {/* Name Field */}
                    <div className='flex flex-col gap-2'>
                        <label className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>Group Name</label>
                        <input 
                            type="text" 
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Enter group name..."
                            className='bg-white/5 border border-gray-700 rounded-lg p-3 text-sm text-white outline-none focus:border-violet-500 transition-all'
                        />
                    </div>

                    {/* Member Selection */}
                    <div className='flex flex-col gap-2'>
                        <label className='text-xs font-semibold text-gray-400 uppercase tracking-wider'>Select Members ({selectedUsers.length})</label>
                        <div className='max-h-[150px] overflow-y-auto flex flex-col gap-1 border border-gray-800 rounded-lg p-2 bg-black/20'>
                            {users.map((user) => (
                                <div 
                                    key={user._id}
                                    onClick={() => handleUserSelect(user._id)}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${selectedUsers.includes(user._id) ? 'bg-violet-600/20' : 'hover:bg-white/5'}`}
                                >
                                    <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedUsers.includes(user._id) ? 'bg-violet-600 border-violet-500' : 'border-gray-600'}`}>
                                        {selectedUsers.includes(user._id) && <span className='text-[10px] text-white'>✓</span>}
                                    </div>
                                    <img src={user.profilePic || assets.avatar_icon} alt="" className='w-6 h-6 rounded-full object-cover' />
                                    <span className='text-xs text-white'>{user.fullName}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className='w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-violet-600/20 mt-2'
                    >
                        Create Group
                    </button>
                </form>
            </div>
        </div>
    )
}

export default CreateGroupModal
