import React from 'react'
import { Link } from 'react-router-dom'

const View = () => {
  return (
    <div className='max-w-6xl mx-auto p-10'>
      <h1 className='text-2xl font-bold text-black pb-3'>YOUR SERIES</h1>
      <div className='pb-10'>
        <hr  className='h-[3px] bg-black '/>

      </div>
      <div className='p-8 w-full rounded-lg bg-slate-600'>
        <p className='text-white pb-8'>You haven't started a Faceless Video series yet.</p>

        <Link to='/dashboard/create'>
        <button className='bg-gradient-to-r from-primary to-blue-700 text-white py-3 px-6 text-lg rounded-lg font-semibold mb-5'>CREATE YOUR SERIES</button>
        </Link>
      </div>

      
    </div>
  )
}

export default View