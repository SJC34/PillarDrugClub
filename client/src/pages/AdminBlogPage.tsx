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
  Clock
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
  const [view, setView] = useState<"list" | "generate" | "edit">("list");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // AI Generation Form State
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("professional");
  const [keywords, setKeywords] = useState("");
  const [targetLength, setTargetLength] = useState("medium");
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editMetaDescription, setEditMetaDescription] = useState("");
  const [editMetaKeywords, setEditMetaKeywords] = useState("");
  const [editStatus, setEditStatus] = useState<"draft" | "published">("draft");

  // Fetch all blog posts
  const { data: posts, isLoading: isLoadingPosts } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts"],
  });

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

  const handleGenerate = () => {
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
    });
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
                <CardDescription>Tell us what you want to write about and let AI do the work</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Benefits of Metformin for Type 2 Diabetes"
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
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    placeholder="e.g., diabetes, metformin, blood sugar"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    data-testid="input-keywords"
                  />
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
      </div>
    </div>
  );
}
