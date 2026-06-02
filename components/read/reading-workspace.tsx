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
          <p className="plan-kicker">第四阶段</p>
          <h1>{initialNovel.novelTitle}</h1>
          <p>
            审查已完成的手稿，精细修改所需文本段落，并在修稿完成后导出 Markdown
            打包文件。
          </p>
        </div>

        <div className="read-hero-actions">
          <a
            className="read-export-button"
            href={`/api/novel/${novelId}/export`}
          >
            导出 Markdown
          </a>
          <div className="read-hero-meta">
            <span>状态</span>
            <strong>{initialNovel.status}</strong>
          </div>
          <div className="read-hero-meta">
            <span>章节数</span>
            <strong>{chapters.length}</strong>
          </div>
        </div>
      </section>

      <section className="read-main-grid">
        <aside className="read-chapter-rail">
          <div className="read-section-heading">
            <p className="plan-kicker">手稿地图</p>
            <h2>章节列表</h2>
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
                    第 {chapter.chapterNumber} 章
                  </span>
                  <strong>{chapter.title}</strong>
                  <small>{chapter.wordCount} 字</small>
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
                  <p className="plan-kicker">当前章节</p>
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
                    阅读模式
                  </button>
                  <button
                    className={`read-mode-button ${
                      mode === "edit" ? "read-mode-button-active" : ""
                    }`}
                    onClick={() => setMode("edit")}
                    type="button"
                  >
                    编辑模式
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
                      实时字数: <strong>{activeChapter.content.length}</strong>
                    </span>
                    <span>
                      已保存字数: <strong>{activeChapter.wordCount}</strong>
                    </span>
                    {hasUnsavedChanges ? (
                      <span className="read-dirty-pill">未保存修改</span>
                    ) : (
                      <span className="read-clean-pill">已保存</span>
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
                            setErrorMessage("保存章节失败。");
                            return;
                          }

                          const result = (await response.json()) as {
                            newWordCount: number;
                          };
                          syncSavedState(
                            activeChapter.content,
                            result.newWordCount,
                          );
                          setMessage("修改已保存。");
                        });
                      }}
                      type="button"
                    >
                      {isSaving ? "保存中..." : "保存修改"}
                    </button>

                    <button
                      className="read-secondary-button"
                      disabled={isPolishing}
                      onClick={() => {
                        startPolishTransition(async () => {
                          setMessage(null);
                          setErrorMessage(null);

                          if (!editorRef.current) {
                            setErrorMessage("编辑器不可用。");
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
                              setErrorMessage("润色选中内容失败。");
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
                            setMessage("润色预览已就绪。");
                          } catch {
                            setErrorMessage("请在润色前先选择一段文本。");
                          }
                        });
                      }}
                      type="button"
                    >
                      {isPolishing ? "润色中..." : "润色选中内容"}
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
            <p className="plan-kicker">润色预览</p>
            <h2>满意后再替换</h2>
          </div>

          {polishPreview ? (
            <div className="read-preview-card">
              <div className="read-preview-block">
                <span>所选文本</span>
                <p>{polishPreview.originalText}</p>
              </div>
              <div className="read-preview-block">
                <span>润色结果</span>
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
                    setMessage("预览已应用于本地，请在准备好后点击保存。");
                    setErrorMessage(null);
                  }}
                  type="button"
                >
                  应用润色
                </button>

                <button
                  className="read-secondary-button"
                  onClick={() => {
                    setPolishPreview(null);
                    setMessage(null);
                  }}
                  type="button"
                >
                  放弃预览
                </button>
              </div>
            </div>
          ) : (
            <div className="read-preview-empty">
              <p>在编辑模式下选择一段非空文本，然后在此处请求润色预览。</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
