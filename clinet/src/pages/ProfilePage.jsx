import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const ProfilePage = () => {



    const { authUser, updateProfile, deleteAccount } = useContext(AuthContext)

    const [selectedImg, setSelectedImg] = useState(null)
    const navigate = useNavigate()
    const [name, setName] = useState(authUser.fullName)
    const [bio, setBio] = useState(authUser.bio || "")
    const [status, setStatus] = useState(authUser.status || "Available")
    const [showReadReceipts, setShowReadReceipts] = useState(authUser.settings?.showReadReceipts ?? true)

    const statuses = ["Available", "Busy", "At School", "At the Movies", "At Work", "Battery about to die", "In a meeting", "At the Gym", "Sleeping", "Urgent calls only"]

    const handleSubmit = async (e) => {
        e.preventDefault()
        const data = { 
            fullName: name, 
            bio, 
            status, 
            settings: { ...authUser.settings, showReadReceipts } 
        }

        if (!selectedImg) {
            await updateProfile(data)
            navigate('/')
            return
        }

        const reader = new FileReader()
        reader.readAsDataURL(selectedImg)
        reader.onload = async () => {
            const base64Image = reader.result
            await updateProfile({ ...data, profilePic: base64Image })
            navigate('/')
        }
    }

    return (
        <div className='min-h-screen bg-stone-950 flex items-center justify-center p-6 relative overflow-hidden'>
            {/* Decorative Gradients */}
            <div className='absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full'></div>
            <div className='absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full'></div>

            <div className='w-full max-w-2xl bg-stone-900/60 backdrop-blur-3xl border border-white/10 rounded-[40px] shadow-2xl p-8 sm:p-12 relative z-10 animate-in fade-in zoom-in-95 duration-500 overflow-y-auto max-h-[90vh] custom-scrollbar'>
                <div className='flex items-center gap-4 mb-8'>
                    <button onClick={() => navigate('/')} className='w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors text-white text-xl'>
                        &larr;
                    </button>
                    <div>
                        <h2 className='text-3xl font-bold text-white'>Profile Settings</h2>
                        <p className='text-sm text-gray-500'>Customize how people see you</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
                    <div className='flex flex-col items-center gap-4 mb-4'>
                        <div className='relative group'>
                            <img 
                                src={selectedImg ? URL.createObjectURL(selectedImg) : (authUser.profilePic || assets.avatar_icon)} 
                                alt="" 
                                className='w-32 h-32 rounded-full object-cover border-4 border-violet-500/20 group-hover:border-violet-500/50 transition-all duration-300 shadow-2xl shadow-violet-600/20' 
                            />
                            <label htmlFor="avatar" className='absolute bottom-2 right-2 w-10 h-10 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all active:scale-90'>
                                <input onChange={(e) => setSelectedImg(e.target.files[0])} type="file" name="" id="avatar" accept='.png,.jpg,.jpeg' hidden />
                                📸
                            </label>
                        </div>
                        <p className='text-xs text-gray-400 font-medium tracking-wide uppercase'>Tap icon to change photo</p>
                    </div>

                    <div className='space-y-6'>
                        <div className='space-y-2'>
                            <label className='text-xs font-bold text-gray-500 uppercase tracking-widest px-1'>Full Name</label>
                            <input onChange={(e) => setName(e.target.value)} value={name} type="text" required placeholder='Enter your name' className='w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all' />
                        </div>
                        
                        <div className='space-y-2'>
                            <label className='text-xs font-bold text-gray-500 uppercase tracking-widest px-1'>Bio</label>
                            <textarea onChange={(e) => setBio(e.target.value)} value={bio} placeholder='Tell us something about yourself...' required className='w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all resize-none' rows={2}></textarea>
                        </div>

                        <div className='space-y-2'>
                            <label className='text-xs font-bold text-gray-500 uppercase tracking-widest px-1'>Status</label>
                            <select 
                                value={status} 
                                onChange={(e) => setStatus(e.target.value)}
                                className='w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all appearance-none cursor-pointer'
                            >
                                {statuses.map(s => <option key={s} value={s} className='bg-stone-900'>{s}</option>)}
                            </select>
                        </div>

                        <div className='pt-4 border-t border-white/5'>
                            <h3 className='text-xs font-bold text-violet-400 uppercase tracking-widest mb-4'>Privacy Settings</h3>
                            <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5'>
                                <div>
                                    <p className='text-sm text-white font-medium'>Read Receipts</p>
                                    <p className='text-[10px] text-gray-500'>Show blue ticks when you read messages</p>
                                </div>
                                <button 
                                    type='button'
                                    onClick={() => setShowReadReceipts(!showReadReceipts)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${showReadReceipts ? 'bg-violet-600' : 'bg-gray-700'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showReadReceipts ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>

                    <button type='submit' className='w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/20 active:scale-95 transition-all mt-4'>
                        Save Changes
                    </button>
                </form>

                <div className='mt-8 pt-6 border-t border-white/5'>
                    <button 
                        onClick={() => deleteAccount()}
                        className='w-full py-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 rounded-2xl transition-all border border-red-500/10 font-bold text-xs uppercase tracking-widest'
                    >
                        🗑️ Delete Account
                    </button>
                    <p className='text-[10px] text-gray-600 text-center mt-3 px-4'>This action is permanent and will remove all your data from our servers.</p>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage