import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: any) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  const hash = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  const matches = hash === user.password;

  return Response.json({
    userFound: true,
    passwordMatches: matches,
    storedHash: user.password,
    testHash: hash,
    user: { id: user.id, email: user.email },
  });
}

  const hash = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");

  const matches = hash === user.password;

  return Response.json({
    userFound: true,
    passwordMatches: matches,
    storedHash: user.password,
    testHash: hash,
    user: { id: user.id, email: user.email },
  });
}
