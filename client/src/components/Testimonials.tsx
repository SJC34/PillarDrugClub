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
      quote: "The process was incredibly straightforward. My doctor was professional, and I received my medication within two days. The pricing is transparent and fair.",
      author: "Sarah M.",
      condition: "Hypertension treatment",
      initials: "SM"
    },
    {
      quote: "I was paying $150/month for my diabetes medication. With Pillar, it's $45 and the quality is exactly the same. The consultation was thorough and professional.",
      author: "Robert C.",
      condition: "Diabetes management",
      initials: "RC"
    },
    {
      quote: "What impressed me most was the doctor taking time to understand my medical history. No rush, clear explanations, and genuine care for my wellbeing.",
      author: "Maria G.",
      condition: "Anxiety treatment",
      initials: "MG"
    }
  ];

  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl mb-6">
            Trusted by thousands
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Real experiences from people who've simplified their healthcare with Pillar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-0 shadow-sm" data-testid={`card-testimonial-${index}`}>
              <CardContent className="p-8 space-y-6">
                <blockquote className="text-lg leading-relaxed" data-testid={`text-testimonial-quote-${index}`}>
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium" data-testid={`text-testimonial-author-${index}`}>
                      {testimonial.author}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid={`text-testimonial-condition-${index}`}>
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