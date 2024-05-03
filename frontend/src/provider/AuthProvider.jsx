import  { createContext, useContext, useEffect, useState } from "react";
import { GoogleAuthProvider,  getAuth, onAuthStateChanged, signInWithPopup, signOut,  } from 'firebase/auth'
import app from "../firebase/firebase.config";
import axios from "axios";



export const AuthContext = createContext()
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userPlan, setUserPlan] = useState(null)
  console.log('user in auth', user)
  console.log('user plan in auth', userPlan)
  const googleSignIn = () => {
    setLoading(true)
    return signInWithPopup(auth, googleProvider)
  }
  const logOut = () => {
    setLoading(true)
    return signOut(auth)
  }

  useEffect(() => {
    const unSubscribe = onAuthStateChanged(auth, (currentUser => {
      setUser(currentUser)
      setLoading(false);
    }))

    return () => {
      unSubscribe()
    }
  },[])
console.log(user?.email)
// Getting user data in the database
const getUserData = async (userData) => { 
    try {
        
        const response = await axios.post(`https://3000-baitech365-aividedit-1tshd2b1yqy.ws-us110.gitpod.io/user`, userData)
        const data = await response.data;
        console.log('res', response)
        if(data?.email){
            setUserPlan(data)
        }
        console.log('data', data)
    } catch (error) {
        console.log(`Error in getting user data, ${error}`)
    }
 }
 useEffect(() => {
    if (user && !userPlan) {
        const userData = {
            email : user?.email,
            tokenInfo : user?.stsTokenManager
        }
      getUserData(userData)
    }
  }, [user, userPlan])



  const authInfo = {
    user, 
    loading,
    googleSignIn, 
    setUser,
    logOut,
  }

  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

// export const useAuth = useContext(AuthContext)