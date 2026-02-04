"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none prose-p:leading-relaxed prose-strong:text-inherit prose-em:text-inherit",
        "prose-a:text-primary prose-a:underline prose-a:underline-offset-4",
        "prose-code:rounded prose-code:bg-black/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[0.85em] dark:prose-code:bg-white/10",
        "prose-pre:rounded-lg prose-pre:bg-black/80 dark:prose-pre:bg-black/60 prose-pre:p-3 prose-pre:text-sm prose-pre:leading-relaxed",
        "prose-blockquote:border-l-2 prose-blockquote:pl-3 prose-blockquote:text-muted-foreground",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h3 className="text-base font-semibold mt-3 mb-1" {...props} />
          ),
          h2: ({ ...props }) => (
            <h4 className="text-sm font-semibold mt-3 mb-1" {...props} />
          ),
          h3: ({ ...props }) => (
            <h5 className="text-sm font-semibold mt-2 mb-1" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="my-2 list-disc pl-5" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="my-2 list-decimal pl-5" {...props} />
          ),
          li: ({ ...props }) => <li className="my-1" {...props} />,
          code: ({ inline, className: codeClassName, ...props }) => {
            if (inline) {
              return (
                <code
                  className="rounded bg-black/10 px-1.5 py-0.5 text-[0.85em] dark:bg-white/10"
                  {...props}
                />
              );
            }
            return <code className={cn("block text-[0.85em]", codeClassName)} {...props} />;
          },
          pre: ({ ...props }) => (
            <pre
              className="rounded-lg bg-black/80 p-3 text-sm leading-relaxed text-white/90 dark:bg-black/60"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
