import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <SiteHeader />
        <div className="flex-1 flex flex-col gap-8 max-w-5xl w-full p-5 py-10">
          {children}
        </div>
        <SiteFooter />
      </div>
    </main>
  );
}
