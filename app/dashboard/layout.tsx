import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <SiteHeader />
        <div className="flex-1 flex flex-col gap-8 max-w-5xl w-full p-5 py-10">
          <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
            {children}
          </Suspense>
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
