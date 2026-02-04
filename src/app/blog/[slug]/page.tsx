import { getPostBySlug, getAllPosts, getRelatedPosts } from "@/lib/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Share2, Bookmark } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import remarkGfm from "remark-gfm";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  
  if (!post) {
    return { title: "Post Not Found | TaskFlow Blog" };
  }

  return {
    title: `${post.title} | TaskFlow Blog`,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              All Posts
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <Share2 className="h-4 w-4" />
              </Button>
              <Link href="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="py-12 md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Article Header */}
          <header className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
                {post.category}
              </Badge>
              <span className="text-sm text-muted-foreground">{post.readTime}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] mb-6">
              {post.title}
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              {post.excerpt}
            </p>
            
            {/* Author & Date */}
            <div className="flex items-center gap-4 pb-8 border-b border-border">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <span className="text-lg font-semibold text-primary">{post.author.charAt(0)}</span>
              </div>
              <div>
                <p className="font-medium">{post.author}</p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground
            prose-h1:text-3xl prose-h1:mt-12 prose-h1:mb-6
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/50 prose-h2:pb-2
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-foreground/80 prose-p:leading-[1.8] prose-p:mb-6
            prose-strong:text-foreground prose-strong:font-semibold
            prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:transition-colors
            prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6
            prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6
            prose-li:text-foreground/80 prose-li:my-2 prose-li:leading-relaxed
            prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
            prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-border/50 prose-pre:rounded-xl prose-pre:shadow-lg prose-pre:my-8
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/30 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:my-8
            prose-hr:border-border/50 prose-hr:my-12
            prose-img:rounded-xl prose-img:shadow-lg
            prose-table:border-collapse prose-table:overflow-hidden prose-table:rounded-lg prose-table:my-8
            prose-th:bg-muted prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:border-b prose-th:border-border
            prose-td:px-4 prose-td:py-3 prose-td:border-b prose-td:border-border/50
          ">
            <Markdown 
              remarkPlugins={[remarkGfm]}
              components={{
                pre: ({ children }) => (
                  <pre className="overflow-x-auto p-4 text-sm">
                    {children}
                  </pre>
                ),
                a: ({ href, children }) => (
                  <a href={href} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}>
                    {children}
                  </a>
                ),
              }}
            >
              {post.content}
            </Markdown>
          </div>

          {/* Tags / Share */}
          <div className="mt-12 pt-8 border-t border-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Share:</span>
              <Button variant="outline" size="sm" className="rounded-full">
                Twitter
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                LinkedIn
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                Copy Link
              </Button>
            </div>
          </div>
        </div>
      </article>

      {/* Author Box */}
      <section className="py-12 bg-muted/30 border-y border-border/40">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
              <span className="text-3xl font-bold text-primary">{post.author.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Written by</p>
              <p className="font-semibold text-xl mb-2">{post.author}</p>
              <p className="text-muted-foreground leading-relaxed">
                Building privacy-first productivity tools at TaskFlow. Passionate about local-first software and developer experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8">Continue Reading</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`}>
                  <Card className="group h-full hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-4 text-xs rounded-full">{relatedPost.category}</Badge>
                      <h3 className="font-semibold text-lg mb-3 group-hover:text-primary transition-colors leading-tight">
                        {relatedPost.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {relatedPost.excerpt}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-primary font-medium">
                        Read article <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className="py-20 md:py-24 bg-gradient-to-b from-muted/50 to-background border-t border-border/40">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-sm text-primary mb-6">
            ✨ Stay Updated
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Enjoyed this post?
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
            Get notified when we publish new content. Join developers building better productivity tools.
          </p>
          <NewsletterForm source="blog-post" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} TaskFlow. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/welcome" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
