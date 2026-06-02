/** 从 7 列大纲 Markdown 表解析出的章节行 */
export type ParsedChapter = {
  chapterNumber: number;
  title: string;
  /** 该行 7 列内容的规范化文本，供 Phase 3 注入 */
  outlineSummary: string;
};

const TABLE_SEPARATOR = /^\|[\s\-:|]+\|$/;
const CHINESE_NUMERAL_MAP: Record<string, number> = {
  零: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

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

function normalizeChapterCell(value: string): string {
  return value
    .replace(/[*_`]/g, "")
    .replace(/[０-９]/g, (digit) =>
      String.fromCharCode(digit.charCodeAt(0) - 0xfee0),
    )
    .trim();
}

function parseChineseNumeral(value: string): number | null {
  if (!value) {
    return null;
  }

  if (value === "十") {
    return 10;
  }

  if (!value.includes("十")) {
    return value.split("").reduce<number | null>((total, char) => {
      const digit = CHINESE_NUMERAL_MAP[char];
      if (digit === undefined || total === null) {
        return null;
      }
      return total * 10 + digit;
    }, 0);
  }

  const [tensPart, onesPart = ""] = value.split("十");
  const tens =
    tensPart === ""
      ? 1
      : tensPart.split("").reduce<number | null>((total, char) => {
          const digit = CHINESE_NUMERAL_MAP[char];
          if (digit === undefined || total === null) {
            return null;
          }
          return total * 10 + digit;
        }, 0);
  const ones =
    onesPart === ""
      ? 0
      : onesPart.split("").reduce<number | null>((total, char) => {
          const digit = CHINESE_NUMERAL_MAP[char];
          if (digit === undefined || total === null) {
            return null;
          }
          return total * 10 + digit;
        }, 0);

  if (tens === null || ones === null) {
    return null;
  }

  return tens * 10 + ones;
}

function parseChapterNumber(cell: string): number | null {
  const normalized = normalizeChapterCell(cell);
  const directNumber = normalized.match(/^0*(\d+)$/);
  if (directNumber?.[1]) {
    return Number.parseInt(directNumber[1], 10);
  }

  const chapterNumber = normalized.match(
    /^第\s*([0-9零一二三四五六七八九十两]+)\s*章$/u,
  );
  if (!chapterNumber?.[1]) {
    return null;
  }

  if (/^\d+$/.test(chapterNumber[1])) {
    return Number.parseInt(chapterNumber[1], 10);
  }

  return parseChineseNumeral(chapterNumber[1]);
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

    const chapterNumber = parseChapterNumber(cells[0] ?? "");
    if (chapterNumber === null || Number.isNaN(chapterNumber)) {
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
