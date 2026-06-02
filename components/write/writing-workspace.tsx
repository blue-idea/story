"use client";

import { useRouter } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
  useTransition,
} from "react";

import type { WritingWorkspacePayload } from "../../lib/novels/writing-service";
import {
  applyWritingEvent,
  createWritingWorkspaceState,
  resetWorkspaceError,
} from "../../lib/novels/writing-workspace-state";
import { ChapterStatusCard } from "./chapter-status-card";

type WritingWorkspaceProps = {
  novelId: string;
  initialWorkspace: WritingWorkspacePayload;
  streamUrl?: string;
  startUrl?: string;
};

type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "completed"
  | "failed";

type StreamEventName =
  | "chapter_start"
  | "content_chunk"
  | "validation_start"
  | "validation_result"
  | "chapter_complete"
  | "error"
  | "novel_complete";

function buildStreamUrl(baseUrl: string, streamRun: number) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}streamRun=${streamRun}`;
}

function getConnectionLabel(connectionState: ConnectionState) {
  switch (connectionState) {
    case "connecting":
      return "连接中";
    case "connected":
      return "生成中";
    case "completed":
      return "已完成";
    case "failed":
      return "已暂停";
    default:
      return "就绪";
  }
}

export function WritingWorkspace({
  novelId,
  initialWorkspace,
  streamUrl,
  startUrl,
}: WritingWorkspaceProps) {
  const router = useRouter();
  const [workspaceState, setWorkspaceState] = useState(() =>
    createWritingWorkspaceState(initialWorkspace),
  );
  const [streamRun, setStreamRun] = useState(0);
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    initialWorkspace.novelStatus === "completed"
      ? "completed"
      : initialWorkspace.novelStatus === "failed"
        ? "failed"
        : initialWorkspace.novelStatus === "in_progress"
          ? "connecting"
          : "idle",
  );
  const [visibleCharacters, setVisibleCharacters] = useState(0);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const [isRetryPending, startTransition] = useTransition();

  const resolvedStreamUrl = streamUrl ?? `/api/novel/${novelId}/write/stream`;
  const resolvedStartUrl = startUrl ?? `/api/novel/${novelId}/start-writing`;

  const activeChapter =
    workspaceState.chapters.find(
      (chapter) => chapter.chapterNumber === workspaceState.activeChapterNumber,
    ) ?? null;
  const deferredContent = useDeferredValue(activeChapter?.content ?? "");

  useEffect(() => {
    if (visibleCharacters >= deferredContent.length) {
      return;
    }

    const timer = window.setInterval(() => {
      setVisibleCharacters((current) =>
        Math.min(
          deferredContent.length,
          current +
            Math.max(1, Math.ceil((deferredContent.length - current) / 18)),
        ),
      );
    }, 18);

    return () => {
      window.clearInterval(timer);
    };
  }, [deferredContent, visibleCharacters]);

  const handleStreamEvent = useEffectEvent(
    (eventName: StreamEventName, payload: Record<string, unknown>) => {
      if (eventName === "chapter_start") {
        setVisibleCharacters(0);
      }

      setWorkspaceState((current) =>
        applyWritingEvent(current, eventName, payload as never),
      );

      if (eventName === "error") {
        setConnectionState("failed");
      } else if (eventName === "novel_complete") {
        setConnectionState("completed");
      } else {
        setConnectionState("connected");
      }
    },
  );

  useEffect(() => {
    if (workspaceState.novelStatus !== "in_progress") {
      return;
    }

    const eventSource = new EventSource(
      buildStreamUrl(resolvedStreamUrl, streamRun),
    );

    const eventNames: StreamEventName[] = [
      "chapter_start",
      "content_chunk",
      "validation_start",
      "validation_result",
      "chapter_complete",
      "error",
      "novel_complete",
    ];

    eventSource.onopen = () => {
      setConnectionState("connected");
    };

    for (const eventName of eventNames) {
      eventSource.addEventListener(eventName, (event) => {
        const payload = JSON.parse((event as MessageEvent).data) as Record<
          string,
          unknown
        >;
        handleStreamEvent(eventName, payload);

        if (eventName === "error" || eventName === "novel_complete") {
          eventSource.close();
        }
      });
    }

    eventSource.onerror = () => {
      eventSource.close();
      setConnectionState((current) =>
        current === "completed" || current === "failed" ? current : "idle",
      );
    };

    return () => {
      eventSource.close();
    };
  }, [resolvedStreamUrl, streamRun, workspaceState.novelStatus]);

  useEffect(() => {
    if (connectionState !== "completed") {
      return;
    }

    const timer = window.setTimeout(() => {
      router.replace(`/novel/${novelId}/read`);
    }, 1200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [connectionState, novelId, router]);

  const renderedContent = deferredContent.slice(0, visibleCharacters);

  return (
    <main className="write-workspace-shell">
      <section className="write-hero-card">
        <div className="write-hero-copy">
          <p className="plan-kicker">第三阶段</p>
          <h1>{workspaceState.title}</h1>
          <p>小说串行写作正在逐章流式生成，校验检查点与故障恢复实时可见。</p>
        </div>

        <div className="write-hero-meta">
          <div className="write-hero-stat">
            <span>状态</span>
            <strong>{getConnectionLabel(connectionState)}</strong>
          </div>
          <div className="write-hero-stat">
            <span>当前写作章节</span>
            <strong>{workspaceState.activeChapterNumber ?? "等待中"}</strong>
          </div>
          <div className="write-hero-stat">
            <span>已显示字数</span>
            <strong>{renderedContent.length}</strong>
          </div>
        </div>
      </section>

      <section className="write-main-grid">
        <article className="write-terminal-panel">
          <div className="write-panel-heading">
            <div>
              <p className="plan-kicker">实时终端</p>
              <h2>打字机写作流</h2>
            </div>
            <span
              className={`write-status-pill write-status-pill-large ${
                connectionState === "failed"
                  ? "write-status-failed"
                  : connectionState === "completed"
                    ? "write-status-completed"
                    : "write-status-writing"
              }`}
            >
              {getConnectionLabel(connectionState)}
            </span>
          </div>

          <div className="write-draft-surface">
            <div className="write-draft-meta">
              <span>
                {activeChapter
                  ? `第 ${activeChapter.chapterNumber} 章 · ${activeChapter.title}`
                  : "等待首章生成事件"}
              </span>
              <strong>{renderedContent.length} 字</strong>
            </div>
            <pre className="write-draft-text">
              {renderedContent ||
                "写作引擎正在准备中。生成的正文将实时渲染在此处。"}
            </pre>
          </div>

          <div className="write-log-panel">
            {workspaceState.terminalEntries.map((entry, index) => (
              <p
                className={`write-log-entry write-log-entry-${entry.tone}`}
                key={`${index}-${entry.message}`}
              >
                {entry.message}
              </p>
            ))}
          </div>

          {workspaceState.errorMessage ? (
            <section className="write-retry-panel">
              <div>
                <p className="plan-kicker">故障暂挂</p>
                <h3>因可恢复错误已暂停写作。</h3>
                <p>{workspaceState.errorMessage}</p>
              </div>

              <button
                className="write-retry-button"
                disabled={isRetryPending || !workspaceState.canRetry}
                onClick={() => {
                  startTransition(async () => {
                    setRetryMessage(null);

                    const response = await fetch(resolvedStartUrl, {
                      method: "POST",
                    });

                    if (!response.ok) {
                      setRetryMessage("重启写作失败。");
                      return;
                    }

                    setWorkspaceState((current) =>
                      resetWorkspaceError(current),
                    );
                    setConnectionState("connecting");
                    setStreamRun((current) => current + 1);
                  });
                }}
                type="button"
              >
                {isRetryPending ? "重启中..." : "重试本章写作"}
              </button>

              {retryMessage ? (
                <p className="plan-error-text">{retryMessage}</p>
              ) : null}
            </section>
          ) : null}
        </article>

        <aside className="write-sidebar-panel">
          <div className="write-panel-heading">
            <div>
              <p className="plan-kicker">章节雷达</p>
              <h2>校验与重试面板</h2>
            </div>
          </div>

          <div className="write-chapter-stack">
            {workspaceState.chapters.map((chapter) => (
              <ChapterStatusCard
                chapter={chapter}
                isActive={
                  chapter.chapterNumber === workspaceState.activeChapterNumber
                }
                key={chapter.chapterNumber}
              />
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
