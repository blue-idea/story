/** 从 7 列大纲 Markdown 表解析出的章节行 */
export type ParsedChapter = {
  chapterNumber: number;
  title: string;
  /** 该行 7 列内容的规范化文本，供 Phase 3 注入 */
  outlineSummary: string;
};

const CHAPTER_CELL = /第\s*(\d+)\s*章/;
const TABLE_SEPARATOR = /^\|[\s\-:|]+\|$/;

const COLUMN_HEADERS = [
  "章节",
  "标题",
  "核心事件",
  "承接上章",
  "章首引子类型",
  "悬念钩子",
  "出场人物",
  "场景列表",
] as const;

function splitTableRow(line: string): string[] {
  return line
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell, index, arr) => index > 0 && index < arr.length - 1);
}

function formatOutlineSummary(cells: string[]): string {
  return cells
    .map(
      (cell, index) => `${COLUMN_HEADERS[index] ?? `列${index + 1}`}: ${cell}`,
    )
    .join(" | ");
}

/**
 * 从完整 outline Markdown 解析 7 列表格行 → chapters 落库结构
 */
export function parseChaptersFromOutline(outline: string): ParsedChapter[] {
  const chapters: ParsedChapter[] = [];

  for (const line of outline.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      continue;
    }
    if (TABLE_SEPARATOR.test(trimmed.replace(/\s/g, ""))) {
      continue;
    }

    const cells = splitTableRow(trimmed);
    if (cells.length < 2) {
      continue;
    }

    const chapterMatch = cells[0].match(CHAPTER_CELL);
    if (!chapterMatch) {
      continue;
    }

    const chapterNumber = Number.parseInt(chapterMatch[1], 10);
    if (Number.isNaN(chapterNumber)) {
      continue;
    }

    chapters.push({
      chapterNumber,
      title: cells[1] ?? "",
      outlineSummary: formatOutlineSummary(cells),
    });
  }

  return chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
}
