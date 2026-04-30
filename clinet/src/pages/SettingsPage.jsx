import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'
import toast from 'react-hot-toast'

const SettingsPage = () => {
    const { authUser, updateProfile, logout } = useContext(AuthContext)
    const { users } = useContext(ChatContext)
    const navigate = useNavigate()

    const [activeSection, setActiveSection] = useState(null)
    const [wallpaper, setWallpaper] = useState(authUser.wallpaper || "")
    const [notifEnabled, setNotifEnabled] = useState(true)

    const sections = [
        { id: 'profile', icon: '👤', title: 'Profile', desc: 'Name, Bio, Profile Photo', path: '/profile' },
        { id: 'privacy', icon: '🔒', title: 'Privacy', desc: 'Read receipts, Blocked contacts' },
        { id: 'chats', icon: '💬', title: 'Chats', desc: 'Wallpaper, Chat history' },
        { id: 'notifications', icon: '🔔', title: 'Notifications', desc: 'Message, group & call tones' },
        { id: 'help', icon: '❓', title: 'Help', desc: 'Help center, contact us, privacy policy' },
    ]

    const handleWallpaperChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = async () => {
            const base64Image = reader.result
            await updateProfile({ wallpaper: base64Image })
            setWallpaper(base64Image)
            toast.success("Wallpaper updated!")
        }
    }

    return (
        <div className='min-h-screen bg-stone-950 text-white p-4 sm:p-8 relative overflow-hidden'>
             {/* Decorative Gradients */}
             <div className='absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full'></div>
            <div className='absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full'></div>

            <div className='max-w-xl mx-auto bg-stone-900/60 backdrop-blur-3xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative z-10'>
                {/* Header */}
                <div className='p-6 border-b border-white/5 flex items-center gap-4'>
                    <button onClick={() => navigate('/')} className='p-2 hover:bg-white/5 rounded-full transition-colors text-xl'>&larr;</button>
                    <h1 className='text-2xl font-bold'>Settings</h1>
                </div>

                {/* Main Content */}
                <div className='p-2'>
                    {/* User Profile Summary */}
                    <div 
                        onClick={() => navigate('/profile')}
                        className='flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl cursor-pointer transition-all m-2'
                    >
                        <img src={authUser.profilePic || assets.avatar_icon} className='w-16 h-16 rounded-full object-cover border-2 border-violet-500/20' alt="" />
                        <div className='flex-1'>
                            <h2 className='text-lg font-bold'>{authUser.fullName}</h2>
                            <p className='text-sm text-gray-500 truncate'>{authUser.bio || 'Hey there! I am using QuickChat'}</p>
                        </div>
                        <span className='text-gray-600'>&rsaquo;</span>
                    </div>

                    <div className='h-[1px] bg-white/5 my-2 mx-6'></div>

                    {/* Setting Sections */}
                    <div className='space-y-1 p-2'>
                        {sections.map(section => (
                            <div 
                                key={section.id}
                                onClick={() => section.path ? navigate(section.path) : setActiveSection(section.id)}
                                className='flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group'
                            >
                                <div className='w-12 h-12 bg-white/5 group-hover:bg-violet-600/20 rounded-xl flex items-center justify-center text-xl transition-colors'>
                                    {section.icon}
                                </div>
                                <div className='flex-1'>
                                    <h3 className='font-bold text-gray-200'>{section.title}</h3>
                                    <p className='text-xs text-gray-500'>{section.desc}</p>
                                </div>
                                <span className='text-gray-600 group-hover:text-violet-400 transition-colors'>&rsaquo;</span>
                            </div>
                        ))}
                    </div>

                    <div className='h-[1px] bg-white/5 my-4 mx-6'></div>

                    {/* Logout */}
                    <div 
                        onClick={logout}
                        className='flex items-center gap-4 p-4 hover:bg-red-500/10 rounded-2xl cursor-pointer transition-all m-2 group'
                    >
                        <div className='w-12 h-12 bg-red-500/5 group-hover:bg-red-500/20 rounded-xl flex items-center justify-center text-xl transition-colors'>
                            🚪
                        </div>
                        <div className='flex-1'>
                            <h3 className='font-bold text-red-500'>Logout</h3>
                            <p className='text-xs text-red-500/60'>Sign out of your account</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section Modals/Overlays */}
            {activeSection && (
                <div className='fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300'>
                    <div className='w-full max-w-md bg-stone-900 border border-white/10 rounded-3xl p-8 animate-in zoom-in-95 duration-300'>
                        <div className='flex justify-between items-center mb-6'>
                            <h2 className='text-xl font-bold capitalize'>{activeSection} Settings</h2>
                            <button onClick={() => setActiveSection(null)} className='text-2xl'>&times;</button>
                        </div>

                        {activeSection === 'chats' && (
                            <div className='space-y-6'>
                                <div>
                                    <label className='text-xs font-bold text-gray-500 uppercase tracking-widest block mb-3'>Chat Wallpaper</label>
                                    <div className='relative group h-40 rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center'>
                                        {wallpaper ? (
                                            <img src={wallpaper} className='w-full h-full object-cover opacity-60' alt="" />
                                        ) : (
                                            <div className='text-gray-600 text-sm'>No wallpaper set</div>
                                        )}
                                        <label className='absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer'>
                                            <span className='bg-violet-600 px-4 py-2 rounded-lg text-xs font-bold'>Change Wallpaper</span>
                                            <input type="file" hidden accept="image/*" onChange={handleWallpaperChange} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'notifications' && (
                            <div className='space-y-6'>
                                <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5'>
                                    <div>
                                        <p className='text-sm text-white font-medium'>Conversation Tones</p>
                                        <p className='text-[10px] text-gray-500'>Play sounds for incoming messages</p>
                                    </div>
                                    <button 
                                        onClick={() => setNotifEnabled(!notifEnabled)}
                                        className={`w-12 h-6 rounded-full transition-all relative ${notifEnabled ? 'bg-violet-600' : 'bg-gray-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifEnabled ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className='flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5'>
                                    <div>
                                        <p className='text-sm text-white font-medium'>Vibrate</p>
                                        <p className='text-[10px] text-gray-500'>Vibrate on message</p>
                                    </div>
                                    <span className='text-xs text-violet-400'>Default</span>
                                </div>
                            </div>
                        )}

                        {activeSection === 'privacy' && (
                            <div className='space-y-4'>
                                <p className='text-gray-400 text-sm'>Privacy options can be managed in your Profile settings.</p>
                                <button onClick={() => navigate('/profile')} className='w-full py-4 bg-violet-600/20 text-violet-400 border border-violet-500/20 rounded-2xl font-bold text-sm hover:bg-violet-600 hover:text-white transition-all'>Go to Profile Settings</button>
                            </div>
                        )}

                        {activeSection === 'help' && (
                            <div className='space-y-4'>
                                <div className='p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4'>
                                    <div className='flex items-center gap-3'>
                                        <span className='text-xl'>📖</span>
                                        <div className='text-sm font-medium'>Help Center</div>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <span className='text-xl'>✉️</span>
                                        <div className='text-sm font-medium'>Contact us</div>
                                    </div>
                                    <div className='flex items-center gap-3'>
                                        <span className='text-xl'>📄</span>
                                        <div className='text-sm font-medium'>Terms and Privacy Policy</div>
                                    </div>
                                </div>
                                <p className='text-[10px] text-center text-gray-600 mt-4'>QuickChat version 2.0.1 (Beta)</p>
                            </div>
                        )}

                        <button onClick={() => setActiveSection(null)} className='w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-sm mt-6 transition-all'>Close</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SettingsPage
