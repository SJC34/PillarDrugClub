import Snoowrap from "snoowrap";

// Initialize Reddit client
let redditClient: Snoowrap | null = null;

function getRedditClient(): Snoowrap {
  if (!redditClient) {
    redditClient = new Snoowrap({
      userAgent: process.env.REDDIT_USER_AGENT || "PillarDrugClub/1.0",
      clientId: process.env.REDDIT_CLIENT_ID || "",
      clientSecret: process.env.REDDIT_CLIENT_SECRET || "",
      username: process.env.REDDIT_USERNAME || "",
      password: process.env.REDDIT_PASSWORD || "",
    });
  }
  return redditClient;
}

export interface RedditPost {
  title: string;
  body: string; // Markdown or plain text
  subreddit: string; // Without r/ prefix
  flairId?: string; // Optional post flair
}

/**
 * Submit a text post to Reddit
 */
export async function postToReddit(post: RedditPost): Promise<{ id: string; url: string }> {
  try {
    const reddit = getRedditClient();
    
    const submission = await reddit.submitSelfpost({
      subredditName: post.subreddit,
      title: post.title,
      text: post.body,
      ...(post.flairId && { flairId: post.flairId }),
      sendReplies: true, // Get notifications for replies
    });

    return {
      id: submission.id,
      url: `https://reddit.com${submission.permalink}`
    };
  } catch (error: any) {
    console.error("Error posting to Reddit:", error);
    throw new Error(`Failed to post to Reddit: ${error.message}`);
  }
}

/**
 * Check if Reddit API credentials are configured
 */
export function isRedditConfigured(): boolean {
  return !!(
    process.env.REDDIT_CLIENT_ID &&
    process.env.REDDIT_CLIENT_SECRET &&
    process.env.REDDIT_USERNAME &&
    process.env.REDDIT_PASSWORD
  );
}

/**
 * Verify Reddit credentials and get account info
 */
export async function verifyRedditCredentials(): Promise<{ username: string; karma: number }> {
  try {
    const reddit = getRedditClient();
    const me = await reddit.getMe();
    
    return {
      username: me.name,
      karma: me.link_karma + me.comment_karma
    };
  } catch (error: any) {
    console.error("Error verifying Reddit credentials:", error);
    throw new Error(`Reddit auth failed: ${error.message}`);
  }
}

/**
 * Get subreddit info (useful for checking if it exists and rules)
 */
export async function getSubredditInfo(subredditName: string): Promise<any> {
  try {
    const reddit = getRedditClient();
    const subreddit = await reddit.getSubreddit(subredditName).fetch();
    
    return {
      name: subreddit.display_name,
      subscribers: subreddit.subscribers,
      description: subreddit.public_description,
      allowsTextPosts: !subreddit.submission_type || subreddit.submission_type === "any" || subreddit.submission_type === "self"
    };
  } catch (error: any) {
    console.error(`Error fetching subreddit ${subredditName}:`, error);
    throw new Error(`Failed to fetch subreddit: ${error.message}`);
  }
}
