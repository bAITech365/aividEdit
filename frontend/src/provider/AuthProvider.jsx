import  { createContext, useContext, useEffect, useState } from "react";
import { GoogleAuthProvider,  getAuth, onAuthStateChanged, signInWithPopup, signOut,  } from 'firebase/auth'
import app from "../firebase/firebase.config";
import axios from "axios";
import Loading from "../components/Loading";



export const AuthContext = createContext()
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [userPlan, setUserPlan] = useState(null)
  // console.log('user in auth', user)
  // console.log('user plan in auth', userPlan)
  const googleSignIn = () => {
      return signInWithPopup(auth, googleProvider)
  }
  const logOut = () => {
    localStorage.removeItem('user');
    return signOut(auth)
  }

  useEffect(() => {
    const unSubscribe = onAuthStateChanged(auth, (currentUser => {
      if (currentUser) {
        localStorage.setItem('user', JSON.stringify(currentUser));
        setUser(currentUser);
      } else {
        localStorage.removeItem('user');
        setUser(null);
      }
      setLoading(false);
    }))

    return () => {
      unSubscribe()
    }
  },[])

  useEffect(() => {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      setUser(JSON.parse(localUser));
    }
  }, []);
  
  
console.log(user?.email)
// Getting user data in the database
const getUserData = async (userData) => { 
    try {
      setLoading(true)
        const response = await axios.post(`http://localhost:3000/user`, userData)
        const data = await response?.data;
        console.log('res', response)
        if(data?.email){
            setUserPlan(data)
        }
        console.log('data', data)
    } catch (error) {
        console.log(`Error in getting user data, ${error}`)
    } finally {
      setLoading(false)
    }
 }
 useEffect(() => {
    if (user && !userPlan) {
     
        const userData = {
            email : user?.email,
          }
      getUserData(userData)
    }
  }, [user, userPlan])

  // if(loading){
  //   return <Loading/>
  // }

  const authInfo = {
    user, 
    loading,
    googleSignIn, 
    setUser,
    logOut,
    userPlan,
    setLoading
  }

  return (
    <AuthContext.Provider value={authInfo}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

// export const useAuth = useContext(AuthContext)