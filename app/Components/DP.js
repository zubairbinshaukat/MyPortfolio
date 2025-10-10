import Image from "next/image";
import React from "react";
import dp from "/public/dp.png";

const DP = () => {
  return (
    <div className=" w-full h-full flex items-end justify-center pb-0">
      {/* Container for profile and labels */}
      <div className="relative w-full max-w-[700px] aspect-square">
        {/* Background decorative blob */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="sm:w-[90%] sm:h-[90%] w-[80%] h-[80%] bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] opacity-80 animate-pulse" />
        </div>

        {/* Web Developer Label - Behind image, top left */}
        <div className="absolute top-[2%] left-[2%] z-0 sm:top-[0%] sm:left-[2%] lg:top-[-10%] lg:left-[10%]">
          <div className="relative">
            {/* Main label */}
            <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 text-white px-6 py-3 rounded-full transform -rotate-12 shadow-lg text-sm sm:text-base md:text-lg font-semibold whitespace-nowrap">
              Web Developer
            </div>
          </div>
        </div>

        {/* Profile Image */}
        <div className="relative z-10 w-full h-full flex items-end justify-center">
          <Image
            src={dp}
            alt="Zubair Bin Shaukat - Software Developer"
            width={700}
            height={700}
            className="w-full h-auto object-contain sm:w-[90%] md:w-full"
            priority
          />
        </div>

        {/* Mobile Developer Label - In front of image, bottom right */}
        <div className="absolute bottom-[15%] right-[-5%] z-20 sm:bottom-[12%] sm:right-[0%] md:bottom-[10%] md:right-[-2%]">
          <div className="relative">
            {/* Main label */}
            <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 text-white px-6 py-3 rounded-full transform rotate-6 shadow-lg text-sm sm:text-base md:text-lg font-semibold whitespace-nowrap">
              Mobile Developer
            </div>
          </div>
        </div>

        {/* Small decorative elements */}
        <div className="absolute top-[45%] right-0 z-0">
          <div className="w-3 h-3 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-full animate-pulse" />
        </div>
        <div className="absolute top-[25%] right-[7%] z-0">
          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 rounded-full animate-pulse delay-150" />
        </div>
      </div>
    </div>
  );
};

export default DP;
