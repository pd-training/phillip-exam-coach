import { getServerSession } from "next-auth/next";

export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user;
}

export async function getCurrentUserWithRole() {
  const session = await getServerSession();
  return {
    user: session?.user,
    role: (session?.user as any)?.role,
  };
}
