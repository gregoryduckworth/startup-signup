import { useScrollReveal } from "../main";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import AboutSection from "@/components/AboutSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import WaitlistSection from "@/components/WaitlistSection";
import VisualFeatureSection from "@/components/VisualFeatureSection";
import Footer from "@/components/Footer";

export default function Home() {
  // Initialize scroll reveal effect
  useScrollReveal();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <AboutSection />
      <TestimonialsSection />
      <WaitlistSection />
      <VisualFeatureSection />
      <Footer />
    </div>
  );
}
