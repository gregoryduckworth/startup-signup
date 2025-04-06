import { 
  Users, 
  LineChart, 
  ShieldCheck, 
  LayoutDashboard, 
  Globe, 
  Code 
} from "lucide-react";

const features = [
  {
    icon: <Users className="h-5 w-5 text-primary" />,
    title: "Seamless Collaboration",
    description: "Break down silos and enable teams to work together more efficiently than ever before."
  },
  {
    icon: <LineChart className="h-5 w-5 text-primary" />,
    title: "Enhanced Productivity",
    description: "Advanced AI tools that streamline workflows and automate repetitive tasks."
  },
  {
    icon: <ShieldCheck className="h-5 w-5 text-primary" />,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance with global security standards to protect your data."
  },
  {
    icon: <LayoutDashboard className="h-5 w-5 text-primary" />,
    title: "Intuitive Dashboard",
    description: "Customizable views that provide real-time insights into project progress and team performance."
  },
  {
    icon: <Globe className="h-5 w-5 text-primary" />,
    title: "Remote-First Design",
    description: "Built for distributed teams with features that make distance irrelevant to successful collaboration."
  },
  {
    icon: <Code className="h-5 w-5 text-primary" />,
    title: "Powerful Integrations",
    description: "Seamlessly connects with your existing tools and workflows for a unified experience."
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 bg-white section-fade-in">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Teams Love Our Platform</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Designed to solve the most pressing challenges facing modern organizations today.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-100 flex flex-col">
              <div className="rounded-full bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">{feature.title}</h3>
              <p className="text-gray-600 flex-grow">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
