import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { AuthContext } from '../../context/AuthContext'

const LoginPage = () => {

    const [currentState, setCurrentState] = useState("Sign up")
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [bio, setBio] = useState("")
    const [isDataSubmitted, setIsDataSubmitted] = useState(false)
    const [showPassword, setShowPassword] = useState(false)


    const { login } = useContext(AuthContext)




    // const onSubmitHandler = (event) => {
    //     event.preventDefault()
    //     if (currentState === "Sign up" && !isDataSubmitted) {
    //         setIsDataSubmitted(true)
    //         return;
    //     }

    //     login(currentState === "Sign up" ? "signup" : "login", { fullName, email, password, bio })
    // }


    const onSubmitHandler = (event) => {
        event.preventDefault();

        // Step 1: after fullname, move to bio screen
        if (currentState === "Sign up" && !isDataSubmitted) {
            setIsDataSubmitted(true);
            return;
        }

        // Step 2: send correct data
        if (currentState === "Sign up") {
            login("signup", {
                fullName,
                email,
                password,
                bio,
                phoneNumber
            });
        } else {
            login("login", {
                email,
                password
            });
        }
    };

    return (
        <div className='min-h-screen bg-stone-950 flex items-center justify-center p-6 relative overflow-hidden'>
            {/* Decorative Gradients */}
            <div className='absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 blur-[120px] rounded-full'></div>
            <div className='absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full'></div>

            <div className='w-full max-w-5xl flex items-center justify-center gap-12 lg:justify-between max-lg:flex-col relative z-10'>
                {/* left side - Branding */}
                <div className='flex flex-col items-center lg:items-start gap-6 animate-in fade-in slide-in-from-left-10 duration-700'>
                    <div className='w-24 h-24 bg-violet-600 rounded-[32px] flex items-center justify-center shadow-2xl shadow-violet-600/40 rotate-12 hover:rotate-0 transition-transform duration-500'>
                        <img src={assets.logo_icon} alt="" className='w-14' />
                    </div>
                    <div className='text-center lg:text-left'>
                        <h1 className='text-6xl font-black text-white tracking-tighter mb-2'>QuickChat</h1>
                        <p className='text-xl text-gray-400 font-light tracking-wide'>Experience the future of <span className='text-violet-400 font-medium'>real-time</span> messaging.</p>
                    </div>
                </div>

                {/* right side - Form */}
                <form onSubmit={onSubmitHandler} className='w-full max-w-md bg-stone-900/60 backdrop-blur-3xl border border-white/10 p-10 rounded-[40px] shadow-2xl animate-in fade-in slide-in-from-right-10 duration-700'>
                    <div className='flex items-center justify-between mb-8'>
                        <div>
                            <h2 className='text-3xl font-bold text-white mb-1'>{currentState}</h2>
                            <p className='text-sm text-gray-500'>{currentState === "Sign up" ? "Create your account" : "Welcome back, chief!"}</p>
                        </div>
                        {isDataSubmitted && (
                            <button type="button" onClick={() => setIsDataSubmitted(false)} className='w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors'>
                                <img src={assets.arrow_icon} className='w-4 opacity-70' alt="" />
                            </button>
                        )}
                    </div>

                    <div className='flex flex-col gap-4'>
                        {currentState === "Sign up" && !isDataSubmitted && (
                            <div className='space-y-4'>
                                <div className='relative'>
                                    <input onChange={(e) => setFullName(e.target.value)} value={fullName} type="text" className='w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all' placeholder='Full name' required />
                                </div>
                                <div className='relative'>
                                    <input onChange={(e) => setPhoneNumber(e.target.value)} value={phoneNumber} type="tel" className='w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all' placeholder='Phone Number (e.g. 9876543210)' required />
                                </div>
                            </div>
                        )}

                        {!isDataSubmitted && (
                            <>
                                <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder='Email Address' className='w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all' required />
                                <div className='relative'>
                                    <input onChange={(e) => setPassword(e.target.value)} value={password} type={showPassword ? "text" : "password"} placeholder='Password' className='w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all' required />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className='absolute right-4 top-1/2 -translate-y-1/2 text-lg hover:scale-110 transition-transform'
                                    >
                                        {showPassword ? "👁️" : "🙈"}
                                    </button>
                                </div>
                            </>
                        )}

                        {currentState === "Sign up" && isDataSubmitted && (
                            <textarea onChange={(e) => setBio(e.target.value)} value={bio} rows={4} className='w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white placeholder-gray-500 outline-none focus:border-violet-500/50 focus:bg-white/10 transition-all resize-none' placeholder='Write a short bio...' required></textarea>
                        )}

                        <button type='submit' className='w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-violet-600/20 active:scale-95 transition-all mt-4'>
                            {currentState === "Sign up" ? "Create Account" : "Login Now"}
                        </button>
                    </div>

                    <div className='flex items-center gap-3 mt-8 mb-6'>
                        <input type="checkbox" id="terms" className='w-5 h-5 rounded-lg accent-violet-500' required />
                        <label htmlFor="terms" className='text-sm text-gray-500 cursor-pointer'>Agree to the terms & privacy policy.</label>
                    </div>

                    <div className='text-center pt-6 border-t border-white/5'>
                        {currentState === "Sign up" ? (
                            <p className='text-sm text-gray-400'>
                                Already have an account? 
                                <span onClick={() => { setCurrentState("Login"); setIsDataSubmitted(false) }} className='ml-2 font-bold text-violet-400 hover:text-violet-300 cursor-pointer transition-colors'>
                                    Login here
                                </span>
                            </p>
                        ) : (
                            <p className='text-sm text-gray-400'>
                                Don't have an account? 
                                <span onClick={() => setCurrentState("Sign up")} className='ml-2 font-bold text-violet-400 hover:text-violet-300 cursor-pointer transition-colors'>
                                    Create one now
                                </span>
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}

export default LoginPage