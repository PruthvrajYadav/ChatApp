import axios from "axios";
import { createContext, useEffect, useState } from "react";
import toast from "react-hot-toast";

import { io } from "socket.io-client";



const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {


    const [token, setToken] = useState(localStorage.getItem("token"))
    const [authUser, setAuthUser] = useState(null)
    const [onlineUsers, setOnlineUsers] = useState([])
    const [socket, setSocket] = useState(null)


    // Check if user is authenticated and if so,set the user data and connect the socket

    const checkAuth = async () => {
        try {
            const { data } = await axios.get('/api/auth/check')
            if (data.success) {
                setAuthUser(data.user)
                connectSocket(data.user)
            }
        } catch (error) {
            toast.error(error.message)

        }
    }

    //login fn to handle user authentacation and socket connection

    const login = async (state, credentials) => {
        try {
            const { data } = await axios.post(`/api/auth/${state}`, credentials)
            // if (data.success) {
            //     setAuthUser(data.userData)
            //     connectSocket(data.userData)
            //     axios.defaults.headers.common["token"] = data.token
            //     setToken(data.token)
            //     localStorage.setItem("token", data.token)
            //     toast.success(data.message)
            // }

            if (data.success) {
                setAuthUser(data.userData)
                localStorage.setItem("user", JSON.stringify(data.userData))
                connectSocket(data.userData)

                axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`
                setToken(data.token)
                localStorage.setItem("token", data.token)

                toast.success(data.message)
            }


            else {
                toast.error(data.message)

            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //logout fn to handle user logout and socket disconnection

    // const logout = async () => {
    //     localStorage.removeItem("token")
    //     setToken(null)
    //     setAuthUser(null)
    //     setOnlineUsers([])
    //     axios.defaults.headers.common["token"] = null
    //     toast.success("Logged out successfully")
    //     socket.disconnect()
    // }


    const logout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        setToken(null)
        setAuthUser(null)
        setOnlineUsers([])
        delete axios.defaults.headers.common["Authorization"]

        if (socket) socket.disconnect()

        toast.success("Logged out successfully")
    }



    //update profile fn to handle user profile updates
    // const updateProfile = async (body) => {
    //     try {
    //         const { data } = await axios.put("/api/auth/update-profile", body)
    //         if (data.success) {
    //             setAuthUser(data.user)
    //             toast.success("Profile updated successfully")
    //         }
    //     } catch (error) {
    //         toast.error(error.message)
    //     }

    // }

    const updateProfile = async (body) => {
        try {
            const { data } = await axios.put("/api/auth/update-profile", body)

            if (data.success) {
                setAuthUser(data.user)
                localStorage.setItem("user", JSON.stringify(data.user)) // ✅ ADD THIS
                toast.success("Profile updated successfully")
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const deleteAccount = async () => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <p className="font-medium text-sm">Are you sure you want to delete your account? This action cannot be undone.</p>
                <div className="flex gap-2">
                    <button 
                        className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-red-600 transition-colors" 
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const { data } = await axios.delete('/api/auth/delete-account')
                                if (data.success) {
                                    logout()
                                    toast.success("Account deleted successfully")
                                }
                            } catch (error) {
                                toast.error(error.message)
                            }
                        }}
                    >
                        Delete Account
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
    }



    //connect socket fn to handle socket connection and online users updates
    const connectSocket = (userData) => {
        if (!userData || socket?.connected) return;
        // const newSocket = io(backendUrl, {
        //     userId: userData._id,

        // })
        const newSocket = io(backendUrl, {
            withCredentials: true,
            query: {
                userId: userData._id
            }
        });

        newSocket.connect()
        setSocket(newSocket)

        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUsers(userIds)
        })
    }
    // useEffect(() => {
    //     if (token) {
    //         axios.defaults.headers.common["token"] = token
    //     }
    //     checkAuth()

    // }, [token])

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
            checkAuth()
        }

        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission()
        }
    }, [token])

    const showNotification = (title, body, icon) => {
        if ("Notification" in window && Notification.permission === "granted" && document.visibilityState === 'hidden') {
            new Notification(title, { body, icon })
        }
    }


    const value = {
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
        deleteAccount,
        showNotification,
        checkAuth
    }
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}