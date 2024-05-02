import React, { useState } from 'react'
import Step from '../components/Step'
import GradientHeading from '../components/GradientHeading'
import SelectOption from '../components/SelectOption';
import { MdAlternateEmail } from 'react-icons/md';
import { IoLogoTiktok } from 'react-icons/io5';
import { FaPlay, FaYoutube } from 'react-icons/fa';
import ContentSelect from '../components/ContentSelect';

const Create = () => {
  const [destination, setDestination] = useState(null);
  const [content, setContent] = useState(null);
  const [narrator, setNarrator] = useState(null);
  const [language, setLanguage] = useState(null);
  const [duration, setDuration] = useState(null);
  console.log('content', content)
  const [customContent, setCustomContent] = useState('');
  const durationOptions = [
    { id: 1, name: '30 to 60 seconds' },
    { id: 1, name: '60 to 90 seconds' },
  ];
  
  const destinationOptions = [
    { id: 1, icon: <MdAlternateEmail />, name: 'Email Me Instead' },
    { id: 2, icon: <IoLogoTiktok />, name: 'Link a TikTok Account' },
    { id: 3, icon: <FaYoutube />, name: 'Link a YouTube Account' },
   
  ];
  const languageOptions = [
    { id: 1,  name: 'English US' },
    { id: 2,  name: 'Czech CZ' },
    { id: 3,  name: 'Danish DK' },
    { id: 4,  name: 'Dutch UL' },
    { id: 5,  name: 'French FR' },
    { id: 5,  name: 'German DE' },
    { id: 7,  name: 'Greek GR' },
    { id: 8,  name: 'Hindi IN' },
    { id: 9,  name: 'Indonesian ID' },
    { id: 10,  name: 'Italian IT' },
    { id: 11,  name: 'Japanese JP' },
    { id: 13,  name: 'Norwegian NO' },
    { id: 14,  name: 'Polish PL' },
    { id: 15,  name: 'Portuguese PT' },
    { id: 16,  name: 'Russian RU' },
    { id: 17,  name: 'Spanish ES' },
    { id: 18,  name: 'Swedish SE' },
    { id: 19,  name: 'Turkish TR' },
    { id: 20,  name: 'Ukrainian UA' },
  ];
  const contentOptions = [
    { id: 1,  name: 'Random AI Story' },
    { id: 2,  name: 'Scary Stories' },
    { id: 3,  name: 'Motivational' },
    { id: 4,  name: 'Bedtime Stories' },
    { id: 5,  name: 'Interesting History' },
    { id: 5,  name: 'Fun Facts' },
    { id: 7,  name: 'Long Form Jokes' },
    { id: 8,  name: 'Life Pro Tips' },
    { id: 9,  name: 'ELI5' },
    { id: 10,  name: 'Philosophy' },
    { id: 11,  name: 'Product Marketing' },
    { id: 12,  name: 'Custom' },
   
  ];
  const narrationOptions = [
    { id: 1, icon: <FaPlay />,  name: 'Echo' },
    { id: 2, icon: <FaPlay />, name: 'Alloy' },
    { id: 3, icon: <FaPlay />, name: 'Onyx' },
    { id: 4, icon: <FaPlay />, name: 'Fable' },
    { id: 5, icon: <FaPlay />, name: 'Nova' },
    { id: 5, icon: <FaPlay />, name: 'Shimmer' },
  ];
  
  
  

 



  return (
    <div className='mb-20'>
      {/* heading */}
      <div className='pb-10'>
        <h1 className='text-center text-black text-4xl font-bold pt-16'>CREATE A SERIES</h1>
        <p className='text-center text-black/70 font-semibold pt-4'>Schedule a series of Faceless Videos to post on auto-pilot.</p>
      </div>
      {/* form div */}
     <div className='px-5 md:px-16'>
     <div className='bg-slate-600 max-w-2xl mx-auto px-8 py-10 md:px-16 shadow-xl rounded-lg'>
        {/* step 1 */}
        <Step
        number='1'
        />
        <GradientHeading
        text='Destination'/>
        <p className='text-lg text-white/70 font-semibold'>The account where your video series will be posted</p>

        <div className='w-full pb-14'>
        <SelectOption
        selectedOption={destination} 
        setSelectedOption={setDestination}
        options={destinationOptions}
        defaultOption='Select Destination'
        />
        </div>
        {/* step 2 */}
        <Step
        number='2'
        />
        <GradientHeading
        text='Content'/>
        <p className='text-lg text-white/70 font-semibold'>What will your video series be about?</p>

        <div className='w-full  pb-6'>
          <ContentSelect
          options={contentOptions}
          selectedOption={content}
          setSelectedOption={setContent}
          defaultOption='Choose Content'
          customContent={customContent}
          setCustomContent={setCustomContent}
          placeholder= 'Example Please share a concise and captivating account of a lesser-known, yet intriguing, historical event. The event MUST be real and factual. Begin with a captivating introduction or question to hook the audience.'         
          />
        {/* <SelectOption
        selectedOption={content} 
        setSelectedOption={setContent}
        options={contentOptions}
        defaultOption='Choose Content'
        />*/}
        </div> 

        <p className='text-lg text-white/70 font-semibold'>Narration Voice</p>

        <div className='w-full  pb-6'>
        <SelectOption
        selectedOption={narrator} 
        setSelectedOption={setNarrator}
        options={narrationOptions}
        defaultOption='Choose Narrator Voice'
        /></div>
        <p className='text-lg text-white/70 font-semibold'>Video Language</p>

        <div className='w-full  pb-6'>
        <SelectOption
        selectedOption={language} 
        setSelectedOption={setLanguage}
        options={languageOptions}
        defaultOption='Choose Video Language'
        /></div>
        <p className='text-lg text-white/70 font-semibold'>Duration Preference</p>

        <div className='w-full  pb-16'>
        <SelectOption
        selectedOption={duration} 
        setSelectedOption={setDuration}
        options={durationOptions}
        defaultOption='Choose Video Duration'
        /></div>
        {/* step 3 */}
        <Step
        number='3'
        />
        <GradientHeading
        text='Create'/>
        <p className='text-lg text-white/70 font-semibold pb-5'>You will be able to preview your upcoming videos before posting</p>

       <div className=' flex justify-center items-center'>
       <button className='bg-gradient-to-r from-primary to-blue-700 text-white py-3 px-20 text-lg rounded-lg font-semibold my-5'>CREATE SERIES</button>
       </div>
      </div>
     </div>
    </div>
  )
}

export default Create