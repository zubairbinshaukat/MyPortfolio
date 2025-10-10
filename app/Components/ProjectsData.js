"use client";
import { ProjectCarousal } from "@/components/ui/ProjectCarousal";

export function ProjectsData() {
  const testimonials = [
    {
      quote:
        "The attention to detail and innovative features have completely transformed our workflow. This is exactly what we've been looking for.",
      name: "OpenCinema",
      link: "https://opencinema2.netlify.app",
      src: ["https://ik.imagekit.io/xosswhicz/project1.png"],
    },
    {
      quote:
        "Implementation was seamless and the results exceeded our expectations. The platform's flexibility is remarkable.",
      name: "Biz-Xpert (Web)",
      link: "https://www.biz-xpert.com",
      src: ["/projects/biz-xpert.png"],
    },
    {
      quote: "This Project is currently in Development.",
      name: "Biz-Xpert (Mobile)",
      link: "",
      src: ["/projects/bizmobile1.png","/projects/bizmobile3.png","/projects/bizmobile2.png"],
    },
    // ,
    // {
    //   quote:
    //     "Outstanding support and robust features. It's rare to find a product that delivers on all its promises.",
    //   name: "James Kim",
    //   link: "https://images.unsplash.com/photo-1636041293178-808a6762ab39?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    //   src: "https://images.unsplash.com/photo-1636041293178-808a6762ab39?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    // },
  ];
  return <ProjectCarousal testimonials={testimonials} />;
}
