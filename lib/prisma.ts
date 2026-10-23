import { PrismaClient } from "@prisma/client";

const dbUrl = process.env.DATABASE_URL ?? "";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
} else {
  let globalWithPrisma = global as typeof globalThis & {
    prisma: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
  }
  prisma = globalWithPrisma.prisma;
}

export default prisma;
