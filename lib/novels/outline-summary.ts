export type OutlineSummaryItem = {
  label: string;
  value: string;
};

export function parseOutlineSummary(summary: string): OutlineSummaryItem[] {
  return summary
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf(":");
      if (separatorIndex === -1) {
        return null;
      }

      const label = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();

      if (!label || !value) {
        return null;
      }

      return { label, value };
    })
    .filter((item): item is OutlineSummaryItem => item !== null);
}

export function getOutlineSummaryLead(summary: string): string {
  const items = parseOutlineSummary(summary);
  const coreEvent = items.find((item) => item.label === "核心事件");

  if (coreEvent) {
    return coreEvent.value;
  }

  return items[0]?.value ?? summary.trim();
}
