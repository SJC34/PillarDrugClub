import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface BlogGenerationOptions {
  topic: string;
  category: "medications" | "pharmacy-news" | "healthcare-savings" | "insurance" | "general";
  tone?: "professional" | "friendly" | "educational" | "conversational";
  keywords?: string[];
  targetLength?: "short" | "medium" | "long"; // ~500, ~1000, ~1500+ words
}

export async function generateBlogPost(options: BlogGenerationOptions) {
  const {
    topic,
    category,
    tone = "professional",
    keywords = [],
    targetLength = "medium"
  } = options;

  const lengthGuidance = {
    short: "approximately 500-700 words",
    medium: "approximately 1000-1200 words",
    long: "approximately 1500-2000 words"
  };

  const categoryContext = {
    medications: "Focus on medication information, usage guidelines, benefits, and safety considerations. Include FDA-approved information where relevant.",
    "pharmacy-news": "Cover recent developments in the pharmacy industry, regulatory changes, new drug approvals, or healthcare policy updates.",
    "healthcare-savings": "Provide actionable tips for reducing healthcare and prescription costs, explaining insurance alternatives, and maximizing savings.",
    insurance: "Explain insurance concepts, coverage options, formularies, and how to navigate prescription drug benefits.",
    general: "Provide general healthcare information that educates and helps readers make informed decisions."
  };

  const keywordsText = keywords.length > 0 
    ? `Include these keywords naturally: ${keywords.join(", ")}.` 
    : "";

  const prompt = `You are a professional healthcare content writer for Pillar Drug Club, a prescription medication platform offering wholesale pricing directly to consumers.

Write a comprehensive, SEO-optimized blog post on the following topic: "${topic}"

Category: ${category}
Context: ${categoryContext[category]}
Tone: ${tone}
Length: ${lengthGuidance[targetLength]}
${keywordsText}

Requirements:
1. Write an engaging, informative article that provides real value to readers
2. Use clear, accessible language that non-medical professionals can understand
3. Include specific examples, statistics, or data points where appropriate
4. Structure with clear headings (H2, H3) for readability
5. Include actionable takeaways or tips
6. Ensure medical accuracy and cite credible sources when making claims
7. Naturally incorporate SEO keywords without keyword stuffing
8. End with a brief conclusion that ties back to Pillar Drug Club's mission of affordable healthcare

Format the response as a JSON object with:
{
  "title": "Compelling, SEO-friendly title (under 60 characters)",
  "excerpt": "Brief 2-3 sentence summary (under 160 characters for meta description)",
  "content": "Full article content in markdown format with headings",
  "seoTitle": "Optimized title for search engines (under 60 characters)",
  "seoDescription": "Meta description optimized for click-through (under 160 characters)",
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3"],
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert healthcare content writer specializing in pharmacy, medications, and healthcare cost savings. You write accurate, engaging, SEO-optimized content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 3000
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(responseText);
    
    return {
      title: result.title,
      excerpt: result.excerpt,
      content: result.content,
      seoTitle: result.seoTitle || result.title,
      seoDescription: result.seoDescription || result.excerpt,
      seoKeywords: result.suggestedKeywords || [],
      tags: result.suggestedTags || [],
      category,
      aiGenerated: true,
      generationPrompt: topic
    };
  } catch (error) {
    console.error("Error generating blog post:", error);
    throw new Error("Failed to generate blog post. Please try again.");
  }
}

export async function improveBlogPost(content: string, instructions: string) {
  const prompt = `You are editing a blog post for Pillar Drug Club. Here's the current content:

${content}

Please improve it based on these instructions: ${instructions}

Return the improved content in markdown format.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert editor for healthcare content. Improve the content while maintaining accuracy and readability."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    });

    return completion.choices[0].message.content || content;
  } catch (error) {
    console.error("Error improving blog post:", error);
    throw new Error("Failed to improve blog post. Please try again.");
  }
}

export async function generateSEOMetadata(title: string, content: string) {
  const prompt = `Given this blog post title and content, generate optimal SEO metadata:

Title: ${title}
Content: ${content.substring(0, 1000)}...

Generate:
1. SEO-optimized title (max 60 characters)
2. Meta description (max 160 characters)
3. 5-7 relevant keywords
4. 3-5 content tags

Return as JSON: { "seoTitle": "", "seoDescription": "", "keywords": [], "tags": [] }`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert specializing in healthcare content optimization."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
      max_tokens: 500
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error generating SEO metadata:", error);
    throw new Error("Failed to generate SEO metadata.");
  }
}
