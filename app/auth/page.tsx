import { redirect } from "next/navigation";

export default async function AuthPage() {
  redirect("/dashboard");
}
