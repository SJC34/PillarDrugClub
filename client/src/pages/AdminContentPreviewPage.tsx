import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, FileText, Twitter, Video, MessageSquare, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import type { GeneratedContent } from "@shared/content-automation";
import ReactMarkdown from 'react-markdown';

interface AdminContentPreviewPageProps {
  content: GeneratedContent;
  topic: string;
}

export default function AdminContentPreviewPage({ content, topic }: AdminContentPreviewPageProps) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/content-automation">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Content Preview</h1>
            <p className="text-muted-foreground mt-1">Topic: {topic}</p>
          </div>
        </div>
      </div>

      {/* Tabs for each content type */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5" data-testid="tabs-content-preview">
          <TabsTrigger value="all" data-testid="tab-all">All Content</TabsTrigger>
          {content.blog && <TabsTrigger value="blog" data-testid="tab-blog"><FileText className="h-4 w-4 mr-2" />Blog</TabsTrigger>}
          {content.xThread && <TabsTrigger value="x-thread" data-testid="tab-x-thread"><Twitter className="h-4 w-4 mr-2" />X Thread</TabsTrigger>}
          {content.redditPost && <TabsTrigger value="reddit" data-testid="tab-reddit"><MessageSquare className="h-4 w-4 mr-2" />Reddit</TabsTrigger>}
          {content.videoScript && <TabsTrigger value="video" data-testid="tab-video"><Video className="h-4 w-4 mr-2" />YouTube</TabsTrigger>}
        </TabsList>

        {/* All Content Overview */}
        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Blog Post Preview */}
            {content.blog && (
              <Card data-testid="preview-blog-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Blog Post
                    </CardTitle>
                    <Badge variant="secondary">1,500+ words</Badge>
                  </div>
                  <CardDescription>{content.blog.seoTitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none line-clamp-6" data-testid="blog-excerpt">
                    <ReactMarkdown>{content.blog.content.substring(0, 500)}...</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* X Thread Preview */}
            {content.xThread && (
              <Card data-testid="preview-xthread-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Twitter className="h-5 w-5" />
                      X/Twitter Thread
                    </CardTitle>
                    <Badge variant="secondary">{content.xThread.tweets.length} tweets</Badge>
                  </div>
                  <CardDescription>Engaging thread optimized for X</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {content.xThread.tweets.slice(0, 3).map((tweet, i) => (
                      <div key={i} className="p-3 bg-muted rounded-lg text-sm" data-testid={`tweet-preview-${i}`}>
                        <span className="text-muted-foreground mr-2">{i + 1}/{content.xThread!.tweets.length}</span>
                        {tweet.substring(0, 100)}...
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reddit Post Preview */}
            {content.redditPost && (
              <Card data-testid="preview-reddit-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Reddit Post
                    </CardTitle>
                    <Badge variant="secondary">r/{content.redditPost.subreddit}</Badge>
                  </div>
                  <CardDescription>{content.redditPost.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none line-clamp-4" data-testid="reddit-body-preview">
                    <ReactMarkdown>{content.redditPost.body.substring(0, 300)}...</ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* YouTube Video Preview */}
            {content.videoScript && (
              <Card data-testid="preview-video-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      YouTube Short
                    </CardTitle>
                    <Badge variant="secondary">{content.videoScript.duration}s</Badge>
                  </div>
                  <CardDescription>
                    {content.video?.status === "completed" && content.video.url
                      ? "Video Ready"
                      : "Video Prompt Generated"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {content.video?.url && content.video.status === "completed" ? (
                    <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden max-w-xs mx-auto" data-testid="video-player">
                      <video 
                        src={content.video.url} 
                        controls 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-muted rounded-lg" data-testid="video-prompt-preview">
                        <p className="text-sm font-medium mb-2">Sora AI Prompt:</p>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {content.video?.prompt?.substring(0, 200)}...
                        </p>
                      </div>
                      {content.video?.status === "awaiting_upload" && (
                        <Badge variant="outline" className="w-full justify-center" data-testid="badge-awaiting-upload">
                          {content.video.operatorNotes || "Awaiting video upload"}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Blog Tab - Full Content */}
        {content.blog && (
          <TabsContent value="blog">
            <Card>
              <CardHeader>
                <CardTitle>{content.blog.title}</CardTitle>
                <CardDescription>{content.blog.seoDescription}</CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  {content.blog.seoKeywords.map((keyword, i) => (
                    <Badge key={i} variant="secondary" data-testid={`blog-keyword-${i}`}>{keyword}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none" data-testid="blog-full-content">
                  <ReactMarkdown>{content.blog.content}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* X Thread Tab - Full Thread */}
        {content.xThread && (
          <TabsContent value="x-thread">
            <Card>
              <CardHeader>
                <CardTitle>X/Twitter Thread</CardTitle>
                <CardDescription>{content.xThread.tweets.length} tweets ready to post</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {content.xThread.tweets.map((tweet, i) => (
                    <div key={i} className="flex gap-4 p-4 bg-muted rounded-lg" data-testid={`tweet-full-${i}`}>
                      <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{tweet}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {tweet.length}/280 characters
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Reddit Tab - Full Post */}
        {content.redditPost && (
          <TabsContent value="reddit">
            <Card>
              <CardHeader>
                <CardTitle>{content.redditPost.title}</CardTitle>
                <CardDescription>Suggested subreddit: r/{content.redditPost.subreddit}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-lg max-w-none" data-testid="reddit-full-content">
                  <ReactMarkdown>{content.redditPost.body}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* YouTube Tab - Video Details */}
        {content.videoScript && (
          <TabsContent value="video">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Player or Prompt */}
              <Card>
                <CardHeader>
                  <CardTitle>Video Preview</CardTitle>
                  <CardDescription>
                    {content.video?.status === "completed" ? "Ready to publish" : "Ready for creation"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {content.video?.url && content.video.status === "completed" ? (
                    <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden max-w-sm mx-auto" data-testid="video-player-full">
                      <video 
                        src={content.video.url} 
                        controls 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h3 className="text-sm font-semibold mb-2">Sora AI Video Prompt</h3>
                        <p className="text-sm whitespace-pre-wrap" data-testid="video-prompt-full">
                          {content.video?.prompt}
                        </p>
                      </div>
                      {content.video?.operatorNotes && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg" data-testid="video-operator-notes">
                          <p className="text-sm text-blue-900 dark:text-blue-100">{content.video.operatorNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Script Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Script Breakdown</CardTitle>
                  <CardDescription>{content.videoScript.duration} second YouTube Short</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2" data-testid="script-hook">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Hook</h4>
                        <Badge variant="secondary" className="text-xs">0-3s</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{content.videoScript.hook}</p>
                    </div>
                    
                    <div className="space-y-2" data-testid="script-problem">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Problem</h4>
                        <Badge variant="secondary" className="text-xs">3-8s</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{content.videoScript.problem}</p>
                    </div>

                    {content.videoScript.tips.map((tip, i) => (
                      <div key={i} className="space-y-2" data-testid={`script-tip-${i}`}>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Tip {i + 1}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {8 + i * 12}-{20 + i * 12}s
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{tip}</p>
                      </div>
                    ))}

                    <div className="space-y-2" data-testid="script-cta">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Call to Action</h4>
                        <Badge variant="secondary" className="text-xs">44-60s</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{content.videoScript.cta}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
