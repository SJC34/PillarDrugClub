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
  clinicalFrequency: string | null; // Raw frequency text from FDA (e.g., "common (1-10%)")
  frequencyCategory: 'very-common' | 'common' | 'uncommon' | 'rare' | 'very-rare' | 'unknown'; // Standardized frequency
  severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'unknown'; // Medical severity
  fdaSource: string; // Which label section (adverse_reactions, boxed_warning, etc.)
  // Legacy field - kept for backward compatibility but now based on clinical frequency
  likelihood: 'low' | 'moderate' | 'high';
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

// Aggregate side effects across all medications with clinical frequency and severity
export async function aggregateSideEffects(medications: { genericName: string }[]): Promise<SideEffectOccurrence[]> {
  // Fetch FDA data for all medications
  const fdaDataPromises = medications.map(med => getDrugLabel(med.genericName));
  const fdaDataResults = await Promise.all(fdaDataPromises);
  
  // Map to track side effects with all their metadata
  interface SideEffectData {
    medications: string[];
    count: number;
    frequencies: (string | null)[];
    contexts: string[];
    sources: string[];
  }
  
  const sideEffectMap = new Map<string, SideEffectData>();
  
  // Process each medication's adverse reactions and boxed warnings
  medications.forEach((med, index) => {
    const fdaData = fdaDataResults[index];
    if (!fdaData) return;
    
    const boxedWarnings = fdaData.warnings.boxedWarning || [];
    
    // Process adverse reactions
    if (fdaData.warnings.adverseReactions) {
      fdaData.warnings.adverseReactions.forEach(reactionText => {
        const parsedEffects = extractSideEffectsEnhanced(reactionText, boxedWarnings);
        
        parsedEffects.forEach(parsed => {
          const normalized = parsed.effect.trim().toLowerCase();
          
          if (!sideEffectMap.has(normalized)) {
            sideEffectMap.set(normalized, {
              medications: [],
              count: 0,
              frequencies: [],
              contexts: [],
              sources: [],
            });
          }
          
          const entry = sideEffectMap.get(normalized)!;
          if (!entry.medications.includes(med.genericName)) {
            entry.medications.push(med.genericName);
            entry.count++;
            entry.frequencies.push(parsed.frequencyText);
            entry.contexts.push(parsed.contextText);
            entry.sources.push('adverse_reactions');
          }
        });
      });
    }
    
    // Also check boxed warnings for critical side effects
    if (boxedWarnings.length > 0) {
      boxedWarnings.forEach(warning => {
        const parsedEffects = extractSideEffectsEnhanced(warning, boxedWarnings);
        
        parsedEffects.forEach(parsed => {
          const normalized = parsed.effect.trim().toLowerCase();
          
          if (!sideEffectMap.has(normalized)) {
            sideEffectMap.set(normalized, {
              medications: [],
              count: 0,
              frequencies: [],
              contexts: [],
              sources: [],
            });
          }
          
          const entry = sideEffectMap.get(normalized)!;
          
          // For boxed warnings, ALWAYS append the source (even if medication already listed)
          // This ensures critical effects are properly elevated
          if (!entry.medications.includes(med.genericName)) {
            // First time seeing this medication for this effect
            entry.medications.push(med.genericName);
            entry.count++;
          }
          
          // Always add boxed warning context and source regardless of medication duplicates
          entry.frequencies.push(parsed.frequencyText);
          entry.contexts.push(parsed.contextText);
          entry.sources.push('boxed_warning');
        });
      });
    }
  });
  
  // Build final side effect occurrences with frequency and severity
  const sideEffects: SideEffectOccurrence[] = [];
  
  sideEffectMap.forEach((data, effect) => {
    // Determine the most specific frequency available
    let bestFrequency: string | null = null;
    let bestFrequencyCategory: 'very-common' | 'common' | 'uncommon' | 'rare' | 'very-rare' | 'unknown' = 'unknown';
    
    // Prioritize: specific percentage > frequency category > null
    for (const freq of data.frequencies) {
      if (freq) {
        const category = classifyFrequencyCategory(freq);
        if (category !== 'unknown') {
          bestFrequency = freq;
          bestFrequencyCategory = category;
          break; // Use first valid frequency found
        }
      }
    }
    
    // Determine severity - use the highest severity found across all contexts
    let severity: 'critical' | 'serious' | 'moderate' | 'minor' | 'unknown' = 'unknown';
    const boxedWarnings = fdaDataResults
      .filter(fda => fda && fda.warnings.boxedWarning)
      .flatMap(fda => fda!.warnings.boxedWarning || []);
    
    // Define severity ranking for comparison
    const severityRank = { critical: 4, serious: 3, moderate: 2, minor: 1, unknown: 0 };
    
    for (let i = 0; i < data.contexts.length; i++) {
      const contextSeverity = determineSideEffectSeverity(
        effect,
        data.contexts[i],
        boxedWarnings
      );
      
      // Upgrade severity if we find something more serious
      if (severityRank[contextSeverity] > severityRank[severity]) {
        severity = contextSeverity;
      }
    }
    
    // FDA Boxed Warnings are reserved for the most serious adverse reactions
    // They indicate significant risk of serious or life-threatening events
    // Therefore, anything from a boxed warning should be at least critical
    if (data.sources.includes('boxed_warning')) {
      if (severityRank[severity] < severityRank.critical) {
        severity = 'critical';
      }
    }
    
    // Determine FDA source - prioritize boxed warnings
    const fdaSource = data.sources.includes('boxed_warning') 
      ? 'boxed_warning' 
      : 'adverse_reactions';
    
    // Legacy likelihood field - now based on clinical frequency, not medication count
    let likelihood: 'low' | 'moderate' | 'high';
    if (bestFrequencyCategory === 'very-common' || bestFrequencyCategory === 'common') {
      likelihood = 'high';
    } else if (bestFrequencyCategory === 'uncommon' || bestFrequencyCategory === 'rare') {
      likelihood = 'moderate';
    } else {
      likelihood = 'low'; // very-rare or unknown
    }
    
    sideEffects.push({
      effect,
      medicationCount: data.count,
      medications: data.medications,
      clinicalFrequency: bestFrequency,
      frequencyCategory: bestFrequencyCategory,
      severity,
      fdaSource,
      likelihood,
    });
  });
  
  // Sort by severity first (critical first), then frequency, then medication count
  const severityRank = { critical: 4, serious: 3, moderate: 2, minor: 1, unknown: 0 };
  const frequencyRank = { 'very-common': 5, common: 4, uncommon: 3, rare: 2, 'very-rare': 1, unknown: 0 };
  
  return sideEffects.sort((a, b) => {
    // First by severity (highest first)
    if (severityRank[a.severity] !== severityRank[b.severity]) {
      return severityRank[b.severity] - severityRank[a.severity];
    }
    // Then by frequency (most common first)
    if (frequencyRank[a.frequencyCategory] !== frequencyRank[b.frequencyCategory]) {
      return frequencyRank[b.frequencyCategory] - frequencyRank[a.frequencyCategory];
    }
    // Finally by medication count
    return b.medicationCount - a.medicationCount;
  });
}

// Helper to parse frequency information from FDA text
interface ParsedSideEffect {
  effect: string;
  frequencyText: string | null; // Raw frequency (e.g., "common (1-10%)", "rare")
  contextText: string; // Full sentence for severity analysis
}

function parseFrequencyFromText(text: string): string | null {
  const lowerText = text.toLowerCase();
  
  // Common FDA frequency patterns - more specific patterns first
  const frequencyPatterns = [
    // Very common patterns
    /very\s+common\s*\(?\s*[>≥]\s*1[\/]10\s*\)?/i,
    /very\s+common\s*\(?\s*[>≥]\s*10%\s*\)?/i,
    // Common patterns
    /common\s*\(?\s*1[\/]10\s*to\s*1[\/]100\s*\)?/i,
    /common\s*\(?\s*[>≥]?\s*1%\s*(?:to|and)?\s*[<?]?\s*10%\s*\)?/i,
    // Uncommon patterns
    /uncommon\s*\(?\s*1[\/]100\s*to\s*1[\/]1,?000\s*\)?/i,
    /uncommon\s*\(?\s*[>≥]?\s*0\.1%\s*(?:to|and)?\s*[<?]?\s*1%\s*\)?/i,
    /infrequent\s*\(?\s*[>≥]?\s*0\.1%\s*(?:to|and)?\s*[<?]?\s*1%\s*\)?/i,
    // Rare patterns
    /very\s+rare\s*\(?\s*[<]\s*1[\/]10,?000\s*\)?/i,
    /very\s+rare\s*\(?\s*[<]\s*0\.01%\s*\)?/i,
    /rare\s*\(?\s*1[\/]1,?000\s*to\s*1[\/]10,?000\s*\)?/i,
    /rare\s*\(?\s*[>≥]?\s*0\.01%\s*(?:to|and)?\s*[<?]?\s*0\.1%\s*\)?/i,
    // Isolated percentage with context (e.g., "approximately 5%", "about 2%")
    /(?:approximately|about|roughly|~)?\s*(\d+(?:\.\d+)?%)/i,
  ];
  
  // Try to match specific frequency patterns first
  for (const pattern of frequencyPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0].trim();
    }
  }
  
  // Check for frequency keywords alone (less preferred - no specific rate)
  // Only return these if no percentage patterns were found
  if (lowerText.includes('very common')) return 'very common';
  if (lowerText.includes('common') && !lowerText.includes('uncommon')) return 'common';
  if (lowerText.includes('uncommon') || lowerText.includes('infrequent')) return 'uncommon';
  if (lowerText.includes('very rare')) return 'very rare';
  if (lowerText.includes('rare') && !lowerText.includes('very rare')) return 'rare';
  
  return null;
}

// Classify frequency category from parsed frequency text
function classifyFrequencyCategory(frequencyText: string | null): 'very-common' | 'common' | 'uncommon' | 'rare' | 'very-rare' | 'unknown' {
  if (!frequencyText) return 'unknown';
  
  const lower = frequencyText.toLowerCase();
  
  // Very common: ≥10% or ≥1/10
  if (lower.includes('very common')) return 'very-common';
  
  // Common: 1-10% or 1/100 to 1/10
  if (lower.includes('common') && !lower.includes('very') && !lower.includes('un')) return 'common';
  
  // Uncommon: 0.1-1% or 1/1000 to 1/100
  if (lower.includes('uncommon') || lower.includes('infrequent')) return 'uncommon';
  
  // Rare: 0.01-0.1% or 1/10000 to 1/1000
  if (lower.includes('rare') && !lower.includes('very')) return 'rare';
  
  // Very rare: <0.01% or <1/10000
  if (lower.includes('very rare')) return 'very-rare';
  
  // Parse percentage if present
  const percentMatch = lower.match(/(\d+(?:\.\d+)?)%/);
  if (percentMatch) {
    const percent = parseFloat(percentMatch[1]);
    if (percent >= 10) return 'very-common';
    if (percent >= 1) return 'common';
    if (percent >= 0.1) return 'uncommon';
    if (percent >= 0.01) return 'rare';
    return 'very-rare';
  }
  
  return 'unknown';
}

// Determine severity based on side effect name and context
function determineSideEffectSeverity(effect: string, contextText: string, boxedWarnings: string[]): 'critical' | 'serious' | 'moderate' | 'minor' | 'unknown' {
  const lowerEffect = effect.toLowerCase();
  const lowerContext = contextText.toLowerCase();
  const allBoxedWarnings = boxedWarnings.join(' ').toLowerCase();
  
  // CRITICAL: Life-threatening conditions
  const criticalKeywords = [
    'death', 'fatal', 'fatality', 'life-threatening', 'life threatening',
    'anaphylaxis', 'anaphylactic', 'anaphylactoid',
    'stevens-johnson', 'stevens johnson', 'sjs', 'lyell',
    'toxic epidermal necrolysis', 'ten',
    'angioedema', 'angioneurotic edema',
    'respiratory failure', 'respiratory arrest',
    'cardiac arrest', 'sudden cardiac death',
    'myocardial infarction', 'acute mi', 'heart attack',
    'torsades de pointes', 'torsade', 'qt prolongation severe',
    'ventricular fibrillation', 'ventricular tachycardia',
    'stroke', 'cerebrovascular accident', 'hemorrhagic stroke',
    'suicidal', 'suicide', 'suicidality',
    'hepatic failure', 'liver failure', 'acute liver failure', 'fulminant hepatitis',
    'renal failure', 'kidney failure', 'acute renal failure',
    'bone marrow suppression', 'bone marrow failure',
    'agranulocytosis', 'aplastic anemia', 'aplastic anaemia',
    'thrombocytopenia severe', 'severe thrombocytopenia',
    'seizure', 'status epilepticus',
    'coma',
    'malignant hyperthermia',
    'neuroleptic malignant syndrome', 'nms',
    'serotonin syndrome',
    'hemorrhage life-threatening', 'life-threatening bleeding',
    'gastrointestinal perforation',
  ];
  
  for (const keyword of criticalKeywords) {
    if (lowerEffect.includes(keyword) || lowerContext.includes(keyword) || allBoxedWarnings.includes(keyword)) {
      return 'critical';
    }
  }
  
  // SERIOUS: Requires medical attention
  const seriousKeywords = [
    'hospitalization',
    'arrhythmia', 'tachycardia severe', 'bradycardia severe',
    'hypertension severe', 'hypotension severe',
    'bleeding', 'hemorrhage',
    'thrombosis', 'embolism',
    'pancreatitis',
    'hepatitis', 'hepatotoxicity',
    'nephrotoxicity', 'acute kidney injury',
    'rhabdomyolysis',
    'neutropenia',
    'infection serious', 'sepsis',
    'pneumonia',
    'ulceration',
    'vision loss', 'blindness',
    'hearing loss', 'deafness',
  ];
  
  for (const keyword of seriousKeywords) {
    if (lowerEffect.includes(keyword) || lowerContext.includes(keyword)) {
      return 'serious';
    }
  }
  
  // MODERATE: Discomforting but manageable
  const moderateKeywords = [
    'rash',
    'dizziness', 'vertigo',
    'fatigue', 'weakness',
    'insomnia', 'sleep',
    'anxiety',
    'tremor',
    'palpitation',
    'edema',
    'constipation',
    'diarrhea',
    'vomiting',
    'weight gain', 'weight loss',
  ];
  
  for (const keyword of moderateKeywords) {
    if (lowerEffect.includes(keyword)) {
      return 'moderate';
    }
  }
  
  // MINOR: Mild and transient
  const minorKeywords = [
    'headache',
    'nausea',
    'dry mouth',
    'drowsiness',
    'mild',
  ];
  
  for (const keyword of minorKeywords) {
    if (lowerEffect.includes(keyword)) {
      return 'minor';
    }
  }
  
  // Default to unknown if we can't classify
  return 'unknown';
}

// Enhanced helper to extract individual side effects from FDA text with frequency preservation
function extractSideEffectsEnhanced(text: string, boxedWarnings: string[] = []): ParsedSideEffect[] {
  const effects: ParsedSideEffect[] = [];
  
  // Common patterns in FDA adverse reaction text
  const patterns = [
    /(?:include|are|were):\s*([^.]+)/gi, // "include: X, Y, Z"
    /(?:such as|including)\s+([^.]+)/gi, // "such as X, Y, Z"
    /most (?:common|frequent)(?:\s+\w+)*:\s*([^.]+)/gi, // "most common: X, Y, Z"
  ];
  
  // Track which sentence each effect came from for context
  const sentences = text.split(/[.!]/);
  
  patterns.forEach(pattern => {
    const matches = Array.from(text.matchAll(pattern));
    for (const match of matches) {
      if (match[1]) {
        // Find which sentence this match belongs to
        const matchIndex = match.index || 0;
        let contextSentence = text;
        for (const sentence of sentences) {
          if (text.indexOf(sentence, matchIndex - 200) !== -1 && text.indexOf(sentence, matchIndex - 200) <= matchIndex) {
            contextSentence = sentence;
            break;
          }
        }
        
        // Parse frequency from the context
        const frequency = parseFrequencyFromText(contextSentence);
        
        // Split by commas, semicolons, and "and"
        const items = match[1].split(/[,;]|\s+and\s+/);
        items.forEach((item: string) => {
          // Preserve percentage in parentheses but extract the effect name
          const percentMatch = item.match(/^(.*?)\s*\((\d+%)\)$/);
          let cleaned = item.trim();
          let itemFrequency = frequency;
          
          if (percentMatch) {
            cleaned = percentMatch[1].trim();
            itemFrequency = percentMatch[2]; // Use specific percentage if present
          } else {
            cleaned = item
              .trim()
              .replace(/^\(|\)$/g, ''); // Remove outer parentheses only
          }
          
          // Clean up but DON'T remove all parenthetical content (may contain frequency)
          cleaned = cleaned.replace(/^(and|or|the)\s+/i, '');
          
          if (cleaned.length > 2 && cleaned.length < 100) { // Sanity check
            effects.push({
              effect: cleaned,
              frequencyText: itemFrequency,
              contextText: contextSentence,
            });
          }
        });
      }
    }
  });
  
  // Also extract from simple lists (e.g., "headache, nausea, dizziness")
  if (effects.length === 0) {
    sentences.forEach(sentence => {
      if (sentence.includes(',')) {
        const frequency = parseFrequencyFromText(sentence);
        const items = sentence.split(',');
        if (items.length >= 2 && items.length <= 20) { // Likely a list
          items.forEach((item: string) => {
            const cleaned = item
              .trim()
              .replace(/^(and|or|the)\s+/i, '');
            
            if (cleaned.length > 2 && cleaned.length < 100 && !/^\d+$/.test(cleaned)) {
              effects.push({
                effect: cleaned,
                frequencyText: frequency,
                contextText: sentence,
              });
            }
          });
        }
      }
    });
  }
  
  return effects;
}

// ============= SIMPLE SIDE EFFECTS ANALYSIS (Per Medication) =============
// Returns top 10 most common side effects for each individual medication
export interface SimpleSideEffect {
  effect: string;
  likelihood: 'low' | 'moderate' | 'high';
}

export interface MedicationSideEffects {
  medicationName: string;
  sideEffects: SimpleSideEffect[];
}

export async function getSimpleSideEffects(medications: { genericName: string }[]): Promise<MedicationSideEffects[]> {
  const results: MedicationSideEffects[] = [];
  
  for (const med of medications) {
    const fdaLabel = await getDrugLabel(med.genericName);
    
    if (!fdaLabel) {
      results.push({
        medicationName: med.genericName,
        sideEffects: []
      });
      continue;
    }
    
    // Extract all side effects from adverse reactions
    const adverseReactions = fdaLabel.warnings.adverseReactions || [];
    const allEffects: Map<string, string> = new Map();
    
    adverseReactions.forEach(section => {
      const parsed = extractSideEffectsEnhanced(section, []);
      parsed.forEach(p => {
        const normalized = p.effect.trim().toLowerCase();
        if (!allEffects.has(normalized)) {
          allEffects.set(normalized, p.frequencyText);
        }
      });
    });
    
    // Convert to array and sort by likelihood
    const effectsList: SimpleSideEffect[] = Array.from(allEffects.entries())
      .map(([effect, frequency]) => {
        // Simple likelihood based on frequency keywords
        let likelihood: 'low' | 'moderate' | 'high' = 'low';
        
        // Handle null/undefined frequency gracefully
        const lowerFreq = (frequency || '').toLowerCase();
        if (lowerFreq.includes('very common') || lowerFreq.includes('>10%')) {
          likelihood = 'high';
        } else if (lowerFreq.includes('common') || (lowerFreq.match(/\d+%/) && parseInt(lowerFreq) >= 1)) {
          likelihood = 'moderate';
        }
        
        return {
          effect,
          likelihood
        };
      })
      .sort((a, b) => {
        // Sort by likelihood: high > moderate > low
        const order = { high: 3, moderate: 2, low: 1 };
        return order[b.likelihood] - order[a.likelihood];
      })
      .slice(0, 10); // Top 10 only
    
    results.push({
      medicationName: med.genericName,
      sideEffects: effectsList
    });
  }
  
  return results;
}
