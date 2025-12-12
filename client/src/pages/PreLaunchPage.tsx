import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  CheckCircle, 
  Phone as PhoneIcon,
  Mail,
  Loader2,
  Calendar,
  Clock,
  Users,
  Shield,
  User,
  Heart,
  Pill,
  ArrowRight,
  Building2,
  Stethoscope,
  Package,
  HeadphonesIcon,
  FileCheck,
  Sparkles,
  ChevronRight,
  Crown
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const SignupForm = ({ idSuffix = "", variant = "default" }: { idSuffix?: string; variant?: "default" | "hero" }) => (
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
                    className="h-12 text-base pl-10 bg-white"
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
                    className="h-12 text-base pl-10 bg-white"
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
                    placeholder="Phone number"
                    {...field}
                    disabled={signupMutation.isPending}
                    className="h-12 text-base pl-10 bg-white"
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
          className={`w-full h-12 text-base font-semibold ${variant === "hero" ? "bg-primary hover:bg-primary/90" : ""}`}
          disabled={signupMutation.isPending}
          data-testid={`button-join-prelaunch${idSuffix}`}
        >
          {signupMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              Get Started in 3 Minutes
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>
    </Form>
  );

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <Card className="max-w-lg w-full border border-gray-200 shadow-xl">
          <CardContent className="p-8 md:p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
              Welcome to Pillar Drug Club
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Thank you for your interest in our concierge medication service. We'll reach out personally within 24-48 hours to discuss your needs.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-900 mb-1">What happens next:</p>
              <p>Dr. Seth Collins, Pharm.D. will contact you directly to learn about your medications and create your personalized care plan.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const valueProps = [
    {
      icon: HeadphonesIcon,
      title: "Concierge Medication Management",
      description: "Personal pharmacist support for refills, renewals, and medication questions — no more pharmacy phone trees."
    },
    {
      icon: Calendar,
      title: "Predictable, Transparent Costs",
      description: "Know exactly what you'll pay. Pass-through pricing with no hidden fees or insurance surprises."
    },
    {
      icon: Package,
      title: "Fewer Refills, Fewer Headaches",
      description: "6–12 month supplies when clinically appropriate. One shipment instead of monthly pharmacy trips."
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Share Your Medication List",
      description: "Tell us what you take. We'll review your medications and identify savings opportunities."
    },
    {
      step: 2,
      title: "We Coordinate Everything",
      description: "Behind the scenes, we work with your prescriber and our licensed pharmacy partners."
    },
    {
      step: 3,
      title: "Medications Arrive at Your Door",
      description: "6–12 month supplies delivered directly to you, with refill coordination handled."
    },
    {
      step: 4,
      title: "Ongoing Concierge Support",
      description: "Questions? Renewals? Changes? Your personal pharmacist is just a call or text away."
    }
  ];

  const conciergePlan = {
    name: "Concierge",
    price: "$600",
    period: "/year",
    description: "White-glove medication management for those who value their time",
    features: [
      "Dedicated concierge pharmacist",
      "12-month medication supplies",
      "Unlimited medication reviews",
      "Drug interaction monitoring",
      "Direct pharmacist text line",
      "Specialty medication support",
      "Clinic coordination services",
      "Same-day response guarantee"
    ],
    cta: "Become a Member"
  };

  const faqs = [
    {
      question: "Are you a pharmacy?",
      answer: "No. Pillar Drug Club is a concierge medication management membership. We partner with licensed U.S. pharmacies to fulfill your prescriptions, but we focus on coordination, convenience, and personal service — not retail pharmacy operations."
    },
    {
      question: "Do I need insurance to use Pillar Drug Club?",
      answer: "No insurance required. Our transparent cash pricing is often lower than insurance copays for generic medications. We work outside the insurance system to provide simple, predictable costs."
    },
    {
      question: "Why are your prices lower than my pharmacy?",
      answer: "Traditional pharmacies have high overhead and opaque pricing. We use pass-through pricing from high-volume pharmacy partners and don't mark up medications. You pay what we pay, plus your membership."
    },
    {
      question: "What medications can I get through Pillar?",
      answer: "We focus on chronic, maintenance medications — things like blood pressure, cholesterol, diabetes, thyroid, and mental health medications. We specialize in FDA-approved generics. Controlled substances and specialty medications may have limitations."
    },
    {
      question: "What happens if my dose changes mid-year?",
      answer: "Your concierge pharmacist coordinates dose changes with your prescriber at no extra charge. We'll adjust your remaining supply and ensure a smooth transition."
    },
    {
      question: "Where do you ship?",
      answer: "We ship to all 50 U.S. states. Shipping is included in your membership — no extra delivery fees."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Pill className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold text-gray-900">Pillar Drug Club</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('how-it-works')} className="text-gray-600 hover:text-gray-900 text-sm font-medium" data-testid="nav-how-it-works">
                How It Works
              </button>
              <button onClick={() => scrollToSection('membership')} className="text-gray-600 hover:text-gray-900 text-sm font-medium" data-testid="nav-membership">
                Membership
              </button>
              <button onClick={() => scrollToSection('clinics')} className="text-gray-600 hover:text-gray-900 text-sm font-medium" data-testid="nav-clinics">
                For Clinics
              </button>
              <button onClick={() => scrollToSection('safety')} className="text-gray-600 hover:text-gray-900 text-sm font-medium" data-testid="nav-safety">
                Safety
              </button>
              <button onClick={() => scrollToSection('faq')} className="text-gray-600 hover:text-gray-900 text-sm font-medium" data-testid="nav-faq">
                FAQ
              </button>
            </div>

            <Link href="/login">
              <Button 
                variant="ghost"
                data-testid="nav-login"
              >
                Log In
              </Button>
            </Link>
            <Button 
              onClick={() => scrollToSection('signup')}
              className="bg-primary hover:bg-primary/90"
              data-testid="nav-cta-become-member"
            >
              Become a Member
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-50 via-white to-teal-50/30 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-40 w-80 h-80 bg-primary/10/50 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Your Medication,
                <span className="text-primary"> Managed for You.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Concierge medication membership with 6–12 month supplies, refill coordination, and transparent pricing — all without using insurance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg"
                  onClick={() => scrollToSection('signup')}
                  className="bg-primary hover:bg-primary/90 text-lg h-14 px-8"
                  data-testid="hero-cta-get-started"
                >
                  Get Started in 3 Minutes
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => scrollToSection('membership')}
                  className="text-lg h-14 px-8"
                  data-testid="hero-cta-see-plans"
                >
                  See Membership Plan
                </Button>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  No insurance required
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Licensed U.S. pharmacy partners
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Transparent pricing
                </span>
              </div>
            </div>

            <div className="lg:pl-8">
              <Card className="border border-gray-200 shadow-xl" id="signup">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Start Your Membership</h3>
                      <p className="text-sm text-gray-500">We'll reach out within 24 hours</p>
                    </div>
                  </div>
                  <SignupForm variant="hero" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Why Pillar - Value Props */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              A Better Pharmacy Experience — Finally.
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pillar Drug Club handles the complexity so you can focus on your health.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {valueProps.map((prop, index) => (
              <Card key={index} className="border border-gray-100 hover-elevate" data-testid={`value-prop-${index}`}>
                <CardContent className="p-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-6">
                    <prop.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{prop.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{prop.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How Pillar Drug Club Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From signup to doorstep delivery in four simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, index) => (
              <div key={index} className="relative" data-testid={`how-it-works-step-${step.step}`}>
                <div className="text-6xl font-bold text-primary-foreground/80 mb-4">{step.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
                {index < howItWorks.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-8 -right-4 h-8 w-8 text-teal-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Who Pillar Drug Club Is For
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border border-gray-100" data-testid="who-for-individuals">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-6">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Individuals & Families</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  People who take chronic medications and want predictable access, transparent pricing, and personal support — without the monthly pharmacy hassle.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Stable, chronic medication regimens
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Uninsured or high-deductible plans
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Value convenience and personal service
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-gray-100" data-testid="who-for-clinics">
              <CardContent className="p-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 mb-6">
                  <Building2 className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Concierge & DPC Clinics</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Direct Primary Care and concierge practices looking to reduce refill emergencies and offer patients a premium medication experience.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Fewer urgent refill requests
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Transparent pricing for patients
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Dedicated clinic concierge support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Concierge Membership
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              One plan. Complete medication management. No surprises.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <Card 
              className="border-primary border-2 shadow-xl"
              data-testid="membership-plan-concierge"
            >
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Crown className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{conciergePlan.name}</h3>
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-gray-900">{conciergePlan.price}</span>
                    <span className="text-gray-600 text-lg">{conciergePlan.period}</span>
                  </div>
                  <p className="text-gray-600">{conciergePlan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {conciergePlan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={() => scrollToSection('signup')}
                  className="w-full bg-primary hover:bg-primary/90"
                  size="lg"
                  data-testid="button-choose-concierge"
                >
                  {conciergePlan.cta}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <p className="text-center text-sm text-gray-500 mt-4">
                  Limited to 600 founding members
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* For Clinics */}
      <section id="clinics" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Stethoscope className="h-4 w-4" />
                For Healthcare Practices
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                A Medication Concierge Layer for Your Practice
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Partner with Pillar Drug Club to reduce refill emergencies and give your patients predictable medication access.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "6–12 month supply planning for stable medications",
                  "Fewer urgent refill calls to your practice",
                  "Dedicated clinic concierge contact",
                  "Transparent pricing your patients can understand"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="p-1 rounded-full bg-primary/10">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-gray-700 text-lg">{item}</span>
                  </li>
                ))}
              </ul>

              <Button 
                size="lg"
                onClick={() => scrollToSection('signup')}
                className="bg-primary hover:bg-primary/90"
                data-testid="clinic-cta-book-overview"
              >
                Book a 20-Minute Clinic Overview
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="lg:pl-8">
              <Card className="border border-gray-200 bg-gray-50">
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <img 
                      src={sethPhoto} 
                      alt="Seth Collins, Pharm.D." 
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mx-auto mb-4"
                    />
                    <h4 className="text-xl font-bold text-gray-900">Seth Collins, Pharm.D.</h4>
                    <p className="text-gray-600">Founder & Clinical Pharmacist</p>
                  </div>
                  <p className="text-gray-600 text-center italic">
                    "I started Pillar Drug Club because I saw patients struggling with pharmacy complexity, insurance hurdles, and monthly refill chaos. There's a better way."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Standards */}
      <section id="safety" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Safety, Standards, and Licensing
            </h2>
            <p className="text-xl text-gray-600">
              Your health and safety are our top priority.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Building2, text: "Licensed U.S. pharmacy partners only" },
              { icon: FileCheck, text: "FDA-approved generic medications" },
              { icon: Stethoscope, text: "Prescription required for all medications" },
              { icon: Shield, text: "Secure, HIPAA-compliant systems" }
            ].map((item, index) => (
              <Card key={index} className="border border-gray-200" data-testid={`safety-item-${index}`}>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-gray-900 font-medium text-lg">{item.text}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="border border-gray-200 rounded-lg px-6"
                data-testid={`faq-item-${index}`}
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary to-primary/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready for a Better Pharmacy Experience?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join Pillar Drug Club and let us manage your medications so you can focus on living.
          </p>
          
          <Card className="border-0 shadow-2xl max-w-md mx-auto">
            <CardContent className="p-6 md:p-8">
              <SignupForm idSuffix="-footer" variant="hero" />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-2">
              <Pill className="h-6 w-6 text-teal-400" />
              <span className="text-xl font-bold text-white">Pillar Drug Club</span>
            </div>
            <p className="text-gray-400 text-center md:text-right">
              Your medication, managed.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
            <button onClick={() => scrollToSection('how-it-works')} className="text-gray-400 hover:text-white">
              How It Works
            </button>
            <button onClick={() => scrollToSection('membership')} className="text-gray-400 hover:text-white">
              Membership
            </button>
            <button onClick={() => scrollToSection('clinics')} className="text-gray-400 hover:text-white">
              For Clinics
            </button>
            <button onClick={() => scrollToSection('safety')} className="text-gray-400 hover:text-white">
              Safety
            </button>
            <button onClick={() => scrollToSection('faq')} className="text-gray-400 hover:text-white">
              FAQ
            </button>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <p className="text-center text-gray-500 text-sm mb-4">
              Pillar Drug Club is not insurance and does not replace your licensed prescriber.
            </p>
            <p className="text-center text-gray-500 text-sm">
              © 2025 Pillar Drug Club. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
