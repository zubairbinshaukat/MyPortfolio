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
  ];
  return <ProjectCarousal testimonials={testimonials} />;
}
