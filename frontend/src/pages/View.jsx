import  { useContext,useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../provider/AuthProvider';
import axios from 'axios';

const View = () => {
  const { userPlan, loading, setLoading } = useContext(AuthContext);
  const [seriesData, setSeriesData] = useState([]);

console.log(seriesData)
  useEffect(() => {
    const fetchSeriesData = async () => {
      try {
        const response = await axios.get(`https://3000-baitech365-aividedit-1tshd2b1yqy.ws-us110.gitpod.io/series_info?email=${userPlan.email}`);
        setSeriesData(response.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSeriesData();
  }, [userPlan.email]);


  return (
    <div className='max-w-6xl mx-auto p-10'>
      <h1 className='text-2xl font-bold text-black pb-3'>YOUR SERIES</h1>
      <div className='pb-10'>
        <hr  className='h-[3px] bg-black '/>

      </div>
      
    {
      seriesData ? (
       seriesData.map(item => (
        <div className='mt-10 p-8 w-full rounded-lg bg-slate-600' key={item._id}>
        <p className="text-lg text-white"><span className="font-bold">Series Name:</span> {item?.content}</p>
          <p className="text-lg text-white"><span className="font-bold">Language:</span> {item?.language}</p>
          <p className="text-lg text-white"><span className="font-bold">Video Duration: </span> {item?.duration}</p>
          <p className="text-lg text-white"><span className="font-bold">Narrator: </span> {item?.narrator}</p>
          <p className="text-lg text-white pb-10"><span className="font-bold">Send Type: </span> {item?.destination}</p>
          <button className='bg-gradient-to-r from-primary to-blue-700 text-white py-3 px-6 text-lg rounded-lg font-semibold '>GENERATE VIDEO</button>
        </div>
       ))
      ) : (
<div className='p-8 w-full rounded-lg bg-slate-600'>
        <p className='text-white pb-8'>You haven't started a Faceless Video series yet.</p>

        <Link to='/dashboard/create'>
        <button className='bg-gradient-to-r from-primary to-blue-700 text-white py-3 px-6 text-lg rounded-lg font-semibold mb-5'>CREATE YOUR SERIES</button>
        </Link>
      </div>
      )
    }

     

      
      
    </div>
  )
}

export default View