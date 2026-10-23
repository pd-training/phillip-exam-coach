export const dynamic = "force-dynamic";

const dbUrl = process.env.DATABASE_URL ?? "";

/**
 * TEMPORARY ENDPOINT - DELETE AFTER USE
 * Cleans up failed migration records from _prisma_migrations table
 * This is a one-time fix for the add_active_field_to_user migration failure
 */
export async function GET() {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    console.log("Attempting to cleanup failed migration record...");

    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM "_prisma_migrations" WHERE "migration_name" = 'add_active_field_to_user'`
    );

    await prisma.$disconnect();

    return Response.json({
      success: true,
      message: `Successfully deleted ${result} failed migration record(s).`,
      details: "Amplify builds should now proceed normally. This endpoint can be deleted.",
    });
  } catch (error: any) {
    console.error("Cleanup error:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Failed to cleanup migration",
      },
      { status: 500 }
    );
  }
}
