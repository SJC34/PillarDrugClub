import mailchimp from "@mailchimp/mailchimp_marketing";

// Initialize Mailchimp client
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY || "",
  server: process.env.MAILCHIMP_SERVER_PREFIX || "", // e.g., "us1", "us2", etc.
});

export interface MailchimpMember {
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier?: string;
  status?: "subscribed" | "unsubscribed" | "pending";
  tags?: string[];
  mergeFields?: {
    FNAME?: string;
    LNAME?: string;
    TIER?: string;
    [key: string]: any;
  };
}

/**
 * Add or update a member in the Mailchimp list
 */
export async function syncMemberToMailchimp(member: MailchimpMember): Promise<void> {
  try {
    const listId = process.env.MAILCHIMP_AUDIENCE_ID || "";
    if (!listId) {
      throw new Error("MAILCHIMP_AUDIENCE_ID not configured");
    }

    const mergeFields: any = {
      FNAME: member.firstName || "",
      LNAME: member.lastName || "",
      ...(member.subscriptionTier && { TIER: member.subscriptionTier }),
      ...member.mergeFields
    };

    await mailchimp.lists.setListMember(listId, member.email, {
      email_address: member.email,
      status_if_new: member.status || "subscribed",
      merge_fields: mergeFields,
      ...(member.tags && member.tags.length > 0 && {
        tags: member.tags.map(tag => ({ name: tag, status: "active" }))
      })
    });

    console.log(`✅ Synced ${member.email} to Mailchimp`);
  } catch (error: any) {
    console.error("Error syncing to Mailchimp:", error);
    throw new Error(`Mailchimp sync failed: ${error.message}`);
  }
}

/**
 * Bulk sync multiple members
 */
export async function bulkSyncMembers(members: MailchimpMember[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const member of members) {
    try {
      await syncMemberToMailchimp(member);
      success++;
    } catch (error) {
      console.error(`Failed to sync ${member.email}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Create an automated email campaign
 */
export async function createCampaign(options: {
  subject: string;
  previewText: string;
  htmlContent: string;
  fromName?: string;
  replyTo?: string;
  segmentConditions?: any;
}): Promise<{ id: string; webUrl: string }> {
  try {
    const listId = process.env.MAILCHIMP_AUDIENCE_ID || "";
    if (!listId) {
      throw new Error("MAILCHIMP_AUDIENCE_ID not configured");
    }

    // Create campaign
    const campaign = await mailchimp.campaigns.create({
      type: "regular",
      recipients: {
        list_id: listId,
        ...(options.segmentConditions && { segment_opts: options.segmentConditions })
      },
      settings: {
        subject_line: options.subject,
        preview_text: options.previewText,
        title: options.subject,
        from_name: options.fromName || "Pillar Drug Club",
        reply_to: options.replyTo || "seth@pillardrugclub.com",
      }
    });

    // Set campaign content
    await mailchimp.campaigns.setContent(campaign.id, {
      html: options.htmlContent
    });

    return {
      id: campaign.id,
      webUrl: campaign.archive_url || ""
    };
  } catch (error: any) {
    console.error("Error creating Mailchimp campaign:", error);
    throw new Error(`Campaign creation failed: ${error.message}`);
  }
}

/**
 * Send a campaign immediately
 */
export async function sendCampaign(campaignId: string): Promise<void> {
  try {
    await mailchimp.campaigns.send(campaignId);
    console.log(`✅ Campaign ${campaignId} sent successfully`);
  } catch (error: any) {
    console.error("Error sending campaign:", error);
    throw new Error(`Campaign send failed: ${error.message}`);
  }
}

/**
 * Schedule a campaign for later
 */
export async function scheduleCampaign(campaignId: string, scheduleTime: Date): Promise<void> {
  try {
    await mailchimp.campaigns.schedule(campaignId, {
      schedule_time: scheduleTime.toISOString()
    });
    console.log(`✅ Campaign ${campaignId} scheduled for ${scheduleTime}`);
  } catch (error: any) {
    console.error("Error scheduling campaign:", error);
    throw new Error(`Campaign schedule failed: ${error.message}`);
  }
}

/**
 * Add tags to a member
 */
export async function addTagsToMember(email: string, tags: string[]): Promise<void> {
  try {
    const listId = process.env.MAILCHIMP_AUDIENCE_ID || "";
    if (!listId) {
      throw new Error("MAILCHIMP_AUDIENCE_ID not configured");
    }

    await mailchimp.lists.updateListMemberTags(listId, email, {
      tags: tags.map(tag => ({ name: tag, status: "active" }))
    });

    console.log(`✅ Added tags to ${email}: ${tags.join(", ")}`);
  } catch (error: any) {
    console.error("Error adding tags:", error);
    throw new Error(`Tag addition failed: ${error.message}`);
  }
}

/**
 * Check if Mailchimp is configured
 */
export function isMailchimpConfigured(): boolean {
  return !!(
    process.env.MAILCHIMP_API_KEY &&
    process.env.MAILCHIMP_SERVER_PREFIX &&
    process.env.MAILCHIMP_AUDIENCE_ID
  );
}

/**
 * Verify Mailchimp credentials
 */
export async function verifyMailchimpCredentials(): Promise<{ accountName: string; email: string }> {
  try {
    const response = await mailchimp.ping.get();
    
    return {
      accountName: response.account_name || "Unknown",
      email: response.account_email || "Unknown"
    };
  } catch (error: any) {
    console.error("Error verifying Mailchimp credentials:", error);
    throw new Error(`Mailchimp auth failed: ${error.message}`);
  }
}

/**
 * Get list info
 */
export async function getListInfo(): Promise<any> {
  try {
    const listId = process.env.MAILCHIMP_AUDIENCE_ID || "";
    if (!listId) {
      throw new Error("MAILCHIMP_AUDIENCE_ID not configured");
    }

    const list = await mailchimp.lists.getList(listId);
    
    return {
      name: list.name,
      memberCount: list.stats.member_count,
      unsubscribeCount: list.stats.unsubscribe_count,
      openRate: list.stats.open_rate,
      clickRate: list.stats.click_rate
    };
  } catch (error: any) {
    console.error("Error fetching list info:", error);
    throw new Error(`List fetch failed: ${error.message}`);
  }
}
