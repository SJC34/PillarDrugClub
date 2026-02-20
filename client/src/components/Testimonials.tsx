import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Testimonial {
  quote: string;
  author: string;
  condition: string;
  initials: string;
}

export default function Testimonials() {
  //todo: remove mock functionality
  const testimonials: Testimonial[] = [
    {
      quote: "I'm saving over $200 a month on my blood pressure and cholesterol medications with Pharmacy Autopilot. The membership fee pays for itself in the first month!",
      author: "Sarah J.",
      condition: "Hypertension & cholesterol",
      initials: "SJ"
    },
    {
      quote: "As someone living with diabetes, my medication costs were breaking the bank. With Pharmacy Autopilot, I'm paying less than half of what I used to pay with insurance.",
      author: "Robert C.",
      condition: "Type 2 diabetes",
      initials: "RC"
    },
    {
      quote: "The transparency is what I love most. No surprises, no hidden fees - just straightforward pricing that's actually affordable. Plus, the home delivery is so convenient.",
      author: "Maria G.",
      condition: "Multiple prescriptions",
      initials: "MG"
    }
  ];

  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl mb-6">
            What our members say
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Thousands of members are saving on their medications every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-primary/5 dark:from-card dark:to-primary/5" data-testid={`card-testimonial-${index}`}>
              <CardContent className="p-8 space-y-6">
                <blockquote className="text-lg leading-relaxed" data-testid={`text-testimonial-quote-${index}`}>
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-lg">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground" data-testid={`text-testimonial-author-${index}`}>
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-primary font-medium" data-testid={`text-testimonial-condition-${index}`}>
                      {testimonial.condition}
                    </p>
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