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
  return "Request failed. Please try again.";
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
      setError("Please fill in the answer.");
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
      setSuggestion(
        "Suggested direction: tighten the conflict around a ticking deadline.",
      );
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

          setError("Please provide a valid chapter count.");
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
      setCandidateTitles([
        "Neon Meridian",
        "Signal Beneath the Glass Sky",
        "Blackout Protocol",
      ]);
      setSelectedTitle("Neon Meridian");
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

      setSuggestion(`Title confirmed: ${selectedTitle || "Neon Meridian"}`);
      return;
    }

    if (!draftId || !selectedTitle.trim()) {
      setError("Please choose a title first.");
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
          <p className="wizard-kicker">PHASE 1</p>
          <h1>Novel Creation Wizard</h1>
          <p>Progressive disclosure mode. One question at a time.</p>
        </header>

        {wizardState.phase === "layer1" ? (
          <section className="wizard-card">
            {currentStep === "q1" ? (
              <>
                <h2>Question 1 of 3</h2>
                <p className="wizard-label">Genre</p>
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
                      {option.starred ? <small>★ Preferred</small> : null}
                    </button>
                  ))}
                </div>
                <button
                  className="wizard-primary"
                  onClick={() => handleLayer1Submit("q1", coreAnswers.q1)}
                  type="button"
                >
                  Continue
                </button>
              </>
            ) : null}

            {currentStep === "q2" ? (
              <>
                <h2>Question 2 of 3</h2>
                <p className="wizard-label">Who is the protagonist?</p>
                <input
                  className="wizard-input"
                  onChange={(event) =>
                    setCoreAnswers((prev) => ({
                      ...prev,
                      q2: event.target.value,
                    }))
                  }
                  placeholder="Name, role, and identity"
                  value={coreAnswers.q2}
                />
                <button
                  className="wizard-primary"
                  onClick={() => handleLayer1Submit("q2", coreAnswers.q2)}
                  type="button"
                >
                  Continue
                </button>
              </>
            ) : null}

            {currentStep === "q3" ? (
              <>
                <h2>Question 3 of 3</h2>
                <p className="wizard-label">What is the core conflict?</p>
                <textarea
                  className="wizard-textarea"
                  onChange={(event) =>
                    setCoreAnswers((prev) => ({
                      ...prev,
                      q3: event.target.value,
                    }))
                  }
                  placeholder="Main tension, risk, and stakes"
                  rows={4}
                  value={coreAnswers.q3}
                />
                <button
                  className="wizard-primary"
                  onClick={() => handleLayer1Submit("q3", coreAnswers.q3)}
                  type="button"
                >
                  Continue
                </button>
              </>
            ) : null}

            {currentStep === "summary" ? (
              <>
                <h2>Layer 1 Summary</h2>
                <pre className="wizard-summary">
                  {buildLayer1Summary(wizardState.coreConfig)}
                </pre>
                <button
                  className="wizard-primary"
                  disabled={isPending}
                  onClick={handleEnterLayer2}
                  type="button"
                >
                  Enter Layer 2
                </button>
              </>
            ) : null}
          </section>
        ) : null}

        {wizardState.phase === "layer2" ? (
          <section className="wizard-card">
            <h2>Layer 2</h2>
            <p className="wizard-label">Deep customization</p>

            {wizardState.step === "q4" ? (
              <>
                <p className="wizard-question">Q4. Worldbuilding details</p>
                <textarea
                  className="wizard-textarea"
                  onChange={(event) =>
                    setLayer2Answers((prev) => ({
                      ...prev,
                      q4: event.target.value,
                    }))
                  }
                  placeholder="Optional world setup"
                  rows={4}
                  value={layer2Answers.q4}
                />
              </>
            ) : null}

            {wizardState.step === "q5" ? (
              <>
                <p className="wizard-question">Q5. Perspective and tone</p>
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
                      {option.starred ? <small>★ Preferred</small> : null}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {wizardState.step === "q6" ? (
              <>
                <p className="wizard-question">Q6. Theme</p>
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
                <p className="wizard-question">Q7. Audience</p>
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
                <p className="wizard-question">Q8. Chapter count</p>
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
                      {option.starred ? <small>★ Preferred</small> : null}
                    </button>
                  ))}
                </div>
              </>
            ) : null}

            {wizardState.step === "config-review" ? (
              <>
                <h3>Configuration Review</h3>
                <dl className="wizard-review-list">
                  <div>
                    <dt>Worldbuilding</dt>
                    <dd>{layer2Answers.q4 || "Default value will be used"}</dd>
                  </div>
                  <div>
                    <dt>Perspective</dt>
                    <dd>
                      {layer2Answers.q5Perspective ||
                        "Default value will be used"}
                    </dd>
                  </div>
                  <div>
                    <dt>Tone</dt>
                    <dd>
                      {layer2Answers.q5Tone || "Default value will be used"}
                    </dd>
                  </div>
                  <div>
                    <dt>Theme</dt>
                    <dd>{layer2Answers.q6 || "Default value will be used"}</dd>
                  </div>
                  <div>
                    <dt>Audience</dt>
                    <dd>{layer2Answers.q7 || "Default value will be used"}</dd>
                  </div>
                  <div>
                    <dt>Chapter count</dt>
                    <dd>{layer2Answers.q8 || "Default value will be used"}</dd>
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
                    Edit Settings
                  </button>
                  <button
                    className="wizard-primary"
                    disabled={isPending}
                    onClick={handleConfirmConfigAndTitles}
                    type="button"
                  >
                    Confirm Configuration
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
                  Skip This Question
                </button>
                <button
                  className="wizard-ghost"
                  onClick={handleSuggest}
                  type="button"
                >
                  Random Suggestion
                </button>
                <button
                  className="wizard-ghost"
                  onClick={() =>
                    setWizardState((prev) => jumpToChapterCount(prev))
                  }
                  type="button"
                >
                  Jump to Q8
                </button>
                <button
                  className="wizard-primary"
                  disabled={isPending}
                  onClick={handleLayer2Next}
                  type="button"
                >
                  Continue
                </button>
              </div>
            )}
          </section>
        ) : null}

        {wizardState.phase === "layer3" ? (
          <section className="wizard-card">
            <h2>Title candidates</h2>
            <p className="wizard-label">
              Choose one title or type your own custom title.
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
              placeholder="Custom title"
              value={selectedTitle}
            />
            <div className="wizard-action-row">
              <button
                className="wizard-primary"
                disabled={isPending}
                onClick={handleConfirmTitle}
                type="button"
              >
                Confirm Title
              </button>
            </div>
          </section>
        ) : null}

        {suggestion ? (
          <p className="wizard-info">Suggestion: {suggestion}</p>
        ) : null}
        {error ? <p className="wizard-error">{error}</p> : null}
      </section>
    </main>
  );
}
