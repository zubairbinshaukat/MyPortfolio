import React from "react";
import { ProjectsData } from "./ProjectsData";

const Projects = () => {
  return (
    <div className="dark:bg-black bg-white h-screen w-screen flex flex-col items-center justify-center">
      <h2 className="dark:text-white text-black  text-center pt-10 text-5xl">
        Projects
      </h2>
      <div className="w-full h-full flex items-center justify-center">
        <ProjectsData />
      </div>
    </div>
  );
};

export default Projects;
