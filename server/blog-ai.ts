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
  writingStyle?: string; // Style of famous writers (e.g., "hemingway", "gladwell", etc.)
}

// Legendary Writing Styles Library
export const writingStyles = {
  hemingway: {
    name: "Ernest Hemingway",
    description: "Short, declarative sentences. Sparse prose. No wasted words. Active voice. Concrete nouns and verbs.",
    prompt: "Write in Ernest Hemingway's distinctive style: use short, declarative sentences with minimal adjectives. Be direct and economical with words. Use active voice and concrete language. Avoid flowery descriptions."
  },
  gladwell: {
    name: "Malcolm Gladwell",
    description: "Narrative storytelling. Surprising insights. Compelling anecdotes. Research-backed conclusions. Accessible science.",
    prompt: "Write in Malcolm Gladwell's style: start with a surprising anecdote or counterintuitive insight. Weave together stories with research. Make complex ideas accessible through real-world examples. Build to an 'aha!' moment."
  },
  godin: {
    name: "Seth Godin",
    description: "Short paragraphs. Bold ideas. Direct address. Provocative questions. Challenge assumptions.",
    prompt: "Write in Seth Godin's style: use short, punchy paragraphs. Challenge conventional thinking. Ask provocative questions. Address the reader directly. Make bold statements that shift perspective."
  },
  ferriss: {
    name: "Tim Ferriss",
    description: "Tactical advice. Step-by-step frameworks. Data-driven. Personal experiments. Actionable takeaways.",
    prompt: "Write in Tim Ferriss's style: provide tactical, actionable advice with specific frameworks. Include data and personal experiments. Use numbered lists and clear step-by-step processes. Focus on optimization and efficiency."
  },
  keller: {
    name: "Gary Keller",
    description: "Focus on ONE thing. Simple frameworks. Question-based insights. Practical wisdom.",
    prompt: "Write in Gary Keller's style: focus on the ONE most important insight. Use simple, powerful frameworks. Ask focusing questions. Provide practical wisdom that cuts through complexity."
  },
  newport: {
    name: "Cal Newport",
    description: "Deep research. Clear arguments. Case studies. Evidence-based. Thoughtful analysis.",
    prompt: "Write in Cal Newport's style: build arguments with deep research and evidence. Use case studies and real examples. Analyze thoughtfully without hype. Focus on sustainable, evidence-backed strategies."
  },
  holiday: {
    name: "Ryan Holiday",
    description: "Stoic wisdom. Historical examples. Timeless principles. Short chapters. Modern applications.",
    prompt: "Write in Ryan Holiday's style: draw on historical examples and timeless wisdom. Connect ancient philosophy to modern challenges. Use compelling stories from history. Keep prose clear and impactful."
  },
  brown: {
    name: "Brené Brown",
    description: "Vulnerable storytelling. Research insights. Empathetic tone. Personal connection. Authentic voice.",
    prompt: "Write in Brené Brown's style: combine personal vulnerability with research insights. Use warm, empathetic language. Connect emotionally with readers. Share authentic experiences alongside academic findings."
  },
  clear: {
    name: "James Clear",
    description: "Systems over goals. Small habits. Scientific backing. Real examples. Progressive frameworks.",
    prompt: "Write in James Clear's style: focus on systems and small, incremental improvements. Back claims with science. Use the '1% better' philosophy. Provide actionable frameworks with real-world examples."
  },
  default: {
    name: "Professional Healthcare Writer",
    description: "Balanced, authoritative, accessible. Clear structure. Evidence-based. Patient-focused.",
    prompt: "Write in a professional yet accessible healthcare writing style. Balance authority with warmth. Use clear structure and evidence-based information. Focus on helping patients make informed decisions."
  }
};

export async function generateBlogPost(options: BlogGenerationOptions) {
  const {
    topic,
    category,
    tone = "professional",
    keywords = [],
    targetLength = "medium",
    writingStyle = "default"
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

  const selectedStyle = writingStyles[writingStyle as keyof typeof writingStyles] || writingStyles.default;
  const styleInstruction = writingStyle !== "default" 
    ? `\n\nWRITING STYLE:\n${selectedStyle.prompt}\n`
    : "";

  const prompt = `You are a professional healthcare content writer for Pillar Drug Club, a prescription medication platform offering wholesale pricing directly to consumers.

Write a comprehensive, SEO-optimized blog post on the following topic: "${topic}"

Category: ${category}
Context: ${categoryContext[category]}
Tone: ${tone}
Length: ${lengthGuidance[targetLength]}
${keywordsText}${styleInstruction}

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

export async function generateSEOKeywords(title: string): Promise<string[]> {
  const prompt = `You are an SEO expert specializing in healthcare and pharmacy content.

Given this blog post title: "${title}"

Generate 8-12 high-value SEO keywords that would help this article rank well in search engines.

Requirements:
1. Include a mix of:
   - Primary keywords (2-3 words, high search volume)
   - Long-tail keywords (3-5 words, specific)
   - Related terms and synonyms
2. Focus on healthcare, medication, and pharmacy terms
3. Consider user search intent (informational, commercial, navigational)
4. Avoid keyword stuffing - only relevant, natural terms
5. Include semantic variations

Return ONLY a JSON array of keywords, like: ["keyword1", "keyword2", "keyword3"]`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an SEO expert who generates high-value, relevant keywords for healthcare and pharmacy content."
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

    const result = JSON.parse(responseText);
    
    // Handle different possible response formats
    if (Array.isArray(result)) {
      return result;
    } else if (result.keywords && Array.isArray(result.keywords)) {
      return result.keywords;
    } else if (result.seoKeywords && Array.isArray(result.seoKeywords)) {
      return result.seoKeywords;
    } else {
      // If we got an object with values, try to extract them
      const values = Object.values(result);
      if (values.length > 0 && Array.isArray(values[0])) {
        return values[0] as string[];
      }
      throw new Error("Unexpected response format from OpenAI");
    }
  } catch (error) {
    console.error("Error generating SEO keywords:", error);
    throw new Error("Failed to generate SEO keywords. Please try again.");
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
