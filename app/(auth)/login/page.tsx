import { Suspense } from "react";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "20px",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "1200px",
        backgroundColor: "white",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "600px",
        }}>
          {/* Left Panel - Illustration */}
          <div style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            padding: "60px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
          }}>
            <div style={{
              textAlign: "center",
            }}>
              <div style={{
                fontSize: "100px",
                marginBottom: "24px",
                lineHeight: "1",
              }}>
                🎓
              </div>
              <h2 style={{
                fontSize: "32px",
                fontWeight: "bold",
                margin: "0 0 16px 0",
              }}>
                Master Your CMFAS
              </h2>
              <p style={{
                fontSize: "16px",
                lineHeight: "1.6",
                margin: "0 0 40px 0",
                opacity: "0.95",
              }}>
                AI-powered exam prep tailored for PhillipCapital advisors
              </p>

              {/* Feature List */}
              <div style={{
                textAlign: "left",
                display: "inline-block",
              }}>
                {[
                  { icon: "🤖", text: "Intelligent AI Coaching" },
                  { icon: "📊", text: "Real-time Progress Tracking" },
                  { icon: "✨", text: "Personalized Study Plans" },
                  { icon: "⚡", text: "Instant Practice Questions" },
                ].map((feature, idx) => (
                  <div key={idx} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                    fontSize: "15px",
                  }}>
                    <span style={{ fontSize: "20px" }}>{feature.icon}</span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div style={{
            padding: "60px 40px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}>
            <Suspense fallback={
              <div style={{
                textAlign: "center",
                color: "#6b7280",
              }}>
                Loading...
              </div>
            }>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
