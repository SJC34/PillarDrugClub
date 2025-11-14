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

// Side Effect Analysis Types
export interface SideEffectOccurrence {
  effect: string;
  medicationCount: number; // How many medications list this side effect
  medications: string[]; // Which medications list it
  likelihood: 'low' | 'moderate' | 'high'; // Based on how many meds share it
  severity?: string; // From FDA warnings if available
}

export interface DrugInteractionDetail {
  medication1: string;
  medication2: string;
  warning: string;
  severity: 'minor' | 'moderate' | 'major'; // Derived from warning text
}

// Cache FDA responses for 30 days (2592000000 ms) - package inserts rarely change
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

// Memoized version - cache for 7 days (JavaScript setTimeout max is ~24.8 days)
// Database cache still uses 30-day TTL for long-term storage
export const getDrugLabel = memoize(getDrugLabelUncached, {
  promise: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (604,800,000 ms - safe for setTimeout)
  max: 2000, // Cache up to 2000 different drugs
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

// Determine interaction severity from warning text
function determineInteractionSeverity(warning: string): 'minor' | 'moderate' | 'major' {
  const lowerWarning = warning.toLowerCase();
  
  // Major severity indicators
  if (
    lowerWarning.includes('contraindicated') ||
    lowerWarning.includes('do not') ||
    lowerWarning.includes('serious') ||
    lowerWarning.includes('life-threatening') ||
    lowerWarning.includes('fatal') ||
    lowerWarning.includes('death') ||
    lowerWarning.includes('avoid')
  ) {
    return 'major';
  }
  
  // Moderate severity indicators
  if (
    lowerWarning.includes('caution') ||
    lowerWarning.includes('monitor') ||
    lowerWarning.includes('may increase') ||
    lowerWarning.includes('may decrease') ||
    lowerWarning.includes('dosage adjustment')
  ) {
    return 'moderate';
  }
  
  // Default to minor
  return 'minor';
}

// Check for drug-drug interactions between multiple medications with severity scoring
export async function checkDrugInteractions(medications: { genericName: string }[]): Promise<{
  hasInteractions: boolean;
  interactions: DrugInteractionDetail[];
}> {
  const interactions: DrugInteractionDetail[] = [];
  
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
        
        const warning = specificWarning || `Potential interaction between ${med1.genericName} and ${med2.genericName}`;
        interactions.push({
          medication1: med1.genericName,
          medication2: med2.genericName,
          warning,
          severity: determineInteractionSeverity(warning),
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

// Aggregate side effects across all medications with likelihood scoring
export async function aggregateSideEffects(medications: { genericName: string }[]): Promise<SideEffectOccurrence[]> {
  // Fetch FDA data for all medications
  const fdaDataPromises = medications.map(med => getDrugLabel(med.genericName));
  const fdaDataResults = await Promise.all(fdaDataPromises);
  
  // Map to track side effects and which medications list them
  const sideEffectMap = new Map<string, { medications: string[]; count: number }>();
  
  // Process each medication's adverse reactions
  medications.forEach((med, index) => {
    const fdaData = fdaDataResults[index];
    if (!fdaData || !fdaData.warnings.adverseReactions) return;
    
    // Parse adverse reactions - they're usually in paragraph form
    const reactions = fdaData.warnings.adverseReactions;
    reactions.forEach(reactionText => {
      // Extract individual side effects from the text
      // Common format: "The most common adverse reactions include: headache, nausea, dizziness..."
      const effects = extractSideEffects(reactionText);
      
      effects.forEach(effect => {
        const normalized = effect.trim().toLowerCase();
        if (!sideEffectMap.has(normalized)) {
          sideEffectMap.set(normalized, { medications: [], count: 0 });
        }
        
        const entry = sideEffectMap.get(normalized)!;
        if (!entry.medications.includes(med.genericName)) {
          entry.medications.push(med.genericName);
          entry.count++;
        }
      });
    });
  });
  
  // Calculate likelihood based on how many medications share the side effect
  const totalMedications = medications.length;
  const sideEffects: SideEffectOccurrence[] = [];
  
  sideEffectMap.forEach((data, effect) => {
    const percentageOfMeds = (data.count / totalMedications) * 100;
    
    let likelihood: 'low' | 'moderate' | 'high';
    if (data.count === 1) {
      likelihood = 'low';
    } else if (percentageOfMeds < 50) {
      likelihood = 'moderate';
    } else {
      likelihood = 'high';
    }
    
    sideEffects.push({
      effect,
      medicationCount: data.count,
      medications: data.medications,
      likelihood,
    });
  });
  
  // Sort by medication count (most common first)
  return sideEffects.sort((a, b) => b.medicationCount - a.medicationCount);
}

// Helper to extract individual side effects from FDA text
function extractSideEffects(text: string): string[] {
  const effects: string[] = [];
  
  // Common patterns in FDA adverse reaction text
  const patterns = [
    /(?:include|are|were):\s*([^.]+)/gi, // "include: X, Y, Z"
    /(?:such as|including)\s+([^.]+)/gi, // "such as X, Y, Z"
    /most (?:common|frequent)(?:\s+\w+)*:\s*([^.]+)/gi, // "most common: X, Y, Z"
  ];
  
  patterns.forEach(pattern => {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        // Split by commas, semicolons, and "and"
        const items = match[1].split(/[,;]|\s+and\s+/);
        items.forEach((item: string) => {
          const cleaned = item
            .trim()
            .replace(/^\(|\)$/g, '') // Remove parentheses
            .replace(/^\d+%?\s*/, '') // Remove percentages at start
            .replace(/\([^)]*\)/g, ''); // Remove content in parentheses
          
          if (cleaned.length > 2 && cleaned.length < 100) { // Sanity check
            effects.push(cleaned);
          }
        });
      }
    }
  });
  
  // Also extract from simple lists (e.g., "headache, nausea, dizziness")
  if (effects.length === 0) {
    // Try to extract comma-separated lists
    const sentences = text.split(/[.!?]/);
    sentences.forEach(sentence => {
      if (sentence.includes(',')) {
        const items = sentence.split(',');
        if (items.length >= 2 && items.length <= 20) { // Likely a list
          items.forEach((item: string) => {
            const cleaned = item
              .trim()
              .replace(/^(and|or|the)\s+/i, '')
              .replace(/^\d+%?\s*/, '');
            
            if (cleaned.length > 2 && cleaned.length < 100 && !/^\d+$/.test(cleaned)) {
              effects.push(cleaned);
            }
          });
        }
      }
    });
  }
  
  return effects;
}
