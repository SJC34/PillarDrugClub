import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import type { BlogPost } from "@shared/schema";

export function BlogCarousel() {
  const { data, isLoading, isError, error, refetch } = useQuery<{ posts: BlogPost[] }>({
    queryKey: ["/api/blog/posts/published"],
    queryFn: async () => {
      const response = await fetch("/api/blog/posts/published?limit=6");
      if (!response.ok) throw new Error("Failed to fetch blog posts");
      return response.json();
    },
  });

  const posts = data?.posts || [];

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Latest Healthcare Insights</h2>
            <p className="text-muted-foreground font-bold">Loading articles...</p>
          </div>
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="py-12 md:py-16 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Latest Healthcare Insights</h2>
            <p className="text-muted-foreground font-bold mb-4">
              Unable to load articles at this time.
            </p>
            <Button onClick={() => refetch()} variant="outline" data-testid="button-retry-blog-posts">
              Try Again
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) {
    return null; // Don't show section if no posts
  }

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
  };

  return (
    <section className="py-12 md:py-16 px-4 sm:px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2" data-testid="heading-blog-carousel">Latest Healthcare Insights</h2>
          <p className="text-muted-foreground font-bold">Expert advice on medications, savings, and wellness</p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
              stopOnInteraction: true,
              stopOnMouseEnter: true,
            })
          ]}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {posts.map((post) => (
              <CarouselItem key={post.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <Link href={`/blog/${post.slug}`} data-testid={`link-blog-post-${post.id}`}>
                  <Card className="h-full hover-elevate cursor-pointer" data-testid={`card-blog-post-${post.id}`}>
                    {post.featuredImage && (
                      <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                        <img 
                          src={post.featuredImage} 
                          alt={post.title}
                          className="w-full h-full object-cover"
                          data-testid={`img-blog-${post.id}`}
                        />
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-md font-bold capitalize" data-testid={`category-${post.id}`}>
                          {post.category?.replace("-", " ")}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span data-testid={`date-${post.id}`}>{formatDate(post.publishedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span data-testid={`read-time-${post.id}`}>{estimateReadTime(post.content)}</span>
                        </div>
                      </div>
                      <CardTitle className="text-lg line-clamp-2" data-testid={`title-${post.id}`}>
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3 font-bold" data-testid={`excerpt-${post.id}`}>
                        {post.excerpt || post.content.substring(0, 150) + "..."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" size="sm" className="p-0 h-auto font-bold" data-testid={`button-read-more-${post.id}`}>
                        Read More <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" data-testid="button-carousel-prev" />
          <CarouselNext className="hidden md:flex" data-testid="button-carousel-next" />
        </Carousel>

        <div className="text-center mt-8">
          <Link href="/blog">
            <Button variant="outline" size="lg" className="font-bold" data-testid="button-view-all-articles">
              View All Articles <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
