import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Quote } from "lucide-react";

interface Testimonial {
  quote: string;
  author: string;
  location: string;
  initials: string;
}

export default function Testimonials() {
  //todo: remove mock functionality
  const testimonials: Testimonial[] = [
    {
      quote: "I'm saving over $200 a month on my blood pressure and cholesterol medications with Pillar Drug Club. The membership fee pays for itself in the first month!",
      author: "Sarah Johnson",
      location: "Austin, TX",
      initials: "SJ"
    },
    {
      quote: "As someone living with diabetes, my medication costs were breaking the bank. With Pillar Drug Club, I'm paying less than half of what I used to pay with insurance.",
      author: "Robert Chen",
      location: "Chicago, IL",
      initials: "RC"
    },
    {
      quote: "The transparency is what I love most. No surprises, no hidden fees - just straightforward pricing that's actually affordable. Plus, the home delivery is so convenient.",
      author: "Maria Garcia",
      location: "Phoenix, AZ",
      initials: "MG"
    },
    {
      quote: "I was skeptical at first, but after comparing prices, I signed up immediately. My anxiety medication costs a fraction of what I was paying before. Life changing!",
      author: "David Williams",
      location: "Atlanta, GA",
      initials: "DW"
    }
  ];

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            What Our Members Say
          </h2>
          <p className="text-lg text-muted-foreground">
            Thousands of members are saving on their medications every day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="hover-elevate" data-testid={`card-testimonial-${index}`}>
              <CardContent className="p-8">
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                <blockquote className="text-lg mb-6" data-testid={`text-testimonial-quote-${index}`}>
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold" data-testid={`text-testimonial-author-${index}`}>
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-testimonial-location-${index}`}>
                      {testimonial.location}
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