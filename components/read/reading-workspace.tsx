"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import Link from "next/link";

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

  const [fontSize, setFontSize] = useState<number>(18);
  const [theme, setTheme] = useState<"beige" | "white" | "green" | "night">(
    "beige",
  );
  const [fontFamily, setFontFamily] = useState<
    "serif" | "sans" | "kai" | "song"
  >("serif");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  const activeIndex = chapters.findIndex(
    (chapter) => chapter.chapterNumber === activeChapterNumber,
  );
  const prevChapter = activeIndex > 0 ? chapters[activeIndex - 1] : null;
  const nextChapter =
    activeIndex >= 0 && activeIndex < chapters.length - 1
      ? chapters[activeIndex + 1]
      : null;

  // 动态注入 FontAwesome 库
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // 滚动进度条监听
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const limit = documentHeight - windowHeight;
      if (limit > 0) {
        setScrollPercent((scrollTop / limit) * 100);
      } else {
        setScrollPercent(0);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 键盘左右键翻页
  useEffect(() => {
    if (mode !== "read") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prevChapter) {
        setActiveChapterNumber(prevChapter.chapterNumber);
        setScrollPercent(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (e.key === "ArrowRight" && nextChapter) {
        setActiveChapterNumber(nextChapter.chapterNumber);
        setScrollPercent(0);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, prevChapter, nextChapter]);

  // 点击外部关闭设置面板
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest(".settings-panel") &&
        !target.closest(".toolbar-btn")
      ) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isSettingsOpen]);

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

  const readPercent =
    chapters.length > 0
      ? Math.round(((activeIndex + 1) / chapters.length) * 100)
      : 0;
  const readingTimeMin = activeChapter
    ? Math.ceil(activeChapter.content.length / 400)
    : 0;

  return (
    <main className={`read-page-shell theme-${theme}`}>
      <div
        className="progress-bar"
        id="progressBar"
        style={{ width: `${scrollPercent}%` }}
      />

      <aside
        className={`sidebar theme-white ${isSidebarOpen ? "" : "collapsed"}`}
        id="sidebar"
      >
        <div className="p-6 border-b border-gray-200">
          {/* <a
            href={`/novel/${novelId}/plan`}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition"
            style={{ textDecoration: "none", display: "flex", gap: "8px", alignItems: "center" }}
          >
            <i className="fas fa-arrow-left"></i>
            <span>返回大纲</span>
          </a> */}
          <h1
            className="text-lg font-semibold mb-2"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "inherit",
            }}
          >
            <i
              className="fas fa-book text-blue-500"
              style={{ fontSize: "16px" }}
            ></i>
            <span>
              {initialNovel.novelTitle
                .replace(/\*\*/g, "")
                .replace(/[《》]/g, "")
                .trim()}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mb-3"></p>
          <div
            className="flex items-center justify-between text-xs text-gray-400"
            style={{ display: "flex", justifyContent: "space-between" }}
          >
            <span>
              <i className="fas fa-book-open mr-1"></i>已读 {readPercent}%
            </span>
            <span className="reading-time">
              <i className="far fa-clock mr-1"></i>约 {readingTimeMin} 分钟
            </span>
          </div>
        </div>

        <nav className="py-4" id="chapterNav">
          {chapters.map((chapter) => {
            const isActive = chapter.chapterNumber === activeChapterNumber;
            const wordCountK = (chapter.wordCount / 1000).toFixed(1) + "k";
            return (
              <button
                key={chapter.chapterNumber}
                className={`chapter-item ${isActive ? "active" : ""}`}
                onClick={() => {
                  setActiveChapterNumber(chapter.chapterNumber);
                  setMessage(null);
                  setErrorMessage(null);
                  setPolishPreview(null);
                }}
                type="button"
              >
                <div
                  className="flex items-center gap-3"
                  style={{ display: "flex", gap: "12px", alignItems: "center" }}
                >
                  <i
                    className={`fas fa-chevron-right expand-icon text-xs ${isActive ? "text-blue-500" : "text-gray-400"}`}
                  ></i>
                  <span>
                    第 {chapter.chapterNumber} 章：{chapter.title}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{wordCountK}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="toolbar">
        <div
          className="toolbar-btn"
          id="toggleSidebar"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title="目录"
        >
          <i
            className={`fas ${isSidebarOpen ? "fa-times" : "fa-bars"} text-gray-700`}
          ></i>
        </div>
        <div
          className="toolbar-btn"
          id="settingsBtn"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          title="设置"
        >
          <i className="fas fa-cog text-gray-700"></i>
        </div>
        <div
          className="toolbar-btn"
          id="modeBtn"
          onClick={() => {
            setMode(mode === "read" ? "edit" : "read");
            setPolishPreview(null);
            setMessage(null);
            setErrorMessage(null);
          }}
          title={mode === "read" ? "编辑模式" : "阅读模式"}
        >
          <i
            className={`fas ${mode === "read" ? "fa-pencil-alt" : "fa-book-open"} text-gray-700`}
          ></i>
        </div>
        <a
          className="toolbar-btn"
          id="exportBtn"
          href={`/api/novel/${novelId}/export`}
          title="导出图书"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <i className="fas fa-file-export text-gray-700"></i>
        </a>
        <Link
          className="toolbar-btn"
          id="backToPlanBtn"
          href={`/novel/${novelId}/plan`}
          title="返回大纲"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <i className="fas fa-project-diagram text-gray-700"></i>
        </Link>
        <Link
          className="toolbar-btn"
          id="backToHomeBtn"
          href="/"
          title="返回首页"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          <i className="fas fa-home text-gray-700"></i>
        </Link>
      </div>

      {isSettingsOpen && (
        <div className="settings-panel active" id="settingsPanel">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">阅读设置</h3>

          <div className="mb-6" style={{ marginBottom: "1.5rem" }}>
            <label
              className="block text-sm font-medium text-gray-700 mb-3"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              主题
            </label>
            <div
              className="flex gap-3"
              style={{ display: "flex", gap: "12px" }}
            >
              {(["beige", "white", "green", "night"] as const).map((t) => (
                <div
                  key={t}
                  className={`theme-option ${t === theme ? "active" : ""}`}
                  onClick={() => setTheme(t)}
                  style={{
                    background:
                      t === "beige"
                        ? "#f5f1e8"
                        : t === "white"
                          ? "#ffffff"
                          : t === "green"
                            ? "#cce8cf"
                            : "#1a1a1a",
                    border: t === "white" ? "1px solid #e5e7eb" : undefined,
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    cursor: "pointer",
                  }}
                  title={
                    t === "beige"
                      ? "护眼米黄"
                      : t === "white"
                        ? "纯白"
                        : t === "green"
                          ? "淡雅绿"
                          : "夜间模式"
                  }
                />
              ))}
            </div>
          </div>

          <div className="mb-6" style={{ marginBottom: "1.5rem" }}>
            <label
              className="block text-sm font-medium text-gray-700 mb-3"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              字体
            </label>
            <div
              className="grid grid-cols-2 gap-2"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              {(["serif", "sans", "kai", "song"] as const).map((f) => (
                <button
                  key={f}
                  className={`font-btn px-4 py-2 text-sm border rounded-lg hover:border-blue-500 transition ${
                    f === fontFamily ? "active" : ""
                  } ${
                    f === "serif"
                      ? "font-serif"
                      : f === "sans"
                        ? "font-sans"
                        : f === "kai"
                          ? "font-kai"
                          : "font-song"
                  }`}
                  onClick={() => setFontFamily(f)}
                  type="button"
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: "none",
                    cursor: "pointer",
                  }}
                >
                  {f === "serif"
                    ? "宋体"
                    : f === "sans"
                      ? "黑体"
                      : f === "kai"
                        ? "楷体"
                        : "行楷"}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label
              className="block text-sm font-medium text-gray-700 mb-3"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: 500,
              }}
            >
              字号
            </label>
            <div
              className="flex items-center gap-4"
              style={{ display: "flex", alignItems: "center", gap: "16px" }}
            >
              <button
                onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                type="button"
                style={{
                  width: "40px",
                  height: "40px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className="fas fa-minus text-sm"></i>
              </button>
              <span
                className="text-sm font-medium min-w-[60px] text-center"
                style={{ minWidth: "50px", textAlign: "center" }}
              >
                {fontSize}px
              </span>
              <button
                onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                type="button"
                style={{
                  width: "40px",
                  height: "40px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  background: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className="fas fa-plus text-sm"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      <main
        className={`content-area ${!isSidebarOpen ? "expanded" : ""} ${mode === "edit" ? "editing-layout" : ""}`}
        id="contentArea"
      >
        <article
          className="max-w-3xl mx-auto px-8 py-16 relative"
          style={{ position: "relative" }}
        >
          {activeChapter ? (
            <>
              <header
                className="mb-16 text-center"
                style={{ textAlign: "center", marginBottom: "4rem" }}
              >
                <h2
                  className="text-4xl font-bold mb-6"
                  style={{
                    fontSize: "2.25rem",
                    fontWeight: 700,
                    marginBottom: "1.5rem",
                  }}
                >
                  {activeChapter.title}
                </h2>
                <div
                  className="flex items-center justify-center gap-6 text-sm text-gray-500"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "24px",
                  }}
                >
                  <span>
                    <i className="fas fa-file-alt mr-2"></i>
                    {activeChapter.content.length} 字
                  </span>
                  <span>
                    <i className="far fa-clock mr-2"></i>约 {readingTimeMin}{" "}
                    分钟
                  </span>
                </div>
              </header>

              {mode === "read" ? (
                <>
                  <div
                    className={`reader-content font-${fontFamily}`}
                    id="readerContent"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {splitParagraphs(activeChapter.content).map(
                      (paragraph, index) => {
                        const isMetaText =
                          paragraph.startsWith("【") ||
                          paragraph.startsWith("[") ||
                          paragraph.startsWith("场景");
                        return (
                          <p
                            key={`${index}-${paragraph.slice(0, 10)}`}
                            className={`chapter-paragraph ${isMetaText ? "no-indent" : ""}`}
                          >
                            {paragraph}
                          </p>
                        );
                      },
                    )}
                  </div>

                  <div
                    className="mt-16 pt-8 border-t border-gray-300 flex items-center justify-between"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "4rem",
                      paddingTop: "2rem",
                      borderTop: "1px solid rgba(0,0,0,0.12)",
                    }}
                  >
                    <button
                      className="px-6 py-3 text-gray-500 hover:text-gray-700 transition flex items-center gap-2"
                      disabled={!prevChapter}
                      onClick={() => {
                        if (prevChapter) {
                          setActiveChapterNumber(prevChapter.chapterNumber);
                          setScrollPercent(0);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: prevChapter ? "pointer" : "not-allowed",
                        opacity: prevChapter ? 1 : 0.5,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 24px",
                        borderRadius: "8px",
                      }}
                    >
                      <i className="fas fa-chevron-left"></i>
                      <span>
                        上一章{prevChapter ? `: ${prevChapter.title}` : ""}
                      </span>
                    </button>
                    <button
                      className="px-6 py-3 text-blue-600 hover:text-blue-700 transition flex items-center gap-2 font-medium"
                      disabled={!nextChapter}
                      onClick={() => {
                        if (nextChapter) {
                          setActiveChapterNumber(nextChapter.chapterNumber);
                          setScrollPercent(0);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      }}
                      type="button"
                      style={{
                        background: "none",
                        border: "none",
                        cursor: nextChapter ? "pointer" : "not-allowed",
                        opacity: nextChapter ? 1 : 0.5,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "12px 24px",
                        borderRadius: "8px",
                      }}
                    >
                      <span>
                        下一章{nextChapter ? `: ${nextChapter.title}` : ""}
                      </span>
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </>
              ) : (
                <div
                  className="read-editor-panel"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                  }}
                >
                  <div
                    className="read-editor-toolbar"
                    style={{
                      display: "flex",
                      gap: "1.5rem",
                      alignItems: "center",
                      paddingBottom: "0.5rem",
                      borderBottom: "1px solid rgba(0,0,0,0.08)",
                    }}
                  >
                    <span>
                      实时字数: <strong>{activeChapter.content.length}</strong>
                    </span>
                    <span>
                      已保存字数: <strong>{activeChapter.wordCount}</strong>
                    </span>
                    {hasUnsavedChanges ? (
                      <span
                        className="read-dirty-pill"
                        style={{
                          background: "#fee2e2",
                          color: "#991b1b",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                        }}
                      >
                        未保存修改
                      </span>
                    ) : (
                      <span
                        className="read-clean-pill"
                        style={{
                          background: "#dcfce7",
                          color: "#166534",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                        }}
                      >
                        已保存
                      </span>
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
                    style={{
                      width: "100%",
                      minHeight: "1200px",
                      padding: "1.25rem 1.5rem",
                      borderRadius: "12px",
                      border: "1.5px solid rgba(0,0,0,0.12)",
                      fontFamily: "inherit",
                      fontSize: "16px",
                      lineHeight: "1.8",
                      backgroundColor: "rgba(255,255,255,0.75)",
                      color: "inherit",
                      outline: "none",
                      resize: "vertical",
                      boxShadow: "inset 0 2px 8px rgba(0,0,0,0.04)",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                  />

                  <div
                    className="read-editor-actions"
                    style={{ display: "flex", gap: "12px" }}
                  >
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
                      className="read-polish-button"
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
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 22px",
                        borderRadius: "999px",
                        border: "none",
                        background: isPolishing
                          ? "linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)"
                          : "linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #4f46e5 100%)",
                        color: "#ffffff",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        letterSpacing: "0.02em",
                        cursor: isPolishing ? "not-allowed" : "pointer",
                        opacity: isPolishing ? 0.75 : 1,
                        boxShadow: isPolishing
                          ? "none"
                          : "0 4px 14px rgba(99, 102, 241, 0.45), 0 2px 6px rgba(139, 92, 246, 0.3)",
                        transition: "all 0.25s ease",
                      }}
                    >
                      <i
                        className={`fas ${
                          isPolishing ? "fa-spinner fa-spin" : "fa-magic"
                        }`}
                        style={{ fontSize: "0.9rem" }}
                      />
                      <span>
                        {isPolishing ? "AI 润色中..." : "AI 润色选中内容"}
                      </span>
                    </button>
                  </div>

                  {message ? (
                    <p
                      className="plan-success-text"
                      style={{ color: "#166534", fontSize: "0.875rem" }}
                    >
                      {message}
                    </p>
                  ) : null}
                  {errorMessage ? (
                    <p
                      className="plan-error-text"
                      style={{ color: "#991b1b", fontSize: "0.875rem" }}
                    >
                      {errorMessage}
                    </p>
                  ) : null}
                </div>
              )}
            </>
          ) : null}
        </article>

        {mode === "edit" && (
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
        )}
      </main>
    </main>
  );
}
