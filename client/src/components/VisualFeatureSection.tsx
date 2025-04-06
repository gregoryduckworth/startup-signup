import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Limited Early Access",
    description: "Our first release will be available to a select group of waitlist members starting next month."
  },
  {
    title: "Special Founding Member Pricing",
    description: "Waitlist members will lock in preferred rates that will be grandfathered as we scale."
  },
  {
    title: "Direct Input On Our Roadmap",
    description: "Early users will have a direct channel to our product team to help shape future development."
  }
];

export default function VisualFeatureSection() {
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
    <section className="py-20 px-4 bg-white section-fade-in">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row-reverse items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pl-10">
            <img 
              src="https://images.unsplash.com/photo-1581287053822-fd7bf4f4bfec?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80" 
              alt="Digital innovation concept" 
              className="rounded-xl shadow-xl" 
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Launching Soon</h2>
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 mt-2">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10">
              <Button 
                onClick={scrollToWaitlist}
                className="button-cta inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-medium text-lg shadow-lg hover:bg-primary/90"
              >
                Secure Your Spot
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
