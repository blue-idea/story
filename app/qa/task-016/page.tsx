import { notFound } from "next/navigation";

import { WritingWorkspace } from "../../../components/write/writing-workspace";

const PREVIEW_WORKSPACE = {
  title: "The Last Signal",
  novelStatus: "in_progress" as const,
  chapters: [
    {
      chapterNumber: 1,
      title: "雨夜信号",
      outlineSummary: "核心事件: 林夏锁定广播塔并截获失真录音",
      status: "pending" as const,
      content: "",
      retryCount: 0,
      passed: false,
      wordCountValid: false,
      suspenseValid: false,
      validationLog: null,
    },
    {
      chapterNumber: 2,
      title: "封存档案",
      outlineSummary: "核心事件: 潜入旧档案室寻找广播塔维护记录",
      status: "pending" as const,
      content: "",
      retryCount: 0,
      passed: false,
      wordCountValid: false,
      suspenseValid: false,
      validationLog: null,
    },
    {
      chapterNumber: 3,
      title: "最后直播",
      outlineSummary: "核心事件: 直播前恢复完整录音并公开真相",
      status: "pending" as const,
      content: "",
      retryCount: 0,
      passed: false,
      wordCountValid: false,
      suspenseValid: false,
      validationLog: null,
    },
  ],
};

export default function Task016PreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <WritingWorkspace
      initialWorkspace={PREVIEW_WORKSPACE}
      novelId="qa-task-016"
      startUrl="/qa/task-016/start"
      streamUrl="/qa/task-016/stream"
    />
  );
}
