import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return user ? (
    <div className="flex items-center gap-3">
      <Button asChild size="sm" variant="ghost">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
      <span className="hidden sm:inline text-sm text-muted-foreground truncate max-w-[160px]">
        {user.email as string}
      </span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="outline" className="rounded-full">
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" className="rounded-full">
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
