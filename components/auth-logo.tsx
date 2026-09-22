import Link from "next/link";
import Image from "next/image";

export function AuthLogo() {
  return (
    <Link
      href="/"
      className="mb-6 flex justify-center"
      aria-label="Evergreen Widget home"
    >
      <Image
        src="/logo.svg"
        alt="Evergreen"
        width={200}
        height={28}
        priority
        className="h-7 w-auto"
      />
    </Link>
  );
}
