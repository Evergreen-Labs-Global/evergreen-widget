import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { hasEnvVars } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <SiteHeader />

        <section className="flex-1 flex flex-col items-center justify-center gap-8 max-w-2xl w-full px-5 py-20 text-center">
          <Image
            src="/logo.svg"
            alt="Evergreen"
            width={280}
            height={39}
            priority
            className="h-10 w-auto"
          />
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Evergreen Widget
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Analytics dashboard and embedded widgets for Evergreen.
            </p>
          </div>
          {hasEnvVars ? (
            <div className="flex gap-3 justify-center">
              <Button asChild size="lg">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/sign-up">Sign up</Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Configure Supabase environment variables to enable sign in.
            </p>
          )}
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
