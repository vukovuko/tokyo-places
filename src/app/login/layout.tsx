import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role === "admin") {
    redirect("/admin/places");
  }

  return <>{children}</>;
}
