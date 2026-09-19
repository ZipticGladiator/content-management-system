import { redirect } from "next/navigation";

// Goals now lives at the bottom of the Inspiration page.
export default function GoalsPage() {
  redirect("/inspiration");
}
