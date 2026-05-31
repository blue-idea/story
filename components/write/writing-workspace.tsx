"use client";

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
      return "Connecting";
    case "connected":
      return "Streaming";
    case "completed":
      return "Completed";
    case "failed":
      return "Paused";
    default:
      return "Standing By";
  }
}

export function WritingWorkspace({
  novelId,
  initialWorkspace,
  streamUrl,
  startUrl,
}: WritingWorkspaceProps) {
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

  const renderedContent = deferredContent.slice(0, visibleCharacters);

  return (
    <main className="write-workspace-shell">
      <section className="write-hero-card">
        <div className="write-hero-copy">
          <p className="plan-kicker">PHASE 3</p>
          <h1>{workspaceState.title}</h1>
          <p>
            Serial writing is now streaming chapter by chapter, with validation
            checkpoints and fault recovery visible in one workspace.
          </p>
        </div>

        <div className="write-hero-meta">
          <div className="write-hero-stat">
            <span>Status</span>
            <strong>{getConnectionLabel(connectionState)}</strong>
          </div>
          <div className="write-hero-stat">
            <span>Active Chapter</span>
            <strong>{workspaceState.activeChapterNumber ?? "Waiting"}</strong>
          </div>
          <div className="write-hero-stat">
            <span>Visible Count</span>
            <strong>{renderedContent.length}</strong>
          </div>
        </div>
      </section>

      <section className="write-main-grid">
        <article className="write-terminal-panel">
          <div className="write-panel-heading">
            <div>
              <p className="plan-kicker">LIVE TERMINAL</p>
              <h2>Typewriter drafting stream</h2>
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
                  ? `Chapter ${activeChapter.chapterNumber} · ${activeChapter.title}`
                  : "Awaiting first chapter event"}
              </span>
              <strong>{renderedContent.length} chars</strong>
            </div>
            <pre className="write-draft-text">
              {renderedContent ||
                "The writing engine is warming up. Incoming prose will render here in real time."}
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
                <p className="plan-kicker">FAULT HOLD</p>
                <h3>Writing paused on a recoverable error.</h3>
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
                      setRetryMessage("Failed to restart writing.");
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
                {isRetryPending ? "Restarting..." : "Retry Chapter Writing"}
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
              <p className="plan-kicker">CHAPTER RADAR</p>
              <h2>Validation and retry board</h2>
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
