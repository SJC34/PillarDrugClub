import OpenAI from "openai";
import { writingStyles } from "./blog-ai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  targetAudience?: "new_members" | "existing" | "general";
  cta?: string; // Call to action (default: pillardrugclub.com/join)
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
}

/**
 * Generate multi-channel content from a single topic
 * Returns content optimized for each platform
 */
export async function generateMultiChannelContent(
  options: MultiChannelContentOptions
): Promise<GeneratedContent> {
  const {
    topic,
    tone = "friendly",
    keywords = [],
    writingStyle = "default",
    generateBlog = true,
    generateXThread = true,
    generateXTip = false,
    generateXPoll = false,
    generateRedditPost = true,
    generateVideoScript = true,
    targetAudience = "general",
    cta = "pillardrugclub.com/join"
  } = options;

  const selectedStyle = writingStyles[writingStyle as keyof typeof writingStyles] || writingStyles.default;
  const keywordsText = keywords.length > 0 ? keywords.join(", ") : "";

  const audienceContext = {
    new_members: "Focus on introducing concepts and building trust with people new to alternative pharmacy options.",
    existing: "Speak to engaged members who understand the value proposition. Provide deeper insights and advanced tips.",
    general: "Write for a broad audience including both prospects and members. Balance education with value demonstration."
  };

  // Prepare the multi-format generation prompt
  const prompt = `You are a content strategist for Pillar Drug Club - a prescription pharmacy platform offering wholesale medication prices without insurance hassles.

TOPIC: "${topic}"

CONTEXT:
- Tone: ${tone}
- Audience: ${targetAudience} (${audienceContext[targetAudience]})
- Keywords: ${keywordsText}
- CTA: ${cta}
- Writing Style: ${selectedStyle.description}

Generate content for the following platforms:

${generateBlog ? `
1. BLOG POST (1,500+ words, SEO-optimized)
   - Engaging title under 60 chars
   - Compelling meta description under 160 chars
   - Full markdown content with H2/H3 headings
   - Include statistics, examples, actionable tips
   - Natural keyword integration
   - Conclusion linking to CTA
` : ''}

${generateXThread ? `
2. X/TWITTER THREAD (10-15 tweets)
   - Hook tweet that grabs attention
   - 8-12 value tweets with insights/tips
   - Stats or data points (1-2 tweets)
   - Engagement tweet (question or bold statement)
   - Final tweet with CTA and link
   - Each tweet under 280 characters
   - Use line breaks for readability
   - Thread emoji indicators (1/15, 2/15, etc.)
` : ''}

${generateXTip ? `
3. X/TWITTER TIP (Single Tweet)
   - One actionable, shareable tip
   - Under 280 characters
   - Clear value proposition
   - Optional CTA or link
` : ''}

${generateXPoll ? `
4. X/TWITTER POLL
   - Engaging question related to topic
   - 2-4 answer options
   - Drives engagement and data collection
` : ''}

${generateRedditPost ? `
5. REDDIT POST (800-1000 words)
   - Engaging title in question format
   - Personal/relatable opener
   - Value-packed body with bullet points
   - Helpful resources section
   - Soft CTA (no hard selling on Reddit)
   - Suggested subreddit: r/diabetes, r/frugal, r/personalfinance, etc.
` : ''}

${generateVideoScript ? `
6. YOUTUBE SHORTS SCRIPT (60 seconds)
   - Hook (0-3s): Attention-grabbing statement
   - Problem (3-8s): Pain point description
   - Tip 1 (8-20s): First solution with visual text
   - Tip 2 (20-32s): Second solution with visual text
   - Tip 3 (32-44s): Third solution with visual text  
   - CTA (44-60s): Call to action with URL display
   - Format for text overlays
` : ''}

WRITING STYLE GUIDANCE:
${selectedStyle.prompt}

BRAND VOICE:
- Trustworthy pharmacist who genuinely cares
- Transparent about costs and process
- Empowering patients to save money
- No insurance jargon
- Practical, actionable advice

Return a JSON object with all requested content formats.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert multi-channel content strategist specializing in pharmacy and healthcare. You create platform-optimized content that drives engagement and conversions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated from OpenAI");
    }

    const parsedContent = JSON.parse(content);
    return parsedContent as GeneratedContent;

  } catch (error: any) {
    console.error("Error generating multi-channel content:", error);
    throw new Error(`Content generation failed: ${error.message}`);
  }
}

/**
 * Generate a simple X/Twitter tip (single tweet)
 */
export async function generateQuickTip(topic: string, keywords: string[] = []): Promise<string> {
  const keywordsText = keywords.length > 0 ? `Keywords: ${keywords.join(", ")}` : "";
  
  const prompt = `Generate a single, actionable tip tweet about: "${topic}"

${keywordsText}

Requirements:
- Under 280 characters
- Actionable and valuable
- Professional pharmacy voice
- Optional CTA or link
- No hashtags unless natural

Return only the tweet text, nothing else.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 100
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  } catch (error: any) {
    console.error("Error generating quick tip:", error);
    throw new Error(`Tip generation failed: ${error.message}`);
  }
}

/**
 * Generate an engaging X/Twitter poll
 */
export async function generatePoll(topic: string): Promise<{ question: string; options: string[] }> {
  const prompt = `Generate an engaging Twitter poll about: "${topic}"

Requirements:
- Question under 280 characters
- 2-4 answer options
- Each option under 25 characters
- Drives engagement and collects useful data
- Related to pharmacy/healthcare savings

Return JSON: { "question": "...", "options": ["...", "...", "..."] }`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No poll generated");
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error generating poll:", error);
    throw new Error(`Poll generation failed: ${error.message}`);
  }
}
