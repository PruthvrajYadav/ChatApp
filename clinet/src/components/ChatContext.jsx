// import { createContext, use, useContext, useState } from "react";
// import { AuthContext } from "../../context/AuthContext";

// export const ChatContext = createContext()


// export const chatProvider = ({children  })=>{


//     const [message,setMessage] = useState([])
//     const [users,setUsers]= useState([])
//     const[selectedUser,setSelectedUser] = useState(null)
//     const [unseenMessage,setUnseenMessage]= useState({})

//     const {socket,axios}=useContext(AuthContext)


//     //fn to get all users for sidbar
//     const getUser = async()=>{
// try {
//     await axios.get('/api/messages/users')
//     if(data.success){
//         setUsers(data.users)
//         setUnseenMessage(data.unseenMessage)
//     }
// } catch (error) {
//     toast.error(error.message)  
// }
//     }


//     //fn to get all messages of selected user
//     const getMessages= async(userdId)=>{
//         try {
//             const {data} = await axios.get(`/api/messages/${userdId}`)
//             if(data.success){
//                 setMessage(data.messages)
//             }
//         } catch (error) {
//             toast.error(error.message)  
//         }
//     }
    
//     //fn to send message
//         const sentMessage = async(messagedata)=>{
//             try {
//                const{data}= await axios.post('/api/messages/sent/${selectedUser._id}',messagedata)
//                if(data.success){
//                 //    setMessage((prev)=>[...prev,{...data.message,senderId:authUser._id,receiverId:selectedUser._id}])
//                 setMessage((prevMsg)=> [...prevMsg,data.newMessage])
//                }else{
//                 toast.error(data.message)
//                }
//             } catch (error) {
//                 toast.error(error.message)  
//             }
//         }

//         //fn to subscribe to messsages for selected user
//         const subcribeToMessage= async(()=>{
//             if(!socket)return
//             socket.on("newMessage",(newMessage)=>{
//                 if(selectedUser && newMessage.senderId === selectedUser._id){
//                     newMessage.seen =true
//                     setMessage((prevMsg)=>[...prevMsg,newMessage])
//                     axios.put(`/api/messages/mark/${newMessage._id}/seen`)
//                 }
//                 else{
// setUnseenMessage((preveUnseenMsg)=>({
//     ...preveUnseenMsg,[newMessage.senderId]:
//     preveUnseenMsg[newMessage.senderId] ? preveUnseenMsg[newMessage.senderId] +1 : 1
// }))                
//             }
//         })   
//     const value = {
       

//     }
// return(<ChatContext.Provider value={value}>
// {children}
// </ChatContext.Provider>)
//         }