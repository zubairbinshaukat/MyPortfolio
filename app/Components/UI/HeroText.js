import { HelloCard } from "@/components/ui/hello-card";
import React from "react";

const HeroText = ({ variant = "desktop" }) => {
  if (variant === "mobile") {
    return (
      <div className="sm:hidden flex flex-col justify-center w-full h-[50%] pl-8">
        <HelloCard />
        <p className="text-white font-bold text-2xl font-font2 mt-2">{"I'm"}</p>
        <h1 className="md:text-7xl text-5xl lg:text-[108px] font-font2 font-bold dark:text-white text-black relative z-20 ">
          ZUBAIR
        </h1>
        <div className=" bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4 -mt-6">
          <span className="text-5xl lg:text-8xl md:text-7xl font-medium font-font0">
            Bin Shaukat
          </span>
        </div>
      </div>
    );
  }

  // Default to desktop
  return (
    <div className="flex flex-col">
      <HelloCard />
      <p className="text-white font-bold text-2xl font-font2 mt-2">{"I'm"}</p>
      <h1 className="md:text-7xl text-5xl lg:text-[108px] font-font2 font-bold text-white relative z-20 ">
        ZUBAIR
      </h1>
      <div className=" bg-clip-text text-transparent bg-no-repeat bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 py-4 -mt-6">
        <span className="text-5xl lg:text-8xl md:text-7xl font-medium font-font0">
          Bin Shaukat
        </span>
      </div>
    </div>
  );
};

export default HeroText;
