import React from "react";
import { BackgroundBeamsWithCollision } from "../../components/ui/background-beams-with-collision";
import { FloatingDockDemo } from "./floating";
import { MainText } from "./MainText";
import DP from "./DP";
import HeroText from "./UI/HeroText";
import Image from "next/image";

export function Hero() {
  return (
    <BackgroundBeamsWithCollision>
      <div className="flex flex-col bg-black">
        <div className="w-screen z-50 sm:top-6 left-0 h-16 absolute">
          <FloatingDockDemo />
        </div>
        <div className="pl-7 sm:hidden block">
          <Image
            alt="logo"
            width={500}
            height={500}
            src={"/logo.png"}
            className="w-10 h-10 absolute top-5"
          />
        </div>
        <div className="w-screen h-dvh flex sm:items-center sm:flex-row flex-col">
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
