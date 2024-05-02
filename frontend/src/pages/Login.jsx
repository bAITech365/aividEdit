import React from 'react'
import Navbar from '../components/Navbar'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
    const navigate = useNavigate()
    const onSuccess = (credentialResponse) => {
        console.log(credentialResponse);
        localStorage.setItem('googleCredentials', JSON.stringify(credentialResponse));
        navigate('/home');
      };
    
      const onError = () => {
        console.log('Login Failed');
        // Handle login failure here
      };
  return (
    <div>
    <Navbar/>
    <div className='bg-white flex justify-center items-center'>
        <div className='h-[300px] bg-primary rounded-lg p-10 mt-20'>
                <h1 className='text-white text-3xl text-center font-semibold'>Login</h1>
                <div className='flex justify-center items-center pt-10'>
                    {/* <button className='bg-white text-black rounded-lg px-5 py-2 font-semibold'>Sign in with Google</button> */}
                    <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        scope="https://www.googleapis.com/auth/youtube.upload"
      />
                </div>
                <div className='flex justify-center items-center gap-1 pt-4 text-white'>
                <p>Not registered yet.</p>
                <Link to='/register' className='underline'>Register</Link>
                </div>
        </div>

    </div>
   </div>
  )
}

export default Login