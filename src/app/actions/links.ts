"use server";

import { db } from "@/db";
import { links } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Parse URL to determine type and extract info
function parseGitUrl(url: string): { type: string; title: string } {
  const githubIssueMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/);
  if (githubIssueMatch) {
    return { 
      type: "github_issue", 
      title: `${githubIssueMatch[1]}/${githubIssueMatch[2]}#${githubIssueMatch[3]}`
    };
  }

  const githubPrMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
  if (githubPrMatch) {
    return { 
      type: "github_pr", 
      title: `${githubPrMatch[1]}/${githubPrMatch[2]}#${githubPrMatch[3]}`
    };
  }

  const gitlabIssueMatch = url.match(/gitlab\.com\/([^\/]+)\/([^\/]+)\/-\/issues\/(\d+)/);
  if (gitlabIssueMatch) {
    return { 
      type: "gitlab_issue", 
      title: `${gitlabIssueMatch[1]}/${gitlabIssueMatch[2]}#${gitlabIssueMatch[3]}`
    };
  }

  const gitlabMrMatch = url.match(/gitlab\.com\/([^\/]+)\/([^\/]+)\/-\/merge_requests\/(\d+)/);
  if (gitlabMrMatch) {
    return { 
      type: "gitlab_mr", 
      title: `${gitlabMrMatch[1]}/${gitlabMrMatch[2]}!${gitlabMrMatch[3]}`
    };
  }

  // Generic link
  try {
    const urlObj = new URL(url);
    return { type: "link", title: urlObj.hostname };
  } catch {
    return { type: "link", title: url };
  }
}

// Add a link to a card
export async function addLinkToCard(cardId: string, url: string) {
  const { type, title } = parseGitUrl(url);
  
  const id = crypto.randomUUID();
  await db.insert(links).values({
    id,
    cardId,
    url,
    type,
    title,
  });

  revalidatePath("/");
  return { id, url, type, title };
}

// Remove a link from a card
export async function removeLinkFromCard(linkId: string) {
  await db.delete(links).where(eq(links.id, linkId));
  revalidatePath("/");
}

// Get all links for a card
export async function getCardLinks(cardId: string) {
  return await db.query.links.findMany({
    where: eq(links.cardId, cardId),
  });
}
