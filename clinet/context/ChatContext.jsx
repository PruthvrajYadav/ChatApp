import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext()

export const ChatProvider = ({ children }) => {

    const [message, setMessage] = useState([])
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [unseenMessage, setUnseenMessage] = useState({})
    const [showProfile, setShowProfile] = useState(false)
    const [typingUser, setTypingUser] = useState(null) // ID of user who is typing
    const [groups, setGroups] = useState([])
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [hasMore, setHasMore] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [viewingUser, setViewingUser] = useState(null)

    const { authUser, socket, axios, showNotification, checkAuth } = useContext(AuthContext)

    // Add friend fn
    const addFriend = async (phoneNumber) => {
        try {
            // First search user by phone to get ID
            const { data: searchData } = await axios.get(`/api/auth/search?phoneNumber=${phoneNumber}`)
            if (searchData.success) {
                const friendId = searchData.user._id
                const { data: addData } = await axios.post('/api/auth/add', { friendId })
                if (addData.success) {
                    toast.success("Contact saved successfully")
                    // Refresh authUser to get updated friends list
                    await checkAuth()
                    // Also refresh users list to show names
                    getUsers()
                } else {
                    toast.error(addData.message)
                }
            } else {
                toast.error(searchData.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //fn to get all users for sidebar
    const getUsers = async () => {
        setIsLoading(true)
        try {
            const { data } = await axios.get('/api/messages/users')
            if (data.success) {
                console.log("Users fetched successfully:", data.users);
                // Prepend authUser to the list for "Message Yourself" feature
                const usersList = authUser ? [{ ...authUser, fullName: `${authUser.fullName} (You)` }, ...data.users] : data.users;
                setUsers(usersList)
                setUnseenMessage(data.unseenMessage)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    //fn to get all messages of selected user
    const getMessages = async (userId) => {
        setIsLoading(true)
        try {
            const { data } = await axios.get(`/api/messages/${userId}?limit=30`)
            if (data.success) {
                setMessage(data.messages)
                setHasMore(data.hasMore)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const getMoreMessages = async () => {
        if (!hasMore || isLoadingMore || message.length === 0) return
        setIsLoadingMore(true)
        try {
            const lastMessageId = message[0]._id
            const endpoint = selectedGroup 
                ? `/api/groups/messages/${selectedGroup._id}?lastMessageId=${lastMessageId}&limit=30` 
                : `/api/messages/${selectedUser._id}?lastMessageId=${lastMessageId}&limit=30`
            
            const { data } = await axios.get(endpoint)
            if (data.success) {
                setMessage(prev => [...data.messages, ...prev])
                setHasMore(data.hasMore)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoadingMore(false)
        }
    }

    //fn to send message
    const sendMessage = async (messagedata) => {
        try {
            const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messagedata)
            if (data.success) {
                setMessage((prevMsg) => [...prevMsg, data.newMessage])
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //fn to edit message
    const editMessage = async (messageId, newText) => {
        try {
            const { data } = await axios.put(`/api/messages/edit/${messageId}`, { text: newText })
            if (data.success) {
                setMessage((prev) => prev.map(m => m._id === messageId ? data.message : m))
                toast.success("Message updated")
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //fn to delete message
    const deleteMessage = async (messageId) => {
        try {
            const { data } = await axios.delete(`/api/messages/delete/${messageId}`)
            if (data.success) {
                setMessage((prev) => prev.filter(m => m._id !== messageId))
                toast.success("Message deleted")
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const deleteChat = async (id, isGroup = false) => {
        try {
            const { data } = await axios.post(`/api/messages/delete-chat/${id}`, { isGroup })
            if (data.success) {
                toast.success("Chat deleted")
                if (isGroup) {
                    setGroups(prev => prev.filter(g => g._id !== id))
                    if (selectedGroup?._id === id) setSelectedGroup(null)
                } else {
                    setUsers(prev => prev.filter(u => u._id !== id))
                    if (selectedUser?._id === id) setSelectedUser(null)
                }
            }
        } catch (error) {
            toast.error("Failed to delete chat")
        }
    }

    const clearChat = async (id, isGroup = false) => {
        try {
            const { data } = await axios.post(`/api/messages/clear-chat/${id}`, { isGroup })
            if (data.success) {
                toast.success("Chat cleared")
                setMessage([]) // Clear local messages
                if (isGroup) {
                    setGroups(prev => prev.filter(g => g._id !== id))
                    if (selectedGroup?._id === id) setSelectedGroup(null)
                } else {
                    setUsers(prev => prev.filter(u => u._id !== id))
                    if (selectedUser?._id === id) setSelectedUser(null)
                }
            }
        } catch (error) {
            toast.error("Failed to clear chat")
        }
    }

    // Group Functions
    const getGroups = async () => {
        try {
            const { data } = await axios.get('/api/groups/my-groups')
            if (data.success) {
                setGroups(data.groups)
                data.groups.forEach(g => socket?.emit("joinGroup", g._id))
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const createGroup = async (groupData) => {
        try {
            const { data } = await axios.post('/api/groups/create', groupData)
            if (data.success) {
                setGroups(prev => [...prev, data.group])
                toast.success("Group created")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getGroupMessages = async (groupId) => {
        setIsLoading(true)
        try {
            const { data } = await axios.get(`/api/groups/messages/${groupId}?limit=30`)
            if (data.success) {
                setMessage(data.messages)
                setHasMore(data.hasMore)
                setUnseenMessage(prev => ({ ...prev, [groupId]: 0 }))
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const sendGroupMessage = async (groupId, messagedata) => {
        try {
            const { data } = await axios.post(`/api/groups/send/${groupId}`, messagedata)
            if (data.success) setMessage(prev => [...prev, data.newMessage])
        } catch (error) {
            toast.error(error.message)
        }
    }

    const updateGroup = async (groupId, groupData) => {
        try {
            const { data } = await axios.put(`/api/groups/update/${groupId}`, groupData)
            if (data.success) {
                setGroups(prev => prev.map(g => g._id === groupId ? data.group : g))
                setSelectedGroup(data.group)
                toast.success("Group updated")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const addMembers = async (groupId, members) => {
        try {
            const { data } = await axios.put(`/api/groups/add-members/${groupId}`, { members })
            if (data.success) {
                setGroups(prev => prev.map(g => g._id === groupId ? data.group : g))
                setSelectedGroup(data.group)
                toast.success("Members added")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const removeMember = async (groupId, memberId) => {
        try {
            const { data } = await axios.delete(`/api/groups/remove/${groupId}/${memberId}`)
            if (data.success) {
                setGroups(prev => prev.map(g => g._id === groupId ? data.group : g))
                if (selectedGroup?._id === groupId) setSelectedGroup(data.group)
                toast.success("Member removed")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const promoteToAdmin = async (groupId, memberId) => {
        try {
            const { data } = await axios.put(`/api/groups/promote/${groupId}/${memberId}`)
            if (data.success) {
                setGroups(prev => prev.map(g => g._id === groupId ? data.group : g))
                if (selectedGroup?._id === groupId) setSelectedGroup(data.group)
                toast.success("Member promoted to admin")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }


    const reactToMessage = async (messageId, emoji) => {
        try {
            const { data } = await axios.put(`/api/messages/react/${messageId}`, { emoji })
            if (data.success) {
                setMessage((prev) => prev.map(m => m._id === messageId ? data.message : m))
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const starMessage = async (messageId) => {
        try {
            const { data } = await axios.put(`/api/messages/star/${messageId}`)
            if (data.success) {
                setMessage((prev) => prev.map(m => m._id === messageId ? data.message : m))
                const isStarred = data.message.starredBy.includes(authUser._id)
                toast.success(isStarred ? "Message starred" : "Message unstarred")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const pinMessage = async (messageId) => {
        try {
            const { data } = await axios.put(`/api/messages/pin/${messageId}`)
            if (data.success) {
                setMessage((prev) => prev.map(m => m._id === messageId ? data.message : m))
                toast.success(data.message.isPinned ? "Message pinned" : "Message unpinned")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }


    const forwardMessage = async (msgData, targetIds, isGroup = false) => {
        try {
            const promises = targetIds.map(id => {
                const endpoint = isGroup ? `/api/groups/send/${id}` : `/api/messages/send/${id}`
                return axios.post(endpoint, {
                    text: msgData.text,
                    image: msgData.image,
                    fileName: msgData.fileName,
                    fileType: msgData.fileType
                })
            })

            const results = await Promise.all(promises)
            const successCount = results.filter(r => r.data.success).length
            
            if (successCount > 0) {
                toast.success(`Message forwarded to ${successCount} chat(s)`)
                // Refresh messages if current chat is one of the targets
                if (targetIds.includes(selectedUser?._id) || targetIds.includes(selectedGroup?._id)) {
                    if (selectedUser) getMessages(selectedUser._id)
                    else if (selectedGroup) getGroupMessages(selectedGroup._id)
                }
            }
        } catch (error) {
            toast.error("Failed to forward message")
        }
    }

    //fn to subscribe to messages for selected user
    const subscribeToMessage = () => {
        if (!socket) return

        socket.off("newMessage")
        socket.on("newMessage", (newMessage) => {
            const senderId = newMessage.senderId._id || newMessage.senderId
            const senderData = newMessage.senderId._id ? newMessage.senderId : null

            if (selectedUser && senderId === selectedUser._id) {
                newMessage.seen = true
                setMessage((prevMsg) => [...prevMsg, newMessage])
                axios.put(`/api/messages/mark/${newMessage._id}`)
            }
            else {
                // Mark as delivered
                axios.put(`/api/messages/delivered/${newMessage._id}`)
                
                // Show Notification
                const knownSender = users.find(u => u._id === senderId)
                if (!knownSender) {
                    // New user messaged us! Refresh list to show them
                    getUsers()
                }
                
                showNotification(knownSender?.fullName || senderData?.fullName || "New Message", newMessage.text || "Sent a photo", knownSender?.profilePic || senderData?.profilePic)
                
                // Update unseen count
                setUnseenMessage(prev => ({
                    ...prev,
                    [senderId]: (prev[senderId] || 0) + 1
                }))
            }
        })

        socket.off("newGroupMessage")
        socket.on("newGroupMessage", ({ groupId, message: newMessage }) => {
            if (selectedGroup && selectedGroup._id === groupId) {
                setMessage((prev) => [...prev, newMessage])
                // Mark as seen immediately if we are viewing the group
                axios.get(`/api/groups/messages/${groupId}`) 
            } else {
                setUnseenMessage(prev => ({
                    ...prev,
                    [groupId]: (prev[groupId] || 0) + 1
                }))
                
                // Show Notification
                const group = groups.find(g => g._id === groupId)
                const senderId = newMessage.senderId._id || newMessage.senderId
                if (senderId !== authUser._id) {
                    showNotification(group?.name || "New Group Message", `${newMessage.senderId?.fullName || "Member"}: ${newMessage.text || "Sent a photo"}`)
                }
            }
        })

        socket.off("groupMessagesSeen")
        socket.on("groupMessagesSeen", ({ groupId, userId }) => {
            if (selectedGroup && selectedGroup._id === groupId) {
                setMessage((prev) => prev.map(m => {
                    if (m.groupId === groupId && !m.seenBy.includes(userId)) {
                        return { ...m, seenBy: [...m.seenBy, userId] }
                    }
                    return m
                }))
            }
        })

        socket.off("groupUpdated")
        socket.on("groupUpdated", (updatedGroup) => {
            setGroups(prev => prev.map(g => g._id === updatedGroup._id ? updatedGroup : g))
            if (selectedGroup?._id === updatedGroup._id) setSelectedGroup(updatedGroup)
        })

        socket.off("messageUpdated")
        socket.on("messageUpdated", (updatedMsg) => {
            setMessage((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m))
        })

        socket.on("displayTyping", ({ userId, groupId }) => {
            if (groupId) {
                if (selectedGroup && selectedGroup._id === groupId) {
                    const member = selectedGroup.members.find(m => (m._id || m) === userId)
                    setTypingUser(member?.fullName || "Someone")
                }
            } else if (selectedUser && selectedUser._id === userId) {
                setTypingUser(userId)
            }
        })

        socket.on("hideTyping", ({ userId, groupId }) => {
            if (groupId) {
                if (selectedGroup && selectedGroup._id === groupId) {
                    setTypingUser(null)
                }
            } else if (selectedUser && selectedUser._id === userId) {
                setTypingUser(null)
            }
        })

        socket.on("messageEdited", (updatedMsg) => {
            if (selectedUser && updatedMsg.senderId === selectedUser._id) {
                setMessage((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m))
            }
        })

        socket.on("messageDeleted", (messageId) => {
            setMessage((prev) => prev.filter(m => m._id !== messageId))
        })



        socket.on("messagesSeen", ({ userId }) => {
            setMessage((prev) => prev.map(m => {
                if (m.receiverId === userId && !m.seenBy.includes(userId)) {
                    return { ...m, seenBy: [...m.seenBy, userId] }
                }
                return m
            }))
        })

        socket.on("messageSeen", ({ messageId, seenBy }) => {
            setMessage((prev) => prev.map(m => {
                if (m._id === messageId && !m.seenBy.includes(seenBy)) {
                    return { ...m, seenBy: [...m.seenBy, seenBy] }
                }
                return m
            }))
        })

        socket.on("messageUpdated", (updatedMsg) => {
            setMessage((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m))
        })
    }

    //fn to unsubscribe from messages
    const unsubscribeToMessage = () => {
        if (!socket) return
        socket.off("newMessage")
        socket.off("displayTyping")
        socket.off("hideTyping")
        socket.off("messageEdited")
        socket.off("messageDeleted")
        socket.off("newGroupMessage")
        socket.off("messagesSeen")
        socket.off("messageSeen")
        socket.off("messageUpdated")
    }

    useEffect(() => {
        subscribeToMessage()
        return () => unsubscribeToMessage()
    }, [socket, selectedUser])

    useEffect(() => {
        if (socket && selectedGroup) {
            socket.emit("joinGroup", selectedGroup._id)
            return () => socket.emit("leaveGroup", selectedGroup._id)
        }
    }, [socket, selectedGroup])

    useEffect(() => {
        if (authUser) {
            getUsers()
            getGroups()
        }
    }, [authUser])


    
    const scheduleMessage = async (messagedata) => {
        try {
            const { data } = await axios.post(`/api/messages/schedule`, messagedata)
            if (data.success) {
                toast.success("Message scheduled successfully")
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const translateText = async (text, targetLang = 'mr') => {
        try {
            const { data } = await axios.post(`/api/messages/translate`, { text, targetLang })
            if (data.success) {
                return data.translatedText
            } else {
                toast.error(data.message)
                return null
            }
        } catch (error) {
            toast.error(error.message)
            return null
        }
    }

    const value = {
        message, setMessage,
        users, setUsers,
        groups, setGroups,
        selectedUser, setSelectedUser,
        selectedGroup, setSelectedGroup,
        unseenMessage, setUnseenMessage,
        getUsers, getMessages, sendMessage, subscribeToMessage,
        editMessage, deleteMessage, deleteChat, clearChat,
        getGroups, createGroup, getGroupMessages, sendGroupMessage, updateGroup, addMembers,
        removeMember, promoteToAdmin,
        showProfile, setShowProfile,
        typingUser, setTypingUser,
        reactToMessage, starMessage, forwardMessage, pinMessage,
        isLoading, hasMore, isLoadingMore, getMoreMessages,
        viewingUser, setViewingUser,
        scheduleMessage, translateText,
        addFriend
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}
