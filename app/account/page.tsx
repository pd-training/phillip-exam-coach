"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AccountPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  // Profile state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Handle auth redirects
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (!session?.user) {
      router.push("/login");
      return;
    }

    // Parse user name into first and last name
    const fullName = session.user.name || "";
    const nameParts = fullName.split(" ");
    setFirstName(nameParts[0] || "");
    setLastName(nameParts.slice(1).join(" ") || "");
    setEmail(session.user.email || "");
    setLoading(false);
  }, [status, session, router]);

  if (status === "loading") {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (status === "unauthenticated" || !session?.user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      console.log("Logging out with baseUrl:", baseUrl);
      const callbackUrl = `${baseUrl}/login`;
      console.log("Callback URL:", callbackUrl);
      await signOut({ redirect: true, callbackUrl });
    } catch (error) {
      console.error("Logout error:", error);
      if (typeof window !== "undefined") {
        window.location.href = `${window.location.origin}/login`;
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setProfileError(data.error || "Failed to update profile");
        return;
      }

      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (error) {
      setProfileError("Something went wrong. Please try again.");
      console.error("Profile update error:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || "Failed to change password");
        return;
      }

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (error) {
      setPasswordError("Something went wrong. Please try again.");
      console.error("Password change error:", error);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* Navigation Bar */}
      <nav style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: "32px" }}>
          <a href="/dashboard" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Dashboard
          </a>
          <a href="#" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Practice
          </a>
          <a href="#" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Browse papers
          </a>
          <a href="#" style={{ textDecoration: "none", color: "#666", fontWeight: "500", fontSize: "14px" }}>
            Help
          </a>
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <span style={{ color: "#666", fontSize: "14px" }}>Account</span>
          <span style={{ fontWeight: "600", fontSize: "14px" }}>{session?.user?.name || "User"}</span>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "transparent",
              color: "#3b82f6",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            Log out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Heading */}
        <h1 style={{ fontSize: "28px", fontWeight: "600", margin: "0 0 32px 0", color: "#1f2937" }}>
          Account Settings
        </h1>

        {/* Personal Information Section */}
        <div style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          marginBottom: "32px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 24px 0", color: "#1f2937" }}>
            Personal Information
          </h2>

          {profileError && (
            <div style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
            }}>
              ❌ {profileError}
            </div>
          )}

          {profileSuccess && (
            <div style={{
              backgroundColor: "#d1fae5",
              border: "1px solid #6ee7b7",
              color: "#065f46",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
            }}>
              ✅ {profileSuccess}
            </div>
          )}

          <form onSubmit={handleProfileUpdate}>
            {/* First and Last Name */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                  First name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+65 9123 4567"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Email (read-only) */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  backgroundColor: "#f3f4f6",
                  color: "#666",
                }}
              />
              <p style={{ fontSize: "12px", color: "#666", margin: "6px 0 0 0" }}>Email cannot be changed</p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={profileLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: profileLoading ? "#9ca3af" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: profileLoading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!profileLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1d4ed8";
              }}
              onMouseLeave={(e) => {
                if (!profileLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2563eb";
              }}
            >
              {profileLoading ? "Saving..." : "Save profile"}
            </button>
          </form>
        </div>

        {/* Change Password Section */}
        <div style={{
          backgroundColor: "white",
          padding: "32px",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", margin: "0 0 24px 0", color: "#1f2937" }}>
            Change password
          </h2>

          {passwordError && (
            <div style={{
              backgroundColor: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
            }}>
              ❌ {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div style={{
              backgroundColor: "#d1fae5",
              border: "1px solid #6ee7b7",
              color: "#065f46",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px",
            }}>
              ✅ {passwordSuccess}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            {/* Current Password */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* New Password */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: "600", color: "#1f2937" }}>
                Confirm new password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Update Button */}
            <button
              type="submit"
              disabled={passwordLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                backgroundColor: passwordLoading ? "#9ca3af" : "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: passwordLoading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!passwordLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#1d4ed8";
              }}
              onMouseLeave={(e) => {
                if (!passwordLoading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2563eb";
              }}
            >
              {passwordLoading ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
