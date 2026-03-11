import ExcelJS from 'exceljs';
import { storage } from '../server/storage';

interface ExcelMedication {
  [key: string]: any;
}

export async function importMedicationsFromExcel() {
  try {
    const filePath = 'attached_assets/Top Generics 5.22.25_1758991198647.xlsx';
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    const worksheet = workbook.worksheets[0];

    // Build header map from first row
    const headers: string[] = [];
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber] = String(cell.value ?? '');
    });

    // Convert rows to objects
    const rawData: ExcelMedication[] = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const obj: ExcelMedication = {};
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        const header = headers[colNumber];
        if (header) {
          obj[header] = cell.value;
        }
      });
      rawData.push(obj);
    });

    console.log(`Found ${rawData.length} medications in Excel file`);
    if (rawData.length > 0) {
      console.log('Sample data:', rawData[0]);
      const availableColumns = Object.keys(rawData[0] || {});
      console.log('Available columns:', availableColumns);
    }

    let imported = 0;
    let skipped = 0;

    for (const row of rawData) {
      try {
        const totalQuantity = parseFloat(row['Claims Total Quantity Dispensed'] || '0');
        const totalCost = parseFloat(row['Claims Total Post-Savings Plan Pay'] || '0');

        if (totalQuantity <= 0 || totalCost <= 0) {
          skipped++;
          continue;
        }

        const realWholesalePrice = totalCost / totalQuantity;
        const retailMultiplier = Math.random() * 3 + 2;
        const retailPrice = realWholesalePrice * retailMultiplier;

        const drugName = row['Drugs Drug Label Name (MDDB)'] || 'Unknown Medication';

        const medicationData = {
          ndc: `ndc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: drugName,
          genericName: extractGenericName(drugName),
          brandName: extractBrandName(drugName),
          strength: extractStrength(drugName),
          dosageForm: extractDosageForm(drugName),
          manufacturer: 'Generic Manufacturer',
          category: determineMedicationCategory(drugName),
          description: `Generic medication: ${drugName}`,
          price: Math.round(retailPrice * 100) / 100,
          wholesalePrice: Math.round(realWholesalePrice * 100) / 100,
          inStock: true,
          quantity: Math.floor(totalQuantity / 1000),
          requiresPrescription: true,
          controlledSubstance: false,
          sideEffects: generateSideEffects(drugName),
          warnings: generateWarnings(drugName),
          interactions: generateInteractions(drugName)
        };

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

function extractGenericName(drugName: string): string {
  const parts = drugName.split(' ');
  if (parts.length >= 2) {
    return parts.slice(0, 2).join(' ');
  }
  return drugName;
}

function extractBrandName(drugName: string): string | undefined {
  if (drugName.includes('Brand') || drugName.includes('®')) {
    return drugName.split(' ')[0];
  }
  return undefined;
}

function extractStrength(drugName: string): string {
  const strengthMatch = drugName.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|GM|MG)/i);
  if (strengthMatch) {
    return strengthMatch[0];
  }
  return 'Various';
}

function extractDosageForm(drugName: string): string {
  const name = drugName.toLowerCase();
  if (name.includes('tablet')) return 'Tablet';
  if (name.includes('capsule')) return 'Capsule';
  if (name.includes('solution')) return 'Solution';
  if (name.includes('cream') || name.includes('ointment')) return 'Topical';
  if (name.includes('injection')) return 'Injection';
  if (name.includes('drops')) return 'Drops';
  if (name.includes('powder')) return 'Powder';
  if (name.includes('gel')) return 'Gel';
  return 'Tablet';
}

function generateSideEffects(drugName: string): string[] {
  const commonSideEffects = [
    'Nausea', 'Dizziness', 'Headache', 'Drowsiness', 'Dry mouth',
    'Fatigue', 'Stomach upset', 'Diarrhea', 'Constipation'
  ];
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

if (import.meta.url === `file://${process.argv[1]}`) {
  importMedicationsFromExcel()
    .then(() => {
      console.log('Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import failed:', error);
      process.exit(1);
    });
}
