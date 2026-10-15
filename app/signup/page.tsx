import { redirect } from "next/navigation";

// Account creation lives on the landing page as a ribbon; keep old links working.
export default function SignupRedirect() {
  redirect("/#signup");
}
