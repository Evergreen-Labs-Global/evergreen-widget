import Link from "next/link";
import Image from "next/image";

export function AuthLogo() {
  return (
    <Link
      href="/"
      className="mb-6 flex justify-center"
      aria-label="HealthyFarm home"
    >
      <Image
        src="/healthyfarmlogo.png"
        alt="HealthyFarm"
        width={200}
        height={60}
        priority
        className="h-12 w-auto"
      />
    </Link>
  );
}
