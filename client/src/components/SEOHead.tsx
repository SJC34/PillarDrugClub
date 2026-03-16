import { useEffect, useRef } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  schema?: object;
}

export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://pillardrugclub.com';
}

let schemaIdCounter = 0;

export function SEOHead({ 
  title, 
  description, 
  canonical,
  schema 
}: SEOHeadProps) {
  const scriptIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (title) {
      document.title = title;
      const metaTitle = document.querySelector('meta[name="title"]');
      if (metaTitle) metaTitle.setAttribute('content', title);
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute('content', title);
      const twitterTitle = document.querySelector('meta[property="twitter:title"]');
      if (twitterTitle) twitterTitle.setAttribute('content', title);
    }

    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) metaDescription.setAttribute('content', description);
      const ogDescription = document.querySelector('meta[property="og:description"]');
      if (ogDescription) ogDescription.setAttribute('content', description);
      const twitterDescription = document.querySelector('meta[property="twitter:description"]');
      if (twitterDescription) twitterDescription.setAttribute('content', description);
    }

    if (canonical) {
      let link: HTMLLinkElement | null = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    if (schema) {
      if (!scriptIdRef.current) {
        scriptIdRef.current = `schema-org-jsonld-${++schemaIdCounter}`;
      }
      
      const scriptId = scriptIdRef.current;
      let script: HTMLScriptElement | null = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      
      script.textContent = JSON.stringify(schema);
      
      return () => {
        const existingScript = document.getElementById(scriptId);
        if (existingScript && existingScript.id === scriptIdRef.current) {
          existingScript.remove();
        }
      };
    }
  }, [title, description, canonical, schema]);

  return null;
}

export const pharmacySchema = {
  "@context": "https://schema.org",
  "@type": "Pharmacy",
  "name": "Pharmacy Autopilot",
  "description": "Get affordable prescription medications as low as $0.01 per tablet without insurance. Save up to 89% on diabetes meds, blood pressure medications, cholesterol drugs & more. Wholesale pricing. $5 flat-rate shipping nationwide. Savings vary by medication.",
  "url": "https://pharmacyautopilot.com",
  "priceRange": "$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "4701 SW Admiral Way, Unit #336",
    "addressLocality": "Seattle",
    "addressRegion": "WA",
    "postalCode": "98106",
    "addressCountry": "US"
  },
  "email": "support@pharmacyautopilot.com",
  "telephone": "+1-800-555-0123",
  "availableService": [
    {
      "@type": "MedicalProcedure",
      "name": "Cheap Prescriptions Without Insurance",
      "description": "Save up to 89% on medications by buying directly at wholesale cost - no insurance needed. Get diabetes medications, blood pressure pills, cholesterol drugs for pennies per pill"
    },
    {
      "@type": "Service",
      "name": "Year Supply Prescriptions",
      "description": "Order 6-month or 12-month medication supplies to save even more money. Perfect for chronic conditions like diabetes, hypertension, high cholesterol"
    },
    {
      "@type": "DeliveryService",
      "name": "$5 Flat-Rate Shipping",
      "description": "Your medications shipped directly to your door for a flat $5 per order. All 50 states, no insurance required"
    },
    {
      "@type": "Service",
      "name": "Prescription Transfer Service",
      "description": "Easy transfer from your current pharmacy. We handle everything - just provide your prescription information"
    }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Affordable Prescription Medications",
    "description": "3000+ medications for diabetes (metformin, insulin), high blood pressure (lisinopril, amlodipine), cholesterol (atorvastatin), thyroid, depression and more at wholesale prices"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "1247",
    "reviewCount": "1247"
  },
  "slogan": "Wholesale Prescription Pricing - Save Up to 89%"
};

export const medicalWebPageSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  "name": "Pharmacy Autopilot - Save Money on Prescriptions",
  "description": "Stop overpaying for prescriptions. Get medications as low as $0.01 per tablet without insurance. $5 flat-rate shipping.",
  "url": "https://pharmacyautopilot.com",
  "specialty": "Pharmacy",
  "about": {
    "@type": "MedicalBusiness",
    "name": "Pharmacy Autopilot",
    "description": "Affordable prescription pharmacy helping people save money on medications",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "4701 SW Admiral Way, Unit #336",
      "addressLocality": "Seattle",
      "addressRegion": "WA",
      "postalCode": "98106",
      "addressCountry": "US"
    }
  },
  "audience": {
    "@type": "MedicalAudience",
    "audienceType": "People who can't afford their prescriptions or want to save money on medications",
    "geographicArea": {
      "@type": "AdministrativeArea",
      "name": "United States"
    }
  },
  "lastReviewed": new Date().toISOString().split('T')[0]
};

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Why is my prescription so expensive?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Traditional pharmacies mark up medications by 300-500% due to insurance middlemen (PBMs). Pharmacy Autopilot buys directly from wholesalers and passes the true cost to you - as low as $0.01 per tablet. We cut out the middlemen so you stop overpaying."
      }
    },
    {
      "@type": "Question",
      "name": "Can I get prescriptions without insurance?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! No insurance needed. Pharmacy Autopilot offers direct wholesale pricing to anyone. Our prices are often cheaper than insurance copays, so you save money whether you have insurance or not."
      }
    },
    {
      "@type": "Question",
      "name": "How much will my prescription cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Use our free Cost Calculator to see exact prices for your medications. Most generic medications cost just pennies per pill. For example, common blood pressure meds are as low as $0.01 per tablet. No hidden fees - what you see is what you pay."
      }
    },
    {
      "@type": "Question",
      "name": "How do I save money on my medications?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Get extended supply prescriptions (up to 12 months) instead of 30-day refills. This reduces dispensing fees and gives you better bulk pricing. Our $99/year membership unlocks extended supply savings with just $10 dispensing per medication per fill."
      }
    },
    {
      "@type": "Question",
      "name": "What if I can't afford my prescriptions?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Start with our $99/year membership. Common medications like metformin, lisinopril, and atorvastatin cost just dollars for a 12-month supply. We also offer payment plans and assistance programs for those who qualify."
      }
    },
    {
      "@type": "Question",
      "name": "Do you deliver to my home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, nationwide delivery to all 50 states for a flat $5 per order. Your medications are shipped directly to your door with tracking. No pharmacy trips, no waiting in line."
      }
    },
    {
      "@type": "Question",
      "name": "What medications do you carry?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We have 3000+ medications for diabetes, high blood pressure, cholesterol, thyroid, depression, and more. Search our catalog to find your specific medication and see the exact cost before you order."
      }
    },
    {
      "@type": "Question",
      "name": "Is this safe and legitimate?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! We're a licensed pharmacy operating in all 50 states. All medications come from FDA-approved manufacturers through licensed U.S. wholesalers. Same quality medications, just without the markup."
      }
    }
  ]
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Pharmacy Autopilot",
  "url": "https://pharmacyautopilot.com",
  "logo": "https://pharmacyautopilot.com/logo.png",
  "description": "Helping Americans save money on prescriptions with affordable medications as low as $0.01 per tablet. No insurance needed.",
  "foundingDate": "2024",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "4701 SW Admiral Way, Unit #336",
    "addressLocality": "Seattle",
    "addressRegion": "WA",
    "postalCode": "98106",
    "addressCountry": "US"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "telephone": "+1-800-555-0123",
    "email": "support@pharmacyautopilot.com",
    "availableLanguage": "English"
  }
};

export interface DrugSchemaProps {
  name: string;
  genericName: string;
  brandName?: string;
  description: string;
  manufacturer?: string;
  dosageForm: string;
  strength: string;
  price: number;
  wholesalePrice: number;
  isPrescriptionOnly: boolean;
  category?: string;
}

export function createDrugSchema(props: DrugSchemaProps) {
  const savingsPercent = Math.round(((props.price - props.wholesalePrice) / props.price) * 100);
  
  return {
    "@context": "https://schema.org",
    "@type": "Drug",
    "name": props.name,
    "nonProprietaryName": props.genericName,
    "proprietaryName": props.brandName || props.name,
    "description": props.description,
    "dosageForm": props.dosageForm,
    "strength": props.strength,
    "manufacturer": props.manufacturer ? {
      "@type": "Organization",
      "name": props.manufacturer
    } : undefined,
    "isPrescriptionOnly": props.isPrescriptionOnly,
    "drugClass": props.category,
    "availableStrength": {
      "@type": "DrugStrength",
      "strengthValue": props.strength,
      "strengthUnit": ""
    },
    "offers": {
      "@type": "Offer",
      "price": props.wholesalePrice.toFixed(2),
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Pharmacy",
        "name": "Pharmacy Autopilot"
      },
      "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "potentialAction": {
      "@type": "OrderAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://pharmacyautopilot.com/register",
        "actionPlatform": [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform"
        ]
      }
    }
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export const howToSaveMoneySchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Save Money on Prescriptions Without Insurance",
  "description": "Step-by-step guide to getting affordable medications without insurance. Save up to 89% on diabetes meds, blood pressure medications, and other prescriptions. Savings vary by medication.",
  "totalTime": "PT10M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "0"
  },
  "step": [
    {
      "@type": "HowToStep",
      "position": 1,
      "name": "Search for Your Medication",
      "text": "Use our medication search tool to find your prescription. We have 3000+ medications including metformin, lisinopril, atorvastatin, and more.",
      "url": "https://pharmacyautopilot.com/medications"
    },
    {
      "@type": "HowToStep",
      "position": 2,
      "name": "Compare Wholesale Pricing",
      "text": "See the exact wholesale cost for your medication. Most generic drugs cost pennies per pill - as low as $0.01 per tablet. No insurance needed, no hidden fees.",
      "url": "https://pharmacyautopilot.com/cost-calculator"
    },
    {
      "@type": "HowToStep",
      "position": 3,
      "name": "Choose Your Membership Tier",
      "text": "Sign up for $99/year membership with $10 dispensing per medication per fill. Your membership gives you access to wholesale pricing and up to 12-month supply.",
      "url": "https://pharmacyautopilot.com/register"
    },
    {
      "@type": "HowToStep",
      "position": 4,
      "name": "Transfer or Upload Your Prescription",
      "text": "We'll transfer from your current pharmacy or you can upload a new prescription from your doctor. We handle all the paperwork.",
      "url": "https://pharmacyautopilot.com/prescription-request"
    },
    {
      "@type": "HowToStep",
      "position": 5,
      "name": "Get $5 Flat-Rate Shipping",
      "text": "Your medications ship directly to your door for a flat $5 per order. Tracking included. Available in all 50 states.",
      "url": "https://pharmacyautopilot.com"
    }
  ]
};

export const videoSchema = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Stop Overpaying for Prescriptions - Pharmacy Autopilot",
  "description": "See how Americans are saving 90% on medications by joining Pharmacy Autopilot. Get prescriptions as low as $0.01 per tablet without insurance.",
  "thumbnailUrl": "https://pharmacyautopilot.com/video-thumbnail.jpg",
  "uploadDate": "2024-01-01T00:00:00Z",
  "contentUrl": "https://pharmacyautopilot.com",
  "duration": "PT2M30S"
};
