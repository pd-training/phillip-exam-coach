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

export function requireAuth(role?: string) {
  return async () => {
    const { user, role: userRole } = await getCurrentUserWithRole();
    if (!user) {
      throw new Error("Unauthorized");
    }
    if (role && userRole !== role) {
      throw new Error("Forbidden");
    }
    return user;
  };
}
