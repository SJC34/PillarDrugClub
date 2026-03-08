import { useEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

let faqSchemaCounter = 0;

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
  noSchema?: boolean;
}

export function FAQAccordion({ items, className, noSchema }: FAQAccordionProps) {
  const scriptIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (noSchema) return;

    if (!scriptIdRef.current) {
      scriptIdRef.current = `faq-schema-${++faqSchemaCounter}`;
    }
    const scriptId = scriptIdRef.current;

    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    script.textContent = JSON.stringify(schema);

    return () => {
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, [items, noSchema]);

  return (
    <Accordion type="single" collapsible className={className}>
      {items.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`} data-testid={`faq-item-${index}`}>
          <AccordionTrigger
            className="text-left font-semibold text-foreground hover:no-underline"
            data-testid={`faq-trigger-${index}`}
          >
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed font-bold" data-testid={`faq-answer-${index}`}>
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
