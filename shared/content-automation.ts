/**
 * Shared types for multi-channel content automation system
 * Used by both server and client to ensure type safety
 */

export interface MultiChannelContentOptions {
  topic: string;
  tone?: "professional" | "friendly" | "educational" | "conversational" | "urgent";
  keywords?: string[];
  writingStyle?: string;
  generateBlog?: boolean;
  generateXThread?: boolean;
  generateXTip?: boolean;
  generateXPoll?: boolean;
  generateRedditPost?: boolean;
  generateVideoScript?: boolean;
  targetAudience?: "new_members" | "existing" | "general" | "healthcare_consumers" | "seniors" | "chronic_conditions" | "cost_conscious" | "small_business" | "families";
  contentGoal?: "education" | "awareness" | "conversion" | "engagement";
  cta?: string; // Call to action (default: pillardrugclub.com/join)
  
  // Creator Style Engine parameters
  generationMode?: "simple" | "professional";
  templatePreset?: string; // Template ID from content-templates.ts
}

export interface GeneratedContent {
  blog?: {
    title: string;
    content: string;
    excerpt: string;
    seoTitle: string;
    seoDescription: string;
    seoKeywords: string[];
    tags: string[];
  };
  xThread?: {
    tweets: string[]; // 10-15 tweet thread
  };
  xTip?: {
    text: string; // Single actionable tip tweet
  };
  xPoll?: {
    question: string;
    options: string[]; // 2-4 options
  };
  redditPost?: {
    title: string;
    body: string;
    subreddit: string; // Suggested subreddit
  };
  videoScript?: {
    hook: string; // 0-3 seconds
    problem: string; // 3-8 seconds
    tips: string[]; // 3 tips, 12 seconds each
    cta: string; // Final 5-10 seconds
    duration: number; // Total seconds
  };
  video?: {
    url?: string; // Video URL (uploaded, generated, or manual)
    prompt: string; // Sora prompt for video generation
    sourceType: "manual" | "runway" | "pika" | "sora" | "uploaded"; // How video was created
    status: "awaiting_upload" | "generating" | "completed" | "failed";
    uploadedAt?: string; // Timestamp when video was added
    operatorNotes?: string; // Admin notes about the video
    error?: string;
  };
}
