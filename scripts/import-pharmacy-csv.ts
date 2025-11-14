import type { Medication } from "@shared/pharmacy-schema";
import { determineMedicationPricing } from '../server/fda-service';

interface PharmacyCSVRow {
  drugDescription: string;
  unitCost: string;
}

function parsePrice(priceStr: string): number {
  // Remove dollar sign, commas, and any trailing spaces
  const cleaned = priceStr.trim().replace(/[$,\s]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

function parseDrugDescription(description: string): {
  name: string;
  genericName: string;
  strength?: string;
  dosageForm?: string;
  category: string;
} {
  // Extract medication name (first word or compound name)
  const words = description.split(/\s+/);
  let name = words[0];
  
  // Handle compound names (e.g., "Amoxicillin-Clavulanate", "Amlodipine-Benazepril")
  if (words[1] && words[1].match(/^[A-Z]/)) {
    name = `${words[0]} ${words[1]}`;
  }
  
  // Extract strength (e.g., "10Mg", "500 Mg", "0.5%")
  const strengthMatch = description.match(/(\d+\.?\d*\s?(?:Mg|Mcg|G|Ml|%|Iu))/i);
  const strength = strengthMatch ? strengthMatch[1] : undefined;
  
  // Extract dosage form
  let dosageForm = 'Tablet';
  const formPatterns = [
    /\b(tablet|cap|capsule|solution|suspension|cream|ointment|gel|inhaler|injection|syrup|drops?|spray|patch|lotion|powder|foam|suppository)\b/i
  ];
  
  for (const pattern of formPatterns) {
    const match = description.match(pattern);
    if (match) {
      dosageForm = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      if (dosageForm === 'Cap') dosageForm = 'Capsule';
      if (dosageForm === 'Drop') dosageForm = 'Drops';
      break;
    }
  }
  
  // Determine category based on drug name/type
  let category = 'General';
  
  const categoryMap: { [key: string]: string } = {
    // Cardiovascular
    'lisinopril|enalapril|benazepril|ramipril': 'ACE Inhibitors',
    'losartan|valsartan|olmesartan|candesartan|irbesartan': 'ARBs',
    'amlodipine|nifedipine|diltiazem|verapamil': 'Calcium Channel Blockers',
    'atorvastatin|simvastatin|rosuvastatin|pravastatin|lovastatin': 'Statins',
    'metoprolol|atenolol|carvedilol|bisoprolol|propranolol': 'Beta Blockers',
    'hydrochlorothiazide|furosemide|spironolactone|bumetanide': 'Diuretics',
    'warfarin|clopidogrel|apixaban|rivaroxaban': 'Anticoagulants',
    
    // Diabetes
    'metformin|glipizide|glyburide|pioglitazone|insulin': 'Diabetes Medications',
    
    // Mental Health
    'sertraline|fluoxetine|escitalopram|citalopram|paroxetine|venlafaxine|duloxetine': 'Antidepressants',
    'alprazolam|lorazepam|clonazepam|diazepam': 'Benzodiazepines',
    'aripiprazole|quetiapine|risperidone|olanzapine': 'Antipsychotics',
    
    // Pain/Inflammation
    'gabapentin|pregabalin': 'Nerve Pain',
    'tramadol|hydrocodone|oxycodone|morphine': 'Opioids',
    'ibuprofen|naproxen|meloxicam|diclofenac|celecoxib': 'NSAIDs',
    'prednisone|prednisolone|dexamethasone|methylprednisolone': 'Corticosteroids',
    
    // Gastrointestinal
    'omeprazole|pantoprazole|esomeprazole|lansoprazole': 'Proton Pump Inhibitors',
    'ranitidine|famotidine': 'H2 Blockers',
    
    // Respiratory
    'albuterol|levalbuterol': 'Bronchodilators',
    'montelukast|zafirlukast': 'Leukotriene Inhibitors',
    'budesonide|fluticasone|mometasone': 'Inhaled Corticosteroids',
    
    // Antibiotics
    'amoxicillin|ampicillin|penicillin': 'Penicillins',
    'azithromycin|clarithromycin|erythromycin': 'Macrolides',
    'ciprofloxacin|levofloxacin|moxifloxacin': 'Fluoroquinolones',
    'doxycycline|tetracycline|minocycline': 'Tetracyclines',
    'cephalexin|cefdinir|cefuroxime': 'Cephalosporins',
    
    // Thyroid
    'levothyroxine|liothyronine|armour': 'Thyroid Medications',
    
    // Other
    'baclofen|cyclobenzaprine|tizanidine|methocarbamol': 'Muscle Relaxants',
  };
  
  const lowerName = name.toLowerCase();
  for (const [pattern, cat] of Object.entries(categoryMap)) {
    if (new RegExp(pattern, 'i').test(lowerName)) {
      category = cat;
      break;
    }
  }
  
  return {
    name,
    genericName: name,
    strength,
    dosageForm,
    category
  };
}

export function parsePharmacyCSV(csvContent: string): Medication[] {
  const medications: Medication[] = [];
  const lines = csvContent.trim().split('\n');
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV (handle quoted fields)
    const match = line.match(/^"?([^"]*(?:""[^"]*)*)"?\s*,\s*(.+)$/);
    if (!match) continue;
    
    let drugDescription = match[1].replace(/""/g, '"').trim();
    const unitCost = match[2].trim();
    
    // Parse drug info
    const drugInfo = parseDrugDescription(drugDescription);
    const unitPrice = parsePrice(unitCost);
    
    // Calculate wholesale price (20% of unit cost as wholesale)
    const wholesalePrice = parseFloat((unitPrice * 0.2).toFixed(2));
    
    // Create medication object
    const medication: Medication = {
      id: `med-csv-${i}`,
      ndc: '',
      name: drugInfo.name,
      genericName: drugInfo.genericName,
      brandName: '',
      strength: drugInfo.strength || '',
      dosageForm: drugInfo.dosageForm || 'Tablet',
      manufacturer: 'SJC Pharmacy',
      category: drugInfo.category,
      description: drugDescription,
      price: unitPrice,
      wholesalePrice: wholesalePrice,
      isShortCourse: false, // Will be updated during FDA enrichment
      inStock: true,
      quantity: 1000,
      requiresPrescription: true,
      controlledSubstance: false,
      sideEffects: [],
      warnings: [],
      interactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    medications.push(medication);
  }
  
  return medications;
}

/**
 * Enrich medications with FDA dosing data and annual pricing
 * Uses rate limiting to respect openFDA's 240 req/min limit (3 req/s)
 */
async function enrichMedicationsWithFDAData(medications: Medication[]): Promise<Medication[]> {
  console.log('🔄 Enriching medications with FDA dosing data...');
  
  let enriched = 0;
  let skipped = 0;
  const enrichedMedications: Medication[] = [];
  
  // Process medications sequentially with 330ms delay between requests (3 req/s)
  for (let i = 0; i < medications.length; i++) {
    const med = medications[i];
    
    try {
      const pricingInfo = await determineMedicationPricing(
        med.name,
        med.price,
        med.category
      );
      
      if (pricingInfo.annualPrice || pricingInfo.isShortCourse) {
        enriched++;
      } else {
        skipped++;
      }
      
      enrichedMedications.push({
        ...med,
        dosesPerDay: pricingInfo.dosesPerDay,
        isShortCourse: pricingInfo.isShortCourse,
        annualPrice: pricingInfo.annualPrice,
        fdaMetadata: pricingInfo.fdaMetadata
      });
      
      // Log progress every 50 medications
      if ((i + 1) % 50 === 0) {
        console.log(`📊 Progress: ${i + 1}/${medications.length} medications processed`);
      }
      
      // Rate limit: 330ms delay = ~3 requests per second
      if (i < medications.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 330));
      }
    } catch (error) {
      console.error(`Failed to enrich ${med.name}:`, error);
      enrichedMedications.push(med);
    }
  }
  
  console.log(`✅ Enriched ${enriched} medications with FDA data, ${skipped} without dosing info`);
  return enrichedMedications;
}

export async function importMedicationsFromCSV(): Promise<Medication[]> {
  try {
    // Read the CSV file
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const csvPath = path.join(process.cwd(), 'attached_assets', 'SJC Pharmacy Pricing Request_1759939607774.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    
    console.log('🔄 Importing medications from pharmacy CSV...');
    const medications = parsePharmacyCSV(csvContent);
    console.log(`✅ Parsed ${medications.length} medications from CSV`);
    
    // Enrich with FDA data (blocking to ensure cached data is persisted)
    // Batching in storage layer (setImmediate) keeps server responsive
    const enrichedMedications = await enrichMedicationsWithFDAData(medications);
    
    return enrichedMedications;
  } catch (error) {
    console.error('❌ Error importing medications from CSV:', error);
    return [];
  }
}
