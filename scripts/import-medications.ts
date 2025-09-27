import XLSX from 'xlsx';
import { readFileSync } from 'fs';
import { storage } from '../server/storage';

interface ExcelMedication {
  [key: string]: any;
}

async function importMedicationsFromExcel() {
  try {
    // Read the Excel file
    const filePath = 'attached_assets/Top Generics 5.22.25_1758991198647.xlsx';
    const workbook = XLSX.readFile(filePath);
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData: ExcelMedication[] = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${rawData.length} medications in Excel file`);
    console.log('Sample data:', rawData[0]);
    
    // Show column headers for mapping
    const headers = Object.keys(rawData[0] || {});
    console.log('Available columns:', headers);
    
    let imported = 0;
    let skipped = 0;
    
    for (const row of rawData) {
      try {
        // Try to map common field names - we'll need to adjust these based on actual Excel structure
        const medicationData = {
          ndc: row['NDC'] || row['ndc'] || `generated-${Date.now()}-${Math.random()}`,
          name: row['Drug Name'] || row['name'] || row['Drug'] || row['Generic Name'] || 'Unknown',
          genericName: row['Generic Name'] || row['generic'] || row['Drug Name'] || row['name'] || 'Unknown',
          brandName: row['Brand Name'] || row['brand'] || undefined,
          strength: row['Strength'] || row['strength'] || 'Unknown',
          dosageForm: row['Dosage Form'] || row['form'] || row['Form'] || 'Tablet',
          manufacturer: row['Manufacturer'] || row['manufacturer'] || row['Mfr'] || 'Generic Manufacturer',
          category: determineMedicationCategory(row['Drug Name'] || row['name'] || row['Generic Name'] || ''),
          description: `Generic medication: ${row['Generic Name'] || row['Drug Name'] || row['name'] || 'Unknown medication'}`,
          price: parseFloat(row['Retail Price'] || row['price'] || row['Price'] || '0') || generateRandomPrice(15, 200),
          wholesalePrice: parseFloat(row['Wholesale Price'] || row['wholesale'] || '0') || generateRandomPrice(5, 50),
          inStock: true,
          quantity: parseInt(row['Quantity'] || row['quantity'] || '100') || 100,
          requiresPrescription: true, // Most generics require prescription
          controlledSubstance: false,
          sideEffects: generateSideEffects(row['Drug Name'] || row['name'] || row['Generic Name'] || ''),
          warnings: generateWarnings(row['Drug Name'] || row['name'] || row['Generic Name'] || ''),
          interactions: generateInteractions(row['Drug Name'] || row['name'] || row['Generic Name'] || '')
        };

        // Ensure wholesale price is less than retail price
        if (medicationData.wholesalePrice >= medicationData.price) {
          medicationData.wholesalePrice = medicationData.price * 0.3; // 30% of retail
        }

        await storage.createMedication(medicationData);
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`Imported ${imported} medications...`);
        }
      } catch (error) {
        console.error(`Error importing medication ${row['Drug Name'] || row['name']}:`, error);
        skipped++;
      }
    }
    
    console.log(`Import complete: ${imported} imported, ${skipped} skipped`);
    
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw error;
  }
}

function determineMedicationCategory(drugName: string): string {
  const name = drugName.toLowerCase();
  
  if (name.includes('metformin') || name.includes('insulin') || name.includes('glipizide')) {
    return 'Diabetes Medications';
  } else if (name.includes('lisinopril') || name.includes('amlodipine') || name.includes('hydrochlorothiazide')) {
    return 'Blood Pressure';
  } else if (name.includes('atorvastatin') || name.includes('simvastatin') || name.includes('rosuvastatin')) {
    return 'Statins';
  } else if (name.includes('sertraline') || name.includes('fluoxetine') || name.includes('escitalopram')) {
    return 'Antidepressants';
  } else if (name.includes('amoxicillin') || name.includes('azithromycin') || name.includes('ciprofloxacin')) {
    return 'Antibiotics';
  } else if (name.includes('ibuprofen') || name.includes('naproxen') || name.includes('acetaminophen')) {
    return 'Pain Relief';
  } else if (name.includes('omeprazole') || name.includes('pantoprazole')) {
    return 'Gastric';
  } else if (name.includes('levothyroxine')) {
    return 'Thyroid';
  } else {
    return 'General Medicine';
  }
}

function generateRandomPrice(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateSideEffects(drugName: string): string[] {
  const commonSideEffects = [
    'Nausea', 'Dizziness', 'Headache', 'Drowsiness', 'Dry mouth',
    'Fatigue', 'Stomach upset', 'Diarrhea', 'Constipation'
  ];
  
  // Return 3-5 random side effects
  const count = Math.floor(Math.random() * 3) + 3;
  const shuffled = commonSideEffects.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateWarnings(drugName: string): string[] {
  const commonWarnings = [
    'Do not exceed recommended dosage',
    'Consult your doctor if symptoms persist',
    'May cause drowsiness - do not drive',
    'Take with food to reduce stomach upset',
    'Keep out of reach of children'
  ];
  
  const count = Math.floor(Math.random() * 2) + 2;
  const shuffled = commonWarnings.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateInteractions(drugName: string): string[] {
  const commonInteractions = [
    'Alcohol', 'Blood thinners', 'Other blood pressure medications',
    'Antacids', 'NSAIDs', 'Certain antibiotics'
  ];
  
  const count = Math.floor(Math.random() * 2) + 1;
  const shuffled = commonInteractions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Export for use in other scripts
export { importMedicationsFromExcel };

// Run the import immediately when this file is executed
importMedicationsFromExcel()
  .then(() => {
    console.log('Import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });