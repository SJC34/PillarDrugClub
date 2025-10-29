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
  "description": "Get affordable prescription medications as low as 1¢ per pill without insurance. Save 90% on diabetes, blood pressure, cholesterol & more. Free home delivery nationwide.",
  "url": "https://pillardrugclub.com",
  "priceRange": "$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "4701 SW Admiral Way, Unit #336",
    "addressLocality": "Seattle",
    "addressRegion": "WA",
    "postalCode": "98106",
    "addressCountry": "US"
  },
  "email": "support@pillardrugclub.com",
  "availableService": [
    {
      "@type": "MedicalProcedure",
      "name": "Cheap Prescriptions Without Insurance",
      "description": "Save 90% on medications by buying directly at wholesale cost - no insurance needed"
    },
    {
      "@type": "Service",
      "name": "Year Supply Prescriptions",
      "description": "Order 6-month or 12-month medication supplies to save even more money"
    },
    {
      "@type": "DeliveryService",
      "name": "Free Home Delivery",
      "description": "Your medications shipped directly to your door at no extra cost"
    }
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Affordable Prescription Medications",
    "description": "3000+ medications for diabetes, high blood pressure, cholesterol, thyroid, depression and more"
  }
};

export const medicalWebPageSchema = {
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  "name": "Pillar Drug Club - Save Money on Prescriptions",
  "description": "Stop overpaying for prescriptions. Get medications as low as 1¢ per pill without insurance. Free delivery.",
  "url": "https://pillardrugclub.com",
  "specialty": "Pharmacy",
  "about": {
    "@type": "MedicalBusiness",
    "name": "Pillar Drug Club",
    "description": "Affordable prescription pharmacy helping people save money on medications"
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
        "text": "Traditional pharmacies mark up medications by 300-500% due to insurance middlemen (PBMs). Pillar Drug Club buys directly from wholesalers and passes the true cost to you - as low as 1¢ per pill. We cut out the middlemen so you stop overpaying."
      }
    },
    {
      "@type": "Question",
      "name": "Can I get prescriptions without insurance?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! No insurance needed. Pillar Drug Club offers direct wholesale pricing to anyone. Our prices are often cheaper than insurance copays, so you save money whether you have insurance or not."
      }
    },
    {
      "@type": "Question",
      "name": "How much will my prescription cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Use our free Cost Calculator to see exact prices for your medications. Most generic medications cost just pennies per pill. For example, common blood pressure meds are as low as 1¢ per tablet. No hidden fees - what you see is what you pay."
      }
    },
    {
      "@type": "Question",
      "name": "How do I save money on my medications?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Get year-supply prescriptions (6 or 12 months) instead of 30-day refills. This reduces dispensing fees and gives you better bulk pricing. Our Gold ($15/month) and Platinum ($25/month) plans unlock year-supply savings. Even our Free Tier saves you 90% vs retail."
      }
    },
    {
      "@type": "Question",
      "name": "What if I can't afford my prescriptions?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Start with our Free Tier - $0/month and only $30 per order. Common medications like metformin, lisinopril, and atorvastatin cost just dollars for a 90-day supply. We also offer payment plans and assistance programs for those who qualify."
      }
    },
    {
      "@type": "Question",
      "name": "Do you deliver to my home?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, free delivery nationwide to all 50 states. Your medications are shipped directly to your door with tracking. No pharmacy trips, no waiting in line."
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
  "name": "Pillar Drug Club",
  "url": "https://pillardrugclub.com",
  "logo": "https://pillardrugclub.com/logo.png",
  "description": "Helping Americans save money on prescriptions with affordable medications as low as 1¢ per pill. No insurance needed.",
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
    "email": "support@pillardrugclub.com",
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
        "name": "Pillar Drug Club"
      },
      "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "potentialAction": {
      "@type": "OrderAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://pillardrugclub.com/register",
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
