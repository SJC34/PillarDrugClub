import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, Eye, Search, Tag } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  authorName: string;
  publishedAt: string | null;
  createdAt: string;
  viewCount: number;
}

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data, isLoading, error } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ["/api/blog/posts/published"],
    retry: 1,
  });

  const posts = data?.posts || [];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categoryLabels: Record<string, string> = {
    "medications": "Medications",
    "pharmacy-news": "Pharmacy News",
    "healthcare-savings": "Healthcare Savings",
    "general": "General"
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      if (diffInHours < 1) return "Updated just now";
      if (diffInHours === 1) return "Updated 1 hour ago";
      return `Updated ${diffInHours} hours ago`;
    } else if (diffInHours < 48) {
      return "Updated 1 day ago";
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `Updated ${days} days ago`;
    } else {
      return `Updated on ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section - GoodRx Style */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            The Answers You Need.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
            From pharmacists and healthcare experts you can trust.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-64" data-testid="select-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="medications">Medications</SelectItem>
              <SelectItem value="pharmacy-news">Pharmacy News</SelectItem>
              <SelectItem value="healthcare-savings">Healthcare Savings</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Blog Posts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading articles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Unable to load articles. Please try again later.</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              data-testid="button-reload"
            >
              Reload Page
            </Button>
          </div>
        ) : !filteredPosts || filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== "all" 
                ? "No articles found matching your criteria" 
                : "No published articles yet"}
            </p>
            {(searchQuery || selectedCategory !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => {
              const gradients = [
                'from-blue-500/10 to-purple-500/10',
                'from-green-500/10 to-teal-500/10',
                'from-orange-500/10 to-red-500/10',
                'from-pink-500/10 to-rose-500/10',
                'from-indigo-500/10 to-blue-500/10',
                'from-cyan-500/10 to-sky-500/10',
              ];
              const gradient = gradients[index % gradients.length];
              
              return (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <Card 
                    className="h-full hover-elevate cursor-pointer overflow-hidden" 
                    data-testid={`card-blog-${post.slug}`}
                  >
                    {/* Featured Image or Gradient Background */}
                    {(post as any).featuredImage ? (
                      <div className="aspect-video w-full overflow-hidden">
                        <img 
                          src={(post as any).featuredImage} 
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className={`aspect-video w-full bg-gradient-to-br ${gradient} flex items-center justify-center p-6`}>
                        <h3 className="text-2xl font-bold text-foreground text-center line-clamp-3">
                          {post.title}
                        </h3>
                      </div>
                    )}
                    
                    <CardHeader>
                      <Badge variant="secondary" className="mb-2 w-fit" data-testid={`badge-category-${post.slug}`}>
                        {categoryLabels[post.category] || post.category}
                      </Badge>
                      
                      <CardTitle className="text-xl line-clamp-2">
                        {post.title}
                      </CardTitle>
                      
                      <CardDescription className="line-clamp-2">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex flex-col gap-1 text-sm">
                        <span className="text-foreground font-medium">
                          Written by {post.authorName}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {formatDate(post.publishedAt || post.createdAt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
