import OpenAI from "openai";
import { writingStyles } from "./blog-ai";
import type { MultiChannelContentOptions, GeneratedContent } from "@shared/content-automation";
import { getTemplate, type BlogStylePack, type XStylePack, type RedditStylePack, type YouTubeStylePack } from "@shared/content-templates";
import { CREATOR_STYLE_ENGINE_PROMPT } from "./prompts/creator-style-engine";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Re-export types for convenience
export type { MultiChannelContentOptions, GeneratedContent };

/**
 * Build Creator Style Engine prompt with channel-specific style packs
 */
function buildCreatorStyleEnginePrompt(
  topic: string,
  tone: string,
  targetAudience: string,
  cta: string,
  keywords: string[],
  contentGoal: string,
  stylePacks: {
    blog?: BlogStylePack;
    x?: XStylePack;
    reddit?: RedditStylePack;
    youtube?: YouTubeStylePack;
  },
  generators: {
    generateBlog: boolean;
    generateXThread: boolean;
    generateXTip: boolean;
    generateXPoll: boolean;
    generateRedditPost: boolean;
    generateVideoScript: boolean;
  }
): string {
  const keywordsText = keywords.length > 0 ? keywords.join(", ") : "";
  
  return `${CREATOR_STYLE_ENGINE_PROMPT}

INPUT PARAMETERS:
- topic: "${topic}"
- goal: ${contentGoal}
- tone: ${tone}
- audience: ${targetAudience}
- keywords: ${keywordsText}
- call_to_action: ${cta}

STYLE PACKS FOR EACH CHANNEL:
${generators.generateBlog ? `- blog: ${stylePacks.blog || 'authority_educator'}` : ''}
${(generators.generateXThread || generators.generateXTip) ? `- x: ${stylePacks.x || 'viral_hook_thread'}` : ''}
${generators.generateRedditPost ? `- reddit_post: ${stylePacks.reddit || 'ama_transparency'}` : ''}
${generators.generateVideoScript ? `- youtube_script: ${stylePacks.youtube || 'educational_velocity'}` : ''}

CHANNEL-SPECIFIC REQUIREMENTS:

${generators.generateBlog ? `
BLOG POST (channel: blog, style: ${stylePacks.blog || 'authority_educator'}):
- 1,500+ words minimum
- SEO-optimized with H2/H3 headings
- Include statistics, examples, actionable tips
- Natural keyword integration: ${keywordsText}
- Clear intro, body, conclusion structure
- End with CTA linking to: ${cta}
` : ''}

${generators.generateXThread ? `
X/TWITTER THREAD (channel: x_thread, style: ${stylePacks.x || 'viral_hook_thread'}):
- 10-15 tweets minimum
- First tweet: strong hook (curiosity gap or bold promise)
- 8-12 value tweets with insights/tips
- Include 1-2 data/stat tweets
- 1 engagement tweet (question or bold statement)
- Final tweet with CTA and link: ${cta}
- Each tweet MUST be under 280 characters
- Use line breaks for readability
- Thread indicators (1/15, 2/15, etc.)
` : ''}

${generators.generateXTip ? `
X/TWITTER TIP (channel: x_tip, style: ${stylePacks.x || 'viral_hook_thread'}):
- Single actionable tweet
- Under 280 characters
- Clear value proposition
- Professional pharmacy voice
- Optional CTA or link
` : ''}

${generators.generateXPoll ? `
X/TWITTER POLL (channel: x_poll):
- Engaging question related to topic
- 2-4 answer options (each under 25 chars)
- Drives engagement and data collection
- Related to pharmacy/healthcare savings
` : ''}

${generators.generateRedditPost ? `
REDDIT POST (channel: reddit_post, style: ${stylePacks.reddit || 'ama_transparency'}):
- 800-1000 words
- Engaging title in question format
- Personal/relatable opener
- Value-packed body with bullet points
- Helpful resources section
- Soft CTA (no hard selling on Reddit)
- Suggest appropriate subreddit (r/diabetes, r/frugal, r/personalfinance, etc.)
` : ''}

${generators.generateVideoScript ? `
YOUTUBE SCRIPT (channel: youtube_script, style: ${stylePacks.youtube || 'educational_velocity'}):
- 60-second script format
- Hook (0-3s): Attention-grabbing statement
- Problem (3-8s): Pain point description
- Tip 1 (8-20s): First solution with visual text cue
- Tip 2 (20-32s): Second solution with visual text cue
- Tip 3 (32-44s): Third solution with visual text cue
- CTA (44-60s): Call to action with URL display: ${cta}
- Include [B-ROLL] and [ON SCREEN TEXT] cues where helpful
` : ''}

CRITICAL: You MUST return a JSON object with the following EXACT structure:
${(() => {
  const jsonParts: string[] = [];
  
  if (generators.generateBlog) {
    jsonParts.push(`  "blog": {
    "title": "string (under 60 chars)",
    "content": "string (1500+ words markdown)",
    "excerpt": "string (100-150 chars)",
    "seoTitle": "string (under 60 chars)",
    "seoDescription": "string (under 160 chars)",
    "seoKeywords": ["array", "of", "keywords"],
    "tags": ["array", "of", "tags"]
  }`);
  }
  
  if (generators.generateXThread) {
    jsonParts.push(`  "xThread": {
    "tweets": ["array of 10-15 tweets, each under 280 chars"]
  }`);
  }
  
  if (generators.generateXTip) {
    jsonParts.push(`  "xTip": {
    "text": "string (single tweet under 280 chars)"
  }`);
  }
  
  if (generators.generateXPoll) {
    jsonParts.push(`  "xPoll": {
    "question": "string (under 280 chars)",
    "options": ["array", "of", "2-4", "options"]
  }`);
  }
  
  if (generators.generateRedditPost) {
    jsonParts.push(`  "redditPost": {
    "title": "string (question format)",
    "body": "string (800-1000 words)",
    "subreddit": "string (r/suggested)"
  }`);
  }
  
  if (generators.generateVideoScript) {
    jsonParts.push(`  "videoScript": {
    "hook": "string (0-3 second script)",
    "problem": "string (3-8 second script)",
    "tips": ["array", "of", "3 tips"],
    "cta": "string (final CTA)",
    "duration": 60
  }`);
  }
  
  return '{\n' + jsonParts.join(',\n') + '\n}';
})()}

ALL requested sections MUST be present in your response. Do not omit any section.
Follow your assigned Creator Style Pack precisely for each channel while meeting all structural requirements above.`;
}

/**
 * Generate multi-channel content from a single topic
 * Returns content optimized for each platform
 * Supports both simple mode (default) and professional mode (Creator Style Engine)
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
    contentGoal = "education",
    cta = "pharmacyautopilot.com/join",
    generationMode = "simple",
    templatePreset
  } = options;

  // Check if using professional mode with Creator Style Engine
  const isProfessionalMode = generationMode === "professional" && templatePreset;
  let stylePacks: { blog?: BlogStylePack; x?: XStylePack; reddit?: RedditStylePack; youtube?: YouTubeStylePack } | null = null;
  
  if (isProfessionalMode) {
    const template = getTemplate(templatePreset!);
    if (!template) {
      console.warn(`⚠️ Template ${templatePreset} not found, falling back to simple mode`);
    } else {
      console.log(`✅ Using Creator Style Engine template: ${template.name}`);
      stylePacks = {
        blog: generateBlog ? template.stylePacks.blog : undefined,
        x: generateXThread || generateXTip ? template.stylePacks.x : undefined,
        reddit: generateRedditPost ? template.stylePacks.reddit : undefined,
        youtube: generateVideoScript ? template.stylePacks.youtube : undefined
      };
    }
  }

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

  // Build prompt based on mode (simple or professional)
  let userPrompt: string;
  let systemPrompt: string;
  
  if (isProfessionalMode && stylePacks) {
    // Professional mode: Use Creator Style Engine
    console.log(`📝 Using Creator Style Engine with style packs:`, stylePacks);
    systemPrompt = "You are the Creator Style Engine - an expert multi-channel content generator for Pharmacy Autopilot. You adapt content structure, pacing, and tone to match selected Creator Style Packs while maintaining medical accuracy and healthcare best practices.";
    userPrompt = buildCreatorStyleEnginePrompt(
      topic,
      tone,
      targetAudience,
      cta,
      keywords,
      contentGoal,
      stylePacks,
      {
        generateBlog,
        generateXThread,
        generateXTip,
        generateXPoll,
        generateRedditPost,
        generateVideoScript
      }
    );
  } else {
    // Simple mode: Use default content strategist prompt
    console.log(`📝 Using simple mode content generation`);
    systemPrompt = "You are an expert multi-channel content strategist specializing in pharmacy and healthcare. You create platform-optimized content that drives engagement and conversions. You ALWAYS return complete JSON with all requested sections - never omit content.";
    userPrompt = `You are a content strategist for Pharmacy Autopilot - a prescription pharmacy platform offering wholesale medication prices without insurance hassles.

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

CRITICAL: You MUST return a JSON object with the following EXACT structure:
${(() => {
  const jsonParts: string[] = [];
  
  if (generateBlog) {
    jsonParts.push(`  "blog": {
    "title": "string (under 60 chars)",
    "content": "string (1500+ words markdown)",
    "excerpt": "string (100-150 chars)",
    "seoTitle": "string (under 60 chars)",
    "seoDescription": "string (under 160 chars)",
    "seoKeywords": ["array", "of", "keywords"],
    "tags": ["array", "of", "tags"]
  }`);
  }
  
  if (generateXThread) {
    jsonParts.push(`  "xThread": {
    "tweets": ["array of 10-15 tweets, each under 280 chars"]
  }`);
  }
  
  if (generateXTip) {
    jsonParts.push(`  "xTip": {
    "text": "string (single tweet under 280 chars)"
  }`);
  }
  
  if (generateXPoll) {
    jsonParts.push(`  "xPoll": {
    "question": "string (under 280 chars)",
    "options": ["array", "of", "2-4", "options"]
  }`);
  }
  
  if (generateRedditPost) {
    jsonParts.push(`  "redditPost": {
    "title": "string (question format)",
    "body": "string (800-1000 words)",
    "subreddit": "string (r/suggested)"
  }`);
  }
  
  if (generateVideoScript) {
    jsonParts.push(`  "videoScript": {
    "hook": "string (0-3 second script)",
    "problem": "string (3-8 second script)",
    "tips": ["array", "of", "3 tips"],
    "cta": "string (final CTA)",
    "duration": 60
  }`);
  }
  
  return '{\n' + jsonParts.join(',\n') + '\n}';
})()}

ALL requested sections MUST be present in your response. Do not omit any section marked above.`;
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content generated from OpenAI");
    }

    let parsedContent: any;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error("❌ Failed to parse OpenAI response:", content);
      throw new Error("Invalid JSON response from AI");
    }

    // Validate required sections are present
    const missingPlatforms: string[] = [];
    if (generateBlog && !parsedContent.blog) missingPlatforms.push("blog");
    if (generateXThread && !parsedContent.xThread) missingPlatforms.push("xThread");
    if (generateXTip && !parsedContent.xTip) missingPlatforms.push("xTip");
    if (generateXPoll && !parsedContent.xPoll) missingPlatforms.push("xPoll");
    if (generateRedditPost && !parsedContent.redditPost) missingPlatforms.push("redditPost");
    if (generateVideoScript && !parsedContent.videoScript) missingPlatforms.push("videoScript");

    if (missingPlatforms.length > 0) {
      console.error("❌ AI response missing platforms:", missingPlatforms);
      console.error("📄 Received content keys:", Object.keys(parsedContent));
      throw new Error(`AI failed to generate content for: ${missingPlatforms.join(", ")}. Please try again.`);
    }

    console.log("✅ All requested platforms generated successfully:", Object.keys(parsedContent));
    
    // Cast to proper type
    const typedContent = parsedContent as GeneratedContent;
    
    // Generate video data if video script was requested
    if (generateVideoScript && typedContent.videoScript) {
      typedContent.video = await generateVideoData(typedContent.videoScript);
    }
    
    return typedContent;

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

/**
 * Generate a Sora AI video prompt from video script
 * NOTE: Sora API is not yet publicly available (expected Q1 2026)
 * This generates the prompt that will be used when the API launches
 */
export async function generateSoraVideoPrompt(videoScript: GeneratedContent['videoScript']): Promise<string> {
  if (!videoScript) {
    throw new Error("No video script provided");
  }

  const prompt = `Create a detailed Sora AI video generation prompt for this YouTube short script:

HOOK (0-3s): ${videoScript.hook}
PROBLEM (3-8s): ${videoScript.problem}
TIP 1 (8-20s): ${videoScript.tips[0]}
TIP 2 (20-32s): ${videoScript.tips[1]}
TIP 3 (32-44s): ${videoScript.tips[2]}
CTA (44-60s): ${videoScript.cta}

Generate a cinematic Sora prompt that:
- Describes visual scenes for each segment
- Includes text overlays that match the script timing
- Specifies camera movements and transitions
- Maintains professional pharmacy/healthcare aesthetic
- Creates engaging, scroll-stopping visuals
- Duration: exactly 60 seconds
- Aspect ratio: 9:16 (vertical for YouTube Shorts)

Return only the Sora prompt, optimized for video generation.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content?.trim() || "";
  } catch (error: any) {
    console.error("Error generating Sora prompt:", error);
    throw new Error(`Sora prompt generation failed: ${error.message}`);
  }
}

/**
 * Generate video data with Sora-ready prompt
 * Returns prompt for manual video creation using Runway, Pika, or future Sora API
 */
export async function generateVideoData(
  videoScript: GeneratedContent['videoScript']
): Promise<GeneratedContent['video']> {
  try {
    // Generate the Sora-optimized video prompt
    const soraPrompt = await generateSoraVideoPrompt(videoScript);

    console.log("📹 Video prompt generated for manual creation");
    console.log("💡 Use this prompt with: Runway Gen-3, Pika, or upload your own video");

    // TODO: When Sora API becomes available (Q1 2026), implement:
    // const response = await openai.videos.generate({
    //   model: "sora-2",
    //   prompt: soraPrompt,
    //   duration: 60,
    //   aspect_ratio: "9:16"
    // });
    // return { 
    //   status: "completed", 
    //   prompt: soraPrompt, 
    //   url: response.url,
    //   sourceType: "sora",
    //   uploadedAt: new Date().toISOString()
    // };

    return {
      prompt: soraPrompt,
      sourceType: "manual",
      status: "awaiting_upload",
      operatorNotes: "Use the prompt with Runway Gen-3, Pika Labs, or manually upload your video. Paste the video URL when ready."
    };
  } catch (error: any) {
    console.error("❌ Error generating video data:", error);
    return {
      prompt: "",
      sourceType: "manual",
      status: "failed",
      error: `Failed to generate video prompt: ${error.message}`
    };
  }
}
