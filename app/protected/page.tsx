import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";

async function ProtectedRedirect() {
  await connection();
  redirect("/dashboard");
  return null;
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={null}>
      <ProtectedRedirect />
    </Suspense>
  );
}
