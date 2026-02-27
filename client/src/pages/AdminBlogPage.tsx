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

export default function AdminBlogPage() {
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "edit">("list");
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Edit Form State
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editExcerpt, setEditExcerpt] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editMetaDescription, setEditMetaDescription] = useState("");
  const [editMetaKeywords, setEditMetaKeywords] = useState("");
  const [editFeaturedImage, setEditFeaturedImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Fetch all blog posts
  const { data: postsResponse, isLoading: isLoadingPosts } = useQuery<{ posts: BlogPost[], total: number }>({
    queryKey: ["/api/blog/posts"],
  });
  
  const posts = postsResponse?.posts || [];

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
    setEditFeaturedImage(post.featuredImage || null);
    setView("edit");
  };

  const handleNewPost = () => {
    resetForm();
    setView("edit");
  };

  const resetForm = () => {
    setSelectedPost(null);
    setEditTitle("");
    setEditContent("");
    setEditExcerpt("");
    setEditCategory("");
    setEditTags("");
    setEditMetaDescription("");
    setEditMetaKeywords("");
    setEditFeaturedImage(null);
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
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          toast({ title: "Upload Failed", description: "Unable to process image", variant: "destructive" });
          setIsUploadingImage(false);
          return;
        }

        const targetWidth = 1200;
        const targetHeight = 630;
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
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let base64Image = canvas.toDataURL("image/jpeg", quality);

        const getBase64Size = (b64: string) => {
          const data = b64.split(',')[1] || b64;
          return (data.length * 3) / 4;
        };

        while (getBase64Size(base64Image) > 200 * 1024 && quality > 0.5) {
          quality -= 0.05;
          base64Image = canvas.toDataURL("image/jpeg", quality);
        }

        const finalSize = getBase64Size(base64Image);
        if (finalSize > 200 * 1024) {
          setIsUploadingImage(false);
          toast({
            title: "Image Too Large",
            description: `Unable to compress below 200KB. Please use a smaller image.`,
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
      toast({ title: "Upload Failed", description: "Failed to process image", variant: "destructive" });
      setIsUploadingImage(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Blog Manager</h1>
          <p className="text-muted-foreground">Create and manage your blog posts</p>
        </div>

        {/* View Switcher */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => { resetForm(); setView("list"); }}
            data-testid="button-view-list"
          >
            All Posts
          </Button>
          <Button
            variant={view === "edit" && !selectedPost ? "default" : "outline"}
            onClick={handleNewPost}
            data-testid="button-new-post"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
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
                  <Button onClick={handleNewPost} data-testid="button-create-first-post">
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
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-foreground">{post.title}</h3>
                              <Badge variant={post.status === "published" ? "default" : "secondary"} data-testid={`badge-status-${post.id}`}>
                                {post.status === "published" ? (
                                  <><CheckCircle className="h-3 w-3 mr-1" />Published</>
                                ) : (
                                  <><Clock className="h-3 w-3 mr-1" />Draft</>
                                )}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{post.category}</span>
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{post.authorName}</span>
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(post.createdAt).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.viewCount} views</span>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(post)} data-testid={`button-edit-${post.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
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

        {/* Edit/Create Form */}
        {view === "edit" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedPost ? "Edit Post" : "New Post"}</CardTitle>
                <CardDescription>Write and publish your content</CardDescription>
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
                        Remove
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

                <div className="flex gap-3 pt-4 flex-wrap">
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
                    onClick={() => { resetForm(); setView("list"); }}
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
