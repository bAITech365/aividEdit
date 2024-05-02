import React from 'react';
import Navbar from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const Register = () => {
    const navigate = useNavigate()
    const onSuccess = (credentialResponse) => {
        console.log(credentialResponse);
        navigate('/')
        // Handle successful login here
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
                <h1 className='text-white text-3xl text-center font-semibold'>Register</h1>
                <div className='flex justify-center items-center pt-10'>
                    <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
      />
                </div>
                <div className='flex justify-center items-center gap-1 pt-4 text-white'>
                <p>Already have account.</p>
                <Link to='/login' className='underline'>Login</Link>
                </div>
        </div>

    </div>
   </div>
  );
};

export default Register;
