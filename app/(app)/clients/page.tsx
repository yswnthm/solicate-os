import { redirect } from "next/navigation";

export default function ClientsPage() {
  redirect("/people?tab=clients");
}
