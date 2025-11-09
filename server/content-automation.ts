import OpenAI from "openai";
import { writingStyles } from "./blog-ai";
import type { MultiChannelContentOptions, GeneratedContent } from "@shared/content-automation";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Re-export types for convenience
export type { MultiChannelContentOptions, GeneratedContent };

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

  const audienceContext: Record<string, string> = {
    new_members: "Focus on introducing concepts and building trust with people new to alternative pharmacy options.",
    existing: "Speak to engaged members who understand the value proposition. Provide deeper insights and advanced tips.",
    general: "Write for a broad audience including both prospects and members. Balance education with value demonstration.",
    healthcare_consumers: "Speak to informed healthcare consumers who understand medical terminology and value transparency.",
    seniors: "Address the medication needs and budget concerns of older adults (65+) on fixed incomes.",
    chronic_conditions: "Target patients managing chronic conditions who require ongoing medication and cost predictability.",
    cost_conscious: "Target people actively seeking ways to reduce medication costs and stretch their healthcare budget.",
    small_business: "Focus on business owners looking to provide affordable medication benefits to employees.",
    families: "Target families managing medication costs for multiple family members."
  };

  // Prepare the multi-format generation prompt
  const prompt = `You are a content strategist for Pillar Drug Club - a prescription pharmacy platform offering wholesale medication prices without insurance hassles.

TOPIC: "${topic}"

CONTEXT:
- Tone: ${tone}
- Audience: ${targetAudience} (${audienceContext[targetAudience] || audienceContext.general})
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
