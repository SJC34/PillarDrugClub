import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Calendar, User, Eye, Tag, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import Header from "@/components/Header";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  category: string;
  tags: string[];
  authorName: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  publishedAt: string | null;
  createdAt: string;
  viewCount: number;
}

export default function BlogPostPage() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug;

  const { data: post, isLoading, error } = useQuery<BlogPost>({
    queryKey: ["/api/blog/posts", slug],
    queryFn: async () => {
      const response = await fetch(`/api/blog/posts/${slug}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Post not found");
      }
      return response.json();
    },
    enabled: !!slug,
  });

  const categoryLabels: Record<string, string> = {
    "medications": "Medications",
    "pharmacy-news": "Pharmacy News",
    "healthcare-savings": "Healthcare Savings",
    "general": "General"
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <p className="text-center text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <Link href="/blog">
            <Button variant="outline" data-testid="button-back-to-blog">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const canonicalUrl = `https://pillardrugclub.com/blog/${post.slug}`;
  const seoTitle = post.seoTitle || post.title;
  const seoDescription = post.seoDescription || post.excerpt || "";

  // Structured Data for SEO (JSON-LD)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "alternativeHeadline": seoTitle,
    "description": seoDescription,
    "author": {
      "@type": "Person",
      "name": post.authorName
    },
    "publisher": {
      "@type": "Organization",
      "name": "Pillar Drug Club",
      "logo": {
        "@type": "ImageObject",
        "url": "https://pillardrugclub.com/logo.png"
      }
    },
    "datePublished": post.publishedAt || post.createdAt,
    "dateModified": post.createdAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "keywords": post.seoKeywords.join(", ")
  };

  return (
    <>
      <Helmet>
        <title>{seoTitle} | Pillar Drug Club</title>
        <meta name="description" content={seoDescription} />
        {post.seoKeywords.length > 0 && <meta name="keywords" content={post.seoKeywords.join(", ")} />}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:site_name" content="Pillar Drug Club" />
        <meta property="article:published_time" content={post.publishedAt || post.createdAt} />
        <meta property="article:author" content={post.authorName} />
        <meta property="article:section" content={categoryLabels[post.category] || post.category} />
        {post.tags.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        
        <article className="max-w-4xl mx-auto px-4 py-12">
          {/* Back Button */}
          <Link href="/blog">
            <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          {/* Article Header */}
          <div className="mb-8">
            <Badge variant="secondary" className="mb-4" data-testid="badge-category">
              <Tag className="h-3 w-3 mr-1" />
              {categoryLabels[post.category] || post.category}
            </Badge>
            
            <h1 className="text-4xl font-bold text-foreground mb-4">{post.title}</h1>
            
            {post.excerpt && (
              <p className="text-xl text-muted-foreground mb-6">{post.excerpt}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {post.authorName}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </span>
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                {post.viewCount} views
              </span>
            </div>
          </div>

          {/* Article Content */}
          <Card>
            <CardContent className="p-8">
              <div 
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
              />
            </CardContent>
          </Card>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" data-testid={`tag-${tag}`}>
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-12 p-6 bg-primary/5 rounded-lg border border-primary/10">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Ready to Save on Prescriptions?
            </h3>
            <p className="text-muted-foreground mb-4">
              Join Pillar Drug Club and get wholesale pricing on your medications.
            </p>
            <Link href="/subscribe">
              <Button data-testid="button-cta-subscribe">
                Get Started Today
              </Button>
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
