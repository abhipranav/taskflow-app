import ReactMarkdown from "react-markdown";

type MarkdownProps = React.ComponentProps<typeof ReactMarkdown> & {
  className?: string;
};

export function Markdown({ className, ...props }: MarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown {...props} />
    </div>
  );
}
