import { DirectoryHome } from "@/components/DirectoryHome";

/** Same English directory as `/en`, kept so `/` works on static hosts without a rewrite. */
export default function RootHomePage() {
  return <DirectoryHome />;
}
