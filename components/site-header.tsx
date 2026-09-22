import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { AuthButton } from "@/components/auth-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { hasEnvVars } from "@/lib/utils";

export function SiteHeader() {
  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-white">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="HealthyFarm home"
        >
          <Image
            src="/healthyfarmlogo.png"
            alt="HealthyFarm"
            width={160}
            height={48}
            priority
            className="h-9 w-auto"
          />
        </Link>
        {!hasEnvVars ? (
          <EnvVarWarning />
        ) : (
          <Suspense>
            <AuthButton />
          </Suspense>
        )}
      </div>
    </nav>
  );
}
