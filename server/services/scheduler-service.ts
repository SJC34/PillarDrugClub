import cron from "node-cron";
import { db } from "../db";
import { contentQueue, blogPosts } from "@shared/schema";
import { eq, and, lte } from "drizzle-orm";

/**
 * Process pending content in the queue
 * Checks for content scheduled to be posted now or in the past
 */
export async function processContentQueue(): Promise<void> {
  try {
    const now = new Date();
    
    // Get pending content scheduled for now or earlier
    const pendingContent = await db.query.contentQueue.findMany({
      where: and(
        eq(contentQueue.status, "pending"),
        lte(contentQueue.scheduledFor, now)
      ),
      orderBy: contentQueue.scheduledFor,
      limit: 10 // Process 10 at a time
    });

    console.log(`📋 Processing ${pendingContent.length} scheduled content items`);

    for (const item of pendingContent) {
      try {
        // Mark as processing
        await db.update(contentQueue)
          .set({ status: "processing" })
          .where(eq(contentQueue.id, item.id));

        let publishedUrl = "";
        let platformPostId = "";

        // Route to appropriate platform
        switch (item.contentType) {
          case "blog":
            if (item.blogContent) {
              const blogData = item.blogContent as any;
              const [newBlog] = await db.insert(blogPosts).values({
                title: blogData.title,
                content: blogData.content,
                excerpt: blogData.excerpt,
                seoTitle: blogData.seoTitle,
                seoDescription: blogData.seoDescription,
                seoKeywords: blogData.seoKeywords || [],
                tags: blogData.tags || [],
                featuredImage: null,
                status: "published",
                author: "Seth Collins, Pharm.D.",
                category: "healthcare-savings"
              }).returning();

              publishedUrl = `/blog/${newBlog.id}`;
              platformPostId = newBlog.id;
            }
            break;

          case "x_thread":
            if (item.xThreadContent) {
              const { isTwitterConfigured, postThread } = await import("./twitter-service");
              if (!isTwitterConfigured()) {
                throw new Error("Twitter API credentials not configured");
              }
              const threadData = item.xThreadContent as any;
              const result = await postThread({ tweets: threadData.tweets });
              publishedUrl = result.url;
              platformPostId = result.tweetIds[0];
            }
            break;

          case "x_tip":
            if (item.xTipContent) {
              const { isTwitterConfigured, postTweet } = await import("./twitter-service");
              if (!isTwitterConfigured()) {
                throw new Error("Twitter API credentials not configured");
              }
              const tipData = item.xTipContent as any;
              const result = await postTweet(tipData.text);
              publishedUrl = result.url;
              platformPostId = result.id;
            }
            break;

          case "x_poll":
            if (item.xPollContent) {
              const { isTwitterConfigured, postPoll } = await import("./twitter-service");
              if (!isTwitterConfigured()) {
                throw new Error("Twitter API credentials not configured");
              }
              const pollData = item.xPollContent as any;
              const result = await postPoll({
                question: pollData.question,
                options: pollData.options
              });
              publishedUrl = result.url;
              platformPostId = result.id;
            }
            break;

          case "reddit_post":
            if (item.redditContent) {
              const { isRedditConfigured, postToReddit } = await import("./reddit-service");
              if (!isRedditConfigured()) {
                throw new Error("Reddit API credentials not configured");
              }
              const redditData = item.redditContent as any;
              const result = await postToReddit({
                title: redditData.title,
                body: redditData.body,
                subreddit: redditData.subreddit
              });
              publishedUrl = result.url;
              platformPostId = result.id;
            }
            break;

          case "youtube_short":
            // YouTube posting will be implemented in Phase 3
            console.log("YouTube Shorts posting not yet implemented");
            break;
        }

        // Mark as published
        await db.update(contentQueue)
          .set({
            status: "published",
            publishedAt: new Date(),
            publishedUrl,
            platformPostId
          })
          .where(eq(contentQueue.id, item.id));

        console.log(`✅ Published ${item.contentType}: ${publishedUrl}`);

      } catch (error: any) {
        console.error(`❌ Failed to publish content ${item.id}:`, error);
        
        // Mark as failed with error message
        await db.update(contentQueue)
          .set({
            status: "failed",
            errorMessage: error.message,
            retryCount: (item.retryCount || 0) + 1
          })
          .where(eq(contentQueue.id, item.id));
      }
    }
  } catch (error) {
    console.error("Error processing content queue:", error);
  }
}

/**
 * Initialize all scheduled cron jobs
 * Gracefully handles missing API credentials for individual channels
 */
export async function initializeScheduler(): Promise<void> {
  console.log("🕐 Initializing content scheduler...");

  // Check which services are configured
  const serviceStatus = {
    twitter: false,
    reddit: false,
    mailchimp: false
  };

  try {
    const { isTwitterConfigured } = await import("./twitter-service");
    serviceStatus.twitter = isTwitterConfigured();
  } catch (error) {
    console.warn("⚠️ Twitter service check failed:", error);
  }

  try {
    const { isRedditConfigured } = await import("./reddit-service");
    serviceStatus.reddit = isRedditConfigured();
  } catch (error) {
    console.warn("⚠️ Reddit service check failed:", error);
  }

  try {
    const { isMailchimpConfigured } = await import("./mailchimp-service");
    serviceStatus.mailchimp = isMailchimpConfigured();
  } catch (error) {
    console.warn("⚠️ Mailchimp service check failed:", error);
  }

  // Log service availability
  console.log("📊 Service Status:");
  console.log(`   ✏️  Blog: ✅ Always available`);
  console.log(`   🐦 Twitter: ${serviceStatus.twitter ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`   📰 Reddit: ${serviceStatus.reddit ? '✅ Configured' : '⚠️  Not configured'}`);
  console.log(`   📧 Mailchimp: ${serviceStatus.mailchimp ? '✅ Configured' : '⚠️  Not configured'}`);

  // Process content queue every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("⏰ Running scheduled content processor");
    try {
      await processContentQueue();
    } catch (error) {
      console.error("❌ Content processor error:", error);
    }
  });

  // Daily blog post generation - 8:00 AM EST
  cron.schedule("0 8 * * *", async () => {
    console.log("📝 Daily blog generation triggered (8am)");
    // This will be triggered by the admin UI or content calendar
  });

  // X/Twitter thread - 12:00 PM EST (peak engagement)
  cron.schedule("0 12 * * *", async () => {
    if (serviceStatus.twitter) {
      console.log("🐦 Daily X thread triggered (12pm)");
    } else {
      console.log("⚠️ Skipping X thread - credentials not configured");
    }
  });

  // X/Twitter poll - 6:00 PM EST (evening engagement)
  cron.schedule("0 18 * * *", async () => {
    if (serviceStatus.twitter) {
      console.log("📊 Daily X poll triggered (6pm)");
    } else {
      console.log("⚠️ Skipping X poll - credentials not configured");
    }
  });

  // Reddit post - Monday & Thursday 10:00 AM EST
  cron.schedule("0 10 * * 1,4", async () => {
    if (serviceStatus.reddit) {
      console.log("📰 Bi-weekly Reddit post triggered");
    } else {
      console.log("⚠️ Skipping Reddit post - credentials not configured");
    }
  });

  console.log("✅ Scheduler initialized with 5 cron jobs");
}

/**
 * Stop all scheduled jobs (for graceful shutdown)
 */
export function stopScheduler(): void {
  cron.getTasks().forEach(task => task.stop());
  console.log("⏹️ All scheduled jobs stopped");
}
