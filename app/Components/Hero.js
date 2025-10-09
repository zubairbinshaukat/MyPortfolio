import React from "react";
import { BackgroundBeamsWithCollision } from "../../components/ui/background-beams-with-collision";
import { FloatingDockDemo } from "./floating";
import { MainText } from "./MainText";
import DP from "./DP";
import HeroText from "./UI/HeroText";

export function Hero() {
  return (
    <BackgroundBeamsWithCollision>
      <div className="flex flex-col">
        <div className="w-screen bottom-0 z-50 sm:top-6 sm:left-0 left-0 h-16 absolute">
          <FloatingDockDemo />
        </div>
        <div className="w-screen h-screen flex sm:items-center sm:flex-row flex-col">
          <div className="w-[50%] h-full sm:flex hidden">
            <MainText />
          </div>
          <HeroText variant="mobile" />
          <div className="sm:w-[50%] sm:h-full mx-auto w-[80%] h-[50%] flex justify-center items-end">
            <DP />
          </div>
        </div>
      </div>
    </BackgroundBeamsWithCollision>
  );
}
