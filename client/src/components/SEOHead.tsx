import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  schema?: object;
}

export function SEOHead({ 
  title, 
  description, 
  canonical,
  schema 
}: SEOHeadProps) {
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
      const scriptId = 'schema-org-jsonld';
      let script: HTMLScriptElement | null = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      
      script.textContent = JSON.stringify(schema);
    }
  }, [title, description, canonical, schema]);

  return null;
}

export const pharmacySchema = {
  "@context": "https://schema.org",
  "@type": "Pharmacy",
  "name": "Pillar Drug Club",
  "description": "Wholesale pharmacy offering prescription medications as low as 1¢ per tablet with transparent pricing and no insurance required",
  "url": "https://pillardrugclub.com",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "US"
  },
  "email": "support@pillardrugclub.com",
  "availableService": [
    {
      "@type": "MedicalProcedure",
      "name": "Prescription Medication Dispensing",
      "description": "Wholesale prescription medications at true cost plus minimal markup"
    },
    {
      "@type": "Service",
      "name": "Year Supply Prescriptions",
      "description": "6-month and 12-month supply prescriptions for chronic medications"
    },
    {
      "@type": "DeliveryService",
      "name": "Nationwide Home Delivery",
      "description": "Free delivery of prescription medications to all 50 states"
    }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Prescription Medications",
    "description": "3000+ generic and brand name medications at wholesale pricing",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Product",
          "name": "Generic Prescription Medications",
          "description": "Affordable generic medications as low as 1¢ per tablet"
        }
      }
    ]
  }
};

export const medicalWebPageSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  "name": "Pillar Drug Club - Wholesale Prescription Pharmacy",
  "description": "Access affordable prescription medications at wholesale prices with transparent pricing",
  "url": "https://pillardrugclub.com",
  "specialty": "Pharmacy",
  "about": {
    "@type": "MedicalBusiness",
    "name": "Pillar Drug Club",
    "description": "Direct-to-consumer wholesale pharmacy"
  },
  "audience": {
    "@type": "MedicalAudience",
    "audienceType": "Patients seeking affordable medications",
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
      "name": "How much do prescriptions cost at Pillar Drug Club?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pillar Drug Club offers prescription medications as low as 1¢ per tablet at true wholesale cost. We provide transparent pricing with no hidden fees, and you can save up to 95% compared to traditional pharmacies."
      }
    },
    {
      "@type": "Question",
      "name": "Do I need insurance to use Pillar Drug Club?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "No insurance is required! Pillar Drug Club offers wholesale pricing directly to consumers, bypassing insurance and PBMs. Our transparent pricing often beats insurance copays."
      }
    },
    {
      "@type": "Question",
      "name": "What membership tiers are available?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We offer three tiers: Free Tier ($0/month with $30 fee per order, 90-day max supply), Gold Plan ($15/month for 1-3 medications with 6-month and 1-year supplies), and Platinum Plan ($25/month for 4+ medications with 6-month and 1-year supplies)."
      }
    },
    {
      "@type": "Question",
      "name": "How does delivery work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Pillar Drug Club provides free nationwide home delivery to all 50 states. Your medications are delivered directly to your door with secure packaging and tracking."
      }
    },
    {
      "@type": "Question",
      "name": "What types of medications are available?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We offer 3000+ generic and brand name prescription medications covering chronic conditions like diabetes, hypertension, cholesterol, and more. All medications are sourced from licensed wholesalers."
      }
    }
  ]
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Pillar Drug Club",
  "url": "https://pillardrugclub.com",
  "description": "Wholesale pharmacy providing prescription medications at true cost with transparent pricing",
  "foundingDate": "2024",
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "support@pillardrugclub.com",
    "availableLanguage": ["English"]
  }
};
