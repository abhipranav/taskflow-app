import fs from "fs";
import path from "path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
  image?: string;
  featured: boolean;
  content: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
  image?: string;
  featured: boolean;
}

// Get all blog posts metadata (for listing)
export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".md"));

  const posts = files.map((file) => {
    const filePath = path.join(BLOG_DIR, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(fileContent);

    return {
      slug: data.slug || file.replace(".md", ""),
      title: data.title || "Untitled",
      excerpt: data.excerpt || "",
      date: data.date || new Date().toISOString(),
      author: data.author || "TaskFlow Team",
      category: data.category || "General",
      readTime: data.readTime || "3 min read",
      image: data.image,
      featured: data.featured || false,
    };
  });

  // Sort by date descending (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Get a single blog post by slug (with content)
export function getPostBySlug(slug: string): BlogPost | null {
  if (!fs.existsSync(BLOG_DIR)) {
    return null;
  }

  const files = fs.readdirSync(BLOG_DIR).filter((file) => file.endsWith(".md"));

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    const postSlug = data.slug || file.replace(".md", "");

    if (postSlug === slug) {
      return {
        slug: postSlug,
        title: data.title || "Untitled",
        excerpt: data.excerpt || "",
        date: data.date || new Date().toISOString(),
        author: data.author || "TaskFlow Team",
        category: data.category || "General",
        readTime: data.readTime || "3 min read",
        image: data.image,
        featured: data.featured || false,
        content,
      };
    }
  }

  return null;
}

// Get featured posts
export function getFeaturedPosts(): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.featured);
}

// Get posts by category
export function getPostsByCategory(category: string): BlogPostMeta[] {
  return getAllPosts().filter(
    (post) => post.category.toLowerCase() === category.toLowerCase()
  );
}

// Get all unique categories
export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = new Set(posts.map((post) => post.category));
  return Array.from(categories);
}

// Get related posts (same category, excluding current)
export function getRelatedPosts(slug: string, limit = 3): BlogPostMeta[] {
  const currentPost = getPostBySlug(slug);
  if (!currentPost) return [];

  return getAllPosts()
    .filter((post) => post.slug !== slug && post.category === currentPost.category)
    .slice(0, limit);
}
