import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { 
  PenTool, 
  Sparkles, 
  Save, 
  Eye, 
  Trash2, 
  Calendar, 
  User, 
  Tag,
  ArrowLeft,
  Plus,
  Edit,
  CheckCircle,
  Clock,
  Upload,
  X,
  Image as ImageIcon
} from "lucide-react";
import { Link } from "wouter";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  status: "draft" | "published";
  metaDescription: string | null;
  metaKeywords: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
}

interface GeneratedContent {
  title: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  tags: string[];
}

export default function AdminBlogPage() {
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "generate" | "edit" | "medical-review">("list");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Blog Type Selection
  const [blogType, setBlogType] = useState<"general" | "medical">("general");

  // AI Generation Form State (General)
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("professional");
  const [keywords, setKeywords] = useState("");
  const [targetLength, setTargetLength] = useState("medium");
  const [writingStyle, setWritingStyle] = useState("default");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isGeneratingKeywords, setIsGeneratingKeywords] = useState(false);

  // Medical RAG State
  const [medicalTopic, setMedicalTopic] = useState("");
  const [minCitations, setMinCitations] = useState(5);
  const [medicalJobId, setMedicalJobId] = useState<string | null>(null);
  const [medicalJobStatus, setMedicalJobStatus] = useState<any>(null);
  const [pollingInterval, setPollingInterval] = useState<any>(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editMetaDescription, setEditMetaDescription] = useState("");
  const [editMetaKeywords, setEditMetaKeywords] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "published">("draft");
  const [editFeaturedImage, setEditFeaturedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch all blog posts
  const { data: postsResponse, isLoading: isLoadingPosts } = useQuery<{ posts: BlogPost[], total: number }>({
    queryKey: ["/api/blog/posts"],
  });
  
  const posts = postsResponse?.posts || [];

  // Generate blog post with AI
  const generateMutation = useMutation({
    mutationFn: async (data: {
      topic: string;
      category: string;
      tone?: string;
      keywords?: string[];
      targetLength?: string;
    }) => {
      const response = await fetch("/api/blog/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate content");
      }
      return response.json() as Promise<GeneratedContent>;
    },
    onSuccess: (data: GeneratedContent) => {
      setGeneratedContent(data);
      setEditTitle(data.seoTitle || data.title);
      setEditContent(data.content);
      setEditExcerpt(data.excerpt);
      setEditMetaDescription(data.seoDescription || data.excerpt);
      setEditMetaKeywords(data.seoKeywords.join(", "));
      setEditTags(data.tags.join(", "));
      setEditCategory(category);
      toast({
        title: "Content Generated!",
        description: "AI has created your blog post. Review and customize before publishing.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate blog post content",
        variant: "destructive",
      });
    },
  });

  // Save blog post (create or update)
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = selectedPost ? `/api/blog/posts/${selectedPost.id}` : "/api/blog/posts";
      const method = selectedPost ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      toast({
        title: selectedPost ? "Post Updated" : "Post Created",
        description: "Blog post saved successfully",
      });
      resetForm();
      setView("list");
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save blog post",
        variant: "destructive",
      });
    },
  });

  // Delete blog post
  const deleteMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      toast({
        title: "Post Deleted",
        description: "Blog post removed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete blog post",
        variant: "destructive",
      });
    },
  });

  // Medical RAG: Start generation
  const medicalGenerateMutation = useMutation({
    mutationFn: async (data: { topic: string; min_citations: number }) => {
      const response = await fetch("http://localhost:8001/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to start generation");
      }
      return response.json();
    },
    onSuccess: (data: { job_id: string; status: string }) => {
      setMedicalJobId(data.job_id);
      toast({
        title: "Medical Content Generation Started",
        description: "Generating FDA-compliant content. This may take 1-2 minutes...",
      });
      // Start polling for job status
      startJobPolling(data.job_id);
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to start medical content generation",
        variant: "destructive",
      });
    },
  });

  // Poll for medical job status
  const startJobPolling = (jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8001/api/generate/jobs/${jobId}`);
        if (!response.ok) {
          clearInterval(interval);
          return;
        }
        const status = await response.json();
        setMedicalJobStatus(status);
        
        if (status.status === "completed" || status.status === "failed") {
          clearInterval(interval);
          setPollingInterval(null);
          
          if (status.status === "completed") {
            toast({
              title: "Medical Content Generated!",
              description: "Review compliance report before publishing",
            });
            setView("medical-review");
          } else {
            toast({
              title: "Generation Failed",
              description: status.error_message || "Medical content generation failed",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds
    
    setPollingInterval(interval);
  };

  const handleGenerate = () => {
    if (blogType === "general") {
      if (!topic || !category) {
        toast({
          title: "Missing Information",
          description: "Please provide a topic and category",
          variant: "destructive",
        });
        return;
      }

      generateMutation.mutate({
        topic,
        category,
        tone,
        keywords: keywords ? keywords.split(",").map(k => k.trim()) : undefined,
        targetLength,
        writingStyle,
      });
    } else {
      if (!medicalTopic) {
        toast({
          title: "Missing Information",
          description: "Please provide a topic for medical content",
          variant: "destructive",
        });
        return;
      }

      medicalGenerateMutation.mutate({
        topic: medicalTopic,
        min_citations: minCitations,
      });
    }
  };

  const handleSave = (status: "draft" | "published") => {
    const postData = {
      title: editTitle,
      content: editContent,
      excerpt: editExcerpt,
      category: editCategory,
      tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
      metaDescription: editMetaDescription,
      metaKeywords: editMetaKeywords,
      status,
      featuredImage: editFeaturedImage || undefined,
    };

    saveMutation.mutate(postData);
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditExcerpt(post.excerpt || "");
    setEditCategory(post.category);
    setEditTags(post.tags.join(", "));
    setEditMetaDescription(post.metaDescription || "");
    setEditMetaKeywords(post.metaKeywords || "");
    setEditStatus(post.status);
    setEditFeaturedImage(post.featuredImage || null);
    setView("edit");
  };

  const resetForm = () => {
    setSelectedPost(null);
    setTopic("");
    setCategory("");
    setTone("professional");
    setKeywords("");
    setTargetLength("medium");
    setGeneratedContent(null);
    setEditTitle("");
    setEditContent("");
    setEditExcerpt("");
    setEditCategory("");
    setEditTags("");
    setEditMetaDescription("");
    setEditMetaKeywords("");
    setEditStatus("draft");
    setEditFeaturedImage(null);
    setIsGeneratingKeywords(false);
  };

  // Generate SEO keywords using AI
  const generateSeoKeywords = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic Required",
        description: "Please enter a blog post topic/title first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingKeywords(true);

    try {
      const response = await fetch("/api/blog/generate-seo-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: topic }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate keywords");
      }

      const data = await response.json();
      setKeywords(data.keywords.join(", "));
      
      toast({
        title: "Keywords Generated!",
        description: `${data.keywords.length} SEO keywords added`,
      });
    } catch (error: any) {
      console.error("SEO keyword generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate keywords",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingKeywords(false);
    }
  };

  // Image upload and resize handler
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image under 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Create image element
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        // Create canvas for resizing
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          toast({
            title: "Upload Failed",
            description: "Unable to process image",
            variant: "destructive",
          });
          setIsUploadingImage(false);
          return;
        }

        // Target dimensions: 1200x630 (optimal for blog cards)
        const targetWidth = 1200;
        const targetHeight = 630;

        // Calculate dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const aspectRatio = width / height;

        if (width > targetWidth || height > targetHeight) {
          if (aspectRatio > targetWidth / targetHeight) {
            width = targetWidth;
            height = targetWidth / aspectRatio;
          } else {
            height = targetHeight;
            width = targetHeight * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with quality compression
        let quality = 0.85;
        let base64Image = canvas.toDataURL("image/jpeg", quality);

        // Calculate actual byte size (base64 encoding adds ~33% overhead)
        const getBase64Size = (base64String: string) => {
          // Remove data URL prefix and calculate bytes
          const base64Data = base64String.split(',')[1] || base64String;
          return (base64Data.length * 3) / 4;
        };

        // If still too large, reduce quality
        while (getBase64Size(base64Image) > 200 * 1024 && quality > 0.5) {
          quality -= 0.05;
          base64Image = canvas.toDataURL("image/jpeg", quality);
        }

        // Final size check
        const finalSize = getBase64Size(base64Image);
        if (finalSize > 200 * 1024) {
          setIsUploadingImage(false);
          toast({
            title: "Image Too Large",
            description: `Unable to compress image below 200KB (final size: ${Math.round(finalSize / 1024)}KB). Please use a smaller or simpler image.`,
            variant: "destructive",
          });
          return;
        }

        setEditFeaturedImage(base64Image);
        setIsUploadingImage(false);

        toast({
          title: "Image Uploaded",
          description: `Image resized to ${Math.round(width)}x${Math.round(height)}px (${Math.round(finalSize / 1024)}KB)`,
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to process image",
        variant: "destructive",
      });
      setIsUploadingImage(false);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-to-admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Blog Manager</h1>
          <p className="text-muted-foreground">Generate SEO-optimized content with AI and manage your blog posts</p>
        </div>

        {/* View Switcher */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => {
              resetForm();
              setView("list");
            }}
            data-testid="button-view-list"
          >
            All Posts
          </Button>
          <Button
            variant={view === "generate" ? "default" : "outline"}
            onClick={() => {
              resetForm();
              setView("generate");
            }}
            data-testid="button-view-generate"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate New Post
          </Button>
        </div>

        {/* Blog Post List */}
        {view === "list" && (
          <Card>
            <CardHeader>
              <CardTitle>All Blog Posts</CardTitle>
              <CardDescription>Manage your published and draft content</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPosts ? (
                <p className="text-muted-foreground">Loading posts...</p>
              ) : !posts || posts.length === 0 ? (
                <div className="text-center py-12">
                  <PenTool className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No blog posts yet</p>
                  <Button onClick={() => setView("generate")} data-testid="button-create-first-post">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id} className="hover-elevate" data-testid={`card-blog-post-${post.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-foreground">{post.title}</h3>
                              <Badge variant={post.status === "published" ? "default" : "secondary"} data-testid={`badge-status-${post.id}`}>
                                {post.status === "published" ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Published
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Draft
                                  </>
                                )}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {post.category}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {post.authorName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {post.viewCount} views
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(post)}
                              data-testid={`button-edit-${post.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this post?")) {
                                  deleteMutation.mutate(post.id);
                                }
                              }}
                              data-testid={`button-delete-${post.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI Generation Form */}
        {view === "generate" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  AI Content Generator
                </CardTitle>
                <CardDescription>Choose your content type and let AI generate SEO-optimized posts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="blog-type">Blog Type *</Label>
                  <Select value={blogType} onValueChange={(value: "general" | "medical") => setBlogType(value)}>
                    <SelectTrigger id="blog-type" data-testid="select-blog-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General AI (Healthcare Content)</SelectItem>
                      <SelectItem value="medical">Medical RAG (FDA-Compliant)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {blogType === "general" 
                      ? "General healthcare topics, news, and savings tips" 
                      : "FDA-approved medication information with strict compliance"}
                  </p>
                </div>

                {blogType === "general" ? (
                  <>
                    <div>
                      <Label htmlFor="topic">Topic *</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., Top 5 Ways to Save on Prescriptions"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        data-testid="input-topic"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category" data-testid="select-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="medications">Medications</SelectItem>
                          <SelectItem value="pharmacy-news">Pharmacy News</SelectItem>
                          <SelectItem value="healthcare-savings">Healthcare Savings</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="tone">Tone</Label>
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger id="tone" data-testid="select-tone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="educational">Educational</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateSeoKeywords}
                          disabled={isGeneratingKeywords || !topic.trim()}
                          data-testid="button-generate-seo-keywords"
                          className="h-8"
                        >
                          {isGeneratingKeywords ? (
                            <>
                              <Clock className="h-3 w-3 mr-1 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3 mr-1" />
                              AI Keywords
                            </>
                          )}
                        </Button>
                      </div>
                      <Input
                        id="keywords"
                        placeholder="e.g., diabetes, metformin, blood sugar"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        data-testid="input-keywords"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter manually or click AI Keywords to generate from your topic
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="targetLength">Target Length</Label>
                      <Select value={targetLength} onValueChange={setTargetLength}>
                        <SelectTrigger id="targetLength" data-testid="select-length">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">Short (500-800 words)</SelectItem>
                          <SelectItem value="medium">Medium (800-1200 words)</SelectItem>
                          <SelectItem value="long">Long (1200-1800 words)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="writingStyle">Writing Style</Label>
                      <Select value={writingStyle} onValueChange={setWritingStyle}>
                        <SelectTrigger id="writingStyle" data-testid="select-writing-style">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Professional Healthcare Writer</SelectItem>
                          <SelectItem value="hemingway">Ernest Hemingway - Short, direct prose</SelectItem>
                          <SelectItem value="gladwell">Malcolm Gladwell - Narrative storytelling</SelectItem>
                          <SelectItem value="godin">Seth Godin - Bold, punchy ideas</SelectItem>
                          <SelectItem value="ferriss">Tim Ferriss - Tactical frameworks</SelectItem>
                          <SelectItem value="keller">Gary Keller - Focus on ONE thing</SelectItem>
                          <SelectItem value="newport">Cal Newport - Deep research</SelectItem>
                          <SelectItem value="holiday">Ryan Holiday - Stoic wisdom</SelectItem>
                          <SelectItem value="brown">Brené Brown - Vulnerable storytelling</SelectItem>
                          <SelectItem value="clear">James Clear - Small habits, systems</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Emulate the writing style of legendary authors and bloggers
                      </p>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending}
                      className="w-full"
                      data-testid="button-generate"
                    >
                      {generateMutation.isPending ? (
                        <>Generating...</>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Content
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="medical-topic">Medication Topic *</Label>
                      <Input
                        id="medical-topic"
                        placeholder="e.g., Metformin for Type 2 Diabetes"
                        value={medicalTopic}
                        onChange={(e) => setMedicalTopic(e.target.value)}
                        data-testid="input-medical-topic"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be based on FDA-approved labeling
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="min-citations">Minimum Citations</Label>
                      <Select value={minCitations.toString()} onValueChange={(val) => setMinCitations(parseInt(val))}>
                        <SelectTrigger id="min-citations" data-testid="select-min-citations">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 citations</SelectItem>
                          <SelectItem value="5">5 citations (recommended)</SelectItem>
                          <SelectItem value="7">7 citations</SelectItem>
                          <SelectItem value="10">10 citations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="border rounded-md p-3 bg-muted/30">
                      <h4 className="text-sm font-semibold mb-2">FDA Compliance Requirements:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>✓ US sources only (FDA, CDC, NIH)</li>
                        <li>✓ Citations for all claims</li>
                        <li>✓ Safety sections required</li>
                        <li>✓ No off-label uses</li>
                        <li>✓ Fair balance (benefits + risks)</li>
                      </ul>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={medicalGenerateMutation.isPending || !!medicalJobId}
                      className="w-full"
                      data-testid="button-generate-medical"
                    >
                      {medicalGenerateMutation.isPending || medicalJobStatus?.status === "generating" ? (
                        <>Generating FDA-Compliant Content...</>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Medical Content
                        </>
                      )}
                    </Button>

                    {medicalJobStatus && medicalJobStatus.status === "generating" && (
                      <div className="text-sm text-muted-foreground text-center">
                        <Clock className="h-4 w-4 inline mr-2 animate-spin" />
                        Processing... This may take 1-2 minutes
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {generatedContent && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated Preview</CardTitle>
                  <CardDescription>Review and edit before publishing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">SEO Title</Label>
                    <p className="font-semibold text-sm">{generatedContent.seoTitle}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Display Title</Label>
                    <p className="text-sm">{generatedContent.title}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">SEO Description</Label>
                    <p className="text-sm">{generatedContent.seoDescription}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Excerpt</Label>
                    <p className="text-sm">{generatedContent.excerpt}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Content Preview</Label>
                    <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto border rounded-md p-3">
                      {generatedContent.content.substring(0, 400)}...
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">SEO Keywords</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {generatedContent.seoKeywords.map((keyword, idx) => (
                        <Badge key={idx} variant="outline">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Suggested Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {generatedContent.tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => setView("edit")}
                    className="w-full"
                    data-testid="button-review-edit"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Review & Edit
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Edit/Create Form */}
        {view === "edit" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedPost ? "Edit Post" : "New Post"}</CardTitle>
                <CardDescription>Customize and publish your content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="edit-title">Title *</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    data-testid="input-edit-title"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-excerpt">Excerpt</Label>
                  <Textarea
                    id="edit-excerpt"
                    rows={3}
                    value={editExcerpt}
                    onChange={(e) => setEditExcerpt(e.target.value)}
                    data-testid="textarea-edit-excerpt"
                  />
                </div>

                {/* Featured Image Upload */}
                <div>
                  <Label>Featured Image (Optional)</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Upload an image for your blog post. It will be automatically resized to 1200x630px.
                  </p>
                  
                  {editFeaturedImage ? (
                    <div className="relative border-2 border-dashed border-border rounded-md p-4" data-testid="image-preview-container">
                      <img 
                        src={editFeaturedImage} 
                        alt="Featured" 
                        className="w-full h-48 object-cover rounded-md mb-2"
                        data-testid="image-preview"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setEditFeaturedImage(null)}
                        className="absolute top-2 right-2"
                        data-testid="button-remove-image"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      className="border-2 border-dashed border-border rounded-md p-8 text-center hover-elevate cursor-pointer"
                      onClick={() => document.getElementById("image-upload-input")?.click()}
                      data-testid="image-upload-zone"
                    >
                      <input
                        id="image-upload-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        data-testid="input-image-upload"
                      />
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-muted-foreground">Processing image...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                          <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG, GIF up to 10MB</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-content">Content *</Label>
                  <Textarea
                    id="edit-content"
                    rows={12}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    data-testid="textarea-edit-content"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-category">Category *</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger id="edit-category" data-testid="select-edit-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medications">Medications</SelectItem>
                        <SelectItem value="pharmacy-news">Pharmacy News</SelectItem>
                        <SelectItem value="healthcare-savings">Healthcare Savings</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                    <Input
                      id="edit-tags"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      data-testid="input-edit-tags"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-meta-description">Meta Description (SEO)</Label>
                  <Textarea
                    id="edit-meta-description"
                    rows={2}
                    value={editMetaDescription}
                    onChange={(e) => setEditMetaDescription(e.target.value)}
                    placeholder="Brief description for search engines (150-160 characters)"
                    data-testid="textarea-edit-meta-description"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-meta-keywords">Meta Keywords (SEO)</Label>
                  <Input
                    id="edit-meta-keywords"
                    value={editMetaKeywords}
                    onChange={(e) => setEditMetaKeywords(e.target.value)}
                    placeholder="keyword1, keyword2, keyword3"
                    data-testid="input-edit-meta-keywords"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleSave("draft")}
                    disabled={saveMutation.isPending}
                    data-testid="button-save-draft"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSave("published")}
                    disabled={saveMutation.isPending}
                    data-testid="button-publish"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Publish
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      resetForm();
                      setView("list");
                    }}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Medical Compliance Review */}
        {view === "medical-review" && medicalJobStatus && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Medical Content Review</CardTitle>
                <CardDescription>Review FDA compliance before publishing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Compliance Status */}
                {medicalJobStatus.policy_report && (
                  <div className={`border rounded-md p-4 ${medicalJobStatus.policy_report.passed ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'}`}>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      {medicalJobStatus.policy_report.passed ? (
                        <><CheckCircle className="h-5 w-5 text-green-600" /> Compliance Passed</>
                      ) : (
                        <><Clock className="h-5 w-5 text-red-600" /> Compliance Issues Detected</>
                      )}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Citations:</span>
                        <span className="font-semibold ml-2">{medicalJobStatus.policy_report.citation_count}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Citation Density:</span>
                        <span className="font-semibold ml-2">{medicalJobStatus.policy_report.citation_density.toFixed(2)} per 150 words</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">US Sources Only:</span>
                        <Badge variant={medicalJobStatus.policy_report.us_sources_only ? "default" : "destructive"}>
                          {medicalJobStatus.policy_report.us_sources_only ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Safety Sections:</span>
                        <Badge variant={medicalJobStatus.policy_report.has_safety_sections ? "default" : "destructive"}>
                          {medicalJobStatus.policy_report.has_safety_sections ? "Present" : "Missing"}
                        </Badge>
                      </div>
                    </div>

                    {medicalJobStatus.policy_report.failures?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">Policy Violations:</h4>
                        <ul className="text-sm space-y-1">
                          {medicalJobStatus.policy_report.failures.map((failure: string, idx: number) => (
                            <li key={idx} className="text-red-600 dark:text-red-400">• {failure}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {medicalJobStatus.policy_report.warnings?.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Warnings:</h4>
                        <ul className="text-sm space-y-1">
                          {medicalJobStatus.policy_report.warnings.map((warning: string, idx: number) => (
                            <li key={idx} className="text-yellow-600 dark:text-yellow-400">• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Content Preview */}
                <div>
                  <Label className="text-sm font-semibold">Generated Content:</Label>
                  <div className="mt-2 p-4 border rounded-md bg-muted/20 max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: medicalJobStatus.content_html || "" }} />
                  </div>
                </div>

                {/* Manual Approval (if compliance passed) */}
                {medicalJobStatus.policy_report?.passed && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold">Final Compliance Checklist</h4>
                    <p className="text-sm text-muted-foreground">
                      Review the generated content manually and confirm all requirements are met:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="check-boxed" className="rounded" data-testid="checkbox-boxed-warning" />
                        <Label htmlFor="check-boxed" className="text-sm">Boxed warning included (if applicable)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="check-contraindications" className="rounded" data-testid="checkbox-contraindications" />
                        <Label htmlFor="check-contraindications" className="text-sm">Contraindications section present</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="check-us-sources" className="rounded" data-testid="checkbox-us-sources" />
                        <Label htmlFor="check-us-sources" className="text-sm">All sources are US-based (FDA/CDC/NIH)</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="check-no-off-label" className="rounded" data-testid="checkbox-no-off-label" />
                        <Label htmlFor="check-no-off-label" className="text-sm">No off-label uses mentioned</Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  {medicalJobStatus.policy_report?.passed ? (
                    <Button
                      onClick={() => {
                        setEditTitle(medicalTopic);
                        setEditContent(medicalJobStatus.content_html || "");
                        setEditCategory("medications");
                        setView("edit");
                      }}
                      data-testid="button-approve-and-edit"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve & Continue to Editor
                    </Button>
                  ) : (
                    <p className="text-sm text-destructive">
                      Content cannot be published due to compliance violations. Please regenerate with a different topic or parameters.
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMedicalJobId(null);
                      setMedicalJobStatus(null);
                      setView("list");
                    }}
                    data-testid="button-cancel-review"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
