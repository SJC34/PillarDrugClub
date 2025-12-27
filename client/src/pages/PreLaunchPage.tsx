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
  HeadphonesIcon,
  FileCheck,
  Sparkles,
  ChevronRight,
  Crown
} from "lucide-react";

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
              Thank you for your interest in our pharmacy consulting service. We'll reach out personally within 24-48 hours to discuss your needs.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-semibold text-gray-900 mb-1">What happens next:</p>
              <p>A pharmacist consultant will contact you to learn about your medications and discuss how we can help you navigate the pharmacy system.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const valueProps = [
    {
      icon: HeadphonesIcon,
      title: "Your Personal Pharmacy Advocate",
      description: "A dedicated pharmacist consultant who navigates the pharmacy system for you — answering questions, researching options, and advocating on your behalf."
    },
    {
      icon: Calendar,
      title: "Cost Transparency Research",
      description: "We research and compare medication costs across pharmacies so you can make informed decisions about where to fill your prescriptions."
    },
    {
      icon: Users,
      title: "Coordination & Communication",
      description: "We coordinate with your doctors, handle prescription transfers, and communicate with pharmacies so you don't have to."
    }
  ];

  const howItWorks = [
    {
      step: 1,
      title: "Share Your Medication List",
      description: "Tell us what you take. We'll review your medications and research cost-saving opportunities."
    },
    {
      step: 2,
      title: "We Research & Advocate",
      description: "Your pharmacist consultant researches the best pharmacy options and pricing for your specific medications."
    },
    {
      step: 3,
      title: "We Coordinate Everything",
      description: "We communicate with your prescribers and pharmacies, handling transfers and renewals on your behalf."
    },
    {
      step: 4,
      title: "Ongoing Consulting Support",
      description: "Questions about your medications? Need help navigating a pharmacy issue? Your consultant is just a call away."
    }
  ];

  const conciergePlan = {
    name: "Concierge",
    price: "$600",
    period: "/year",
    description: "White-glove pharmacy consulting for those who value their time",
    features: [
      "Dedicated pharmacist consultant",
      "Comprehensive Medication Reviews",
      "Cost comparison research",
      "Drug interaction analysis",
      "Prescription coordination",
      "Provider communication support",
      "Same-day response guarantee"
    ],
    cta: "Become a Member"
  };

  const faqs = [
    {
      question: "Are you a pharmacy?",
      answer: "No. Pillar Drug Club is a pharmacy consulting and advocacy service. We do not dispense, sell, or ship medications. We are pharmacist consultants who help you navigate the pharmacy system, research cost-saving options, and coordinate with your healthcare providers."
    },
    {
      question: "What exactly do you do?",
      answer: "We provide expert pharmacy consulting services: medication reviews, cost research, prescription coordination with your doctors, and ongoing advocacy. Think of us as your personal pharmacy navigator — we do the legwork so you don't have to."
    },
    {
      question: "Do I need insurance to use your consulting services?",
      answer: "No insurance required for our consulting membership. We help both insured and uninsured patients navigate the complex pharmacy landscape and find the most affordable options for their medications."
    },
    {
      question: "How do I actually get my medications?",
      answer: "You fill your prescriptions at the pharmacy of your choice. We research options and help you find the best prices, but the actual medication purchase is between you and your chosen pharmacy — we are not involved in that transaction."
    },
    {
      question: "What types of medications can you help with?",
      answer: "We can consult on virtually any prescription medication. Our pharmacist consultants specialize in chronic medications like those for blood pressure, cholesterol, diabetes, and mental health — but we're happy to help research any medication."
    },
    {
      question: "What happens if my medication changes?",
      answer: "Your pharmacist consultant helps coordinate with your prescriber and researches updated pricing options. We're here to support you through any medication changes."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <span className="text-base sm:text-xl font-bold text-gray-900 whitespace-nowrap">Pillar Drug Club</span>
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
                Your Personal
                <span className="text-primary"> Pharmacy Advocate.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Expert pharmacy consulting to help you navigate costs, coordinate prescriptions, and get answers from a real pharmacist — on your schedule.
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
                  Licensed pharmacist consultants
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Cost research & comparison
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Prescription coordination
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
              Navigate the Pharmacy System with Confidence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our pharmacist consultants handle the complexity so you can focus on your health.
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
              How Our Consulting Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From signup to ongoing support in four simple steps.
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">Individuals, Families & Caregivers</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  People who want expert guidance navigating the pharmacy system, finding cost savings, and getting answers from a real pharmacist.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Managing multiple medications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Seeking cost-saving options
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Want personal pharmacist advocacy
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
                  Direct Primary Care and concierge practices seeking pharmacy consulting support for their patients.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Cost research for patient medications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Prescription coordination support
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Dedicated clinic liaison contact
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
              Consulting Membership
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              One plan. Expert pharmacy advocacy. No surprises.
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
                    <span className="text-5xl font-bold text-gray-900">$50</span>
                    <span className="text-gray-600 text-lg">/mo</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    with pay-as-you-go plans
                  </p>
                  <p className="text-sm text-gray-900 font-medium mb-2">
                    Or $600/year
                  </p>
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
                A Pharmacy Consulting Partner for Your Practice
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Partner with Pillar Drug Club to give your patients expert pharmacy navigation and advocacy support.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "Medication cost research for your patients",
                  "Prescription coordination support",
                  "Dedicated clinic liaison contact",
                  "Help patients navigate pharmacy options"
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
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white shadow-lg mx-auto mb-4">
                      <Stethoscope className="h-12 w-12 text-primary" />
                    </div>
                    <h4 className="text-xl font-bold text-gray-900">Founded by Pharmacists</h4>
                    <p className="text-gray-600">Clinical Expertise You Can Trust</p>
                  </div>
                  <p className="text-gray-600 text-center italic">
                    "We started Pillar Drug Club because we saw patients struggling with pharmacy complexity, insurance hurdles, and monthly refill chaos. There's a better way."
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
              { icon: Stethoscope, text: "Licensed pharmacist consultants" },
              { icon: Shield, text: "HIPAA-compliant communication" },
              { icon: FileCheck, text: "Evidence-based medication guidance" },
              { icon: Building2, text: "Independent advocacy — no pharmacy affiliations" }
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
            Ready for Expert Pharmacy Advocacy?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join Pillar Drug Club and let our pharmacist consultants navigate the pharmacy system for you.
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
              <Pill className="h-5 w-5 sm:h-6 sm:w-6 text-teal-400 flex-shrink-0" />
              <span className="text-base sm:text-xl font-bold text-white whitespace-nowrap">Pillar Drug Club</span>
            </div>
            <p className="text-gray-400 text-center md:text-right">
              Your pharmacy advocate.
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
              Pillar Drug Club is a pharmacy consulting service. We do not dispense, sell, or ship medications. All medication purchases are made directly between you and your chosen pharmacy.
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
