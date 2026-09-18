import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Run prisma migrate deploy
    const { stdout, stderr } = await execAsync("npx prisma migrate deploy", {
      cwd: process.cwd(),
    });

    return Response.json({
      success: true,
      message: "Prisma migrations completed",
      output: stdout,
      stderr: stderr || null,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return Response.json(
      {
        success: false,
        error: String(error),
        message: "Migration failed - this is expected on first run",
      },
      { status: 200 } // Return 200 even on "failure" since we're initializing
    );
  }
}
