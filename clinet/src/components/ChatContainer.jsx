import React, { useContext, useEffect, useRef, useState } from 'react'
import assets from '../assets/assets'
import { formatMessageTIme, formatLastSeen, formatDateSeparator } from '../lib/utils'
import { ChatContext } from '../../context/ChatContext'
import { AuthContext } from '../../context/AuthContext'
import toast from 'react-hot-toast'
import EmojiPicker from 'emoji-picker-react'
import ForwardModal from './ForwardModal'
import MessageInfoModal from './MessageInfoModal'
import { ChatSkeleton } from './Skeleton'

const ChatContainer = () => {
    const { 
        message, getMessages, selectedUser, setSelectedUser, sendMessage, 
        setShowProfile, typingUser, editMessage, deleteMessage, 
        selectedGroup, setSelectedGroup, sendGroupMessage, getGroupMessages,
        reactToMessage, starMessage, forwardMessage, pinMessage, isLoading,
        hasMore, isLoadingMore, getMoreMessages, viewingUser, setViewingUser,
        scheduleMessage, translateText, clearChat, deleteChat
    } = useContext(ChatContext)
    const { authUser, onlineUsers, socket } = useContext(AuthContext)

    const scrollEnd = useRef()
    const [input, setInput] = useState("")
    const [editingMessage, setEditingMessage] = useState(null)
    const [editInput, setEditInput] = useState("")
    const [showEmoji, setShowEmoji] = useState(false)
    const [contextMenu, setContextMenu] = useState(null)
    const [isTyping, setIsTyping] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [mediaRecorder, setMediaRecorder] = useState(null)
    const [replyingTo, setReplyingTo] = useState(null)
    const [isForwardModalOpen, setIsForwardModalOpen] = useState(false)
    const [forwardData, setForwardData] = useState(null)
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
    const [scheduledTime, setScheduledTime] = useState('')
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
    const [infoData, setInfoData] = useState(null)
    const [selectedImage, setSelectedImage] = useState(null)
    const [translatedMessages, setTranslatedMessages] = useState({}) // {msgId: translatedText}
    const [isVoiceTyping, setIsVoiceTyping] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isGifPickerOpen, setIsGifPickerOpen] = useState(false)
    const [gifSearch, setGifSearch] = useState("")
    const [gifs, setGifs] = useState([])
    const typingTimeoutRef = useRef(null)
    const speechRecognitionRef = useRef(null)
    const recordingIntervalRef = useRef(null)
    const [showChatMenu, setShowChatMenu] = useState(false)

    const senderColors = [
        'text-blue-400', 'text-green-400', 'text-yellow-400', 
        'text-pink-400', 'text-purple-400', 'text-orange-400', 
        'text-cyan-400', 'text-red-400'
    ]

    const getSenderColor = (senderId) => {
        if (!senderId) return 'text-violet-400'
        const idString = typeof senderId === 'string' ? senderId : senderId._id || ''
        const index = idString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        return senderColors[index % senderColors.length]
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!input.trim()) return

        if (socket && selectedUser) {
            socket.emit("stopTyping", selectedUser._id)
        }

        if (selectedGroup) {
            await sendGroupMessage(selectedGroup._id, { text: input.trim(), replyTo: replyingTo?.id })
        } else {
            await sendMessage({ text: input.trim(), replyTo: replyingTo?.id })
        }
        
        setInput("")
        setIsTyping(false)
        setReplyingTo(null)
    }

    const handleInputChange = (e) => {
        setInput(e.target.value)
        if (!socket) return

        if (!isTyping) {
            setIsTyping(true)
            socket.emit("typing", { 
                receiverId: selectedUser?._id, 
                groupId: selectedGroup?._id 
            })
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stopTyping", { 
                receiverId: selectedUser?._id, 
                groupId: selectedGroup?._id 
            })
            setIsTyping(false)
        }, 2000)
    }

    const handleEditMessage = async (e) => {
        e.preventDefault()
        if (editInput.trim() === "" || editInput === editingMessage.text) {
            setEditingMessage(null)
            return
        }
        await editMessage(editingMessage.id, editInput.trim())
        setEditingMessage(null)
        setEditInput("")
    }

    const handleSendFile = async (e)=>{
       const file = e.target.files[0]
       if(!file) return

    const reader=new FileReader()
    reader.onloadend =async ()=>{
      const fileData = {
        image:reader.result, 
        fileName: file.name,
        fileType: file.type
      }
      if (selectedGroup) {
        await sendGroupMessage(selectedGroup._id, { ...fileData, replyTo: replyingTo?.id })
      } else {
        await sendMessage({ ...fileData, replyTo: replyingTo?.id })
      }
      e.target.value="" 
      setReplyingTo(null)
    }
    reader.readAsDataURL(file)
    }

    const handlePaste = async (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const fileData = {
                        image: reader.result,
                        fileName: `pasted_image.png`,
                        fileType: blob.type
                    };
                    if (selectedGroup) {
                        await sendGroupMessage(selectedGroup._id, { ...fileData, replyTo: replyingTo?.id });
                    } else {
                        await sendMessage({ ...fileData, replyTo: replyingTo?.id });
                    }
                    setReplyingTo(null);
                    toast.success("Image pasted and sent!");
                };
                reader.readAsDataURL(blob);
                e.preventDefault();
                break;
            }
        }
    }

    const handleScheduleMessage = async (e) => {
        e.preventDefault()
        if (!input.trim() || !scheduledTime) return

        const messagedata = {
            text: input,
            scheduledTime,
            receiverId: selectedUser?._id,
            groupId: selectedGroup?._id
        }

        await scheduleMessage(messagedata)
        setInput('')
        setScheduledTime('')
        setIsScheduleModalOpen(false)
    }

    const handleTranslate = async (msgId, text) => {
        const translated = await translateText(text, 'mr')
        if (translated) {
            setTranslatedMessages(prev => ({ ...prev, [msgId]: translated }))
        }
    }

    useEffect(() => {
        if (isGifPickerOpen) {
            const fetchGifs = async () => {
                try {
                    const q = gifSearch || "trending";
                    const res = await fetch(`https://api.tenor.com/v1/search?q=${q}&key=LIVDSRZULELA&limit=12`);
                    const data = await res.json();
                    setGifs(data.results || []);
                } catch (error) {
                    console.error("Error fetching GIFs:", error);
                }
            };
            const debounce = setTimeout(fetchGifs, 500);
            return () => clearTimeout(debounce);
        }
    }, [gifSearch, isGifPickerOpen]);

    const handleSendGif = (gifUrl) => {
        const messageData = {
            image: gifUrl,
            fileType: 'image/gif'
        };
        if (selectedGroup) {
            sendGroupMessage(selectedGroup._id, { ...messageData, replyTo: replyingTo?.id });
        } else {
            sendMessage({ ...messageData, replyTo: replyingTo?.id });
        }
        setIsGifPickerOpen(false);
        setReplyingTo(null);
    };

    useEffect(() => {
        if (selectedUser) {
            getMessages(selectedUser._id)
        }
        if (selectedGroup) {
            getGroupMessages(selectedGroup._id)
            setViewingUser(null)
        }
    }, [selectedUser, selectedGroup])

    const chatContainerRef = useRef(null)

    const handleScroll = async (e) => {
        if (e.target.scrollTop === 0 && hasMore && !isLoadingMore) {
            const oldScrollHeight = e.target.scrollHeight
            await getMoreMessages()
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight - oldScrollHeight
                }
            }, 0)
        }
    }

    useEffect(() => {
        if (scrollEnd.current && message && !isLoadingMore) {
            scrollEnd.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [message, isLoadingMore])

    useEffect(() => {
        const handleClick = (e) => {
            // Only close if the click is outside the context menu and not on a message bubble
            if (!e.target.closest('.context-menu') && !e.target.closest('.message-bubble') && !e.target.closest('.menu-button')) {
                setContextMenu(null)
                setShowEmoji(false)
                setShowChatMenu(false)
            }
        }
        window.addEventListener('click', handleClick)
        return () => window.removeEventListener('click', handleClick)
    }, [])

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
                    const fileData = {
                        image: base64Audio,
                        fileName: `voice_note_${Date.now()}.webm`,
                        fileType: 'audio/webm'
                    }
                    if (selectedGroup) await sendGroupMessage(selectedGroup._id, fileData)
                    else await sendMessage(fileData)
                }
                stream.getTracks().forEach(track => track.stop())
            }

            recorder.start()
            setMediaRecorder(recorder)
            setIsRecording(true)
            setRecordingTime(0)
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
        } catch (error) {
            toast.error("Microphone access denied")
        }
    }

    const stopRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.stop()
            setIsRecording(false)
            clearInterval(recordingIntervalRef.current)
        }
    }

    const cancelRecording = () => {
        if (mediaRecorder) {
            mediaRecorder.onstop = null
            mediaRecorder.stop()
            setIsRecording(false)
            clearInterval(recordingIntervalRef.current)
            mediaRecorder.stream.getTracks().forEach(track => track.stop())
        }
    }

    const toggleVoiceTyping = () => {
        if (isVoiceTyping) {
            speechRecognitionRef.current?.stop()
            setIsVoiceTyping(false)
            return
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            toast.error("Voice typing is not supported in this browser.")
            return
        }

        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        // Let it default to browser language or set to Marathi
        // recognition.lang = 'mr-IN' 

        recognition.onstart = () => setIsVoiceTyping(true)
        
        recognition.onresult = (event) => {
            let finalTranscript = ''
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript + ' '
                }
            }
            if (finalTranscript) {
                setInput(prev => prev + finalTranscript)
            }
        }

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error)
            setIsVoiceTyping(false)
        }

        recognition.onend = () => setIsVoiceTyping(false)

        recognition.start()
        speechRecognitionRef.current = recognition
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const downloadFile = (url, fileName) => {
        let downloadUrl = url;
        if (url.includes("cloudinary.com")) {
            downloadUrl = url.replace("/upload/", "/upload/fl_attachment/");
        }
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', fileName);
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        link.remove();
    }

    const currentChat = selectedUser || selectedGroup;

    const renderMessageText = (text) => {
        if (!text) return null;
        if (text.includes('```')) {
            const parts = text.split('```');
            return parts.map((part, index) => {
                if (index % 2 === 1) {
                    const firstNewline = part.indexOf('\n');
                    let language = 'code';
                    let code = part;
                    if (firstNewline !== -1 && firstNewline < 15) {
                        language = part.substring(0, firstNewline).trim() || 'code';
                        code = part.substring(firstNewline + 1);
                    }
                    return (
                        <div key={index} className='my-2 rounded-xl overflow-hidden border border-white/20 bg-[#1e1e1e]' onClick={(e) => e.stopPropagation()}>
                            <div className='flex items-center justify-between px-3 py-1.5 bg-[#2d2d2d] border-b border-white/10'>
                                <span className='text-[10px] text-gray-400 font-mono lowercase'>{language}</span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        navigator.clipboard.writeText(code);
                                        toast.success("Code copied!");
                                    }}
                                    className='text-[10px] flex items-center gap-1 text-gray-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer z-50'
                                >
                                    📋 Copy
                                </button>
                            </div>
                            <pre className='p-3 overflow-x-auto text-xs font-mono text-gray-300 m-0'>
                                <code>{code}</code>
                            </pre>
                        </div>
                    );
                } else if (part.trim()) {
                    return <span key={index} className='whitespace-pre-wrap'>{part}</span>;
                }
                return null;
            });
        }
        return <span className='whitespace-pre-wrap'>{text}</span>;
    };

    if (!currentChat) return (
        <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden h-full'>
            <img src={assets.logo_icon} alt="" className='max-w-16' />
            <p className='text-lg font-medium text-white'>Chat anytime,anywhere</p>
        </div>
    );

    return (
        <div className='h-full flex flex-col relative overflow-hidden bg-[var(--bg-color)]'>
            {/* header */}
            <div className='flex items-center justify-between pt-8 pb-5 px-6 border-b border-white/10 bg-black/40 backdrop-blur-3xl shrink-0 z-50 min-h-[90px]'>
                <div className='flex items-center gap-4'>
                    <img onClick={()=>selectedUser ? setSelectedUser(null) : setSelectedGroup(null)} src={assets.arrow_icon} alt="" className='w-5 md:hidden cursor-pointer' />
                    <div className='relative shrink-0'>
                        <img 
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedImage((selectedUser?.profilePic || selectedGroup?.groupProfile) || assets.avatar_icon);
                            }}
                            src={(selectedUser?.profilePic || selectedGroup?.groupProfile) || assets.avatar_icon} 
                            alt="" 
                            className='w-12 h-12 aspect-square object-cover rounded-full border-2 border-violet-500/50 cursor-pointer hover:border-violet-400 transition-all active:scale-95' 
                        />
                        {selectedUser && onlineUsers.includes(selectedUser._id) && (
                            <span className='absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1a1a1a] rounded-full'></span>
                        )}
                    </div>
                    <div className='flex flex-col cursor-pointer' onClick={()=>setShowProfile(true)}>
                        <h1 className='text-base font-bold text-white leading-tight'>
                            {selectedUser ? (
                                authUser.friends?.some(f => String(f._id || f) === String(selectedUser._id)) ? selectedUser.fullName : (selectedUser.phoneNumber || selectedUser.fullName)
                            ) : selectedGroup?.name}
                        </h1>
                        <div className='flex items-center gap-1.5 mt-0.5'>
                            {selectedUser ? (
                                onlineUsers.includes(selectedUser._id) ? (
                                    <div className='flex items-center gap-1'>
                                        {typingUser === selectedUser._id ? (
                                            <span className='text-xs text-violet-400 font-medium animate-pulse'>typing...</span>
                                        ) : (
                                            <span className='text-xs text-green-400 font-medium'>Online</span>
                                        )}
                                    </div>
                                ) : (
                                    <span className='text-xs text-gray-400'>{selectedUser.lastSeen ? `Last seen ${formatLastSeen(selectedUser.lastSeen)}` : 'Offline'}</span>
                                )
                            ) : (
                                <span className='text-xs text-gray-400 font-medium'>{selectedGroup?.members?.length || 0} members</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className='flex items-center gap-5'>
                    {showSearch && (
                        <div className='flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2 animate-in slide-in-from-right-5 duration-300'>
                            <input 
                                autoFocus
                                type="text" 
                                placeholder="Search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className='bg-transparent border-none outline-none text-sm text-white w-32 md:w-56'
                            />
                            <button onClick={() => {setShowSearch(false); setSearchQuery("")}} className='text-gray-400 hover:text-white ml-2 text-xl'>&times;</button>
                        </div>
                    )}
                    <img onClick={() => setShowSearch(!showSearch)} src={assets.search_icon} alt="" className={`w-6 opacity-70 hover:opacity-100 cursor-pointer transition-all hover:scale-110 ${showSearch ? 'brightness-125 opacity-100' : ''}`} />
                    
                    <div className='relative'>
                        <img 
                            onClick={() => setShowChatMenu(!showChatMenu)} 
                            src={assets.menu_icon} 
                            alt="" 
                            className='menu-button w-6 opacity-70 hover:opacity-100 cursor-pointer transition-all hover:rotate-90' 
                        />
                        
                        {showChatMenu && (
                            <div className='absolute right-0 top-10 bg-[#232323] border border-white/10 rounded-xl shadow-2xl py-2 min-w-[200px] z-[9999] animate-in fade-in zoom-in-95 duration-200 overflow-hidden'>
                                <div 
                                    onClick={() => { setShowProfile(true); setShowChatMenu(false); }}
                                    className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-sm text-gray-200 flex items-center gap-3 transition-colors'
                                >
                                    <span className='text-lg w-5'>👤</span> View {selectedUser ? 'Contact' : 'Group Info'}
                                </div>
                                <div 
                                    className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-sm text-gray-200 flex items-center gap-3 transition-colors opacity-50'
                                >
                                    <span className='text-lg w-5'>🖼️</span> Media, Links and Docs
                                </div>
                                <div 
                                    className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-sm text-gray-200 flex items-center gap-3 transition-colors opacity-50'
                                >
                                    <span className='text-lg w-5'>🔇</span> Mute Notifications
                                </div>
                                <div 
                                    className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-sm text-gray-200 flex items-center gap-3 transition-colors opacity-50'
                                >
                                    <span className='text-lg w-5'>🎨</span> Wallpaper
                                </div>
                                <div className='h-[1px] bg-white/10 my-1'></div>
                                <div 
                                    onClick={() => {
                                        if(window.confirm('Clear all messages in this chat?')) {
                                            clearChat(selectedUser?._id || selectedGroup?._id, !!selectedGroup);
                                        }
                                        setShowChatMenu(false);
                                    }}
                                    className='px-4 py-2.5 hover:bg-white/5 cursor-pointer text-sm text-gray-200 flex items-center gap-3 transition-colors'
                                >
                                    <span className='text-lg w-5'>🧹</span> Clear Chat
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pinned Messages Bar */}
            {message.filter(m => m.isPinned).length > 0 && (
                <div 
                    className='bg-black/20 backdrop-blur-xl border-b border-white/5 p-2 px-6 flex items-center justify-between group shrink-0'
                >
                    <div 
                        onClick={() => {
                            const pinned = message.filter(m => m.isPinned).reverse()
                            const lastPinned = pinned[0]
                            const el = document.getElementById(`msg-${lastPinned._id}`)
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
                        }}
                        className='flex items-center gap-4 overflow-hidden flex-1 cursor-pointer hover:bg-black/10 rounded-lg transition-all p-1 -ml-1'
                    >
                        <div className='w-1 h-8 bg-violet-500 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]'></div>
                        <div className='overflow-hidden'>
                            <p className='text-[10px] font-black text-violet-400 uppercase tracking-[0.2em] mb-0.5'>Pinned Message</p>
                            <p className='text-xs text-white/90 truncate max-w-[200px] md:max-w-md'>
                                {message.filter(m => m.isPinned).reverse()[0].text || (message.filter(m => m.isPinned).reverse()[0].image ? "📷 Photo" : "📄 File")}
                            </p>
                        </div>
                    </div>
                    <div className='flex items-center gap-3'>
                        <span className='text-xs'>📌</span>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                const pinned = message.filter(m => m.isPinned).reverse()
                                const lastPinned = pinned[0]
                                if(lastPinned) pinMessage(lastPinned._id)
                            }} 
                            className='w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all text-lg leading-none pb-0.5'
                            title="Unpin message"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {/* chat area */}
            <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        const file = e.dataTransfer.files[0];
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            const fileData = {
                                image: reader.result,
                                fileName: file.name,
                                fileType: file.type
                            };
                            if (selectedGroup) {
                                await sendGroupMessage(selectedGroup._id, { ...fileData, replyTo: replyingTo?.id });
                            } else {
                                await sendMessage({ ...fileData, replyTo: replyingTo?.id });
                            }
                            setReplyingTo(null);
                        };
                        reader.readAsDataURL(file);
                    }
                }}
                className='flex-1 flex flex-col overflow-y-auto p-4 pb-8 gap-6 relative'
                style={{ 
                    backgroundImage: authUser.wallpaper ? `url(${authUser.wallpaper})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                {isDragging && (
                    <div className='absolute inset-0 z-50 bg-violet-600/20 backdrop-blur-sm border-2 border-dashed border-violet-500 rounded-xl flex items-center justify-center pointer-events-none'>
                        <div className='bg-black/50 p-6 rounded-2xl flex flex-col items-center gap-3'>
                            <span className='text-4xl'>📂</span>
                            <p className='text-white font-bold tracking-widest uppercase'>Drop file to send</p>
                        </div>
                    </div>
                )}
                {isLoadingMore && (
                    <div className='flex justify-center py-2'>
                        <div className='w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin'></div>
                    </div>
                )}
                {authUser.wallpaper && <div className='absolute inset-0 bg-black/30 pointer-events-none'></div>}
                
                {isLoading ? (
                    <ChatSkeleton />
                ) : message.filter(msg => !searchQuery || msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) || msg.fileName?.toLowerCase().includes(searchQuery.toLowerCase())).map((msg, index) => {
                    const prevMsg = message[index - 1];
                    const showDateSeparator = !prevMsg || new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

                    return (
                        <React.Fragment key={msg._id}>
                            {showDateSeparator && (
                                <div className='flex justify-center my-6'>
                                    <div className='bg-white/5 backdrop-blur-md border border-white/5 px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest shadow-sm'>
                                        {formatDateSeparator(msg.createdAt)}
                                    </div>
                                </div>
                            )}
                            
                            <div id={`msg-${msg._id}`} className={`flex items-start gap-3 ${msg.isSystemMessage ? 'justify-center w-full' : (msg.senderId === authUser._id || msg.senderId?._id === authUser._id ? 'flex-row-reverse' : '')}`}>
                                {!msg.isSystemMessage && (
                                    <img 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const sender = msg.senderId === authUser._id || msg.senderId?._id === authUser._id ? authUser : msg.senderId;
                                            setViewingUser(sender);
                                        }}
                                        src={(msg.senderId === authUser._id || msg.senderId?._id === authUser._id ? authUser.profilePic : msg.senderId?.profilePic) || assets.avatar_icon} 
                                        className='w-8 h-8 rounded-full object-cover border border-white/20 cursor-pointer hover:border-violet-500 transition-all' 
                                        alt='' 
                                    />
                                )}

                                <div className={`flex flex-col ${msg.isSystemMessage ? 'items-center max-w-full' : (msg.senderId === authUser._id || msg.senderId?._id === authUser._id ? 'items-end max-w-[70%]' : 'items-start max-w-[70%]')}`}>
                                    {msg.isSystemMessage ? (
                                        <div className='bg-white/5 backdrop-blur-md px-4 py-1 rounded-full border border-white/5'>
                                            <p className='text-[10px] text-gray-400 font-medium italic'>{msg.text}</p>
                                        </div>
                                    ) : editingMessage?.id === msg._id ? (
                                        <form onSubmit={handleEditMessage} className='w-full'>
                                            <input 
                                                autoFocus
                                                className='w-full p-2 text-sm bg-white/10 text-white rounded-xl border border-violet-500 outline-none'
                                                value={editInput}
                                                onChange={(e) => setEditInput(e.target.value)}
                                                onBlur={() => setEditingMessage(null)}
                                            />
                                        </form>
                                    ) : (
                                        <>
                                            <div 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    console.log("Message clicked:", msg._id);
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    
                                                    setContextMenu(contextMenu?.id === msg._id ? null : {
                                                        id: msg._id, 
                                                        text: msg.text,
                                                        isSender: msg.senderId === authUser._id || msg.senderId?._id === authUser._id,
                                                        senderName: msg.senderId?.fullName || "User",
                                                        x: rect.left,
                                                        y: rect.bottom,
                                                        width: rect.width
                                                    })
                                                }}
                                                onDoubleClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setReplyingTo({
                                                        id: msg._id, 
                                                        text: msg.text, 
                                                        senderName: msg.senderId === authUser._id || msg.senderId?._id === authUser._id ? authUser.fullName : (msg.senderId?.fullName || "User")
                                                    });
                                                }}
                                                className={`message-bubble relative group p-3 px-4 rounded-2xl border border-[var(--border-color)] shadow-sm transition-all duration-300 hover:shadow-lg cursor-pointer ${contextMenu?.id === msg._id ? 'ring-2 ring-violet-500 scale-[1.02]' : ''} ${msg.senderId === authUser._id || msg.senderId?._id === authUser._id ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-none' : 'bg-[var(--card-bg)] text-[var(--text-color)] rounded-tl-none'}`}
                                            >
                                                <div className='absolute -top-1 -left-1 flex items-center gap-0.5'>
                                                    {msg.starredBy?.includes(authUser._id) && <span className='text-[10px] drop-shadow-md'>⭐</span>}
                                                    {msg.isPinned && <span className='text-[10px] drop-shadow-md'>📌</span>}
                                                </div>

                                                {msg.replyTo && (
                                                    <div className='mb-2 p-2 bg-black/20 border-l-4 border-violet-500 rounded-r-lg text-[11px] opacity-80'>
                                                        <p className='font-bold text-violet-400'>{msg.replyTo.senderId === authUser._id || msg.replyTo.senderId?._id === authUser._id ? 'You' : 'Member'}</p>
                                                        <p className='truncate text-gray-300'>{msg.replyTo.text || (msg.replyTo.image ? '📷 Photo' : '📄 File')}</p>
                                                    </div>
                                                )}

                                                {selectedGroup && (
                                                    <div className={`flex items-center gap-1.5 mb-1 ${msg.senderId === authUser._id || msg.senderId?._id === authUser._id ? 'justify-end' : ''}`}>
                                                        <p 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const sender = msg.senderId === authUser._id || msg.senderId?._id === authUser._id ? authUser : msg.senderId;
                                                                setViewingUser(sender);
                                                            }}
                                                            className={`text-[10px] font-bold cursor-pointer hover:underline ${msg.senderId === authUser._id || msg.senderId?._id === authUser._id ? 'text-violet-200' : getSenderColor(msg.senderId)}`}
                                                        >
                                                            {msg.senderId === authUser._id || msg.senderId?._id === authUser._id ? 'You' : (
                                                                authUser.friends?.some(f => String(f._id || f) === String(msg.senderId?._id || msg.senderId)) ? (msg.senderId?.fullName || "User") : (msg.senderId?.phoneNumber || msg.senderId?.fullName || "User")
                                                            )}
                                                        </p>
                                                        {(selectedGroup.admins || []).some(admin => String(admin._id || admin) === String(msg.senderId?._id || msg.senderId)) && (
                                                            <span className='text-[10px] text-green-500 font-medium ml-1'>Admin</span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className='mt-1'>
                                                    {translatedMessages[msg._id] && (
                                                        <div className='mb-2 p-2 bg-violet-600/20 border-l-2 border-violet-400 rounded text-[11px] animate-in fade-in slide-in-from-left-1'>
                                                            <p className='text-violet-300 font-bold mb-0.5'>Marathi Translation:</p>
                                                            <p className='text-white italic'>{translatedMessages[msg._id]}</p>
                                                        </div>
                                                    )}
                                                    {msg.linkMeta && (
                                                        <a href={msg.linkMeta.url} target="_blank" rel="noopener noreferrer" className='block mb-3 bg-black/30 border border-white/10 rounded-xl overflow-hidden hover:bg-black/40 transition-all'>
                                                            {msg.linkMeta.image && <img src={msg.linkMeta.image} alt="" className='w-full h-32 object-cover border-b border-white/5' />}
                                                            <div className='p-3'>
                                                                <h4 className='text-[11px] font-bold text-violet-400 line-clamp-1'>{msg.linkMeta.title}</h4>
                                                                <p className='text-[10px] text-gray-400 line-clamp-2 mt-1 leading-tight'>{msg.linkMeta.description}</p>
                                                                <p className='text-[8px] text-gray-500 mt-2 truncate'>{msg.linkMeta.url}</p>
                                                            </div>
                                                        </a>
                                                    )}
                                                    {msg.image && msg.fileType?.startsWith('image/') ? (
                                                        <img src={msg.image} alt="" onClick={() => setSelectedImage(msg.image)} className='max-w-full border border-[var(--border-color)] rounded-xl overflow-hidden mb-1 cursor-pointer hover:scale-[1.02] transition-transform duration-300' />
                                                    ) : msg.image && msg.fileType?.startsWith('audio/') ? (
                                                        <div className='flex items-center gap-2 min-w-[200px] py-1'>
                                                            <audio src={msg.image} controls className='h-8 w-full filter invert brightness-125' />
                                                        </div>
                                                    ) : msg.image ? (
                                                        <div onClick={() => downloadFile(msg.image, msg.fileName || 'file')} className='flex items-center gap-3 p-2 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-all mb-1'>
                                                            <div className='w-8 h-8 bg-violet-600/30 flex items-center justify-center rounded-lg text-lg'>📄</div>
                                                            <div className='flex-1 overflow-hidden'>
                                                                <p className='text-[11px] text-white truncate font-medium'>{msg.fileName || 'Document'}</p>
                                                                <p className='text-[9px] text-gray-400 uppercase tracking-tighter'>{msg.fileType?.split('/')[1] || 'FILE'}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className='text-sm font-light text-white leading-relaxed break-words pr-4 w-full'>
                                                            {renderMessageText(msg.text)}
                                                            {msg.isEdited && <span className='text-[9px] opacity-40 ml-1 italic'>(edited)</span>}
                                                        </div>
                                                    )}
                                                </div>

                                                {msg.reactions?.length > 0 && (
                                                    <div className={`absolute -bottom-3 ${msg.senderId === authUser._id || msg.senderId?._id === authUser._id ? '-left-2' : '-right-2'} flex items-center gap-1 bg-stone-800/90 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10 shadow-lg z-10 cursor-pointer hover:scale-110 transition-all`}>
                                                        {Object.entries(msg.reactions.reduce((acc, r) => {acc[r.emoji] = (acc[r.emoji] || 0) + 1; return acc}, {})).slice(0, 3).map(([emoji, count]) => (
                                                            <span key={emoji} className='text-[12px]'>{emoji}</span>
                                                        ))}
                                                        {msg.reactions.length > 1 && <span className='text-[9px] font-bold text-gray-400 pr-0.5'>{msg.reactions.length}</span>}
                                                    </div>
                                                )}

                                                <div className='flex items-center justify-end gap-1 mt-1 opacity-70'>
                                                    <p className='text-[9px] text-gray-400'>{formatMessageTIme(msg.createdAt)}</p>
                                                    {(msg.senderId === authUser._id || msg.senderId?._id === authUser._id) && (
                                                        <div className='flex items-center'>
                                                            {selectedGroup ? (
                                                                <div className='flex items-center gap-0.5'>
                                                                    {msg.seenBy?.length === (selectedGroup.members?.length || 0) ? (
                                                                        <span className='text-blue-400 font-bold text-[9px] ml-0.5'>✓✓</span>
                                                                    ) : (
                                                                        <>
                                                                            {msg.seenBy?.length > 1 && <span className='text-[8px] text-gray-400 font-medium'>{msg.seenBy.length - 1}</span>}
                                                                            {msg.deliveredTo?.length > 1 ? <span className='text-gray-400 font-bold text-[9px] ml-0.5'>✓✓</span> : <span className='text-gray-400 text-[9px] ml-0.5'>✓</span>}
                                                                        </>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className={`${msg.seenBy?.some(u => u === selectedUser?._id || u._id === selectedUser?._id) ? 'text-blue-400' : 'text-gray-400'} text-[10px] font-bold`}>
                                                                    {msg.deliveredTo?.some(u => u === selectedUser?._id || u._id === selectedUser?._id) ? '✓✓' : '✓'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Removed Quick Hover Actions for better stability */}
                                            </div>

                                            {contextMenu?.id === msg._id && (
                                                <>
                                                    {/* Backdrop to close menu and focus */}
                                                    <div className='fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]' onClick={() => setContextMenu(null)}></div>
                                                    
                                                    <div 
                                                        className='context-menu fixed flex flex-col gap-1 bg-stone-900 border border-white/10 p-2 rounded-2xl shadow-2xl z-[9999] min-w-[200px] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-300'
                                                        style={{ 
                                                            left: '50%',
                                                            top: '50%',
                                                            transform: 'translate(-50%, -50%)'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div className='flex items-center justify-center gap-3 p-2 border-b border-white/10 mb-2 pb-3'>
                                                            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                <span key={emoji} onClick={() => {reactToMessage(msg._id, emoji); setContextMenu(null)}} className='cursor-pointer hover:scale-150 transition-transform text-xl active:scale-90'>{emoji}</span>
                                                            ))}
                                                        </div>
                                                        <div className='grid grid-cols-1 gap-1'>
                                                            {msg.text && (
                                                                <div className='flex items-center gap-3 hover:bg-white/10 p-3 rounded-xl cursor-pointer text-sm text-white transition-colors' onClick={() => {
                                                                    navigator.clipboard.writeText(msg.text);
                                                                    toast.success("Message copied!");
                                                                    setContextMenu(null);
                                                                }}>
                                                                    <span className='text-lg'>📋</span>
                                                                    <span>Copy Message</span>
                                                                </div>
                                                            )}
                                                            <div className='flex items-center gap-3 hover:bg-white/10 p-3 rounded-xl cursor-pointer text-sm text-white transition-colors' onClick={() => {setReplyingTo({id: msg._id, text: msg.text, senderName: contextMenu.senderName}); setContextMenu(null)}}>
                                                                <span className='text-lg'>↩️</span>
                                                                <span>Reply Message</span>
                                                            </div>
                                                            <div className={`flex items-center gap-3 hover:bg-white/10 p-3 rounded-xl cursor-pointer text-sm ${msg.starredBy?.includes(authUser._id) ? 'text-yellow-400' : 'text-white'} transition-colors`} onClick={() => {starMessage(msg._id); setContextMenu(null)}}>
                                                                <span className='text-lg'>{msg.starredBy?.includes(authUser._id) ? '⭐' : '☆'}</span>
                                                                <span>{msg.starredBy?.includes(authUser._id) ? 'Unstar Message' : 'Star Message'}</span>
                                                            </div>
                                                            <div className='flex items-center gap-3 hover:bg-white/10 p-3 rounded-xl cursor-pointer text-sm text-white transition-colors' onClick={() => {setForwardData(msg); setIsForwardModalOpen(true); setContextMenu(null)}}>
                                                                <span className='text-lg'>➡️</span>
                                                                <span>Forward</span>
                                                            </div>
                                                            <div className={`flex items-center gap-3 hover:bg-white/10 p-3 rounded-xl cursor-pointer text-sm ${msg.isPinned ? 'text-violet-400' : 'text-white'} transition-colors`} onClick={() => {pinMessage(msg._id); setContextMenu(null)}}>
                                                                <span className='text-lg'>📌</span>
                                                                <span>{msg.isPinned ? 'Unpin Message' : 'Pin Message'}</span>
                                                            </div>
                                                            {msg.text && authUser.settings?.translationEnabled && (
                                                                <div className='flex items-center gap-3 hover:bg-violet-600/20 p-3 rounded-xl cursor-pointer text-sm text-violet-300 border border-violet-500/20 transition-colors' onClick={() => {handleTranslate(msg._id, msg.text); setContextMenu(null)}}>
                                                                    <span className='text-lg'>🌐</span>
                                                                    <span>Translate to Marathi</span>
                                                                </div>
                                                            )}
                                                            
                                                            {contextMenu.isSender && (
                                                                <>
                                                                    <div className='w-full h-px bg-white/5 my-1'></div>
                                                                    <div className='flex items-center gap-3 hover:bg-white/10 p-3 rounded-xl cursor-pointer text-sm text-white transition-colors' onClick={() => {setInfoData(msg); setIsInfoModalOpen(true); setContextMenu(null)}}>
                                                                        <span className='text-lg'>ℹ️</span>
                                                                        <span>Message Info</span>
                                                                    </div>
                                                                    {!msg.image && (Date.now() - new Date(msg.createdAt).getTime() < 10 * 60 * 1000) && (
                                                                        <div className='flex items-center gap-3 hover:bg-white/10 p-3 rounded-xl cursor-pointer text-sm text-white transition-colors' onClick={() => {setEditingMessage({id: msg._id, text: msg.text}); setEditInput(msg.text); setContextMenu(null)}}>
                                                                            <span className='text-lg'>✏️</span>
                                                                            <span>Edit Message</span>
                                                                        </div>
                                                                    )}
                                                                    <div className='flex items-center gap-3 hover:bg-red-500/20 p-3 rounded-xl cursor-pointer text-sm text-red-400 transition-colors' onClick={() => {
                                                                        setContextMenu(null);
                                                                        toast((t) => (
                                                                            <div className="flex flex-col gap-3">
                                                                                <p className="font-medium text-sm">Delete message?</p>
                                                                                <div className="flex gap-2">
                                                                                    <button 
                                                                                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 transition-colors" 
                                                                                        onClick={() => {
                                                                                            deleteMessage(msg._id);
                                                                                            toast.dismiss(t.id);
                                                                                        }}
                                                                                    >
                                                                                        Delete
                                                                                    </button>
                                                                                    <button 
                                                                                        className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-gray-500 transition-colors"
                                                                                        onClick={() => toast.dismiss(t.id)}
                                                                                    >
                                                                                        Cancel
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ), { duration: Infinity, style: { background: '#1e1e1e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } });
                                                                    }}>
                                                                        <span className='text-lg'>🗑️</span>
                                                                        <span>Delete for everyone</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
                <div ref={scrollEnd}></div>
            </div>

            {/* bottom area */}
            <div className='bg-[var(--header-bg)] backdrop-blur-2xl border-t border-[var(--border-color)] p-3 px-4 shrink-0'>
                {replyingTo && (
                    <div className='flex items-center justify-between bg-white/5 p-3 mx-2 mb-2 rounded-xl border-l-4 border-violet-500 animate-in slide-in-from-bottom-2 duration-200'>
                        <div className='flex flex-col gap-1 overflow-hidden'>
                            <p className='text-[10px] font-bold text-violet-400'>Replying to {replyingTo.senderName}</p>
                            <p className='text-xs text-gray-300 truncate'>{replyingTo.text || 'Photo/File'}</p>
                        </div>
                        <button onClick={() => setReplyingTo(null)} className='text-gray-400 hover:text-white text-lg'>&times;</button>
                    </div>
                )}

                <div className='flex items-center gap-3 px-2 pb-2'>
                    {isRecording ? (
                        <div className='flex-1 flex items-center justify-between bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-2xl'>
                            <div className='flex items-center gap-3'>
                                <span className='w-2 h-2 bg-red-500 rounded-full animate-ping'></span>
                                <span className='text-sm text-red-500 font-bold'>{formatTime(recordingTime)}</span>
                            </div>
                            <div className='flex items-center gap-6'>
                                <button onClick={cancelRecording} className='text-gray-400 hover:text-white text-xs font-medium uppercase tracking-wider'>Cancel</button>
                                <button onClick={stopRecording} className='bg-violet-600 text-white p-2 px-4 rounded-xl shadow-lg hover:bg-violet-500 transition-all'>Send Voice 🎙️</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className='flex-1 flex items-center bg-white/5 border border-white/10 px-3 rounded-2xl relative transition-all focus-within:bg-white/10'>
                                <p onClick={(e) => {e.stopPropagation(); setShowEmoji(!showEmoji)}} className='cursor-pointer text-xl grayscale hover:grayscale-0 transition-all mr-2'>😊</p>
                                
                                {showEmoji && (
                                    <div className='absolute bottom-full mb-4 left-0 z-50 animate-in fade-in zoom-in-95' onClick={(e) => e.stopPropagation()}>
                                        <EmojiPicker theme="dark" onEmojiClick={onEmojiClick} />
                                    </div>
                                )}

                                <input type="text" onChange={handleInputChange} value={input} onKeyDown={(e)=>e.key==='Enter' ? handleSendMessage(e):null} onPaste={handlePaste} placeholder={isVoiceTyping ? 'Listening...' : 'Message...'} className={`flex-1 text-sm p-3 border-none rounded-lg outline-none text-white bg-transparent ${isVoiceTyping ? 'placeholder-violet-400' : 'placeholder-gray-500'}`} />
                                
                                <div onClick={toggleVoiceTyping} className={`text-xl cursor-pointer mr-2 transition-all ${isVoiceTyping ? 'text-violet-500 animate-pulse drop-shadow-[0_0_8px_rgba(139,92,246,0.8)]' : 'text-gray-500 hover:text-white'}`} title="Voice Typing">
                                    🗣️
                                </div>
                                <div onClick={() => setIsGifPickerOpen(!isGifPickerOpen)} className='text-gray-500 hover:text-violet-400 transition-colors mr-3 text-[10px] font-bold border border-gray-500 hover:border-violet-400 px-1.5 py-0.5 rounded cursor-pointer relative'>
                                    GIF
                                    {isGifPickerOpen && (
                                        <div className='absolute bottom-full mb-4 right-0 z-[60] bg-stone-900 border border-white/10 p-3 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 w-72 h-80 flex flex-col cursor-default' onClick={(e) => e.stopPropagation()}>
                                            <input 
                                                type="text" 
                                                autoFocus
                                                placeholder="Search GIFs..." 
                                                value={gifSearch}
                                                onChange={(e) => setGifSearch(e.target.value)}
                                                className='w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500 transition-all mb-3'
                                            />
                                            <div className='flex-1 overflow-y-auto grid grid-cols-2 gap-2 pr-1 custom-scrollbar'>
                                                {gifs.length === 0 ? (
                                                    <div className='col-span-2 text-center text-gray-500 text-xs mt-4'>Searching...</div>
                                                ) : (
                                                    gifs.map(gif => (
                                                        <img 
                                                            key={gif.id} 
                                                            src={gif.media[0]?.tinygif?.url} 
                                                            alt="gif" 
                                                            className='w-full h-24 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-violet-500 transition-all'
                                                            onClick={() => handleSendGif(gif.media[0]?.gif?.url || gif.media[0]?.tinygif?.url)}
                                                        />
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div onClick={() => setIsScheduleModalOpen(!isScheduleModalOpen)} className='text-gray-500 hover:text-violet-400 transition-colors mr-3 text-lg relative cursor-pointer'>
                                    📅
                                    {isScheduleModalOpen && (
                                        <div className='absolute bottom-full mb-4 right-0 z-[60] bg-stone-900 border border-white/10 p-4 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 w-72 cursor-default' onClick={(e) => e.stopPropagation()}>
                                            <h3 className='text-xs font-bold text-violet-400 uppercase tracking-widest mb-3'>Schedule Message</h3>
                                            <input 
                                                type="datetime-local" 
                                                value={scheduledTime}
                                                onChange={(e) => setScheduledTime(e.target.value)}
                                                className='w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-violet-500 transition-all mb-4'
                                            />
                                            <div className='flex gap-2'>
                                                <button onClick={() => setIsScheduleModalOpen(false)} className='flex-1 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors'>Cancel</button>
                                                <button 
                                                    onClick={handleScheduleMessage}
                                                    disabled={!scheduledTime}
                                                    className='flex-1 py-2 bg-violet-600 rounded-xl text-[10px] font-bold uppercase tracking-wider text-white hover:bg-violet-500 transition-all disabled:opacity-50'
                                                >
                                                    Schedule
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <input type="file"  onChange={handleSendFile} name="" id="image" accept='*' hidden />
                                <label htmlFor="image">
                                    <img src={assets.gallery_icon} alt="" className='w-5 mr-4 cursor-pointer opacity-50 hover:opacity-100 transition-opacity' />
                                </label>

                                <button onClick={startRecording} className='text-gray-500 hover:text-violet-400 transition-colors mr-1 text-lg'>
                                    🎙️
                                </button>
                            </div>
                            <img onClick={handleSendMessage} src={assets.send_button} alt="" className='w-9 cursor-pointer hover:scale-110 active:scale-95 transition-transform' />
                        </>
                    )}
                </div>
            </div>


            <ForwardModal 
                isOpen={isForwardModalOpen} 
                onClose={() => setIsForwardModalOpen(false)} 
                messageData={forwardData} 
            />

            <MessageInfoModal 
                isOpen={isInfoModalOpen} 
                onClose={() => setIsInfoModalOpen(false)} 
                messageData={infoData} 
            />

            {selectedImage && (
                <div 
                    className='fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300'
                    onClick={() => setSelectedImage(null)}
                >
                    <button className='absolute top-6 right-6 text-white text-4xl hover:text-gray-300 transition-colors'>&times;</button>
                    <img 
                        src={selectedImage} 
                        className='max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300' 
                        alt="Preview" 
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}

export default ChatContainer