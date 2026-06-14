import { redirect } from "next/navigation";

export default function OmbudsmanRedirectPage() {
  redirect("/dashboard/documents");
}
