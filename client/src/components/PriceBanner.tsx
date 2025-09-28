export default function PriceBanner() {
  const medications = [
    "Metformin 500mg - $12.50 (Save 85%)",
    "Lisinopril 10mg - $8.75 (Save 82%)", 
    "Atorvastatin 20mg - $15.20 (Save 79%)",
    "Amlodipine 5mg - $9.30 (Save 88%)",
    "Omeprazole 20mg - $14.60 (Save 76%)",
    "Sertraline 50mg - $18.90 (Save 73%)",
    "Levothyroxine 100mcg - $11.40 (Save 84%)",
    "Gabapentin 300mg - $16.80 (Save 71%)",
  ];

  // Duplicate the array for seamless scrolling
  const duplicatedMedications = [...medications, ...medications];

  return (
    <div className="w-full bg-primary text-primary-foreground py-1 overflow-hidden relative" data-testid="price-banner">
      <div className="flex whitespace-nowrap animate-marquee">
        <span className="text-sm font-semibold mr-8">💊 Wholesale Prices:</span>
        {duplicatedMedications.map((med, index) => (
          <span key={index} className="text-sm font-medium mx-8">
            {med}
          </span>
        ))}
      </div>
    </div>
  );
}