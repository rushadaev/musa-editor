import { redirect } from "next/navigation";

// Embedded under Musa — skip OpenCut's marketing landing, go straight to projects.
export default function Home() {
  redirect("/projects");
}
