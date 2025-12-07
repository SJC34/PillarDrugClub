import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { 
  CheckCircle, 
  Phone as PhoneIcon,
  Mail,
  Loader2,
  Calendar,
  Clock,
  Truck,
  Pill,
  User,
  Heart,
  Star,
  MessageCircle,
  Stethoscope
} from "lucide-react";
import sethPhoto from "@assets/IMG_3299_1765089660918.jpeg";

const signupFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, "Please enter a valid phone number (e.g., 555-123-4567)"),
});

type SignupFormValues = z.infer<typeof signupFormSchema>;

export default function PreLaunchPage() {
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupFormValues) => {
      return apiRequest("POST", "/api/email-signup", { ...data, source: "concierge_prelaunch" });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "You're on the list!",
        description: "We'll be in touch soon to discuss your pharmacy needs.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Oops!",
        description: error.message || "Something went wrong. Please try again.",
      });
    },
  });

  const onSubmit = (data: SignupFormValues) => {
    signupMutation.mutate(data);
  };

  const benefits = [
    {
      icon: Calendar,
      title: "Annual Medication Supplies",
      description: "Get 6 or 12-month supplies of your medications — no more monthly refill hassles"
    },
    {
      icon: Truck,
      title: "Delivered to Your Door",
      description: "Skip the pharmacy lines. Your medications arrive at home on your schedule"
    },
    {
      icon: Clock,
      title: "Refill Coordination",
      description: "We manage refill timing and prescriber renewals so you never run out"
    },
    {
      icon: MessageCircle,
      title: "Free Initial Consult",
      description: "Talk with a pharmacist about your medications, savings opportunities, and care plan"
    }
  ];

  const includedServices = [
    "Free initial pharmacist consultation",
    "6 or 12-month medication supplies",
    "Refill coordination and renewal reminders",
    "Transparent cash pricing — no insurance needed",
    "Home delivery included",
    "Ongoing clinical medication reviews",
    "Drug interaction monitoring",
    "Direct pharmacist phone/text access"
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full border-2 border-primary/20 shadow-2xl">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
              Welcome to Pillar!
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Thank you for your interest in Concierge Pharmacy. We'll reach out personally within 24-48 hours to discuss your needs.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">What happens next:</p>
              <p>Dr. Seth Collins, Pharm.D. will contact you directly to learn about your medications and how we can help you save.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const SignupForm = ({ idSuffix = "" }: { idSuffix?: string }) => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Full name"
                    {...field}
                    disabled={signupMutation.isPending}
                    className="h-12 text-base pl-10"
                    data-testid={`input-name-prelaunch${idSuffix}`}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    {...field}
                    disabled={signupMutation.isPending}
                    className="h-12 text-base pl-10"
                    data-testid={`input-email-prelaunch${idSuffix}`}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Phone number (e.g., 555-123-4567)"
                    {...field}
                    disabled={signupMutation.isPending}
                    className="h-12 text-base pl-10"
                    data-testid={`input-phone-prelaunch${idSuffix}`}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-bold"
          disabled={signupMutation.isPending}
          data-testid={`button-join-prelaunch${idSuffix}`}
        >
          {signupMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            "Request Early Access"
          )}
        </Button>
      </form>
    </Form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-60 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-12 md:pt-20 md:pb-16">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight">
              PILLAR DRUG CLUB
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Concierge Pharmacy Services</p>
          </div>

          {/* Main Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Limited to 600 Members</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 text-foreground leading-tight">
              Annual Medication Supplies
              <br />
              <span className="text-primary">Managed For You</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              6 and 12-month prescriptions delivered to your door. Refill coordination handled. 
              Transparent cash pricing — no insurance hassles. Free initial consult included.
            </p>
          </div>

          {/* Pricing */}
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-2xl p-6 md:p-8 border-2 border-primary/20">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Annual Membership
              </p>
              <p className="text-5xl md:text-6xl font-black text-primary mb-2">$600</p>
              <p className="text-lg text-muted-foreground">per year</p>
              <p className="text-sm text-muted-foreground mt-2">
                That's just <span className="font-bold text-foreground">$50/month</span> for complete medication management
              </p>
            </div>
          </div>

          {/* Signup Form */}
          <div className="max-w-md mx-auto mb-12">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">Join the Waitlist</h3>
                </div>
                <SignupForm />
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  We'll reach out personally to discuss your pharmacy needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
              Why Pillar Drug Club?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Skip the monthly pharmacy trips. Get annual supplies delivered, with refill coordination 
              handled for you. Simple cash pricing — no insurance paperwork, no surprises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className="border border-border"
                data-testid={`card-benefit-${index}`}
              >
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                    <benefit.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
              Everything Included
            </h2>
            <p className="text-muted-foreground">
              One annual fee. Complete pharmacy concierge service.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {includedServices.map((service, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg bg-muted/50"
                data-testid={`service-item-${index}`}
              >
                <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-foreground font-medium">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet Your Pharmacist */}
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-background rounded-2xl p-8 md:p-12 border border-border">
            <div className="text-center">
              <div className="inline-block mb-6">
                <img 
                  src={sethPhoto} 
                  alt="Seth Collins, Pharm.D." 
                  className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                />
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
                Meet Your Pharmacist
              </h2>
              <p className="text-xl font-bold text-primary mb-2">Seth Collins, Pharm.D.</p>
              <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                Doctor of Pharmacy with a mission to make prescription medications affordable and accessible. 
                Direct, personal care — not algorithms or call centers.
              </p>
              <div className="flex items-center justify-center gap-1 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-current" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                "Finally, a pharmacist who actually knows my medications and cares about my health."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-16">
        <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-4 text-foreground">
            Ready to Transform Your Pharmacy Experience?
          </h2>
          <p className="text-muted-foreground mb-6">
            Limited to 600 members. Join the waitlist today.
          </p>
          
          <Card className="border-2 border-primary/20 shadow-xl">
            <CardContent className="p-6">
              <SignupForm idSuffix="-footer" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Pillar Drug Club. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
