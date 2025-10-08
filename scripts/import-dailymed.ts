import { storage } from '../server/storage';

interface DailyMedDrug {
  setid: string;
  spl_version: string;
  title: string;
  published_date: string;
}

interface DailyMedResponse {
  metadata: {
    total_elements: string;
    elements_per_page: string;
    total_pages: string;
    current_page: string;
  };
  data: DailyMedDrug[];
}

// Common medications to import from DailyMed
const COMMON_MEDICATIONS = [
  'Lisinopril', 'Metformin', 'Atorvastatin', 'Amlodipine', 'Metoprolol',
  'Omeprazole', 'Levothyroxine', 'Simvastatin', 'Losartan', 'Gabapentin',
  'Hydrochlorothiazide', 'Sertraline', 'Furosemide', 'Albuterol', 'Pantoprazole',
  'Clopidogrel', 'Escitalopram', 'Montelukast', 'Rosuvastatin', 'Pravastatin',
  'Fluoxetine', 'Trazodone', 'Citalopram', 'Carvedilol', 'Meloxicam',
  'Alprazolam', 'Clonazepam', 'Lorazepam', 'Amoxicillin', 'Azithromycin',
  'Ciprofloxacin', 'Doxycycline', 'Prednisone', 'Tramadol', 'Cyclobenzaprine'
];

export async function importMedicationsFromDailyMed() {
  try {
    console.log('🔄 Starting DailyMed medication import...');
    
    let imported = 0;
    let skipped = 0;
    const seenSetIds = new Set<string>();
    
    for (const drugName of COMMON_MEDICATIONS) {
      try {
        console.log(`\n📦 Fetching ${drugName} from DailyMed...`);
        
        // Search DailyMed for the drug
        const searchUrl = `https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=${encodeURIComponent(drugName)}&pagesize=5`;
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
          console.error(`❌ Failed to fetch ${drugName}: ${response.status}`);
          skipped++;
          continue;
        }
        
        const data: DailyMedResponse = await response.json();
        
        if (!data.data || data.data.length === 0) {
          console.log(`⚠️  No results found for ${drugName}`);
          skipped++;
          continue;
        }
        
        // Process the first result (most relevant)
        const drug = data.data[0];
        
        // Skip if we already imported this drug (by setid)
        if (seenSetIds.has(drug.setid)) {
          console.log(`⏭️  Skipping duplicate: ${drug.title}`);
          skipped++;
          continue;
        }
        
        seenSetIds.add(drug.setid);
        
        // Parse drug information from title
        const { name, strength, form } = parseDrugTitle(drug.title);
        
        // Determine category and pricing
        const category = determineMedicationCategory(name);
        const { retailPrice, wholesalePrice } = getPricingForDrug(name, category);
        
        const medicationData = {
          ndc: `dm-${drug.setid.substring(0, 8)}`,
          name: name,
          genericName: name,
          brandName: extractBrandName(drug.title),
          strength: strength || 'Various',
          dosageForm: form || 'Tablet',
          manufacturer: 'FDA Approved',
          category: category,
          description: `FDA-approved ${name}. ${getDescription(category)}`,
          price: retailPrice,
          wholesalePrice: wholesalePrice,
          inStock: true,
          quantity: 1000,
          requiresPrescription: true,
          controlledSubstance: isControlledSubstance(name),
          sideEffects: getSideEffects(category),
          warnings: getWarnings(category),
          interactions: getInteractions(category)
        };
        
        await storage.createMedication(medicationData);
        imported++;
        console.log(`✅ Imported: ${name} ${strength} (${form})`);
        
      } catch (error) {
        console.error(`❌ Error importing ${drugName}:`, error);
        skipped++;
      }
      
      // Rate limiting - be nice to DailyMed API
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\n✅ DailyMed import complete: ${imported} imported, ${skipped} skipped`);
    
  } catch (error) {
    console.error('❌ Error in DailyMed import:', error);
    throw error;
  }
}

function parseDrugTitle(title: string): { name: string; strength: string | null; form: string | null } {
  // DailyMed titles are like: "LISINOPRIL (LISINOPRIL) TABLET" or "METFORMIN HCL 500 MG TABLET"
  
  // Extract strength (e.g., "500 MG", "10MG", "20 mg")
  const strengthMatch = title.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|GM|MG)/i);
  const strength = strengthMatch ? strengthMatch[0] : null;
  
  // Extract form (tablet, capsule, etc.)
  const formMatch = title.match(/(tablet|capsule|solution|injection|cream|ointment|drops|powder|gel)/i);
  const form = formMatch ? formMatch[1].charAt(0).toUpperCase() + formMatch[1].slice(1).toLowerCase() : null;
  
  // Extract drug name (first word or phrase before parenthesis)
  let name = title.split('(')[0].trim();
  
  // Remove strength and form from name if present
  if (strength) name = name.replace(strength, '').trim();
  if (form) name = name.replace(new RegExp(form, 'i'), '').trim();
  
  // Capitalize properly
  name = name.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  return { name, strength, form };
}

function extractBrandName(title: string): string | undefined {
  // Look for brand names in parentheses or capitalized words
  const brandMatch = title.match(/\b([A-Z][a-z]+)\b/);
  if (brandMatch && !['TABLET', 'CAPSULE', 'MG', 'ML'].includes(brandMatch[1])) {
    return brandMatch[1];
  }
  return undefined;
}

function determineMedicationCategory(drugName: string): string {
  const name = drugName.toLowerCase();
  
  if (name.includes('metformin') || name.includes('glipizide') || name.includes('insulin')) {
    return 'Diabetes Medications';
  } else if (name.includes('lisinopril') || name.includes('amlodipine') || name.includes('metoprolol') || name.includes('losartan') || name.includes('hydrochlorothiazide') || name.includes('carvedilol')) {
    return 'Blood Pressure';
  } else if (name.includes('atorvastatin') || name.includes('simvastatin') || name.includes('rosuvastatin') || name.includes('pravastatin')) {
    return 'Statins';
  } else if (name.includes('sertraline') || name.includes('fluoxetine') || name.includes('escitalopram') || name.includes('citalopram') || name.includes('trazodone')) {
    return 'Antidepressants';
  } else if (name.includes('amoxicillin') || name.includes('azithromycin') || name.includes('ciprofloxacin') || name.includes('doxycycline')) {
    return 'Antibiotics';
  } else if (name.includes('omeprazole') || name.includes('pantoprazole')) {
    return 'Gastric';
  } else if (name.includes('levothyroxine')) {
    return 'Thyroid';
  } else if (name.includes('gabapentin') || name.includes('tramadol') || name.includes('meloxicam') || name.includes('cyclobenzaprine')) {
    return 'Pain Relief';
  } else if (name.includes('alprazolam') || name.includes('clonazepam') || name.includes('lorazepam')) {
    return 'Anxiety';
  } else if (name.includes('albuterol') || name.includes('montelukast')) {
    return 'Respiratory';
  } else if (name.includes('furosemide')) {
    return 'Diuretics';
  } else if (name.includes('clopidogrel')) {
    return 'Blood Thinners';
  } else if (name.includes('prednisone')) {
    return 'Corticosteroids';
  } else {
    return 'General Medicine';
  }
}

function getPricingForDrug(drugName: string, category: string): { retailPrice: number; wholesalePrice: number } {
  // Realistic pricing based on common medication costs
  const pricingMap: Record<string, { retailPrice: number; wholesalePrice: number }> = {
    'Lisinopril': { retailPrice: 15.99, wholesalePrice: 4.99 },
    'Metformin': { retailPrice: 12.99, wholesalePrice: 3.99 },
    'Atorvastatin': { retailPrice: 18.99, wholesalePrice: 6.99 },
    'Amlodipine': { retailPrice: 14.99, wholesalePrice: 4.99 },
    'Metoprolol': { retailPrice: 13.99, wholesalePrice: 4.49 },
    'Omeprazole': { retailPrice: 16.99, wholesalePrice: 5.99 },
    'Levothyroxine': { retailPrice: 11.99, wholesalePrice: 3.49 },
    'Simvastatin': { retailPrice: 17.99, wholesalePrice: 5.99 },
    'Losartan': { retailPrice: 19.99, wholesalePrice: 7.49 },
    'Gabapentin': { retailPrice: 14.99, wholesalePrice: 4.99 },
    'Hydrochlorothiazide': { retailPrice: 10.99, wholesalePrice: 2.99 },
    'Sertraline': { retailPrice: 21.99, wholesalePrice: 8.99 },
    'Furosemide': { retailPrice: 9.99, wholesalePrice: 2.49 },
    'Albuterol': { retailPrice: 49.99, wholesalePrice: 19.99 },
    'Pantoprazole': { retailPrice: 18.99, wholesalePrice: 6.99 },
  };
  
  const pricing = pricingMap[drugName];
  if (pricing) {
    return pricing;
  }
  
  // Default pricing by category
  const categoryPricing: Record<string, { retailPrice: number; wholesalePrice: number }> = {
    'Diabetes Medications': { retailPrice: 24.99, wholesalePrice: 9.99 },
    'Blood Pressure': { retailPrice: 16.99, wholesalePrice: 5.99 },
    'Statins': { retailPrice: 19.99, wholesalePrice: 7.49 },
    'Antidepressants': { retailPrice: 22.99, wholesalePrice: 8.99 },
    'Antibiotics': { retailPrice: 29.99, wholesalePrice: 12.99 },
    'Pain Relief': { retailPrice: 18.99, wholesalePrice: 6.99 },
    'Anxiety': { retailPrice: 24.99, wholesalePrice: 9.99 },
    'default': { retailPrice: 15.99, wholesalePrice: 5.99 }
  };
  
  return categoryPricing[category] || categoryPricing.default;
}

function getDescription(category: string): string {
  const descriptions: Record<string, string> = {
    'Diabetes Medications': 'Used to manage blood sugar levels in type 2 diabetes.',
    'Blood Pressure': 'Used to treat high blood pressure and reduce risk of heart disease.',
    'Statins': 'Used to lower cholesterol and reduce cardiovascular risk.',
    'Antidepressants': 'Used to treat depression, anxiety, and related conditions.',
    'Antibiotics': 'Used to treat bacterial infections.',
    'Gastric': 'Used to reduce stomach acid and treat GERD.',
    'Thyroid': 'Used to treat hypothyroidism and thyroid disorders.',
    'Pain Relief': 'Used to manage pain and inflammation.',
    'Anxiety': 'Used to treat anxiety disorders and panic attacks.',
    'Respiratory': 'Used to treat asthma and respiratory conditions.',
    'default': 'FDA-approved medication for various medical conditions.'
  };
  
  return descriptions[category] || descriptions.default;
}

function getSideEffects(category: string): string[] {
  const sideEffectsMap: Record<string, string[]> = {
    'Diabetes Medications': ['Nausea', 'Diarrhea', 'Stomach upset', 'Hypoglycemia'],
    'Blood Pressure': ['Dizziness', 'Fatigue', 'Headache', 'Cough'],
    'Statins': ['Muscle pain', 'Headache', 'Nausea', 'Liver enzyme elevation'],
    'Antidepressants': ['Nausea', 'Drowsiness', 'Dry mouth', 'Weight changes'],
    'Antibiotics': ['Nausea', 'Diarrhea', 'Stomach upset', 'Yeast infection'],
    'Gastric': ['Headache', 'Nausea', 'Diarrhea', 'Abdominal pain'],
    'default': ['Nausea', 'Dizziness', 'Headache', 'Fatigue']
  };
  
  return sideEffectsMap[category] || sideEffectsMap.default;
}

function getWarnings(category: string): string[] {
  const warningsMap: Record<string, string[]> = {
    'Diabetes Medications': ['Monitor blood sugar regularly', 'Risk of lactic acidosis with kidney disease'],
    'Blood Pressure': ['May cause low blood pressure', 'Do not stop suddenly'],
    'Statins': ['Regular liver function tests required', 'Report muscle pain immediately'],
    'Antidepressants': ['Do not stop abruptly', 'May increase suicidal thoughts in young adults'],
    'Antibiotics': ['Complete full course', 'May cause allergic reactions'],
    'default': ['Take as directed', 'Consult doctor if symptoms persist']
  };
  
  return warningsMap[category] || warningsMap.default;
}

function getInteractions(category: string): string[] {
  const interactionsMap: Record<string, string[]> = {
    'Diabetes Medications': ['Alcohol', 'Contrast dyes', 'Other diabetes medications'],
    'Blood Pressure': ['NSAIDs', 'Diuretics', 'Other blood pressure medications'],
    'Statins': ['Grapefruit juice', 'Certain antibiotics', 'Fibrates'],
    'Antidepressants': ['MAOIs', 'Blood thinners', 'Other antidepressants'],
    'Antibiotics': ['Antacids', 'Dairy products', 'Blood thinners'],
    'default': ['Alcohol', 'Other medications', 'Certain supplements']
  };
  
  return interactionsMap[category] || interactionsMap.default;
}

function isControlledSubstance(drugName: string): boolean {
  const controlled = ['alprazolam', 'clonazepam', 'lorazepam', 'tramadol'];
  return controlled.some(drug => drugName.toLowerCase().includes(drug));
}

// Run the import immediately when this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importMedicationsFromDailyMed()
    .then(() => {
      console.log('✅ DailyMed import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ DailyMed import failed:', error);
      process.exit(1);
    });
}
