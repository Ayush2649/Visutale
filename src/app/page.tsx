import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession();

  if (session && session.user) {
    redirect("/your-videos");
  } else {
    redirect("/sign-in");
  }
}
