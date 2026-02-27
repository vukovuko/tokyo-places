import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={session.user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
