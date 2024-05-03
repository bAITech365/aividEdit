import  { createContext, useContext, useEffect, useState } from "react";
import { GoogleAuthProvider,  getAuth, onAuthStateChanged, signInWithPopup, signOut,  } from 'firebase/auth'
import app from "../firebase/firebase.config";



export const AuthContext = createContext()
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const googleSignIn = () => {
    setLoading(true)
    return signInWithPopup(auth, googleProvider)
  }
console.log('user in auth', user)
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