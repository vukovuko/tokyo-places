import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
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

  // Verify user still exists in DB (JWT is stateless, user may have been deleted)
  const user = await db.query.users.findFirst({
    where: eq(users.id, Number(session.user.id)),
    columns: { id: true },
  });
  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AdminSidebar user={session.user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
