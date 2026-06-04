import type { CharacterProfile } from "../../db/schema";
import { parseOutlineSummary } from "../novels/outline-summary";

export type CompletedChapterMemory = {
  chapterNumber: number;
  title: string;
  chapterSummary: string;
  content: string;
};

export type NarrativeContext = {
  selectedProfiles: CharacterProfile[];
  summaryTimeline: string;
  previousExcerpt: string;
  perspectiveBoundary: string;
};

const EMPTY_SUMMARY_TIMELINE = "（首章暂无已完成章节摘要）";
const EMPTY_PREVIOUS_EXCERPT = "（首章无上文结尾片段）";

function normalizeNameToken(token: string): string {
  return token.replace(/[（(].*?[)）]/g, "").trim();
}

function extractCastNames(outlineRow: string): string[] {
  const items = parseOutlineSummary(outlineRow);
  const castItem = items.find((item) => item.label === "出场人物");
  if (!castItem) {
    return [];
  }

  return castItem.value
    .split(/[、,，/／;；\s]+/u)
    .map(normalizeNameToken)
    .filter(
      (name, index, allNames) =>
        name.length > 0 &&
        name !== "无" &&
        name !== "待定" &&
        allNames.indexOf(name) === index,
    );
}

function selectProfilesForChapter(
  profiles: CharacterProfile[],
  castNames: string[],
): CharacterProfile[] {
  if (castNames.length === 0) {
    return profiles;
  }

  const selected = castNames
    .map((castName) =>
      profiles.find(
        (profile) =>
          profile.name === castName || profile.name.includes(castName),
      ),
    )
    .filter((profile): profile is CharacterProfile => Boolean(profile));

  return selected.length > 0 ? selected : profiles;
}

function buildSummaryTimeline(
  completedChapters: CompletedChapterMemory[],
): string {
  if (completedChapters.length === 0) {
    return EMPTY_SUMMARY_TIMELINE;
  }

  return completedChapters
    .map(
      (chapter) =>
        `第${chapter.chapterNumber}章《${chapter.title}》：${chapter.chapterSummary.trim()}`,
    )
    .join("\n");
}

function buildPreviousExcerpt(
  completedChapters: CompletedChapterMemory[],
): string {
  const previousChapter = completedChapters.at(-1);
  if (!previousChapter) {
    return EMPTY_PREVIOUS_EXCERPT;
  }

  const paragraphs = previousChapter.content
    .split(/\n+/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const lastParagraph =
    paragraphs.at(-1) ??
    previousChapter.content.trim() ??
    EMPTY_PREVIOUS_EXCERPT;

  if (lastParagraph.length <= 220) {
    return lastParagraph;
  }

  return lastParagraph.slice(-220);
}

function resolveFocusCharacter(input: {
  perspective: string;
  protagonist: string;
  selectedProfiles: CharacterProfile[];
}): string {
  const protagonistProfile = input.selectedProfiles.find(
    (profile) => profile.name === input.protagonist,
  );

  return (
    protagonistProfile?.name ??
    input.selectedProfiles[0]?.name ??
    input.protagonist.trim() ??
    "当前核心角色"
  );
}

function buildPerspectiveBoundary(input: {
  perspective: string;
  protagonist: string;
  selectedProfiles: CharacterProfile[];
}): string {
  const perspective = input.perspective.trim() || "第三人称限制";
  const focusCharacter = resolveFocusCharacter(input);

  if (perspective.includes("第一人称")) {
    return `本章采用第一人称视角，视角主人为${focusCharacter}，只能描写该角色直接所见所闻所想，严禁越界透露其他角色尚未知晓的信息。`;
  }

  if (perspective.includes("全知")) {
    return "本章采用第三人称全知视角，可以覆盖多名角色与多条线索，但必须保持场景切换平滑、时间线连续，避免突兀跳转。";
  }

  return `本章采用第三人称限制视角，视角主人为${focusCharacter}，只能描写该角色直接所见所闻所想，严禁越界透露他人的隐藏动机或未公开事件。`;
}

export function buildNarrativeContext(input: {
  outlineRow: string;
  characterProfiles: CharacterProfile[];
  perspective: string;
  protagonist: string;
  completedChapters: CompletedChapterMemory[];
}): NarrativeContext {
  const castNames = extractCastNames(input.outlineRow);
  const selectedProfiles = selectProfilesForChapter(
    input.characterProfiles,
    castNames,
  );

  return {
    selectedProfiles,
    summaryTimeline: buildSummaryTimeline(input.completedChapters),
    previousExcerpt: buildPreviousExcerpt(input.completedChapters),
    perspectiveBoundary: buildPerspectiveBoundary({
      perspective: input.perspective,
      protagonist: input.protagonist,
      selectedProfiles,
    }),
  };
}
