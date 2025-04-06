import { User, Box } from "lucide-react";

export default function AboutSection() {
  return (
    <section id="about" className="py-20 px-4 bg-gray-50 section-fade-in">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1600&q=80" 
              alt="Innovative team working together" 
              className="rounded-xl shadow-xl" 
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-6">
              At InnovateTech, we believe that great work happens when talented people have the right tools. Our mission is to empower organizations of all sizes with technology that enhances human potential rather than replacing it.
            </p>
            <p className="text-lg text-gray-700 mb-8">
              Founded by a team of industry veterans with experience at leading tech companies, we're combining deep expertise in AI, UX design, and enterprise software to create something truly revolutionary.
            </p>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">3,000+</h4>
                  <p className="text-gray-600">Beta Testers</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mr-4">
                  <Box className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">$4.2M</h4>
                  <p className="text-gray-600">Seed Funding</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
