import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { AIChatInline } from "@/components/ai-chat-inline";

export const metadata: Metadata = {
  title: "AI Assistant | TaskFlow",
  description: "Chat with your TaskFlow AI assistant to get insights about your tasks and productivity.",
};

export default async function AIChatPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/welcome");
  }

  return (
    <div className="h-[calc(100vh-3rem)]">
      <AIChatInline userName={session.user.name || undefined} />
    </div>
  );
}
