import { redirect } from "next/navigation";

/** Legacy route → clearer name for judges */
export default function AgentRedirect() {
  redirect("/insights");
}
