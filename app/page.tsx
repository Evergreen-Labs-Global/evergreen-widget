import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { hasEnvVars } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center bg-[#F7F5F0]">
      <div className="flex-1 w-full flex flex-col items-center">
        <SiteHeader />

        <section className="flex-1 flex flex-col items-center justify-center gap-8 max-w-2xl w-full px-5 py-20 text-center">
          <Image
            src="/healthyfarmlogo.png"
            alt="HealthyFarm"
            width={280}
            height={84}
            priority
            className="h-16 w-auto"
          />
          <div className="flex flex-col gap-4">
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              HealthyFarm
            </h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Vietnam&apos;s Laying Hen Welfare Network — trusted market
              intelligence for humane egg production.
            </p>
          </div>
          {hasEnvVars ? (
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full px-6 border-primary text-primary"
              >
                <Link href="/auth/sign-up">Join the network</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="rounded-full px-6 bg-[#C4A035] text-white hover:bg-[#b3912c]"
              >
                <Link href="/widget" target="_blank">
                  View market panel
                </Link>
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
