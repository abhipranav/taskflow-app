import { SidebarWrapper } from "@/components/layout/sidebar-wrapper";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarWrapper>{children}</SidebarWrapper>;
}
