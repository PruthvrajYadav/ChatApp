import React from 'react'
import assets from '../assets/assets'

const MessageInfoModal = ({ isOpen, onClose, messageData }) => {
    if (!isOpen || !messageData) return null

    const seenBy = messageData.seenBy || []
    const deliveredTo = messageData.deliveredTo || []

    return (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300'>
            <div className='w-full max-w-md bg-stone-900 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300'>
                <div className='p-6 border-b border-white/5 flex items-center justify-between'>
                    <h2 className='text-lg font-bold text-white'>Message Info</h2>
                    <button onClick={onClose} className='w-8 h-8 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white'>&times;</button>
                </div>

                <div className='max-h-[400px] overflow-y-auto p-2 custom-scrollbar'>
                    {/* Read By Section */}
                    <div className='mb-6'>
                        <h3 className='text-[10px] font-bold text-blue-400 uppercase tracking-widest px-4 mb-3'>Read By</h3>
                        <div className='space-y-1'>
                            {seenBy.length > 0 ? seenBy.map(user => (
                                <div key={user._id} className='flex items-center gap-3 p-3 px-4 hover:bg-white/5 rounded-2xl transition-colors'>
                                    <img src={user.profilePic || assets.avatar_icon} className='w-8 h-8 rounded-full object-cover' alt='' />
                                    <div className='flex-1'>
                                        <p className='text-sm font-bold text-white'>{user.fullName}</p>
                                        <p className='text-[10px] text-gray-500'>Seen</p>
                                    </div>
                                    <span className='text-blue-400'>✓✓</span>
                                </div>
                            )) : (
                                <p className='text-[10px] text-gray-600 italic px-4'>No one has read this yet</p>
                            )}
                        </div>
                    </div>

                    {/* Delivered To Section */}
                    <div>
                        <h3 className='text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-3'>Delivered To</h3>
                        <div className='space-y-1'>
                            {deliveredTo.filter(u => !seenBy.some(s => s._id === u._id)).length > 0 ? 
                                deliveredTo.filter(u => !seenBy.some(s => s._id === u._id)).map(user => (
                                    <div key={user._id} className='flex items-center gap-3 p-3 px-4 hover:bg-white/5 rounded-2xl transition-colors'>
                                        <img src={user.profilePic || assets.avatar_icon} className='w-8 h-8 rounded-full object-cover' alt='' />
                                        <div className='flex-1'>
                                            <p className='text-sm font-bold text-white'>{user.fullName}</p>
                                            <p className='text-[10px] text-gray-500'>Delivered</p>
                                        </div>
                                        <span className='text-gray-500'>✓✓</span>
                                    </div>
                                )) : (
                                    seenBy.length === 0 && <p className='text-[10px] text-gray-600 italic px-4'>Waiting for delivery...</p>
                                )
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MessageInfoModal
