import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { useEffect } from "react";

// Function to handle scroll reveal (will be used in components)
export const useScrollReveal = () => {
  useEffect(() => {
    const revealSections = document.querySelectorAll('.section-fade-in');
    
    function checkReveal() {
      revealSections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight * 0.85) {
          section.classList.add('visible');
        }
      });
    }
    
    // Check on load
    checkReveal();
    
    // Check on scroll
    window.addEventListener('scroll', checkReveal);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', checkReveal);
    };
  }, []);
};

createRoot(document.getElementById("root")!).render(<App />);
