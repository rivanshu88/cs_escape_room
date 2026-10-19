import { EscapeRoom } from "@/components/EscapeRoom";
import { ESCAPE_CAMPAIGNS } from "@/lib/escapeRoom/campaigns";
import type { EscapeLanguage } from "@/lib/escapeRoom/types";

const LANGUAGES = new Set<EscapeLanguage>(["cpp", "python", "java"]);

function isEscapeLanguage(value: string): value is EscapeLanguage {
  return LANGUAGES.has(value as EscapeLanguage);
}

export default async function EscapeRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string | string[] }>;
}) {
  const { language: requestedLanguage } = await searchParams;
  const language =
    typeof requestedLanguage === "string" && isEscapeLanguage(requestedLanguage)
      ? requestedLanguage
      : null;

  return (
    <EscapeRoom
      key={language ?? "language-picker"}
      campaign={language ? ESCAPE_CAMPAIGNS[language] : null}
    />
  );
}
