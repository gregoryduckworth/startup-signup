import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    quote: "The platform has transformed how our distributed team coordinates projects across time zones. It's like they understood our pain points before we even articulated them.",
    name: "Jessica Davis",
    title: "CTO, TechStart Inc.",
    initials: "JD"
  },
  {
    quote: "The AI features have saved us countless hours on tedious tasks. Our creative team now spends more time on strategic thinking and less on administrative work.",
    name: "Michael Rodriguez",
    title: "Creative Director, DesignLab",
    initials: "MR"
  },
  {
    quote: "As a rapidly scaling startup, we needed a solution that could grow with us. This platform is flexible enough to adapt to our changing needs while remaining intuitive.",
    name: "Sarah Lin",
    title: "Operations Lead, GrowthByte",
    initials: "SL"
  }
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 px-4 bg-white section-fade-in">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Early Feedback from Beta Users</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">Here's what teams are saying about our platform during closed beta testing.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-white shadow-md hover:shadow-lg transition-shadow border border-gray-100 relative">
              <CardContent className="p-6">
                <div className="absolute -top-4 left-6 text-5xl text-primary/30">"</div>
                <p className="text-gray-700 mb-6 pt-4">
                  {testimonial.quote}
                </p>
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4">
                    <AvatarFallback className="bg-primary/20 text-primary-foreground">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
