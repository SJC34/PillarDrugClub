/**
 * Creator Style Engine Template Presets
 * 
 * Each template defines a smart cross-channel content strategy
 * with optimal style packs for Blog, X/Twitter, Reddit, and YouTube.
 */

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  useCase: string;
  stylePacks: {
    blog: BlogStylePack;
    x: XStylePack;
    reddit: RedditStylePack;
    youtube: YouTubeStylePack;
  };
  recommendedFor: string[];
}

// Style pack type definitions
export type BlogStylePack = "deep_dive_analyst" | "authority_educator" | "seo_storyteller" | "minimalist_explainer";
export type YouTubeStylePack = "high_retention_storyteller" | "educational_velocity" | "narrative_documentary";
export type RedditStylePack = "ama_transparency" | "tifu_comedic_story" | "emotional_longform" | "ultra_practical_steps";
export type XStylePack = "viral_hook_thread" | "data_driven_thread" | "tactical_playbook_thread" | "spicy_opinion_thread";

/**
 * Template Presets for Healthcare/Pharmacy Content
 */
export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: "professional_health_blog",
    name: "Professional Health Blog",
    description: "Evidence-based, authoritative medical content for healthcare professionals and informed patients",
    useCase: "When you need trusted, professional content that establishes medical authority",
    stylePacks: {
      blog: "authority_educator",
      x: "data_driven_thread",
      reddit: "ama_transparency",
      youtube: "educational_velocity",
    },
    recommendedFor: ["Medical updates", "Clinical guidelines", "Professional education"],
  },
  {
    id: "viral_health_tips",
    name: "Viral Health Tips",
    description: "Engaging, shareable health tips optimized for maximum reach and social engagement",
    useCase: "When you want to grow your audience with high-engagement content",
    stylePacks: {
      blog: "seo_storyteller",
      x: "viral_hook_thread",
      reddit: "ultra_practical_steps",
      youtube: "high_retention_storyteller",
    },
    recommendedFor: ["Quick health tips", "Preventive care", "Wellness trends"],
  },
  {
    id: "patient_stories",
    name: "Patient Stories & Testimonials",
    description: "Emotional, relatable stories that build trust and connection with your audience",
    useCase: "When you need to humanize healthcare and build emotional connection",
    stylePacks: {
      blog: "seo_storyteller",
      x: "viral_hook_thread",
      reddit: "emotional_longform",
      youtube: "narrative_documentary",
    },
    recommendedFor: ["Patient experiences", "Success stories", "Healthcare journeys"],
  },
  {
    id: "medication_guides",
    name: "Medication Guides",
    description: "Comprehensive, step-by-step medication guides with actionable information",
    useCase: "When you need to explain complex medication information clearly",
    stylePacks: {
      blog: "deep_dive_analyst",
      x: "tactical_playbook_thread",
      reddit: "ultra_practical_steps",
      youtube: "educational_velocity",
    },
    recommendedFor: ["Drug guides", "Treatment plans", "Medication FAQs"],
  },
  {
    id: "healthcare_news",
    name: "Healthcare News & Updates",
    description: "Breaking healthcare news with expert analysis and data-driven insights",
    useCase: "When you need to cover current healthcare events and policy changes",
    stylePacks: {
      blog: "authority_educator",
      x: "data_driven_thread",
      reddit: "ama_transparency",
      youtube: "educational_velocity",
    },
    recommendedFor: ["FDA approvals", "Policy changes", "Industry news"],
  },
  {
    id: "cost_savings_tips",
    name: "Cost Savings Tips",
    description: "Clear, actionable advice on reducing medication costs and healthcare expenses",
    useCase: "When you want to help patients save money on prescriptions",
    stylePacks: {
      blog: "minimalist_explainer",
      x: "viral_hook_thread",
      reddit: "ultra_practical_steps",
      youtube: "high_retention_storyteller",
    },
    recommendedFor: ["Discount programs", "Generic alternatives", "Insurance tips"],
  },
  {
    id: "industry_analysis",
    name: "Industry Analysis",
    description: "Deep-dive analysis of pharmacy and healthcare trends with data and insights",
    useCase: "When you need thought leadership content for stakeholders",
    stylePacks: {
      blog: "deep_dive_analyst",
      x: "data_driven_thread",
      reddit: "ama_transparency",
      youtube: "narrative_documentary",
    },
    recommendedFor: ["Market trends", "Business analysis", "Strategic insights"],
  },
  {
    id: "pharmacy_qa",
    name: "Pharmacy Q&A",
    description: "Expert answers to common pharmacy questions in clear, accessible format",
    useCase: "When you need to address patient questions and concerns",
    stylePacks: {
      blog: "authority_educator",
      x: "tactical_playbook_thread",
      reddit: "ama_transparency",
      youtube: "educational_velocity",
    },
    recommendedFor: ["Patient FAQs", "Drug interactions", "Safety questions"],
  },
];

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): ContentTemplate | undefined {
  return CONTENT_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Get default template (first one - Professional Health Blog)
 */
export function getDefaultTemplate(): ContentTemplate {
  return CONTENT_TEMPLATES[0];
}

/**
 * Get style packs for a template
 */
export function getStylePacks(templateId: string): ContentTemplate["stylePacks"] | null {
  const template = getTemplate(templateId);
  return template ? template.stylePacks : null;
}
