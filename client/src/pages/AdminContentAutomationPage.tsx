import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Sparkles, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Twitter,
  FileText,
  Video,
  Mail,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Send,
  Rocket,
  Zap,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import type { GeneratedContent } from "@shared/content-automation";

interface ContentQueueItem {
  id: string;
  contentType: "blog_post" | "x_thread" | "x_tip" | "x_poll" | "reddit_post" | "youtube_short";
  topic: string;
  scheduledFor: string;
  status: "pending" | "processing" | "published" | "failed";
  publishedUrl: string | null;
  platformPostId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  blogContent: any;
  xThreadContent: any;
  xTipContent: any;
  xPollContent: any;
  redditContent: any;
  youtubeContent: any;
}

interface ServiceStatus {
  blog: boolean;
  twitter: boolean;
  reddit: boolean;
  mailchimp: boolean;
  youtube: boolean;
}

export default function AdminContentAutomationPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Multi-Channel Generation State
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("healthcare_consumers");
  const [contentGoal, setContentGoal] = useState("education");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  // Manual Scheduling State
  const [selectedChannel, setSelectedChannel] = useState<string>("blog_post");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  // Fetch service status
  const { data: serviceStatus, isLoading: isLoadingStatus } = useQuery<ServiceStatus>({
    queryKey: ["/api/content-automation/status"],
  });

  // Fetch content queue
  const { data: queueResponse, isLoading: isLoadingQueue } = useQuery<{ items: ContentQueueItem[] }>({
    queryKey: ["/api/content-automation/queue"],
  });

  const queueItems = queueResponse?.items || [];

  // Generate multi-channel content
  const generateMultiChannelMutation = useMutation({
    mutationFn: async (data: { topic: string; targetAudience: string; contentGoal: string }) => {
      const response = await fetch("/api/content-automation/generate-multi-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate content");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast({
        title: "Content Generated!",
        description: "Multi-channel content created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate content",
        variant: "destructive",
      });
    },
  });

  // Schedule content mutation
  const scheduleContentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/content-automation/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to schedule content");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-automation/queue"] });
      toast({
        title: "Content Scheduled!",
        description: "Content added to queue successfully",
      });
      setTopic("");
      setGeneratedContent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule content",
        variant: "destructive",
      });
    },
  });

  // Delete queue item mutation
  const deleteQueueItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/content-automation/queue/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete item");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-automation/queue"] });
      toast({
        title: "Item Deleted",
        description: "Queue item removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  // Handle multi-channel generation
  const handleGenerateMultiChannel = () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a content topic",
        variant: "destructive",
      });
      return;
    }

    generateMultiChannelMutation.mutate({
      topic,
      targetAudience,
      contentGoal,
    });
  };

  // Handle scheduling all generated content
  const handleScheduleAllContent = () => {
    if (!generatedContent) return;

    const scheduledDateTime = scheduledDate && scheduledTime 
      ? new Date(`${scheduledDate}T${scheduledTime}`)
      : new Date();

    // Schedule blog post
    scheduleContentMutation.mutate({
      contentType: "blog_post",
      topic,
      scheduledFor: scheduledDateTime.toISOString(),
      blogContent: generatedContent.blog,
    });

    // Schedule X thread (15 minutes after blog)
    if (serviceStatus?.twitter) {
      const xThreadTime = new Date(scheduledDateTime.getTime() + 15 * 60 * 1000);
      scheduleContentMutation.mutate({
        contentType: "x_thread",
        topic,
        scheduledFor: xThreadTime.toISOString(),
        xThreadContent: generatedContent.xThread,
      });
    }

    // Schedule Reddit post (30 minutes after blog)
    if (serviceStatus?.reddit && generatedContent.redditPost) {
      const redditTime = new Date(scheduledDateTime.getTime() + 30 * 60 * 1000);
      scheduleContentMutation.mutate({
        contentType: "reddit_post",
        topic,
        scheduledFor: redditTime.toISOString(),
        redditContent: generatedContent.redditPost,
      });
    }

    // Schedule YouTube Short (1 hour after blog)
    if (serviceStatus?.youtube && generatedContent.videoScript) {
      const youtubeTime = new Date(scheduledDateTime.getTime() + 60 * 60 * 1000);
      scheduleContentMutation.mutate({
        contentType: "youtube_short",
        topic,
        scheduledFor: youtubeTime.toISOString(),
        youtubeContent: generatedContent.videoScript,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, icon: Clock, label: "Pending" },
      processing: { variant: "default" as const, icon: Zap, label: "Processing" },
      published: { variant: "default" as const, icon: CheckCircle, label: "Published" },
      failed: { variant: "destructive" as const, icon: AlertCircle, label: "Failed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getChannelIcon = (contentType: string) => {
    switch (contentType) {
      case "blog_post": return FileText;
      case "x_thread":
      case "x_tip":
      case "x_poll": return Twitter;
      case "reddit_post": return FileText;
      case "youtube_short": return Video;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-3xl font-bold">Content Automation</h1>
            </div>
            <p className="text-muted-foreground">
              Automate multi-channel content marketing across Blog, X, Reddit, and YouTube
            </p>
          </div>
          <Badge variant="default" className="gap-2">
            <Rocket className="h-4 w-4" />
            24/7 Automation
          </Badge>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-automation">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="generate" data-testid="tab-generate">
              <Sparkles className="h-4 w-4 mr-2" />
              Multi-Channel
            </TabsTrigger>
            <TabsTrigger value="queue" data-testid="tab-queue">
              <Calendar className="h-4 w-4 mr-2" />
              Content Queue
            </TabsTrigger>
            <TabsTrigger value="manual" data-testid="tab-manual">
              <Send className="h-4 w-4 mr-2" />
              Manual Post
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Service Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Service Status
                  </CardTitle>
                  <CardDescription>
                    API credentials and service availability
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isLoadingStatus ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    <>
                      <div className="flex items-center justify-between" data-testid="status-blog">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Blog</span>
                        </div>
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Always Active
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between" data-testid="status-twitter">
                        <div className="flex items-center gap-2">
                          <Twitter className="h-4 w-4" />
                          <span className="font-medium">X/Twitter</span>
                        </div>
                        {serviceStatus?.twitter ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Configured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between" data-testid="status-reddit">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="font-medium">Reddit</span>
                        </div>
                        {serviceStatus?.reddit ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Configured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between" data-testid="status-mailchimp">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span className="font-medium">Mailchimp</span>
                        </div>
                        {serviceStatus?.mailchimp ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Not Configured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between" data-testid="status-youtube">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          <span className="font-medium">YouTube</span>
                        </div>
                        {serviceStatus?.youtube ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Coming Soon
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Queue Summary
                  </CardTitle>
                  <CardDescription>
                    Content pipeline status
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pending Posts</span>
                    <span className="text-2xl font-bold" data-testid="stat-pending">
                      {queueItems.filter(item => item.status === "pending").length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Published Today</span>
                    <span className="text-2xl font-bold" data-testid="stat-published">
                      {queueItems.filter(item => 
                        item.status === "published" && 
                        new Date(item.updatedAt).toDateString() === new Date().toDateString()
                      ).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Failed Posts</span>
                    <span className="text-2xl font-bold text-destructive" data-testid="stat-failed">
                      {queueItems.filter(item => item.status === "failed").length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common automation tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setActiveTab("generate")}
                  data-testid="button-quick-generate"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Multi-Channel Content
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab("queue")}
                  data-testid="button-quick-queue"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  View Content Queue
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab("manual")}
                  data-testid="button-quick-manual"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Manual Post Now
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multi-Channel Generation Tab */}
          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Multi-Channel Content Generator
                </CardTitle>
                <CardDescription>
                  Generate coordinated content across Blog, X/Twitter, Reddit, and YouTube from a single topic
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Generation Form */}
                {!generatedContent && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Content Topic</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., How to Save Money on Diabetes Medications"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        data-testid="input-topic"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="targetAudience">Target Audience</Label>
                        <Select value={targetAudience} onValueChange={setTargetAudience}>
                          <SelectTrigger id="targetAudience" data-testid="select-audience">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="healthcare_consumers">Healthcare Consumers</SelectItem>
                            <SelectItem value="seniors">Seniors (65+)</SelectItem>
                            <SelectItem value="chronic_conditions">Chronic Condition Patients</SelectItem>
                            <SelectItem value="cost_conscious">Cost-Conscious Buyers</SelectItem>
                            <SelectItem value="general">General Public</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contentGoal">Content Goal</Label>
                        <Select value={contentGoal} onValueChange={setContentGoal}>
                          <SelectTrigger id="contentGoal" data-testid="select-goal">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="education">Education</SelectItem>
                            <SelectItem value="awareness">Awareness</SelectItem>
                            <SelectItem value="conversion">Conversion/Sign-up</SelectItem>
                            <SelectItem value="engagement">Community Engagement</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      onClick={handleGenerateMultiChannel}
                      disabled={generateMultiChannelMutation.isPending}
                      className="w-full"
                      data-testid="button-generate"
                    >
                      {generateMultiChannelMutation.isPending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Generating Content...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Multi-Channel Content
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Generated Content Preview */}
                {generatedContent && generatedContent.blog && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Generated Content</h3>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setGeneratedContent(null);
                          setTopic("");
                        }}
                        data-testid="button-reset"
                      >
                        Start Over
                      </Button>
                    </div>

                    {/* Blog Post Preview */}
                    {generatedContent.blog && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Blog Post
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">Title:</p>
                            <p className="text-sm">{generatedContent.blog.title}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Excerpt:</p>
                            <p className="text-sm text-muted-foreground line-clamp-3">
                              {generatedContent.blog.excerpt}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Content Length:</p>
                            <p className="text-sm">{generatedContent.blog.content?.length || 0} characters</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* X Thread Preview */}
                    {generatedContent.xThread && generatedContent.xThread.tweets && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Twitter className="h-4 w-4" />
                            X/Twitter Thread
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm font-medium">{generatedContent.xThread.tweets.length} tweets</p>
                          <div className="space-y-2">
                            {generatedContent.xThread.tweets.slice(0, 3).map((tweet, i) => (
                              <div key={i} className="text-sm p-2 bg-muted rounded">
                                {i + 1}. {tweet.substring(0, 100)}{tweet.length > 100 ? "..." : ""}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Reddit Post Preview */}
                    {generatedContent.redditPost && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Reddit Post
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">Title:</p>
                            <p className="text-sm">{generatedContent.redditPost.title}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Subreddit:</p>
                            <p className="text-sm">r/{generatedContent.redditPost.subreddit}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Body Length:</p>
                            <p className="text-sm">{generatedContent.redditPost.body?.length || 0} characters</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* YouTube Script Preview */}
                    {generatedContent.videoScript && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            YouTube Short Script
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">Hook:</p>
                            <p className="text-sm">{generatedContent.videoScript.hook}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Problem:</p>
                            <p className="text-sm text-muted-foreground">
                              {generatedContent.videoScript.problem}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Tips:</p>
                            <div className="space-y-1">
                              {generatedContent.videoScript.tips?.map((tip, i) => (
                                <p key={i} className="text-sm">• {tip}</p>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Duration:</p>
                            <p className="text-sm">{generatedContent.videoScript.duration} seconds</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Scheduling Options */}
                    <Card className="border-primary">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Schedule Content
                        </CardTitle>
                        <CardDescription>
                          Choose when to publish this content across all channels
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="scheduledDate">Date</Label>
                            <Input
                              id="scheduledDate"
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              data-testid="input-schedule-date"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="scheduledTime">Time</Label>
                            <Input
                              id="scheduledTime"
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              data-testid="input-schedule-time"
                            />
                          </div>
                        </div>

                        <div className="bg-muted p-4 rounded-lg space-y-2">
                          <p className="text-sm font-medium">Publishing Schedule:</p>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Blog Post: {scheduledDate && scheduledTime ? `${scheduledDate} at ${scheduledTime}` : "Immediately"}</li>
                            <li>• X Thread: 15 minutes after blog</li>
                            <li>• Reddit Post: 30 minutes after blog</li>
                            <li>• YouTube Short: 1 hour after blog</li>
                          </ul>
                        </div>

                        <Button
                          onClick={handleScheduleAllContent}
                          disabled={scheduleContentMutation.isPending}
                          className="w-full"
                          data-testid="button-schedule-all"
                        >
                          {scheduleContentMutation.isPending ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Scheduling...
                            </>
                          ) : (
                            <>
                              <Rocket className="h-4 w-4 mr-2" />
                              Schedule All Content
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Queue Tab */}
          <TabsContent value="queue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Content Queue
                </CardTitle>
                <CardDescription>
                  Manage scheduled and published content across all channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingQueue ? (
                  <p className="text-center text-muted-foreground py-8">Loading queue...</p>
                ) : queueItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Content Scheduled</h3>
                    <p className="text-muted-foreground mb-4">
                      Generate multi-channel content to get started
                    </p>
                    <Button onClick={() => setActiveTab("generate")} data-testid="button-generate-from-queue">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Content
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queueItems.map((item) => {
                      const Icon = getChannelIcon(item.contentType);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover-elevate"
                          data-testid={`queue-item-${item.id}`}
                        >
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.topic}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="capitalize">{item.contentType.replace(/_/g, " ")}</span>
                              <span>•</span>
                              <span>
                                {item.status === "published" 
                                  ? `Published ${formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}`
                                  : `Scheduled for ${new Date(item.scheduledFor).toLocaleString()}`
                                }
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(item.status)}
                            {item.status !== "published" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteQueueItemMutation.mutate(item.id)}
                                disabled={deleteQueueItemMutation.isPending}
                                data-testid={`button-delete-${item.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Post Tab */}
          <TabsContent value="manual" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Manual Post
                </CardTitle>
                <CardDescription>
                  Schedule a single post to a specific channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Manual Posting</h3>
                  <p className="text-muted-foreground mb-4">
                    Individual channel posting will be available soon. For now, use the Multi-Channel Generator to create coordinated content.
                  </p>
                  <Button onClick={() => setActiveTab("generate")} data-testid="button-use-multi-channel">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Use Multi-Channel Generator
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
