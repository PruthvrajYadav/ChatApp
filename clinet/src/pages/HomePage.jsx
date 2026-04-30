import React, { useContext, useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatContainer from '../components/ChatContainer'
import RightSidebar from '../components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'

const HomePage = () => {

    const { selectedUser, selectedGroup, showProfile, viewingUser } = useContext(ChatContext)
    const isChatOpen = selectedUser || selectedGroup;

    return (
        <div className='w-full h-screen px-2 sm:px-[5%] pt-12 md:pt-20 pb-10 bg-[var(--bg-color)] relative overflow-hidden transition-all duration-700'>
            {/* Animated Background Blobs */}
            <div className='absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full animate-pulse hidden md:block'></div>
            <div className='absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse delay-700 hidden md:block'></div>
            
            <div className={`h-full glass-panel md:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] md:rounded-[32px] overflow-hidden relative flex transition-all duration-500`}>
                {/* Sidebar */}
                <div className={`${isChatOpen ? 'hidden md:block md:w-[35%] lg:w-[30%]' : 'w-full'} border-r border-gray-600/30 h-full`}>
                    <Sidebar/>
                </div>

                {/* Chat Area & Profile Section */}
                {isChatOpen ? (
                    <div className='flex-1 flex overflow-hidden h-full'>
                        <div className={`${showProfile ? 'hidden lg:block lg:w-[60%] xl:w-[65%]' : 'w-full'} h-full transition-all duration-300`}>
                            <ChatContainer />
                        </div>
                        
                        {(showProfile || viewingUser) && (
                            <div className={`${showProfile ? 'w-full lg:w-[40%] xl:w-[35%]' : 'hidden'} h-full border-l border-white/5 animate-in slide-in-from-right duration-300`}>
                                <RightSidebar />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className='hidden md:flex flex-1 flex-col items-center justify-center bg-transparent relative overflow-hidden'>
                        {/* Background Decorative Elements */}
                        <div className='absolute top-1/4 -left-20 w-80 h-80 bg-violet-600/10 rounded-full blur-[120px] animate-pulse'></div>
                        <div className='absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] animate-pulse delay-1000'></div>
                        
                        <div className='relative z-10 flex flex-col items-center text-center px-10'>
                            <div className='w-28 h-28 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-[40px] flex items-center justify-center shadow-[0_20px_50px_rgba(124,58,237,0.3)] mb-10 transform hover:scale-110 transition-transform duration-500 cursor-default'>
                                <span className='text-5xl animate-bounce'>💬</span>
                            </div>
                            <h2 className='text-4xl font-black text-white mb-6 tracking-tight'>
                                Experience <span className='bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent'>Seamless</span> Messaging
                            </h2>
                            <p className='text-gray-400 max-w-sm leading-relaxed mb-10 text-lg'>
                                Connect with your world in style. QuickChat brings you premium features with a beautiful, modern interface.
                            </p>
                            <div className='flex gap-4 items-center'>
                                <div className='px-6 py-3 bg-[var(--accent-gradient)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-violet-600/20'>
                                    Start Exploring 🚀
                                </div>
                            </div>
                        </div>

                        {/* Floating Micro-elements */}
                        <div className='absolute top-20 right-20 text-4xl opacity-20 animate-spin-slow'>✨</div>
                        <div className='absolute bottom-20 left-20 text-4xl opacity-20 animate-bounce delay-1000'>⚡</div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default HomePage