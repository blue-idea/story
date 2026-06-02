"use client";

import { useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import {
  LAYER1_GENRE_OPTIONS,
  LAYER2_AUDIENCE_OPTIONS,
  LAYER2_CHAPTER_OPTIONS,
  LAYER2_PERSPECTIVE_OPTIONS,
  LAYER2_THEME_OPTIONS,
  LAYER2_TONE_OPTIONS,
} from "../../config/wizard-ui";
import type { UserPreferencesPayload } from "../../db/schema";
import {
  confirmWizardConfigRequest,
  confirmWizardTitleRequest,
  createWizardDraftRequest,
  requestWizardSuggestion,
  requestWizardTitles,
  updateWizardDraftRequest,
} from "../../lib/novels/wizard-api-client";
import {
  applyLayer1Answer,
  applyLayer2Answer,
  buildLayer1Summary,
  createWizardUiState,
  enterLayer2,
  jumpToChapterCount,
  markConfigConfirmed,
  skipLayer2Question,
  sortOptionsByPreference,
} from "../../lib/novels/wizard-ui-state";

type NovelWizardProps = {
  initialPreferences: UserPreferencesPayload;
  qaMode?: boolean;
  qaNextHref?: string;
};

type Layer2AnswerState = {
  q4: string;
  q5Perspective: string;
  q5Tone: string;
  q6: string;
  q7: string;
  q8: string;
};

const INITIAL_LAYER2_ANSWERS: Layer2AnswerState = {
  q4: "",
  q5Perspective: "",
  q5Tone: "",
  q6: "",
  q7: "",
  q8: "",
};

function requestFailedMessage() {
  return "请求失败，请重试。";
}

export function NovelWizard({
  initialPreferences,
  qaMode = false,
  qaNextHref,
}: NovelWizardProps) {
  const router = useRouter();
  const [wizardState, setWizardState] = useState(createWizardUiState);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [coreAnswers, setCoreAnswers] = useState({
    q1: "",
    q2: "",
    q3: "",
  });
  const [layer2Answers, setLayer2Answers] = useState<Layer2AnswerState>(
    INITIAL_LAYER2_ANSWERS,
  );
  const [candidateTitles, setCandidateTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const sortedGenreOptions = useMemo(
    () =>
      sortOptionsByPreference(
        LAYER1_GENRE_OPTIONS,
        initialPreferences.preferredGenres,
      ),
    [initialPreferences.preferredGenres],
  );

  const sortedToneOptions = useMemo(() => {
    if (!initialPreferences.defaultTone) {
      return LAYER2_TONE_OPTIONS.map((option) => ({
        ...option,
        starred: false,
      }));
    }

    return sortOptionsByPreference(LAYER2_TONE_OPTIONS, [
      initialPreferences.defaultTone,
    ]);
  }, [initialPreferences.defaultTone]);

  const sortedChapterOptions = useMemo(() => {
    if (!initialPreferences.defaultChapterCount) {
      return LAYER2_CHAPTER_OPTIONS.map((option) => ({
        ...option,
        starred: false,
      }));
    }

    return sortOptionsByPreference(LAYER2_CHAPTER_OPTIONS, [
      String(initialPreferences.defaultChapterCount),
    ]);
  }, [initialPreferences.defaultChapterCount]);

  const currentStep = wizardState.step;

  function handleLayer1Submit(questionId: "q1" | "q2" | "q3", value: string) {
    if (!value.trim()) {
      setError("请填写答案。");
      return;
    }

    setError(null);
    setSuggestion(null);
    setCoreAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    setWizardState((prev) => applyLayer1Answer(prev, questionId, value));
  }

  function handleEnterLayer2() {
    if (qaMode) {
      setDraftId("qa-novel");
      setWizardState((prev) => enterLayer2(prev));
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        let activeDraftId = draftId;

        if (!activeDraftId) {
          const draft = await createWizardDraftRequest({
            genre: coreAnswers.q1,
            protagonist: coreAnswers.q2,
            conflict: coreAnswers.q3,
          });
          activeDraftId = draft.novelId;
          setDraftId(activeDraftId);
        }

        setWizardState((prev) => enterLayer2(prev));
      } catch {
        setError(requestFailedMessage());
      }
    });
  }

  function handleSuggest() {
    if (qaMode) {
      setSuggestion("建议的写作方向：围绕一个紧迫的截止日期来强化冲突。");
      return;
    }

    if (!draftId || wizardState.phase !== "layer2") {
      return;
    }

    const questionId = wizardState.step;
    if (!["q4", "q5", "q6", "q7", "q8"].includes(questionId)) {
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        const response = await requestWizardSuggestion(draftId, questionId);
        setSuggestion(response.suggestion);

        if (questionId === "q4") {
          setLayer2Answers((prev) => ({
            ...prev,
            q4: response.suggestion,
          }));
        }

        if (questionId === "q6") {
          setLayer2Answers((prev) => ({
            ...prev,
            q6: response.suggestion,
          }));
        }

        if (questionId === "q7") {
          setLayer2Answers((prev) => ({
            ...prev,
            q7: response.suggestion,
          }));
        }
      } catch {
        setError(requestFailedMessage());
      }
    });
  }

  function handleLayer2Next() {
    if (qaMode && wizardState.phase === "layer2") {
      if (wizardState.step === "q4") {
        setWizardState((prev) =>
          applyLayer2Answer(prev, "q4", layer2Answers.q4),
        );
        return;
      }

      if (wizardState.step === "q5") {
        setWizardState((prev) =>
          applyLayer2Answer(
            prev,
            "q5",
            layer2Answers.q5Perspective || layer2Answers.q5Tone,
          ),
        );
        return;
      }

      if (wizardState.step === "q6") {
        setWizardState((prev) =>
          applyLayer2Answer(prev, "q6", layer2Answers.q6),
        );
        return;
      }

      if (wizardState.step === "q7") {
        setWizardState((prev) =>
          applyLayer2Answer(prev, "q7", layer2Answers.q7),
        );
        return;
      }

      if (wizardState.step === "q8") {
        const chapterCount = Number.parseInt(layer2Answers.q8 || "20", 10);
        setWizardState((prev) => applyLayer2Answer(prev, "q8", chapterCount));
      }
      return;
    }

    if (!draftId || wizardState.phase !== "layer2") {
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        if (wizardState.step === "q4") {
          const value = layer2Answers.q4.trim();
          if (value) {
            await updateWizardDraftRequest(draftId, { worldbuilding: value });
          }
          setWizardState((prev) => applyLayer2Answer(prev, "q4", value));
          return;
        }

        if (wizardState.step === "q5") {
          const perspective = layer2Answers.q5Perspective.trim();
          const tone = layer2Answers.q5Tone.trim();
          await updateWizardDraftRequest(draftId, {
            perspective,
            tone,
          });
          setWizardState((prev) =>
            applyLayer2Answer(prev, "q5", perspective || tone),
          );
          return;
        }

        if (wizardState.step === "q6") {
          const value = layer2Answers.q6.trim();
          if (value) {
            await updateWizardDraftRequest(draftId, { theme: value });
          }
          setWizardState((prev) => applyLayer2Answer(prev, "q6", value));
          return;
        }

        if (wizardState.step === "q7") {
          const value = layer2Answers.q7.trim();
          if (value) {
            await updateWizardDraftRequest(draftId, { audience: value });
          }
          setWizardState((prev) => applyLayer2Answer(prev, "q7", value));
          return;
        }

        if (wizardState.step === "q8") {
          const chapterCount = Number.parseInt(layer2Answers.q8, 10);
          if (Number.isFinite(chapterCount) && chapterCount > 0) {
            await updateWizardDraftRequest(draftId, { chapterCount });
            setWizardState((prev) =>
              applyLayer2Answer(prev, "q8", chapterCount),
            );
            return;
          }

          setError("请输入有效的章节数。");
        }
      } catch {
        setError(requestFailedMessage());
      }
    });
  }

  function handleConfirmConfigAndTitles() {
    if (
      qaMode &&
      wizardState.phase === "layer2" &&
      wizardState.step === "config-review"
    ) {
      setCandidateTitles(["霓虹子午线", "玻璃天空下的信号", "停电协议"]);
      setSelectedTitle("霓虹子午线");
      setWizardState((prev) => markConfigConfirmed(prev));
      return;
    }

    if (
      !draftId ||
      wizardState.phase !== "layer2" ||
      wizardState.step !== "config-review"
    ) {
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        await confirmWizardConfigRequest(draftId);
        const titles = await requestWizardTitles(draftId);
        setCandidateTitles(titles.candidateTitles);
        setSelectedTitle(titles.candidateTitles[0] ?? "");
        setWizardState((prev) => markConfigConfirmed(prev));
      } catch {
        setError(requestFailedMessage());
      }
    });
  }

  function handleConfirmTitle() {
    if (qaMode) {
      if (qaNextHref) {
        router.push(qaNextHref);
        return;
      }

      setSuggestion(`已确认标题：${selectedTitle || "霓虹子午线"}`);
      return;
    }

    if (!draftId || !selectedTitle.trim()) {
      setError("请先选择或输入一个标题。");
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        await confirmWizardTitleRequest(draftId, selectedTitle.trim());
        router.push(`/novel/${draftId}/plan`);
      } catch {
        setError(requestFailedMessage());
      }
    });
  }

  return (
    <main className="wizard-shell">
      <section className="wizard-frame">
        <header className="wizard-hero">
          <p className="wizard-kicker">第一阶段</p>
          <h1>小说创作向导</h1>
          <p>渐进式问答模式，每次仅显示一道问题。</p>
        </header>

        {wizardState.phase === "layer1" ? (
          <section className="wizard-card">
            {currentStep === "q1" ? (
              <>
                <h2>问题 1 / 3</h2>
                <p className="wizard-label">题材分类</p>
                <div className="wizard-option-grid">
                  {sortedGenreOptions.map((option) => (
                    <button
                      className={`wizard-option ${coreAnswers.q1 === option.value ? "wizard-option-active" : ""}`}
                      key={option.value}
                      onClick={() =>
                        setCoreAnswers((prev) => ({
                          ...prev,
                          q1: option.value,
                        }))
                      }
                      type="button"
                    >
                      <span>{option.label}</span>
                      {option.starred ? <small>★ 偏好推荐</small> : null}
                    </button>
                  ))}
                </div>
                <button
                  className="wizard-primary"
                  onClick={() => handleLayer1Submit("q1", coreAnswers.q1)}
                  type="button"
                >
                  继续
                </button>
              </>
            ) : null}

            {currentStep === "q2" ? (
              <>
                <h2>问题 2 / 3</h2>
                <p className="wizard-label">主角是谁？</p>
                <input
                  className="wizard-input"
                  onChange={(event) =>
                    setCoreAnswers((prev) => ({
                      ...prev,
                      q2: event.target.value,
                    }))
                  }
                  placeholder="姓名、角色与身份背景"
                  value={coreAnswers.q2}
                />
                <button
                  className="wizard-primary"
                  onClick={() => handleLayer1Submit("q2", coreAnswers.q2)}
                  type="button"
                >
                  继续
                </button>
              </>
            ) : null}

            {currentStep === "q3" ? (
              <>
                <h2>问题 3 / 3</h2>
                <p className="wizard-label">核心冲突是什么？</p>
                <textarea
                  className="wizard-textarea"
                  onChange={(event) =>
                    setCoreAnswers((prev) => ({
                      ...prev,
                      q3: event.target.value,
                    }))
                  }
                  placeholder="主要矛盾、危机与利益攸关点"
                  rows={4}
                  value={coreAnswers.q3}
                />
                <button
                  className="wizard-primary"
                  onClick={() => handleLayer1Submit("q3", coreAnswers.q3)}
                  type="button"
                >
                  继续
                </button>
              </>
            ) : null}

            {currentStep === "summary" ? (
              <>
                <h2>第一阶段摘要</h2>
                <pre className="wizard-summary">
                  {buildLayer1Summary(wizardState.coreConfig)}
                </pre>
                <button
                  className="wizard-primary"
                  disabled={isPending}
                  onClick={handleEnterLayer2}
                  type="button"
                >
                  进入深度定制
                </button>
              </>
            ) : null}
          </section>
        ) : null}

        {wizardState.phase === "layer2" ? (
          <section className="wizard-card">
            <h2>第二阶段</h2>
            <p className="wizard-label">深度定制</p>

            {wizardState.step === "q4" ? (
              <>
                <p className="wizard-question">Q4. 世界观细节</p>
                <textarea
                  className="wizard-textarea"
                  onChange={(event) =>
                    setLayer2Answers((prev) => ({
                      ...prev,
                      q4: event.target.value,
                    }))
                  }
                  placeholder="选填，世界观设定"
                  rows={4}
                  value={layer2Answers.q4}
                />
              </>
            ) : null}

            {wizardState.step === "q5" ? (
              <>
                <p className="wizard-question">Q5. 视角与基调</p>
                <div className="wizard-option-grid">
                  {LAYER2_PERSPECTIVE_OPTIONS.map((option) => (
                    <button
                      className={`wizard-option ${layer2Answers.q5Perspective === option.value ? "wizard-option-active" : ""}`}
                      key={option.value}
                      onClick={() =>
                        setLayer2Answers((prev) => ({
                          ...prev,
                          q5Perspective: option.value,
                        }))
                      }
                      type="button"
                    >
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
                <div className="wizard-option-grid">
                  {sortedToneOptions.map((option) => (
                    <button
                      className={`wizard-option ${layer2Answers.q5Tone === option.value ? "wizard-option-active" : ""}`}
                      key={option.value}
                      onClick={() =>
                        setLayer2Answers((prev) => ({
                          ...prev,
                          q5Tone: option.value,
                        }))
                      }
                      type="button"
                    >
                      <span>{option.label}</span>
                      {option.starred ? <small>★ 偏好推荐</small> : null}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {wizardState.step === "q6" ? (
              <>
                <p className="wizard-question">Q6. 主题</p>
                <div className="wizard-option-grid">
                  {LAYER2_THEME_OPTIONS.map((option) => (
                    <button
                      className={`wizard-option ${layer2Answers.q6 === option.value ? "wizard-option-active" : ""}`}
                      key={option.value}
                      onClick={() =>
                        setLayer2Answers((prev) => ({
                          ...prev,
                          q6: option.value,
                        }))
                      }
                      type="button"
                    >
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {wizardState.step === "q7" ? (
              <>
                <p className="wizard-question">Q7. 目标读者</p>
                <div className="wizard-option-grid">
                  {LAYER2_AUDIENCE_OPTIONS.map((option) => (
                    <button
                      className={`wizard-option ${layer2Answers.q7 === option.value ? "wizard-option-active" : ""}`}
                      key={option.value}
                      onClick={() =>
                        setLayer2Answers((prev) => ({
                          ...prev,
                          q7: option.value,
                        }))
                      }
                      type="button"
                    >
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {wizardState.step === "q8" ? (
              <>
                <p className="wizard-question">Q8. 章节数</p>
                <div className="wizard-option-grid">
                  {sortedChapterOptions.map((option) => (
                    <button
                      className={`wizard-option ${layer2Answers.q8 === option.value ? "wizard-option-active" : ""}`}
                      key={option.value}
                      onClick={() =>
                        setLayer2Answers((prev) => ({
                          ...prev,
                          q8: option.value,
                        }))
                      }
                      type="button"
                    >
                      <span>{option.label}</span>
                      {option.starred ? <small>★ 偏好推荐</small> : null}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {wizardState.step === "config-review" ? (
              <>
                <h3>配置确认</h3>
                <dl className="wizard-review-list">
                  <div>
                    <dt>世界观</dt>
                    <dd>{layer2Answers.q4 || "将使用默认值"}</dd>
                  </div>
                  <div>
                    <dt>视角</dt>
                    <dd>{layer2Answers.q5Perspective || "将使用默认值"}</dd>
                  </div>
                  <div>
                    <dt>基调</dt>
                    <dd>{layer2Answers.q5Tone || "将使用默认值"}</dd>
                  </div>
                  <div>
                    <dt>主题</dt>
                    <dd>{layer2Answers.q6 || "将使用默认值"}</dd>
                  </div>
                  <div>
                    <dt>目标读者</dt>
                    <dd>{layer2Answers.q7 || "将使用默认值"}</dd>
                  </div>
                  <div>
                    <dt>章节数</dt>
                    <dd>{layer2Answers.q8 || "将使用默认值"}</dd>
                  </div>
                </dl>
                <div className="wizard-action-row">
                  <button
                    className="wizard-ghost"
                    onClick={() =>
                      setWizardState((prev) => ({ ...prev, step: "q4" }))
                    }
                    type="button"
                  >
                    修改设置
                  </button>
                  <button
                    className="wizard-primary"
                    disabled={isPending}
                    onClick={handleConfirmConfigAndTitles}
                    type="button"
                  >
                    确认配置
                  </button>
                </div>
              </>
            ) : (
              <div className="wizard-action-row">
                <button
                  className="wizard-ghost"
                  onClick={() =>
                    setWizardState((prev) => skipLayer2Question(prev))
                  }
                  type="button"
                >
                  跳过此题
                </button>
                <button
                  className="wizard-ghost"
                  onClick={handleSuggest}
                  type="button"
                >
                  随机生成
                </button>
                <button
                  className="wizard-ghost"
                  onClick={() =>
                    setWizardState((prev) => jumpToChapterCount(prev))
                  }
                  type="button"
                >
                  跳转到 Q8
                </button>
                <button
                  className="wizard-primary"
                  disabled={isPending}
                  onClick={handleLayer2Next}
                  type="button"
                >
                  继续
                </button>
              </div>
            )}
          </section>
        ) : null}

        {wizardState.phase === "layer3" ? (
          <section className="wizard-card">
            <h2>候选标题</h2>
            <p className="wizard-label">
              选择一个标题，或者输入您自己的自定义标题。
            </p>
            <div className="wizard-option-grid">
              {candidateTitles.map((title) => (
                <button
                  className={`wizard-option ${selectedTitle === title ? "wizard-option-active" : ""}`}
                  key={title}
                  onClick={() => setSelectedTitle(title)}
                  type="button"
                >
                  <span>{title}</span>
                </button>
              ))}
            </div>
            <input
              className="wizard-input"
              onChange={(event) => setSelectedTitle(event.target.value)}
              placeholder="自定义标题"
              value={selectedTitle}
            />
            <div className="wizard-action-row">
              <button
                className="wizard-primary"
                disabled={isPending}
                onClick={handleConfirmTitle}
                type="button"
              >
                确认标题
              </button>
            </div>
          </section>
        ) : null}

        {suggestion ? <p className="wizard-info">建议：{suggestion}</p> : null}
        {error ? <p className="wizard-error">{error}</p> : null}
      </section>
    </main>
  );
}
