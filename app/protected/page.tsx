import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return JSON.stringify(data.claims, null, 2);
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight">
          Welcome back
        </h1>
        <p className="text-muted-foreground mt-2">
          You are signed in to Evergreen Widget.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Your account</CardTitle>
          <CardDescription>
            Session details for the currently authenticated user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs font-mono p-3 rounded-md border bg-muted/40 max-h-48 overflow-auto">
            <Suspense fallback="Loading…">
              <UserDetails />
            </Suspense>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
