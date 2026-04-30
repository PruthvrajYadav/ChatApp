import React, { useContext, useEffect, useRef, useState, useMemo } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import axios from 'axios'
import toast from 'react-hot-toast'
import ChatSkeleton from './Skeleton'
import EmojiPicker from 'emoji-picker-react'
import ForwardModal from './ForwardModal'

const ChatContainer = () => {
    const { 
        selectedUser, 
        selectedGroup, 
        message, 
        setMessage, 
        sendMessage, 
        getMessages, 
        getGroupMessages, 
        sendGroupMessage, 
        onlineUsers, 
        typingUser, 
        setTypingUser,
        deleteMessage,
        clearChat,
        pinMessage,
        isLoadingMore,
        hasMore,
        fetchMoreMessages,
        forwardMessage,
        pinChat,
        muteChat,
        setSelectedUser,
        setSelectedGroup,
        showProfile,
        setShowProfile,
        viewingUser
    } = useContext(ChatContext)
    
    const { authUser, socket } = useContext(AuthContext)
    const [input, setInput] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [showEmoji, setShowEmoji] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [showChatMenu, setShowChatMenu] = useState(false)
    const [replyingTo, setReplyingTo] = useState(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [showSearch, setShowSearch] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [mediaRecorder, setMediaRecorder] = useState(null)
    const [recordingTime, setRecordingTime] = useState(0)
    const [contextMenu, setContextMenu] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)
    const [isForwardModalOpen, setIsForwardModalOpen] = useState(false)
    const [forwardData, setForwardData] = useState(null)
    const [gifSearch, setGifSearch] = useState("")
    const [gifs, setGifs] = useState([])
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false)
    const [scheduledTime, setScheduledTime] = useState("")
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
    const [isVoiceTyping, setIsVoiceTyping] = useState(false)
    const [showExtras, setShowExtras] = useState(false)

    const scrollEnd = useRef()
    const chatContainerRef = useRef()
    const lastMessageRef = useRef()

    const currentChat = selectedUser || selectedGroup;

    // ... (keeping all other functions as they are)
    const handleScroll = (e) => {
        if (e.target.scrollTop === 0 && hasMore && !isLoadingMore) {
            const currentHeight = e.target.scrollHeight;
            fetchMoreMessages(currentChat._id, !!selectedGroup).then(() => {
                setTimeout(() => {
                    const newHeight = e.target.scrollHeight;
                    e.target.scrollTop = newHeight - currentHeight;
                }, 0);
            });
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!input.trim()) return
        const msgData = { text: input, replyTo: replyingTo?.id }
        if (selectedGroup) await sendGroupMessage(selectedGroup._id, msgData)
        else await sendMessage(msgData)
        setInput("")
        setReplyingTo(null)
        setShowExtras(false)
    }

    const handleSendFile = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onloadend = async () => {
            const fileData = {
                image: reader.result,
                fileName: file.name,
                fileType: file.type,
                replyTo: replyingTo?.id
            }
            if (selectedGroup) await sendGroupMessage(selectedGroup._id, fileData)
            else await sendMessage(fileData)
            setReplyingTo(null)
        }
    }

    const handleSendGif = async (url) => {
        const fileData = { image: url, fileName: 'gif', fileType: 'image/gif', replyTo: replyingTo?.id }
        if (selectedGroup) await sendGroupMessage(selectedGroup._id, fileData)
        else await sendMessage(fileData)
        setIsGifPickerOpen(false)
        setReplyingTo(null)
        setShowExtras(false)
    }

    const handleScheduleMessage = async () => {
        if (!input.trim() || !scheduledTime) return;
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/messages/schedule`, {
                receiverId: selectedUser?._id,
                groupId: selectedGroup?._id,
                text: input,
                scheduledAt: scheduledTime
            }, { withCredentials: true });
            
            if (res.data.success) {
                toast.success('Message scheduled!');
                setInput("");
                setIsScheduleModalOpen(false);
                setShowExtras(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to schedule');
        }
    };

    const toggleVoiceTyping = () => {
        if (!('webkitSpeechRecognition' in window) && !('speechRecognition' in window)) {
            toast.error("Voice typing not supported in this browser");
            return;
        }
        const SpeechRecognition = window.webkitSpeechRecognition || window.speechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        if (isVoiceTyping) {
            setIsVoiceTyping(false);
            return;
        }

        recognition.onstart = () => setIsVoiceTyping(true);
        recognition.onend = () => setIsVoiceTyping(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + (prev ? " " : "") + transcript);
        };
        recognition.start();
    };

    const handleInputChange = (e) => {
        setInput(e.target.value)
        if (socket && selectedUser) {
            socket.emit('typing', { receiverId: selectedUser._id, senderId: authUser._id })
        }
    }

    const onEmojiClick = (emojiData) => {
        setInput(prev => prev + emojiData.emoji)
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)
            const chunks = []
            recorder.ondataavailable = (e) => chunks.push(e.data)
            recorder.onstop = async () => {
                const blob = new Blob(chunks, { type: 'audio/webm' })
                const reader = new FileReader()
                reader.readAsDataURL(blob)
                reader.onloadend = async () => {
                    const base64Audio = reader.result
                    const fileData = { image: base64Audio, fileName: `voice_note.webm`, fileType: 'audio/webm' }
                    if (selectedGroup) await sendGroupMessage(selectedGroup._id, fileData)
                    else await sendMessage(fileData)
                }
                stream.getTracks().forEach(track => track.stop())
            }
            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
            setRecordingTime(0)
        } catch (error) {
            toast.error("Microphone access denied")
        }
    }

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop()
            setIsRecording(false)
        }
    }

    const cancelRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop()
            setIsRecording(false)
            setMediaRecorder(null)
        }
    }

    useEffect(() => {
        let timer;
        if (isRecording) {
            timer = setInterval(() => setRecordingTime(prev => prev + 1), 1000)
        }
        return () => clearInterval(timer)
    }, [isRecording])

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    useEffect(() => {
        if (currentChat) {
            setIsLoading(true)
            if (selectedGroup) getGroupMessages(selectedGroup._id).then(() => setIsLoading(false))
            else getMessages(selectedUser._id).then(() => setIsLoading(false))
        }
    }, [selectedUser?._id, selectedGroup?._id])

    useEffect(() => {
        if (scrollEnd.current && message && !isLoadingMore) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [message, isLoadingMore])

    useEffect(() => {
        const handleClick = (e) => {
            if (!e.target.closest('.context-menu') && !e.target.closest('.message-bubble') && !e.target.closest('.menu-button') && !e.target.closest('.extras-menu')) {
                setContextMenu(null)
                setShowEmoji(false)
                setShowChatMenu(false)
                setShowExtras(false)
            }
        }
        window.addEventListener('click', handleClick)
        return () => window.removeEventListener('click', handleClick)
    }, [])

    // ... (Keeping the rest of the render logic but updating the input area)

    const handlePaste = async (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const fileData = { image: reader.result, fileName: 'pasted_image.png', fileType: 'image/png', replyTo: replyingTo?.id };
                    if (selectedGroup) await sendGroupMessage(selectedGroup._id, fileData);
                    else await sendMessage(fileData);
                    setReplyingTo(null);
                };
            }
        }
    };

    const formatLastSeen = (date) => {
        const now = new Date();
        const lastSeen = new Date(date);
        const diffInMins = Math.floor((now - lastSeen) / 1000 / 60);
        if (diffInMins < 1) return 'just now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)}h ago`;
        return lastSeen.toLocaleDateString();
    }

    const formatDateSeparator = (date) => {
        const d = new Date(date);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) return 'Today';
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    }

    if (!currentChat) return (
        <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden h-full'>
            <img src={assets.logo_icon} alt="" className='max-w-16' />
            <p className='text-lg font-medium text-white'>Chat anytime,anywhere</p>
        </div>
    );

    return (
        <div className='h-full flex flex-col relative overflow-hidden bg-[var(--bg-color)]'>
            {/* header */}
            <div className='flex items-center justify-between pt-8 pb-5 px-4 md:px-6 border-b border-white/10 bg-black/40 backdrop-blur-3xl shrink-0 z-50 min-h-[90px]'>
                <div className='flex items-center gap-3 md:gap-4'>
                    <img onClick={()=>selectedUser ? setSelectedUser(null) : setSelectedGroup(null)} src={assets.arrow_icon} alt="" className='w-5 md:hidden cursor-pointer' />
                    <div className='relative shrink-0'>
                        <img 
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage((selectedUser?.profilePic || selectedGroup?.groupProfile) || assets.avatar_icon);
                            }}
                            src={(selectedUser?.profilePic || selectedGroup?.groupProfile) || assets.avatar_icon} 
                            alt="" 
                            className='w-10 h-10 md:w-12 md:h-12 aspect-square object-cover rounded-full border-2 border-violet-500/50 cursor-pointer hover:border-violet-400 transition-all active:scale-95' 
                        />
                        {selectedUser && onlineUsers?.includes(selectedUser._id) && (
                            <span className='absolute bottom-0 right-0 w-3 h-3 md:w-3.5 md:h-3.5 bg-green-500 border-2 border-[#1a1a1a] rounded-full'></span>
                        )}
                    </div>
                    <div className='flex flex-col cursor-pointer' onClick={()=>setShowProfile(true)}>
                        <h1 className='text-sm md:text-base font-bold text-white leading-tight truncate max-w-[150px] md:max-w-none'>
                            {selectedUser ? (
                                authUser.friends?.some(f => String(f._id || f) === String(selectedUser._id)) ? selectedUser.fullName : (selectedUser.phoneNumber || selectedUser.fullName)
                            ) : selectedGroup?.name}
                        </h1>
                        <div className='flex items-center gap-1.5 mt-0.5'>
                            {selectedUser ? (
                                onlineUsers?.includes(selectedUser._id) ? (
                                    <div className='flex items-center gap-1'>
                                        {typingUser === selectedUser._id ? (
                                            <span className='text-[10px] md:text-xs text-violet-400 font-medium animate-pulse'>typing...</span>
                                        ) : (
                                            <span className='text-[10px] md:text-xs text-green-400 font-medium'>Online</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className='text-[10px] md:text-xs text-gray-400'>{selectedUser.lastSeen ? `Last seen ${formatLastSeen(selectedUser.lastSeen)}` : 'Offline'}</span>
                                )
                            ) : (
                                <span className='text-[10px] md:text-xs text-gray-400 font-medium'>{selectedGroup?.members?.length || 0} members</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className='flex items-center gap-3 md:gap-5'>
                    {showSearch && (
                        <div className='flex items-center bg-white/5 border border-white/10 rounded-xl px-2 md:px-4 py-2 animate-in slide-in-from-right-5 duration-300'>
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='bg-transparent border-none outline-none text-xs md:text-sm text-white w-20 md:w-56'
                            />
                            <button onClick={() => {setShowSearch(false); setSearchQuery("")}} className='text-gray-400 hover:text-white ml-1 md:ml-2 text-lg'>&times;</button>
                        </div>
                    )}
                    <img onClick={() => setShowSearch(!showSearch)} src={assets.search_icon} alt="" className={`w-5 md:w-6 opacity-70 hover:opacity-100 cursor-pointer transition-all hover:scale-110 ${showSearch ? 'brightness-125 opacity-100' : ''}`} />
                    
                    <div className='relative'>
                        <img 
                            onClick={() => setShowChatMenu(!showChatMenu)} 
                            src={assets.menu_icon} 
                            alt="" 
                            className='menu-button w-5 md:w-6 opacity-70 hover:opacity-100 cursor-pointer transition-all hover:rotate-90' 
                        />
                        
                        {showChatMenu && (
                            <div className='absolute right-0 top-10 bg-[#232323] border border-white/10 rounded-xl shadow-2xl py-2 min-w-[180px] md:min-w-[200px] z-[9999] animate-in fade-in zoom-in-95 duration-200 overflow-hidden'>
                                <div onClick={() => { setShowProfile(true); setShowChatMenu(false); }} className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-xs md:text-sm text-gray-200 flex items-center gap-3 transition-colors'><span className='text-lg w-5'>👤</span> View {selectedUser ? 'Contact' : 'Group Info'}</div>
                                <div className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-xs md:text-sm text-gray-200 flex items-center gap-3 transition-colors opacity-50'><span className='text-lg w-5'>🖼️</span> Media, Links and Docs</div>
                                <div className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-xs md:text-sm text-gray-200 flex items-center gap-3 transition-colors opacity-50'><span className='text-lg w-5'>🎨</span> Wallpaper</div>
                                <div className='h-[1px] bg-white/10 my-1'></div>
                                <div onClick={() => { if(window.confirm('Clear all messages in this chat?')) clearChat(selectedUser?._id || selectedGroup?._id, !!selectedGroup); setShowChatMenu(false); }} className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-xs md:text-sm text-gray-200 flex items-center gap-3 transition-colors'><span className='text-lg w-5'>🧹</span> Clear Chat</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pinned Messages Bar */}
            {message.filter(m => m.isPinned).length > 0 && (
                <div className='bg-black/20 backdrop-blur-xl border-b border-white/5 p-2 px-4 md:px-6 flex items-center justify-between group shrink-0'>
                    <div onClick={() => { const pinned = message.filter(m => m.isPinned).reverse(); const lastPinned = pinned[0]; const el = document.getElementById(`msg-${lastPinned._id}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }) }} className='flex items-center gap-3 md:gap-4 overflow-hidden flex-1 cursor-pointer hover:bg-black/10 rounded-lg transition-all p-1 -ml-1'>
                        <div className='w-1 h-8 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]'></div>
                        <div className='overflow-hidden'>
                            <p className='text-[8px] md:text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-0.5'>Pinned Message</p>
                            <p className='text-[10px] md:text-xs text-white/90 truncate max-w-[150px] md:max-w-md'>{message.filter(m => m.isPinned).reverse()[0].text || (message.filter(m => m.isPinned).reverse()[0].image ? "📷 Photo" : "📄 File")}</p>
                        </div>
                    </div>
                    <div className='flex items-center gap-2 md:gap-3'>
                        <span className='text-xs'>📌</span>
                        <button onClick={(e) => { e.stopPropagation(); const pinned = message.filter(m => m.isPinned).reverse(); const lastPinned = pinned[0]; if(lastPinned) pinMessage(lastPinned._id) }} className='w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all text-lg leading-none pb-0.5' title="Unpin message">&times;</button>
                    </div>
                </div>
            )}

            {/* chat area */}
            <div ref={chatContainerRef} onScroll={handleScroll} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }} onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { const file = e.dataTransfer.files[0]; const reader = new FileReader(); reader.onloadend = async () => { const fileData = { image: reader.result, fileName: file.name, fileType: file.type }; if (selectedGroup) await sendGroupMessage(selectedGroup._id, { ...fileData, replyTo: replyingTo?.id }); else await sendMessage({ ...fileData, replyTo: replyingTo?.id }); setReplyingTo(null); }; reader.readAsDataURL(file); } }} className='flex-1 flex flex-col overflow-y-auto p-4 pb-8 gap-4 md:gap-6 relative' style={{ backgroundImage: authUser.wallpaper ? `url(${authUser.wallpaper})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
                {isDragging && <div className='absolute inset-0 z-50 bg-violet-600/20 backdrop-blur-sm border-2 border-dashed border-violet-500 rounded-xl flex items-center justify-center pointer-events-none'><div className='bg-black/50 p-6 rounded-2xl flex flex-col items-center gap-3'><span className='text-4xl'>📂</span><p className='text-white font-bold tracking-widest uppercase'>Drop file to send</p></div></div>}
                {isLoadingMore && <div className='flex justify-center py-2'><div className='w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin'></div></div>}
                {authUser.wallpaper && <div className='absolute inset-0 bg-black/30 pointer-events-none'></div>}
                {isLoading ? <ChatSkeleton /> : message.map((msg, index) => { const prevMsg = message[index - 1]; const showDateSeparator = !prevMsg || new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString(); return ( <React.Fragment key={msg._id}> {showDateSeparator && <div className='flex justify-center my-4 md:my-6'><div className='bg-white/5 backdrop-blur-md border border-white/5 px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-sm'>{formatDateSeparator(msg.createdAt)}</div></div>} <div ref={index === message.length - 1 ? scrollEnd : null} id={`msg-${msg._id}`} className={`flex flex-col ${String(msg.senderId?._id || msg.senderId) === String(authUser._id) ? 'items-end' : 'items-start'} group transition-all duration-300`}> <div className='flex items-end gap-2 max-w-[85%] md:max-w-[75%]'> {String(msg.senderId?._id || msg.senderId) !== String(authUser._id) && selectedGroup && ( <img src={msg.senderId?.profilePic || assets.avatar_icon} className='w-6 h-6 md:w-8 md:h-8 rounded-full border border-white/10 shrink-0 mb-1 object-cover' title={msg.senderId?.fullName} /> )} <div className={`message-bubble relative p-2.5 md:p-3.5 rounded-2xl md:rounded-[22px] transition-all duration-300 ${String(msg.senderId?._id || msg.senderId) === String(authUser._id) ? 'bg-[var(--accent-gradient)] text-white rounded-br-none shadow-[0_4px_15px_rgba(124,58,237,0.3)]' : 'bg-white/5 text-gray-200 rounded-bl-none border border-white/5'} ${msg.isPinned ? 'ring-2 ring-violet-500/50' : ''}`} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, msgId: msg._id, senderId: msg.senderId?._id || msg.senderId, isPinned: msg.isPinned }); }}> {msg.replyTo && ( <div onClick={() => { const el = document.getElementById(`msg-${msg.replyTo._id}`); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }) }} className='mb-2 p-2 bg-black/20 rounded-xl border-l-4 border-violet-500 cursor-pointer hover:bg-black/30 transition-all'> <p className='text-[10px] font-black text-violet-400 uppercase tracking-widest mb-0.5'>Replying to</p> <p className='text-[10px] opacity-70 truncate'>{msg.replyTo.text || (msg.replyTo.image ? "📷 Photo" : "📄 File")}</p> </div> )} {msg.image && ( <div className='relative mb-2 group/img overflow-hidden rounded-xl bg-black/20'> {msg.fileType?.startsWith('audio/') ? ( <div className='p-3 md:p-4 flex items-center gap-3 md:gap-4 bg-white/5 min-w-[200px] md:min-w-[250px]'> <div className='w-10 h-10 md:w-12 md:h-12 bg-violet-600 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-violet-600/20'>🎙️</div> <div className='flex-1'><div className='h-1.5 md:h-2 bg-white/10 rounded-full overflow-hidden'><div className='h-full bg-violet-500 w-[40%] animate-pulse'></div></div><p className='text-[10px] text-gray-400 mt-2 font-medium'>Voice message • {msg.fileName?.split('_').pop()?.split('.')[0] || 'Recording'}</p></div> </div> ) : ( <img onClick={() => setSelectedImage(msg.image)} src={msg.image} alt="" className='max-w-full rounded-xl cursor-pointer hover:scale-105 transition-all duration-500' /> )} <a href={msg.image} download={msg.fileName || 'file'} className='absolute top-2 right-2 p-2 bg-black/60 rounded-xl opacity-0 group-hover/img:opacity-100 transition-all text-xs hover:bg-violet-600'>⬇️</a> </div> )} {msg.text && <p className='text-xs md:text-sm leading-relaxed whitespace-pre-wrap'>{msg.text}</p>} <div className='flex items-center justify-end gap-1.5 mt-1 opacity-60'> <span className='text-[8px] md:text-[10px] font-medium'>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> {String(msg.senderId?._id || msg.senderId) === String(authUser._id) && ( <span className={`text-[8px] md:text-[10px] ${msg.isRead ? 'text-blue-400 font-black' : ''}`}>{msg.isRead ? '✓✓' : '✓'}</span> )} </div> </div> </div> </div> </React.Fragment> ); })}
            </div>

            {/* Input Bar */}
            <div className='p-3 md:p-6 bg-black/40 backdrop-blur-3xl border-t border-white/10 relative'>
                {replyingTo && (
                    <div className='absolute bottom-full left-0 right-0 p-3 md:p-4 bg-violet-600/10 backdrop-blur-xl border-t border-white/5 flex items-center justify-between animate-in slide-in-from-bottom duration-300'>
                        <div className='flex items-center gap-3 md:gap-4'>
                            <div className='w-1 bg-violet-500 h-8 rounded-full'></div>
                            <div className='overflow-hidden'>
                                <p className='text-[10px] font-black text-violet-400 uppercase tracking-widest mb-0.5'>Replying to {replyingTo.name}</p>
                                <p className='text-xs text-white/70 truncate max-w-[250px] md:max-w-md'>{replyingTo.text}</p>
                            </div>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className='w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xl leading-none'>&times;</button>
                    </div>
                )}

                <div className='flex items-center gap-2 md:gap-4 max-w-7xl mx-auto'>
                    {isRecording ? (
                        <div className='flex-1 flex items-center justify-between bg-red-500/10 border border-red-500/20 px-3 md:px-4 py-2 rounded-2xl'>
                            <div className='flex items-center gap-2 md:gap-3'>
                                <span className='w-2 h-2 bg-red-500 rounded-full animate-ping'></span>
                                <span className='text-xs md:text-sm text-red-500 font-bold'>{formatTime(recordingTime)}</span>
                            </div>
                            <div className='flex items-center gap-3 md:gap-6'>
                                <button onClick={cancelRecording} className='text-gray-400 hover:text-white text-[10px] md:text-xs font-medium uppercase tracking-wider'>Cancel</button>
                                <button onClick={stopRecording} className='bg-violet-600 text-white p-1.5 md:p-2 px-3 md:px-4 rounded-xl shadow-lg hover:bg-violet-500 transition-all text-[10px] md:text-xs'>Send Voice 🎙️</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className='flex-1 flex items-center bg-white/5 border border-white/10 px-2 md:px-3 rounded-2xl relative transition-all focus-within:bg-white/10'>
                                <p onClick={(e) => {e.stopPropagation(); setShowEmoji(!showEmoji)}} className='cursor-pointer text-lg md:text-xl grayscale hover:grayscale-0 transition-all mr-1 md:mr-2'>😊</p>
                                
                                {showEmoji && (
                                    <div className='absolute bottom-full mb-4 left-0 z-50 animate-in fade-in zoom-in-95' onClick={(e) => e.stopPropagation()}>
                                        <EmojiPicker theme="dark" onEmojiClick={onEmojiClick} width={window.innerWidth < 400 ? 280 : 350} />
                                    </div>
                                )}

                                <input type="text" onChange={handleInputChange} value={input} onKeyDown={(e)=>e.key==='Enter' ? handleSendMessage(e):null} onPaste={handlePaste} placeholder={isVoiceTyping ? 'Listening...' : 'Message...'} className={`flex-1 text-xs md:text-sm p-2.5 md:p-3 border-none rounded-lg outline-none text-white bg-transparent ${isVoiceTyping ? 'placeholder-violet-400' : 'placeholder-gray-500'}`} />
                                
                                {/* Desktop Icons */}
                                <div className='hidden md:flex items-center'>
                                    <div onClick={toggleVoiceTyping} className={`text-xl cursor-pointer mr-2 transition-all ${isVoiceTyping ? 'text-violet-500 animate-pulse drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'text-gray-500 hover:text-white'}`} title="Voice Typing">🗣️</div>
                                    <div onClick={() => setIsGifPickerOpen(!isGifPickerOpen)} className='text-gray-500 hover:text-violet-400 transition-colors mr-3 text-[10px] font-bold border border-gray-500 hover:border-violet-400 px-1.5 py-0.5 rounded cursor-pointer relative'>
                                        GIF
                                        {isGifPickerOpen && <div className='absolute bottom-full mb-4 right-0 z-[60] bg-stone-900 border border-white/10 p-3 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 w-72 h-80 flex flex-col cursor-default' onClick={(e) => e.stopPropagation()}><input type="text" autoFocus placeholder="Search GIFs..." value={gifSearch} onChange={(e) => setGifSearch(e.target.value)} className='w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500 transition-all mb-3' /><div className='flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-1 custom-scrollbar'>{gifs.map(gif => (<img key={gif.id} src={gif.media[0]?.tinygif?.url} alt="gif" className='w-full h-24 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all' onClick={() => handleSendGif(gif.media[0]?.gif?.url || gif.media[0]?.tinygif?.url)} />))}</div></div>}
                                    </div>
                                    <div onClick={() => setIsScheduleModalOpen(!isScheduleModalOpen)} className='text-gray-500 hover:text-violet-400 transition-colors mr-3 text-lg relative cursor-pointer'>
                                        📅
                                        {isScheduleModalOpen && <div className='absolute bottom-full mb-4 right-0 z-[60] bg-stone-900 border border-white/10 p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 w-72 cursor-default' onClick={(e) => e.stopPropagation()}><h3 className='text-xs font-bold text-violet-400 uppercase tracking-widest mb-3'>Schedule Message</h3><input type="datetime-local" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className='w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500 transition-all mb-4' /><div className='flex gap-2'><button onClick={() => setIsScheduleModalOpen(false)} className='flex-1 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors'>Cancel</button><button onClick={handleScheduleMessage} disabled={!scheduledTime} className='flex-1 py-2 bg-violet-600 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white hover:bg-violet-500 transition-all disabled:opacity-50'>Schedule</button></div></div>}
                                    </div>
                                </div>

                                {/* Mobile "Plus" Extras Menu */}
                                <div className='md:hidden relative extras-menu'>
                                    <button onClick={() => setShowExtras(!showExtras)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${showExtras ? 'bg-violet-600 text-white rotate-45' : 'text-gray-400 hover:text-white'}`}>
                                        <span className='text-2xl font-light'>+</span>
                                    </button>
                                    
                                    {showExtras && (
                                        <div className='absolute bottom-full mb-4 right-0 bg-stone-900 border border-white/10 p-2 rounded-2xl shadow-2xl flex flex-col gap-2 z-[70] animate-in slide-in-from-bottom-2 duration-200'>
                                            <div onClick={toggleVoiceTyping} className={`p-3 rounded-xl flex items-center gap-3 ${isVoiceTyping ? 'bg-violet-600/20 text-violet-400' : 'hover:bg-white/5'}`}>
                                                <span className='text-xl'>🗣️</span> <span className='text-xs font-bold'>Voice typing</span>
                                            </div>
                                            <div onClick={() => {setIsGifPickerOpen(true); setShowExtras(false)}} className='p-3 rounded-xl flex items-center gap-3 hover:bg-white/5'>
                                                <span className='text-xl font-bold text-gray-400'>GIF</span> <span className='text-xs font-bold'>Send GIF</span>
                                            </div>
                                            <div onClick={() => {setIsScheduleModalOpen(true); setShowExtras(false)}} className='p-3 rounded-xl flex items-center gap-3 hover:bg-white/5'>
                                                <span className='text-xl'>📅</span> <span className='text-xs font-bold'>Schedule</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <input type="file" onChange={handleSendFile} id="image" accept='*' hidden />
                                <label htmlFor="image">
                                    <img src={assets.gallery_icon} alt="" className='w-5 mr-3 md:mr-4 cursor-pointer opacity-50 hover:opacity-100 transition-opacity' />
                                </label>

                                <button onClick={startRecording} className='text-gray-500 hover:text-violet-400 transition-colors mr-1 text-lg'>🎙️</button>
                            </div>
                            <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-8 md:w-9 cursor-pointer hover:scale-110 active:scale-95 transition-transform shrink-0' />
                        </>
                    )}
                </div>
            </div>

            <ForwardModal isOpen={isForwardModalOpen} onClose={() => setIsForwardModalOpen(false)} messageData={forwardData} />
            
            {contextMenu && (
                <div className='context-menu fixed bg-[#232323] border border-white/10 rounded-xl shadow-2xl py-2 min-w-[180px] z-[9999] animate-in fade-in zoom-in-95 duration-200 overflow-hidden' style={{ top: contextMenu.y, left: contextMenu.x }}>
                    <div onClick={() => { setReplyingTo({ id: contextMenu.msgId, text: message.find(m => m._id === contextMenu.msgId)?.text || "Media", name: message.find(m => m._id === contextMenu.msgId)?.senderId?.fullName || "User" }); setContextMenu(null); }} className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-xs text-gray-200 flex items-center gap-3 transition-colors'><span className='text-lg w-5'>↩️</span> Reply</div>
                    <div onClick={() => { setForwardData(message.find(m => m._id === contextMenu.msgId)); setIsForwardModalOpen(true); setContextMenu(null); }} className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-xs text-gray-200 flex items-center gap-3 transition-colors'><span className='text-lg w-5'>➡️</span> Forward</div>
                    <div onClick={() => { pinMessage(contextMenu.msgId); setContextMenu(null); }} className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-xs text-gray-200 flex items-center gap-3 transition-colors'><span className='text-lg w-5'>📌</span> {contextMenu.isPinned ? 'Unpin' : 'Pin'}</div>
                    <div className='h-[1px] bg-white/10 my-1'></div>
                    {String(contextMenu.senderId) === String(authUser._id) && (
                        <div onClick={() => { if(window.confirm('Delete this message?')) deleteMessage(contextMenu.msgId); setContextMenu(null); }} className='px-4 py-2.5 hover:bg-red-500/10 cursor-pointer text-xs text-red-400 flex items-center gap-3 transition-colors'><span className='text-lg w-5'>🗑️</span> Delete Message</div>
                    )}
                </div>
            )}

            {selectedImage && (
                <div className='fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300' onClick={() => setSelectedImage(null)}>
                    <button className='absolute top-6 right-6 text-white text-4xl hover:text-gray-300 transition-colors'>&times;</button>
                    <img src={selectedImage} className='max-w-full max-h-[80vh] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300' alt="Preview" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    )
}

export default ChatContainer