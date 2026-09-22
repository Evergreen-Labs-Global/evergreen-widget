import { SignUpForm } from "@/components/sign-up-form";
import { AuthLogo } from "@/components/auth-logo";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[#F7F5F0] p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AuthLogo />
        <SignUpForm />
      </div>
    </div>
  );
}
