import { useState } from "react";
import { RocketIcon, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: "smooth",
      });
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="bg-white shadow-sm fixed w-full z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="bg-primary text-white p-2 rounded-md">
            <RocketIcon className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">InnovateTech</h1>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <button 
            onClick={() => scrollToSection('features')} 
            className="text-gray-600 hover:text-primary font-medium transition-colors"
          >
            Features
          </button>
          <button 
            onClick={() => scrollToSection('about')} 
            className="text-gray-600 hover:text-primary font-medium transition-colors"
          >
            About
          </button>
          <button 
            onClick={() => scrollToSection('waitlist')} 
            className="text-gray-600 hover:text-primary font-medium transition-colors"
          >
            Join Waitlist
          </button>
        </nav>
        
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col gap-4 mt-8">
              <Button 
                variant="ghost" 
                onClick={() => scrollToSection('features')} 
                className="justify-start"
              >
                Features
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => scrollToSection('about')} 
                className="justify-start"
              >
                About
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => scrollToSection('waitlist')} 
                className="justify-start"
              >
                Join Waitlist
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
