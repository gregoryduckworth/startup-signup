import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById('waitlist');
    if (waitlistSection) {
      window.scrollTo({
        top: waitlistSection.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="pt-32 pb-20 md:pt-40 md:pb-28 px-4 bg-gradient-to-br from-white to-primary-50">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4 animate-fade-in">
              The Future of Work<br /><span className="text-primary">Starts Here</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
              We're building a revolutionary platform that transforms how teams collaborate, innovate, and succeed in the digital age.
            </p>
            <div className="animate-slide-up" style={{animationDelay: '0.4s'}}>
              <Button 
                onClick={scrollToWaitlist}
                className="button-cta inline-flex items-center px-6 py-6 bg-primary text-white rounded-lg font-medium text-lg shadow-lg hover:bg-primary/90"
              >
                Join the Waitlist
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 animate-fade-in" style={{animationDelay: '0.4s'}}>
            <img 
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80" 
              alt="Modern office environment with team collaboration" 
              className="rounded-xl shadow-2xl w-full h-auto animate-bounce-subtle"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
