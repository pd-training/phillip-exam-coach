import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function getCurrentUserWithRole() {
  const session = await getServerSession(authOptions);
  return {
    user: session?.user,
    role: (session?.user as any)?.role,
  };
}
