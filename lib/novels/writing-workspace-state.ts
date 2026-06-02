import type { ChapterStatus, NovelStatus } from "../../db/schema";

export type WritingWorkspaceChapterState = {
  chapterNumber: number;
  title: string;
  outlineSummary: string;
  status: ChapterStatus;
  content: string;
  retryCount: number;
  passed: boolean;
  wordCountValid: boolean;
  suspenseValid: boolean;
  validationLog: string | null;
};

export type WritingTerminalEntry = {
  tone: "info" | "success" | "error";
  message: string;
};

export type WritingWorkspaceState = {
  title: string;
  novelStatus: NovelStatus;
  activeChapterNumber: number | null;
  chapters: WritingWorkspaceChapterState[];
  terminalEntries: WritingTerminalEntry[];
  errorMessage: string | null;
  canRetry: boolean;
};

type WritingEventMap = {
  chapter_start: {
    chapterNumber: number;
    status: "writing";
  };
  content_chunk: {
    chapterNumber: number;
    chunk: string;
  };
  validation_start: {
    chapterNumber: number;
    status: "validating";
  };
  validation_result: {
    chapterNumber: number;
    passed: boolean;
    wordCountValid: boolean;
    suspenseValid: boolean;
    retryCount: number;
    diagnosticLog: string | null;
  };
  chapter_complete: {
    chapterNumber: number;
    status: "completed";
    content: string;
  };
  error: {
    chapterNumber: number | null;
    status: "failed";
    message: string;
  };
  novel_complete: {
    novelId: string;
    status: "completed";
  };
};

type WritingEventName = keyof WritingEventMap;

function appendTerminalEntry(
  state: WritingWorkspaceState,
  entry: WritingTerminalEntry,
): WritingTerminalEntry[] {
  return [...state.terminalEntries, entry];
}

function updateChapter(
  chapters: WritingWorkspaceChapterState[],
  chapterNumber: number,
  updater: (
    chapter: WritingWorkspaceChapterState,
  ) => WritingWorkspaceChapterState,
) {
  return chapters.map((chapter) =>
    chapter.chapterNumber === chapterNumber ? updater(chapter) : chapter,
  );
}

export function createWritingWorkspaceState(input: {
  title: string;
  novelStatus: NovelStatus;
  chapters: WritingWorkspaceChapterState[];
}): WritingWorkspaceState {
  return {
    title: input.title,
    novelStatus: input.novelStatus,
    activeChapterNumber: null,
    chapters: input.chapters,
    terminalEntries: [],
    errorMessage: null,
    canRetry: false,
  };
}

export function applyWritingEvent<TEventName extends WritingEventName>(
  state: WritingWorkspaceState,
  eventName: TEventName,
  payload: WritingEventMap[TEventName],
): WritingWorkspaceState {
  switch (eventName) {
    case "chapter_start": {
      const data = payload as WritingEventMap["chapter_start"];
      return {
        ...state,
        activeChapterNumber: data.chapterNumber,
        chapters: updateChapter(
          state.chapters,
          data.chapterNumber,
          (chapter) => ({
            ...chapter,
            status: data.status,
            content: "",
            validationLog: null,
          }),
        ),
        terminalEntries: appendTerminalEntry(state, {
          tone: "info",
          message: `第 ${data.chapterNumber} 章创作开始。`,
        }),
      };
    }

    case "content_chunk": {
      const data = payload as WritingEventMap["content_chunk"];
      return {
        ...state,
        chapters: updateChapter(
          state.chapters,
          data.chapterNumber,
          (chapter) => ({
            ...chapter,
            content: `${chapter.content}${data.chunk}`,
          }),
        ),
      };
    }

    case "validation_start": {
      const data = payload as WritingEventMap["validation_start"];
      return {
        ...state,
        chapters: updateChapter(
          state.chapters,
          data.chapterNumber,
          (chapter) => ({
            ...chapter,
            status: data.status,
          }),
        ),
        terminalEntries: appendTerminalEntry(state, {
          tone: "info",
          message: `第 ${data.chapterNumber} 章进入质量校验。`,
        }),
      };
    }

    case "validation_result": {
      const data = payload as WritingEventMap["validation_result"];
      return {
        ...state,
        chapters: updateChapter(
          state.chapters,
          data.chapterNumber,
          (chapter) => ({
            ...chapter,
            retryCount: data.retryCount,
            passed: data.passed,
            wordCountValid: data.wordCountValid,
            suspenseValid: data.suspenseValid,
            validationLog: data.diagnosticLog,
          }),
        ),
        terminalEntries: appendTerminalEntry(state, {
          tone: data.passed ? "success" : "info",
          message: data.passed
            ? `第 ${data.chapterNumber} 章通过质量校验。`
            : `第 ${data.chapterNumber} 章未通过校验，需要重新处理。`,
        }),
      };
    }

    case "chapter_complete": {
      const data = payload as WritingEventMap["chapter_complete"];
      return {
        ...state,
        chapters: updateChapter(
          state.chapters,
          data.chapterNumber,
          (chapter) => ({
            ...chapter,
            status: data.status,
            content: data.content,
            passed: true,
            wordCountValid: true,
            suspenseValid: true,
          }),
        ),
        terminalEntries: appendTerminalEntry(state, {
          tone: "success",
          message: `第 ${data.chapterNumber} 章创作完成。`,
        }),
      };
    }

    case "error": {
      const data = payload as WritingEventMap["error"];
      return {
        ...state,
        novelStatus: "failed",
        chapters:
          data.chapterNumber === null
            ? state.chapters
            : updateChapter(state.chapters, data.chapterNumber, (chapter) => ({
                ...chapter,
                status: data.status,
              })),
        errorMessage: data.message,
        canRetry: true,
        terminalEntries: appendTerminalEntry(state, {
          tone: "error",
          message: data.message,
        }),
      };
    }

    case "novel_complete": {
      const data = payload as WritingEventMap["novel_complete"];
      return {
        ...state,
        novelStatus: data.status,
        canRetry: false,
        terminalEntries: appendTerminalEntry(state, {
          tone: "success",
          message: "全书创作完成。",
        }),
      };
    }
  }
}

export function resetWorkspaceError(
  state: WritingWorkspaceState,
): WritingWorkspaceState {
  return {
    ...state,
    novelStatus: "in_progress",
    errorMessage: null,
    canRetry: false,
    terminalEntries: appendTerminalEntry(state, {
      tone: "info",
      message: "已请求重试。正在重新连接写作流。",
    }),
  };
}
