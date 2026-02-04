import { getAllPosts, getAllCategories } from "@/lib/blog";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, User, ArrowRight } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";

export const metadata = {
  title: "Blog | TaskFlow",
  description: "Latest updates, engineering insights, and thoughts on productivity from the TaskFlow team.",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/welcome" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <Link href="/login" className="text-sm font-medium text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 border-b border-border/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            TaskFlow Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Product updates, engineering deep-dives, and thoughts on building privacy-first productivity tools.
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-6 border-b border-border/40">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              <span className="text-sm text-muted-foreground shrink-0">Filter:</span>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                All
              </Badge>
              {categories.map((category) => (
                <Badge key={category} variant="outline" className="cursor-pointer hover:bg-muted transition-colors shrink-0">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Posts Grid */}
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No posts yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid gap-8">
              {posts.map((post, index) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <Card className={`group overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 ${index === 0 ? 'md:grid md:grid-cols-2' : ''}`}>
                    {/* Featured Image Placeholder */}
                    <div className={`bg-gradient-to-br from-primary/10 to-primary/5 ${index === 0 ? 'min-h-[200px] md:min-h-full' : 'h-48'}`}>
                      <div className="h-full flex items-center justify-center text-primary/30">
                        <span className="text-6xl font-bold">{post.title.charAt(0)}</span>
                      </div>
                    </div>
                    
                    <CardContent className={`${index === 0 ? 'p-8' : 'p-6'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {post.category}
                        </Badge>
                        {post.featured && (
                          <Badge className="text-xs bg-primary/10 text-primary border-0">
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <h2 className={`font-bold group-hover:text-primary transition-colors mb-2 ${index === 0 ? 'text-2xl md:text-3xl' : 'text-xl'}`}>
                        {post.title}
                      </h2>
                      
                      <p className={`text-muted-foreground mb-4 ${index === 0 ? 'text-base' : 'text-sm line-clamp-2'}`}>
                        {post.excerpt}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {post.author}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </span>
                      </div>
                      
                      <div className="mt-4 flex items-center gap-1 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Read more <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-24 bg-muted/30 border-t border-border/40">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Stay in the loop
          </h2>
          <p className="text-muted-foreground mb-8">
            Get notified about new features, engineering posts, and productivity tips. No spam, unsubscribe anytime.
          </p>
          <NewsletterForm source="blog" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TaskFlow. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link href="/welcome" className="text-sm text-muted-foreground hover:text-foreground">Home</Link>
              <Link href="/welcome#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">Sign In</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
