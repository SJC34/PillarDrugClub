import { TwitterApi, TwitterApiReadWrite } from "twitter-api-v2";

// Lazy initialization of Twitter client
let twitterClient: TwitterApi | null = null;
let rwClient: TwitterApiReadWrite | null = null;

function getTwitterClient() {
  if (!isTwitterConfigured()) {
    throw new Error("Twitter API credentials not configured");
  }
  
  if (!twitterClient) {
    twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    });
    rwClient = twitterClient.readWrite;
  }
  
  return rwClient!;
}

export interface TweetThread {
  tweets: string[];
}

export interface TweetPoll {
  question: string;
  options: string[];
  durationMinutes?: number; // Default: 1440 (24 hours)
}

/**
 * Post a single tweet
 */
export async function postTweet(text: string): Promise<{ id: string; url: string }> {
  try {
    const client = getTwitterClient();
    const tweet = await client.v2.tweet(text);
    
    return {
      id: tweet.data.id,
      url: `https://twitter.com/i/web/status/${tweet.data.id}`
    };
  } catch (error: any) {
    console.error("Error posting tweet:", error);
    throw new Error(`Failed to post tweet: ${error.message}`);
  }
}

/**
 * Post a tweet thread
 * Automatically chains tweets in reply to each other
 */
export async function postThread(thread: TweetThread): Promise<{ tweetIds: string[]; url: string }> {
  try {
    const client = getTwitterClient();
    const tweetIds: string[] = [];
    let previousTweetId: string | undefined;

    for (const tweetText of thread.tweets) {
      const tweet = previousTweetId
        ? await client.v2.reply(tweetText, previousTweetId)
        : await client.v2.tweet(tweetText);

      tweetIds.push(tweet.data.id);
      previousTweetId = tweet.data.id;
    }

    // Return URL of first tweet (thread starter)
    return {
      tweetIds,
      url: `https://twitter.com/i/web/status/${tweetIds[0]}`
    };
  } catch (error: any) {
    console.error("Error posting thread:", error);
    throw new Error(`Failed to post thread: ${error.message}`);
  }
}

/**
 * Post a poll tweet
 */
export async function postPoll(poll: TweetPoll): Promise<{ id: string; url: string }> {
  try {
    const client = getTwitterClient();
    const tweet = await client.v2.tweet({
      text: poll.question,
      poll: {
        options: poll.options,
        duration_minutes: poll.durationMinutes || 1440, // 24 hours default
      },
    });

    return {
      id: tweet.data.id,
      url: `https://twitter.com/i/web/status/${tweet.data.id}`
    };
  } catch (error: any) {
    console.error("Error posting poll:", error);
    throw new Error(`Failed to post poll: ${error.message}`);
  }
}

/**
 * Check if Twitter API credentials are configured
 */
export function isTwitterConfigured(): boolean {
  return !!(
    process.env.TWITTER_API_KEY &&
    process.env.TWITTER_API_SECRET &&
    process.env.TWITTER_ACCESS_TOKEN &&
    process.env.TWITTER_ACCESS_TOKEN_SECRET
  );
}

/**
 * Get account info to verify credentials
 */
export async function verifyCredentials(): Promise<{ username: string; name: string }> {
  try {
    const client = getTwitterClient();
    const me = await client.v2.me();
    return {
      username: me.data.username,
      name: me.data.name
    };
  } catch (error: any) {
    console.error("Error verifying Twitter credentials:", error);
    throw new Error(`Twitter auth failed: ${error.message}`);
  }
}
