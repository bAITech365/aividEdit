import React from "react";
import GradientHeading from "../components/GradientHeading";

const Billing = () => {
  return (
    <div>
      <div className="pt-20 px-5 pb-5">
        <GradientHeading text="CURRENT PLAN" />
      </div>
      <div className="px-5 md:px-16">
        <div className="bg-slate-600 max-w-2xl mx-auto px-8 py-10 md:px-16 shadow-xl rounded-lg ">
        <p className="text-lg text-white"><span className="font-bold">Current Plan:</span> Free</p>
        <p className="text-lg text-white"><span className="font-bold">Max Series:</span> 1</p>
        <p className="text-lg text-white"><span className="font-bold">Frequency:</span> 1 Video Creation</p>
        </div>
       
      </div>
      <div className="pt-20 px-5 pb-5">
        <GradientHeading text="CHANGE PLAN" />
      </div>
    </div>
  );
};

export default Billing;
