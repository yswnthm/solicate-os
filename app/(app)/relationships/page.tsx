import { redirect } from "next/navigation";

export default function RelationshipsPage() {
  redirect("/people?tab=relationships");
}
