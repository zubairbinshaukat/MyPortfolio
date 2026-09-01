import JsonLd from "./JsonLd";
import { rootGraph } from "@/lib/schema";

/**
 * The Person + WebSite + ProfilePage @graph, rendered once on the homepage.
 *
 * This is the node every other page's schema points at by @id, so it is what
 * merges the site, GitHub, LinkedIn and X into one entity in Google's
 * Knowledge Graph rather than four unrelated things with the same name.
 */
export default function SchemaOrg() {
  return <JsonLd graph={rootGraph()} />;
}
