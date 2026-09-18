import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Phillip Exam Coach Dashboard</h1>
      <p>Welcome, {user.email}!</p>
      <p>Your platform is live and working!</p>
      
      <div style={{ marginTop: "20px", padding: "20px", backgroundColor: "#f0f0f0", borderRadius: "8px" }}>
        <h2>Getting Started</h2>
        <ul>
          <li>Upload exam papers</li>
          <li>Create practice exams</li>
          <li>Track student progress</li>
        </ul>
      </div>
    </div>
  );
}
