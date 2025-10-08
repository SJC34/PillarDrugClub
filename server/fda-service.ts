import memoize from 'memoizee';
import { promises as fs } from 'fs';
import path from 'path';

interface FDALabelResponse {
  results?: Array<{
    dosage_and_administration?: string[];
    indications_and_usage?: string[];
    openfda?: {
      generic_name?: string[];
      brand_name?: string[];
    };
  }>;
}

interface DosingInfo {
  dosesPerDay: number | undefined;
  isShortCourse: boolean;
  rawDosageText: string;
  fetchedAt: string;
}

interface CachedFDAResponse {
  medicationName: string;
  dosingInfo: DosingInfo;
  fetchedAt: string;
}

// Disk cache directory
const CACHE_DIR = path.join(process.cwd(), '.fda-cache');

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create FDA cache directory:', error);
  }
}

// Get cache file path for a medication
function getCacheFilePath(medicationName: string): string {
  const sanitized = medicationName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return path.join(CACHE_DIR, `${sanitized}.json`);
}

// Load cached FDA response from disk
async function loadFromDiskCache(medicationName: string): Promise<DosingInfo | null> {
  try {
    const filePath = getCacheFilePath(medicationName);
    const data = await fs.readFile(filePath, 'utf-8');
    const cached: CachedFDAResponse = JSON.parse(data);
    
    // Check if cache is less than 30 days old
    const cacheAge = Date.now() - new Date(cached.fetchedAt).getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    if (cacheAge < thirtyDays) {
      console.log(`📦 Loaded FDA data from disk cache for ${medicationName}`);
      return cached.dosingInfo;
    }
  } catch (error) {
    // Cache miss or error - will fetch from API
  }
  return null;
}

// Save FDA response to disk cache
async function saveToDiskCache(medicationName: string, dosingInfo: DosingInfo): Promise<void> {
  try {
    await ensureCacheDir();
    const filePath = getCacheFilePath(medicationName);
    const cached: CachedFDAResponse = {
      medicationName,
      dosingInfo,
      fetchedAt: new Date().toISOString()
    };
    await fs.writeFile(filePath, JSON.stringify(cached, null, 2));
  } catch (error) {
    console.error(`Failed to save FDA cache for ${medicationName}:`, error);
  }
}

// Short-course medication categories and keywords
const SHORT_COURSE_INDICATORS = [
  'antibiotic', 'antibiotics',
  'inhaler', 'inhalation',
  'steroid pack', 'prednisone pack',
  'z-pack', 'zpak',
  'course of treatment',
  'acute treatment',
  'short-term use',
  'nebulizer solution',
  'rescue inhaler',
];

// Common antibiotic names
const ANTIBIOTIC_NAMES = [
  'amoxicillin', 'azithromycin', 'ciprofloxacin', 'doxycycline',
  'cephalexin', 'clindamycin', 'metronidazole', 'sulfamethoxazole',
  'trimethoprim', 'penicillin', 'ampicillin', 'levofloxacin',
];

// Inhaler/respiratory medication keywords
const INHALER_KEYWORDS = [
  'albuterol', 'fluticasone', 'budesonide', 'salmeterol',
  'tiotropium', 'ipratropium', 'formoterol', 'mometasone',
  'beclomethasone', 'inhaler', 'inhalation', 'hfa',
];

/**
 * Check if a medication is a short-course drug based on name and category
 */
function isShortCourseMedication(medicationName: string, category?: string): boolean {
  const lowerName = medicationName.toLowerCase();
  const lowerCategory = category?.toLowerCase() || '';
  
  // Check if it's an antibiotic
  if (ANTIBIOTIC_NAMES.some(name => lowerName.includes(name))) {
    return true;
  }
  
  // Check if it's an inhaler or respiratory medication
  if (INHALER_KEYWORDS.some(keyword => lowerName.includes(keyword))) {
    return true;
  }
  
  // Check category
  if (lowerCategory.includes('antibiotic') || 
      lowerCategory.includes('inhaler') ||
      lowerCategory.includes('respiratory')) {
    return true;
  }
  
  return false;
}

/**
 * Extract doses per day from FDA dosage text
 */
function extractDosesPerDay(dosageText: string): number | undefined {
  const text = dosageText.toLowerCase();
  
  // Common dosing patterns
  const patterns = [
    /(\d+)\s*(?:tablet|capsule|dose)s?\s*(?:once|1\s*time)?\s*(?:per|a|each)?\s*day/i,
    /(?:once|1\s*time)\s*(?:per|a|each)?\s*day.*?(\d+)\s*(?:tablet|capsule|dose)/i,
    /(\d+)\s*(?:tablet|capsule|dose)s?\s*daily/i,
    /take\s*(\d+).*?(?:per|a|each)?\s*day/i,
    /(\d+)\s*(?:tablet|capsule|dose)s?\s*twice\s*(?:per|a|each)?\s*day/i, // multiply by 2
    /twice\s*(?:per|a|each)?\s*day.*?(\d+)\s*(?:tablet|capsule|dose)/i, // multiply by 2
    /(\d+)\s*(?:tablet|capsule|dose)s?\s*three\s*times\s*(?:per|a|each)?\s*day/i, // multiply by 3
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let doses = parseInt(match[1]);
      
      // Handle "twice daily" or "three times daily"
      if (text.includes('twice')) doses *= 2;
      if (text.includes('three times')) doses *= 3;
      
      return doses;
    }
  }
  
  // Default patterns if specific dosing not found
  if (text.includes('once daily') || text.includes('once a day')) return 1;
  if (text.includes('twice daily') || text.includes('twice a day')) return 2;
  if (text.includes('three times daily') || text.includes('three times a day')) return 3;
  if (text.includes('four times daily') || text.includes('four times a day')) return 4;
  
  return undefined;
}

/**
 * Fetch dosing information from openFDA API (with disk cache)
 */
async function fetchFDADosingInfo(medicationName: string): Promise<DosingInfo> {
  // First try to load from disk cache
  const cached = await loadFromDiskCache(medicationName);
  if (cached) {
    return cached;
  }
  
  // Cache miss - fetch from FDA API
  const fetchedAt = new Date().toISOString();
  
  try {
    const searchQuery = medicationName.split(/\s+/)[0]; // Use first word for search
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${searchQuery}"&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.log(`⚠️ FDA API returned ${response.status} for ${medicationName}`);
      const emptyResult = { dosesPerDay: undefined, isShortCourse: false, rawDosageText: '', fetchedAt };
      await saveToDiskCache(medicationName, emptyResult);
      return emptyResult;
    }
    
    const data: FDALabelResponse = await response.json();
    
    if (!data.results || data.results.length === 0) {
      const emptyResult = { dosesPerDay: undefined, isShortCourse: false, rawDosageText: '', fetchedAt };
      await saveToDiskCache(medicationName, emptyResult);
      return emptyResult;
    }
    
    const result = data.results[0];
    const dosageText = result.dosage_and_administration?.[0] || '';
    const indicationsText = result.indications_and_usage?.[0] || '';
    
    // Check if it's a short-course medication based on text
    const isShortCourse = SHORT_COURSE_INDICATORS.some(indicator => 
      dosageText.toLowerCase().includes(indicator) || 
      indicationsText.toLowerCase().includes(indicator)
    );
    
    const dosesPerDay = extractDosesPerDay(dosageText);
    
    const dosingInfo = {
      dosesPerDay,
      isShortCourse,
      rawDosageText: dosageText.substring(0, 500), // Truncate for storage
      fetchedAt
    };
    
    // Save to disk cache
    await saveToDiskCache(medicationName, dosingInfo);
    
    return dosingInfo;
  } catch (error) {
    console.error(`❌ Error fetching FDA data for ${medicationName}:`, error);
    const emptyResult = { dosesPerDay: undefined, isShortCourse: false, rawDosageText: '', fetchedAt };
    await saveToDiskCache(medicationName, emptyResult);
    return emptyResult;
  }
}

// Memoize FDA API calls to avoid hitting rate limits (cache for 24 hours)
export const getFDADosingInfo = memoize(fetchFDADosingInfo, {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  promise: true,
  normalizer: (args) => args[0].toLowerCase(), // Case-insensitive cache key
});

/**
 * Calculate annual price based on dosing information
 */
export function calculateAnnualPrice(
  unitPrice: number,
  dosesPerDay: number | undefined,
  isShortCourse: boolean
): number | undefined {
  // Don't calculate annual price for short-course medications
  if (isShortCourse) {
    return undefined;
  }
  
  // Need doses per day to calculate annual price
  if (!dosesPerDay) {
    return undefined;
  }
  
  // Annual supply: doses per day × 365 days × unit price
  return dosesPerDay * 365 * unitPrice;
}

/**
 * Determine if medication is short-course based on name and FDA data
 */
export async function determineMedicationPricing(
  medicationName: string,
  unitPrice: number,
  category?: string
): Promise<{
  dosesPerDay: number | undefined;
  isShortCourse: boolean;
  annualPrice: number | undefined;
  fdaMetadata?: {
    rawDosageText: string;
    fetchedAt: string;
  };
}> {
  // First check by name/category
  const isShortCourseByName = isShortCourseMedication(medicationName, category);
  
  if (isShortCourseByName) {
    const fetchedAt = new Date().toISOString();
    return {
      dosesPerDay: undefined,
      isShortCourse: true,
      annualPrice: undefined,
      fdaMetadata: {
        rawDosageText: '',
        fetchedAt
      }
    };
  }
  
  // Then check FDA data for chronic medications
  const fdaInfo = await getFDADosingInfo(medicationName);
  
  const annualPrice = calculateAnnualPrice(
    unitPrice,
    fdaInfo.dosesPerDay,
    fdaInfo.isShortCourse || isShortCourseByName
  );
  
  return {
    dosesPerDay: fdaInfo.dosesPerDay,
    isShortCourse: fdaInfo.isShortCourse || isShortCourseByName,
    annualPrice,
    fdaMetadata: {
      rawDosageText: fdaInfo.rawDosageText,
      fetchedAt: fdaInfo.fetchedAt
    }
  };
}
