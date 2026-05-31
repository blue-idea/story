"use client";

import { useRef, useState, useTransition } from "react";

import type { ReadableNovelPayload } from "../../lib/novels/reader-service";
import {
  applyPolishReplacement,
  buildPolishSelectionPayload,
} from "../../lib/novels/read-editor";

type ReadingWorkspaceProps = {
  novelId: string;
  initialNovel: ReadableNovelPayload;
};

type ReadingChapterState = ReadableNovelPayload["chapters"][number] & {
  savedContent: string;
};

type PolishPreview = {
  chapterNumber: number;
  selectionStart: number;
  selectionEnd: number;
  originalText: string;
  polishedText: string;
};

function buildInitialChapters(
  chapters: ReadableNovelPayload["chapters"],
): ReadingChapterState[] {
  return chapters.map((chapter) => ({
    ...chapter,
    savedContent: chapter.content,
  }));
}

function splitParagraphs(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function ReadingWorkspace({
  novelId,
  initialNovel,
}: ReadingWorkspaceProps) {
  const [chapters, setChapters] = useState(() =>
    buildInitialChapters(initialNovel.chapters),
  );
  const [activeChapterNumber, setActiveChapterNumber] = useState<number>(
    initialNovel.chapters[0]?.chapterNumber ?? 1,
  );
  const [mode, setMode] = useState<"read" | "edit">("read");
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [polishPreview, setPolishPreview] = useState<PolishPreview | null>(
    null,
  );
  const [isSaving, startSavingTransition] = useTransition();
  const [isPolishing, startPolishTransition] = useTransition();
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const activeChapter =
    chapters.find((chapter) => chapter.chapterNumber === activeChapterNumber) ??
    chapters[0] ??
    null;

  const hasUnsavedChanges = activeChapter
    ? activeChapter.content !== activeChapter.savedContent
    : false;

  function updateActiveChapterContent(nextContent: string) {
    if (!activeChapter) {
      return;
    }

    setChapters((current) =>
      current.map((chapter) =>
        chapter.chapterNumber === activeChapter.chapterNumber
          ? {
              ...chapter,
              content: nextContent,
            }
          : chapter,
      ),
    );
  }

  function syncSavedState(nextContent: string, nextWordCount: number) {
    if (!activeChapter) {
      return;
    }

    setChapters((current) =>
      current.map((chapter) =>
        chapter.chapterNumber === activeChapter.chapterNumber
          ? {
              ...chapter,
              content: nextContent,
              savedContent: nextContent,
              wordCount: nextWordCount,
            }
          : chapter,
      ),
    );
  }

  return (
    <main className="read-page-shell">
      <section className="read-hero-card">
        <div className="read-hero-copy">
          <p className="plan-kicker">PHASE 4</p>
          <h1>{initialNovel.novelTitle}</h1>
          <p>
            Review the completed manuscript, refine the exact lines you want,
            and export a clean Markdown package when the revision pass feels
            right.
          </p>
        </div>

        <div className="read-hero-actions">
          <a
            className="read-export-button"
            href={`/api/novel/${novelId}/export`}
          >
            Export Markdown
          </a>
          <div className="read-hero-meta">
            <span>Status</span>
            <strong>{initialNovel.status}</strong>
          </div>
          <div className="read-hero-meta">
            <span>Chapters</span>
            <strong>{chapters.length}</strong>
          </div>
        </div>
      </section>

      <section className="read-main-grid">
        <aside className="read-chapter-rail">
          <div className="read-section-heading">
            <p className="plan-kicker">MANUSCRIPT MAP</p>
            <h2>Chapter stack</h2>
          </div>

          <div className="read-chapter-list">
            {chapters.map((chapter) => {
              const isActive = chapter.chapterNumber === activeChapterNumber;

              return (
                <button
                  className={`read-chapter-button ${
                    isActive ? "read-chapter-button-active" : ""
                  }`}
                  key={chapter.chapterNumber}
                  onClick={() => {
                    setActiveChapterNumber(chapter.chapterNumber);
                    setMessage(null);
                    setErrorMessage(null);
                    setPolishPreview(null);
                  }}
                  type="button"
                >
                  <span className="read-chapter-number">
                    Chapter {chapter.chapterNumber}
                  </span>
                  <strong>{chapter.title}</strong>
                  <small>{chapter.wordCount} chars</small>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="read-manuscript-panel">
          {activeChapter ? (
            <>
              <div className="read-panel-header">
                <div>
                  <p className="plan-kicker">ACTIVE CHAPTER</p>
                  <h2>{activeChapter.title}</h2>
                </div>

                <div className="read-mode-toggle">
                  <button
                    className={`read-mode-button ${
                      mode === "read" ? "read-mode-button-active" : ""
                    }`}
                    onClick={() => setMode("read")}
                    type="button"
                  >
                    Read Mode
                  </button>
                  <button
                    className={`read-mode-button ${
                      mode === "edit" ? "read-mode-button-active" : ""
                    }`}
                    onClick={() => setMode("edit")}
                    type="button"
                  >
                    Edit Mode
                  </button>
                </div>
              </div>

              {mode === "read" ? (
                <article className="read-manuscript-surface">
                  {splitParagraphs(activeChapter.content).map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </article>
              ) : (
                <div className="read-editor-panel">
                  <div className="read-editor-toolbar">
                    <span>
                      Live Count:{" "}
                      <strong>{activeChapter.content.length}</strong>
                    </span>
                    <span>
                      Saved Count: <strong>{activeChapter.wordCount}</strong>
                    </span>
                    {hasUnsavedChanges ? (
                      <span className="read-dirty-pill">Unsaved changes</span>
                    ) : (
                      <span className="read-clean-pill">Saved</span>
                    )}
                  </div>

                  <textarea
                    className="read-editor-textarea"
                    onChange={(event) => {
                      setMessage(null);
                      setErrorMessage(null);
                      updateActiveChapterContent(event.target.value);
                    }}
                    ref={editorRef}
                    value={activeChapter.content}
                  />

                  <div className="read-editor-actions">
                    <button
                      className="plan-primary-button"
                      disabled={isSaving || !hasUnsavedChanges}
                      onClick={() => {
                        startSavingTransition(async () => {
                          setMessage(null);
                          setErrorMessage(null);

                          const response = await fetch(
                            `/api/novel/${novelId}/chapter/${activeChapter.chapterNumber}`,
                            {
                              method: "PUT",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                content: activeChapter.content,
                              }),
                            },
                          );

                          if (!response.ok) {
                            setErrorMessage("Failed to save chapter.");
                            return;
                          }

                          const result = (await response.json()) as {
                            newWordCount: number;
                          };
                          syncSavedState(
                            activeChapter.content,
                            result.newWordCount,
                          );
                          setMessage("Changes saved.");
                        });
                      }}
                      type="button"
                    >
                      {isSaving ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      className="read-secondary-button"
                      disabled={isPolishing}
                      onClick={() => {
                        startPolishTransition(async () => {
                          setMessage(null);
                          setErrorMessage(null);

                          if (!editorRef.current) {
                            setErrorMessage("Editor is unavailable.");
                            return;
                          }

                          try {
                            const payload = buildPolishSelectionPayload({
                              content: activeChapter.content,
                              selectionStart: editorRef.current.selectionStart,
                              selectionEnd: editorRef.current.selectionEnd,
                            });

                            const response = await fetch(
                              `/api/novel/${novelId}/chapter/${activeChapter.chapterNumber}/polish`,
                              {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  selectedText: payload.selectedText,
                                  surroundingContext:
                                    payload.surroundingContext,
                                }),
                              },
                            );

                            if (!response.ok) {
                              setErrorMessage("Failed to polish selection.");
                              return;
                            }

                            const result = (await response.json()) as {
                              polishedText: string;
                            };

                            setPolishPreview({
                              chapterNumber: activeChapter.chapterNumber,
                              selectionStart: payload.selectionStart,
                              selectionEnd: payload.selectionEnd,
                              originalText: payload.selectedText,
                              polishedText: result.polishedText,
                            });
                            setMessage("Polish preview is ready.");
                          } catch {
                            setErrorMessage(
                              "Select some text before polishing.",
                            );
                          }
                        });
                      }}
                      type="button"
                    >
                      {isPolishing ? "Polishing..." : "Polish Selection"}
                    </button>
                  </div>

                  {message ? (
                    <p className="plan-success-text">{message}</p>
                  ) : null}
                  {errorMessage ? (
                    <p className="plan-error-text">{errorMessage}</p>
                  ) : null}
                </div>
              )}
            </>
          ) : null}
        </section>

        <aside className="read-preview-panel">
          <div className="read-section-heading">
            <p className="plan-kicker">POLISH PREVIEW</p>
            <h2>Replace only if it feels right</h2>
          </div>

          {polishPreview ? (
            <div className="read-preview-card">
              <div className="read-preview-block">
                <span>Selected Text</span>
                <p>{polishPreview.originalText}</p>
              </div>
              <div className="read-preview-block">
                <span>Polished Result</span>
                <p>{polishPreview.polishedText}</p>
              </div>

              <div className="read-preview-actions">
                <button
                  className="plan-primary-button"
                  onClick={() => {
                    if (
                      !activeChapter ||
                      polishPreview.chapterNumber !==
                        activeChapter.chapterNumber
                    ) {
                      return;
                    }

                    updateActiveChapterContent(
                      applyPolishReplacement({
                        content: activeChapter.content,
                        selectionStart: polishPreview.selectionStart,
                        selectionEnd: polishPreview.selectionEnd,
                        replacement: polishPreview.polishedText,
                      }),
                    );
                    setPolishPreview(null);
                    setMode("edit");
                    setMessage("Preview applied locally. Save when ready.");
                    setErrorMessage(null);
                  }}
                  type="button"
                >
                  Apply Polish
                </button>

                <button
                  className="read-secondary-button"
                  onClick={() => {
                    setPolishPreview(null);
                    setMessage(null);
                  }}
                  type="button"
                >
                  Discard Preview
                </button>
              </div>
            </div>
          ) : (
            <div className="read-preview-empty">
              <p>
                Select a non-empty range in Edit Mode, then request a polish
                preview here before replacing anything.
              </p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
