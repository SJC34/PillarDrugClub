import memoize from 'memoizee';

// OpenFDA API endpoint
const OPENFDA_BASE_URL = 'https://api.fda.gov/drug/label.json';

// Types for OpenFDA response
export interface FDADrugInteraction {
  drugInteractions?: string[];
  foodInteractions?: string[];
}

export interface FDAAdministration {
  instructions?: string[];
  route?: string[];
  dosageAndAdministration?: string[];
}

export interface FDAWarnings {
  warnings?: string[];
  contraindications?: string[];
  adverseReactions?: string[];
  boxedWarning?: string[];
}

export interface FDADrugLabel {
  genericName: string;
  brandName?: string;
  interactions: FDADrugInteraction;
  administration: FDAAdministration;
  warnings: FDAWarnings;
  description?: string;
  indicationsAndUsage?: string[];
  activeIngredient?: string[];
}

interface OpenFDAResult {
  openfda?: {
    generic_name?: string[];
    brand_name?: string[];
    route?: string[];
  };
  drug_interactions?: string[];
  warnings?: string[];
  contraindications?: string[];
  adverse_reactions?: string[];
  boxed_warning?: string[];
  dosage_and_administration?: string[];
  indications_and_usage?: string[];
  description?: string[];
  active_ingredient?: string[];
}

// Cache FDA responses for 24 hours (86400000 ms)
const getDrugLabelUncached = async (genericName: string): Promise<FDADrugLabel | null> => {
  try {
    // Clean up the generic name for search
    const searchTerm = genericName.trim().toLowerCase();
    
    // Search by generic name
    const url = `${OPENFDA_BASE_URL}?search=openfda.generic_name:"${encodeURIComponent(searchTerm)}"&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`No FDA label found for: ${genericName}`);
        return null;
      }
      throw new Error(`FDA API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      console.log(`No FDA label results for: ${genericName}`);
      return null;
    }
    
    const result: OpenFDAResult = data.results[0];
    
    // Parse and structure the FDA data
    const fdaLabel: FDADrugLabel = {
      genericName: result.openfda?.generic_name?.[0] || genericName,
      brandName: result.openfda?.brand_name?.[0],
      interactions: {
        drugInteractions: result.drug_interactions || [],
        foodInteractions: extractFoodInteractions(result.drug_interactions || []),
      },
      administration: {
        instructions: result.dosage_and_administration || [],
        route: result.openfda?.route || [],
        dosageAndAdministration: result.dosage_and_administration || [],
      },
      warnings: {
        warnings: result.warnings || [],
        contraindications: result.contraindications || [],
        adverseReactions: result.adverse_reactions || [],
        boxedWarning: result.boxed_warning || [],
      },
      description: result.description?.[0],
      indicationsAndUsage: result.indications_and_usage || [],
      activeIngredient: result.active_ingredient || [],
    };
    
    return fdaLabel;
  } catch (error) {
    console.error(`Error fetching FDA data for ${genericName}:`, error);
    return null;
  }
};

// Memoized version - cache for 24 hours
export const getDrugLabel = memoize(getDrugLabelUncached, {
  promise: true,
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  max: 500, // Cache up to 500 different drugs
});

// Helper function to extract food interactions from drug interactions text
function extractFoodInteractions(drugInteractions: string[]): string[] {
  const foodKeywords = ['food', 'meal', 'dairy', 'grapefruit', 'alcohol', 'caffeine', 'vitamin'];
  const foodInteractions: string[] = [];
  
  drugInteractions.forEach(interaction => {
    const lowerInteraction = interaction.toLowerCase();
    if (foodKeywords.some(keyword => lowerInteraction.includes(keyword))) {
      foodInteractions.push(interaction);
    }
  });
  
  return foodInteractions;
}

// Check for drug-drug interactions between multiple medications
export async function checkDrugInteractions(medications: { genericName: string }[]): Promise<{
  hasInteractions: boolean;
  interactions: Array<{
    medication1: string;
    medication2: string;
    warning: string;
  }>;
}> {
  const interactions: Array<{
    medication1: string;
    medication2: string;
    warning: string;
  }> = [];
  
  // Fetch FDA data for all medications
  const fdaDataPromises = medications.map(med => getDrugLabel(med.genericName));
  const fdaDataResults = await Promise.all(fdaDataPromises);
  
  // Check each medication against others
  for (let i = 0; i < medications.length; i++) {
    const med1 = medications[i];
    const fdaData1 = fdaDataResults[i];
    
    if (!fdaData1 || !fdaData1.interactions.drugInteractions) continue;
    
    for (let j = i + 1; j < medications.length; j++) {
      const med2 = medications[j];
      
      // Check if med1's interactions mention med2
      const interactionText = fdaData1.interactions.drugInteractions.join(' ').toLowerCase();
      const med2Name = med2.genericName.toLowerCase();
      
      if (interactionText.includes(med2Name)) {
        // Find the specific interaction warning
        const specificWarning = fdaData1.interactions.drugInteractions.find(int => 
          int.toLowerCase().includes(med2Name)
        );
        
        interactions.push({
          medication1: med1.genericName,
          medication2: med2.genericName,
          warning: specificWarning || `Potential interaction between ${med1.genericName} and ${med2.genericName}`,
        });
      }
    }
  }
  
  return {
    hasInteractions: interactions.length > 0,
    interactions,
  };
}

// Get consolidated administration instructions for all medications
export async function getAdministrationInstructions(medications: { genericName: string }[]): Promise<Array<{
  medication: string;
  instructions: string[];
  route: string[];
}>> {
  const fdaDataPromises = medications.map(med => getDrugLabel(med.genericName));
  const fdaDataResults = await Promise.all(fdaDataPromises);
  
  return medications.map((med, index) => ({
    medication: med.genericName,
    instructions: fdaDataResults[index]?.administration.instructions || [],
    route: fdaDataResults[index]?.administration.route || [],
  }));
}

// Get all warnings for a medication list
export async function getAllWarnings(medications: { genericName: string }[]): Promise<Array<{
  medication: string;
  warnings: FDAWarnings;
}>> {
  const fdaDataPromises = medications.map(med => getDrugLabel(med.genericName));
  const fdaDataResults = await Promise.all(fdaDataPromises);
  
  return medications.map((med, index) => ({
    medication: med.genericName,
    warnings: fdaDataResults[index]?.warnings || {
      warnings: [],
      contraindications: [],
      adverseReactions: [],
      boxedWarning: [],
    },
  }));
}
