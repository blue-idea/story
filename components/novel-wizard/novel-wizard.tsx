"use client";

import { useMemo, useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import {
  getProfessionOptionsByGenre,
  getStyleReferenceOptionsByGenre,
  getWorldDetailOptionsByGenre,
  LAYER1_Q1_GENRE_OPTIONS,
  LAYER1_Q2_PERSONALITY_OPTIONS,
  LAYER1_Q2_TYPE_OPTIONS,
  LAYER1_Q3_CONFLICT_OPTIONS,
  LAYER1_Q3_DRIVE_OPTIONS,
  LAYER2_Q4_WORLD_OPTIONS,
  LAYER2_Q5_PERSPECTIVE_OPTIONS,
  LAYER2_Q5_TONE_OPTIONS,
  LAYER2_Q6_THEME_OPTIONS,
  LAYER2_Q7_AUDIENCE_OPTIONS,
  LAYER2_Q8_CHAPTER_OPTIONS,
  LAYER2_Q8_SPECIAL_REQUIREMENT_OPTIONS,
  QA_CANDIDATE_TITLES,
  TITLE_RETRY_HINT_THRESHOLD,
  WIZARD_CUSTOM_CHAPTER_VALUE,
  WIZARD_FREE_TEXT_VALUE,
  WIZARD_RANDOM_VALUE,
} from "../../config/wizard-ui";
import type { UserPreferencesPayload } from "../../db/schema";
import {
  confirmWizardConfigRequest,
  createWizardDraftRequest,
  requestWizardTitles,
  updateWizardDraftRequest,
} from "../../lib/novels/wizard-api-client";
import {
  applyLayer1Answer,
  applyLayer2Answer,
  buildLayer1Summary,
  buildReviewSummary,
  buildCustomConfigFromLayer2Answers,
  createWizardUiState,
  enterLayer2,
  jumpToChapterCount,
  markConfigConfirmed,
  skipLayer2Question,
  sortOptionsByPreference,
  type Layer1Answers,
  type Layer2Answers,
} from "../../lib/novels/wizard-ui-state";

// SSE 规划事件载荷结构
type PlanningEventPayload = {
  message?: string;
  chunk?: string;
  novelId?: string;
  characters?: { name: string; role: string }[];
};

type NovelWizardProps = {
  initialPreferences: UserPreferencesPayload;
  qaMode?: boolean;
  qaNextHref?: string;
};

type Layer1DraftState = Layer1Answers & {
  q2TypeCustom: string;
  q2PersonalityCustom: string;
  q3ConflictCustom: string;
  q3DriveCustom: string;
};

type Layer2DraftState = Layer2Answers & {
  q4WorldCustom: string;
  q5PerspectiveCustom: string;
  q5ToneCustom: string;
  q6ThemeCustom: string;
  q7AudienceCustom: string;
  q8ChapterCustom: string;
  q8SpecialRequirementOption: string;
};

const INITIAL_LAYER1_DRAFT: Layer1DraftState = {
  q1Genre: "",
  q1Idea: "",
  q2Type: "",
  q2TypeCustom: "",
  q2Profession: "",
  q2Personality: "",
  q2PersonalityCustom: "",
  q2Supporting: "",
  q3Conflict: "",
  q3ConflictCustom: "",
  q3Drive: "",
  q3DriveCustom: "",
};

const INITIAL_LAYER2_DRAFT: Layer2DraftState = {
  q4World: "",
  q4WorldCustom: "",
  q4Details: "",
  q5Perspective: "",
  q5PerspectiveCustom: "",
  q5Tone: "",
  q5ToneCustom: "",
  q6Theme: "",
  q6ThemeCustom: "",
  q7Audience: "",
  q7AudienceCustom: "",
  q7StyleReference: "",
  q8ChapterCount: "",
  q8ChapterCustom: "",
  q8SpecialRequirementOption: "",
  q8SpecialRequirements: "",
};

const TITLE_TECHNIQUES = [
  "意象锚点",
  "冲突直指",
  "悬念提问",
  "命运反差",
  "世界观切口",
];

function requestFailedMessage() {
  return "Request failed. Please try again.";
}

function requireAnswerMessage() {
  return "Please answer the current question.";
}

function resolveSelectableValue(selectedValue: string, customValue = "") {
  if (selectedValue === WIZARD_FREE_TEXT_VALUE) {
    return customValue.trim();
  }

  return selectedValue.trim();
}

function parseCustomChapterCount(value: string) {
  const parsed = Number.parseInt(value.trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildRandomChoice(
  step: string,
  draft: Layer1DraftState & Layer2DraftState,
) {
  const genre = draft.q1Genre;

  if (step === "q4-world") {
    if (genre.includes("科幻")) {
      return "未来/科幻世界（科技水平、社会结构特殊）";
    }
    if (genre.includes("奇幻")) {
      return "完全虚构世界（需自建规则体系，如魔法/修真体系）";
    }
    if (genre.includes("武侠") || genre.includes("历史")) {
      return "架空历史（特定朝代或虚构朝代）";
    }
    return "现实世界（当代中国或其他现实背景）";
  }

  if (step === "q4-details") {
    return getWorldDetailOptionsByGenre(genre)[0] ?? "社会规则如何运转";
  }

  if (step === "q5-perspective") {
    return "第三人称限制视角（跟随主角的所见所感）";
  }

  if (step === "q5-tone") {
    return draft.q5Tone || "紧张刺激（快节奏、高冲突、悬念驱动）";
  }

  if (step === "q6-theme") {
    if (draft.q3Conflict.includes("复仇")) {
      return "正义与复仇（善恶对决、伸张正义）";
    }
    if (draft.q3Conflict.includes("生死")) {
      return "生存与希望（绝境中的人性光辉）";
    }
    return "成长与蜕变（主角的内在变化是核心）";
  }

  if (step === "q7-audience") {
    if (genre.includes("科幻") || genre.includes("悬疑")) {
      return "成熟读者（偏好深度、文学性、思想性）";
    }
    return "大众读者（番茄小说/网络文学受众，追求爽感和代入感）";
  }

  if (step === "q7-style-reference") {
    return getStyleReferenceOptionsByGenre(genre)[0] ?? "东野圭吾";
  }

  if (step === "q8-chapter-count") {
    return "20章（中篇，约6-10万字）⭐";
  }

  if (step === "q8-special-requirements") {
    return "没有特殊要求，按标准来";
  }

  return "";
}

function buildTitleDescription(title: string, index: number, genre: string) {
  const technique =
    TITLE_TECHNIQUES[index % TITLE_TECHNIQUES.length] ?? "意象锚点";
  return {
    title,
    technique,
    explanation: `使用${technique}强化${genre || "故事"}识别度，让标题更容易承接已选冲突与基调。`,
  };
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
  const [layer1Draft, setLayer1Draft] =
    useState<Layer1DraftState>(INITIAL_LAYER1_DRAFT);
  const [layer2Draft, setLayer2Draft] =
    useState<Layer2DraftState>(INITIAL_LAYER2_DRAFT);
  const [candidateTitles, setCandidateTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  // 新增流式故事规划状态
  const [isPlanningProgress, setIsPlanningProgress] = useState(false);
  const [planningState, setPlanningState] = useState<
    "idle" | "init" | "outline" | "characters" | "saving" | "complete" | "error"
  >("idle");
  const [planningProgress, setPlanningProgress] = useState(0);
  const [planningLogs, setPlanningLogs] = useState<
    { timestamp: string; message: string; type: "info" | "success" | "error" }[]
  >([]);
  const [streamOutline, setStreamOutline] = useState("");
  const [streamCharacters, setStreamCharacters] = useState("");

  const addLog = (
    message: string,
    type: "info" | "success" | "error" = "info",
  ) => {
    const timeStr = new Date().toLocaleTimeString();
    setPlanningLogs((prev) => [...prev, { timestamp: timeStr, message, type }]);
  };

  const sortedGenreOptions = useMemo(
    () =>
      sortOptionsByPreference(
        LAYER1_Q1_GENRE_OPTIONS,
        initialPreferences.preferredGenres,
      ),
    [initialPreferences.preferredGenres],
  );

  const sortedToneOptions = useMemo(() => {
    if (!initialPreferences.defaultTone) {
      return LAYER2_Q5_TONE_OPTIONS.map((option) => ({
        ...option,
        starred: false,
      }));
    }

    return sortOptionsByPreference(LAYER2_Q5_TONE_OPTIONS, [
      initialPreferences.defaultTone,
    ]);
  }, [initialPreferences.defaultTone]);

  const sortedChapterOptions = useMemo(() => {
    if (!initialPreferences.defaultChapterCount) {
      return LAYER2_Q8_CHAPTER_OPTIONS.map((option) => ({
        ...option,
        starred: false,
      }));
    }

    return sortOptionsByPreference(LAYER2_Q8_CHAPTER_OPTIONS, [
      String(initialPreferences.defaultChapterCount),
    ]);
  }, [initialPreferences.defaultChapterCount]);

  const titleCards = useMemo(
    () =>
      candidateTitles.map((title, index) =>
        buildTitleDescription(title, index, layer1Draft.q1Genre),
      ),
    [candidateTitles, layer1Draft.q1Genre],
  );

  const professionOptions = useMemo(
    () => getProfessionOptionsByGenre(layer1Draft.q1Genre),
    [layer1Draft.q1Genre],
  );

  const worldDetailOptions = useMemo(
    () => getWorldDetailOptionsByGenre(layer1Draft.q1Genre),
    [layer1Draft.q1Genre],
  );

  const styleReferenceOptions = useMemo(
    () => getStyleReferenceOptionsByGenre(layer1Draft.q1Genre),
    [layer1Draft.q1Genre],
  );

  function updateLayer1Draft<K extends keyof Layer1DraftState>(
    key: K,
    value: Layer1DraftState[K],
  ) {
    setLayer1Draft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateLayer2Draft<K extends keyof Layer2DraftState>(
    key: K,
    value: Layer2DraftState[K],
  ) {
    setLayer2Draft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function applyRandomAnswer(step: string) {
    const generated = buildRandomChoice(step, {
      ...layer1Draft,
      ...layer2Draft,
    });

    if (!generated) {
      return;
    }

    setSuggestion(`已随机生成：${generated}`);

    if (step === "q4-world") {
      updateLayer2Draft("q4World", generated);
    }
    if (step === "q4-details") {
      updateLayer2Draft("q4Details", generated);
    }
    if (step === "q5-perspective") {
      updateLayer2Draft("q5Perspective", generated);
    }
    if (step === "q5-tone") {
      updateLayer2Draft("q5Tone", generated);
    }
    if (step === "q6-theme") {
      updateLayer2Draft("q6Theme", generated);
    }
    if (step === "q7-audience") {
      updateLayer2Draft("q7Audience", generated);
    }
    if (step === "q7-style-reference") {
      updateLayer2Draft("q7StyleReference", generated);
    }
    if (step === "q8-chapter-count") {
      updateLayer2Draft("q8ChapterCount", generated);
    }
    if (step === "q8-special-requirements") {
      updateLayer2Draft("q8SpecialRequirementOption", generated);
      updateLayer2Draft("q8SpecialRequirements", generated);
    }
  }

  function handleLayer1Submit() {
    setError(null);
    setSuggestion(null);

    if (wizardState.step === "q1") {
      const value = resolveSelectableValue(layer1Draft.q1Genre);
      if (!value) {
        setError(requireAnswerMessage());
        return;
      }
      setWizardState((prev) => {
        const next = applyLayer1Answer(prev, "q1", value);
        next.layer1Answers.q1Idea = layer1Draft.q1Idea.trim();
        next.coreConfig = {
          ...next.coreConfig,
          genre: `${value}${layer1Draft.q1Idea.trim() ? ` | 创意概要：${layer1Draft.q1Idea.trim()}` : ""}`,
        };
        return next;
      });
      return;
    }

    if (wizardState.step === "q2-type") {
      const value = resolveSelectableValue(
        layer1Draft.q2Type,
        layer1Draft.q2TypeCustom,
      );
      if (!value) {
        setError(requireAnswerMessage());
        return;
      }
      setWizardState((prev) => applyLayer1Answer(prev, "q2-type", value));
      return;
    }

    if (wizardState.step === "q2-profession") {
      const value = layer1Draft.q2Profession.trim();
      if (!value) {
        setError(requireAnswerMessage());
        return;
      }
      setWizardState((prev) => applyLayer1Answer(prev, "q2-profession", value));
      return;
    }

    if (wizardState.step === "q2-personality") {
      const value = resolveSelectableValue(
        layer1Draft.q2Personality,
        layer1Draft.q2PersonalityCustom,
      );
      if (!value) {
        setError(requireAnswerMessage());
        return;
      }
      setWizardState((prev) =>
        applyLayer1Answer(prev, "q2-personality", value),
      );
      return;
    }

    if (wizardState.step === "q2-supporting") {
      setWizardState((prev) =>
        applyLayer1Answer(prev, "q2-supporting", layer1Draft.q2Supporting),
      );
      return;
    }

    if (wizardState.step === "q3-conflict") {
      const value = resolveSelectableValue(
        layer1Draft.q3Conflict,
        layer1Draft.q3ConflictCustom,
      );
      if (!value) {
        setError(requireAnswerMessage());
        return;
      }
      setWizardState((prev) => applyLayer1Answer(prev, "q3-conflict", value));
      return;
    }

    if (wizardState.step === "q3-drive") {
      const value = resolveSelectableValue(
        layer1Draft.q3Drive,
        layer1Draft.q3DriveCustom,
      );
      if (!value) {
        setError(requireAnswerMessage());
        return;
      }
      setWizardState((prev) => applyLayer1Answer(prev, "q3-drive", value));
    }
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
          const draft = await createWizardDraftRequest(wizardState.coreConfig);
          activeDraftId = draft.novelId;
          setDraftId(activeDraftId);
        }

        setWizardState((prev) => enterLayer2(prev));
      } catch {
        setError(requestFailedMessage());
      }
    });
  }

  async function persistLayer2Patch(step: string, value: string) {
    if (!draftId) {
      return;
    }

    if (step === "q4-world" || step === "q4-details") {
      const customConfig = buildCustomConfigFromLayer2Answers({
        ...wizardState.layer2Answers,
        q4World:
          step === "q4-world" ? value : wizardState.layer2Answers.q4World,
        q4Details:
          step === "q4-details" ? value : wizardState.layer2Answers.q4Details,
      });
      if (customConfig.worldbuilding) {
        await updateWizardDraftRequest(draftId, {
          worldbuilding: customConfig.worldbuilding,
        });
      }
      return;
    }

    if (step === "q5-perspective") {
      await updateWizardDraftRequest(draftId, { perspective: value });
      return;
    }

    if (step === "q5-tone") {
      await updateWizardDraftRequest(draftId, { tone: value });
      return;
    }

    if (step === "q6-theme") {
      await updateWizardDraftRequest(draftId, { theme: value });
      return;
    }

    if (step === "q7-audience" || step === "q7-style-reference") {
      const customConfig = buildCustomConfigFromLayer2Answers({
        ...wizardState.layer2Answers,
        q7Audience:
          step === "q7-audience" ? value : wizardState.layer2Answers.q7Audience,
        q7StyleReference:
          step === "q7-style-reference"
            ? value
            : wizardState.layer2Answers.q7StyleReference,
      });
      if (customConfig.audience) {
        await updateWizardDraftRequest(draftId, {
          audience: customConfig.audience,
        });
      }
      return;
    }

    if (step === "q8-chapter-count") {
      const matched = value.match(/\d+/);
      const count = matched ? Number.parseInt(matched[0] ?? "", 10) : NaN;
      if (Number.isFinite(count) && count > 0) {
        await updateWizardDraftRequest(draftId, { chapterCount: count });
      }
    }
  }

  function handleLayer2Next() {
    if (wizardState.phase !== "layer2") {
      return;
    }

    const currentStep = wizardState.step;
    let value = "";
    let optional = false;

    if (currentStep === "q4-world") {
      value = resolveSelectableValue(
        layer2Draft.q4World,
        layer2Draft.q4WorldCustom,
      );
    }

    if (currentStep === "q4-details") {
      value = layer2Draft.q4Details.trim();
      optional = true;
    }

    if (currentStep === "q5-perspective") {
      value = resolveSelectableValue(
        layer2Draft.q5Perspective,
        layer2Draft.q5PerspectiveCustom,
      );
    }

    if (currentStep === "q5-tone") {
      value = resolveSelectableValue(
        layer2Draft.q5Tone,
        layer2Draft.q5ToneCustom,
      );
    }

    if (currentStep === "q6-theme") {
      value = resolveSelectableValue(
        layer2Draft.q6Theme,
        layer2Draft.q6ThemeCustom,
      );
    }

    if (currentStep === "q7-audience") {
      value = resolveSelectableValue(
        layer2Draft.q7Audience,
        layer2Draft.q7AudienceCustom,
      );
    }

    if (currentStep === "q7-style-reference") {
      value = layer2Draft.q7StyleReference.trim();
      optional = true;
    }

    if (currentStep === "q8-chapter-count") {
      if (layer2Draft.q8ChapterCount === WIZARD_CUSTOM_CHAPTER_VALUE) {
        const count = parseCustomChapterCount(layer2Draft.q8ChapterCustom);
        if (!count) {
          setError("Please enter a valid chapter count.");
          return;
        }
        value = `${count}章（自定义）`;
      } else {
        value = layer2Draft.q8ChapterCount.trim();
      }
    }

    if (currentStep === "q8-special-requirements") {
      value =
        layer2Draft.q8SpecialRequirementOption === WIZARD_FREE_TEXT_VALUE
          ? layer2Draft.q8SpecialRequirements.trim()
          : layer2Draft.q8SpecialRequirements.trim() ||
            layer2Draft.q8SpecialRequirementOption.trim();
      optional = true;
    }

    if (!optional && !value) {
      setError(requireAnswerMessage());
      return;
    }

    if (qaMode) {
      setError(null);
      setWizardState((prev) =>
        applyLayer2Answer(
          prev,
          currentStep as
            | "q4-world"
            | "q4-details"
            | "q5-perspective"
            | "q5-tone"
            | "q6-theme"
            | "q7-audience"
            | "q7-style-reference"
            | "q8-chapter-count"
            | "q8-special-requirements",
          value,
        ),
      );
      return;
    }

    if (!draftId) {
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        await persistLayer2Patch(currentStep, value);
        setWizardState((prev) =>
          applyLayer2Answer(
            prev,
            currentStep as
              | "q4-world"
              | "q4-details"
              | "q5-perspective"
              | "q5-tone"
              | "q6-theme"
              | "q7-audience"
              | "q7-style-reference"
              | "q8-chapter-count"
              | "q8-special-requirements",
            value,
          ),
        );
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
      setCandidateTitles(QA_CANDIDATE_TITLES.slice(0, 3));
      setSelectedTitle(QA_CANDIDATE_TITLES[0] ?? "");
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

  function handleRegenerateTitles() {
    if (qaMode) {
      setCandidateTitles(QA_CANDIDATE_TITLES.slice(2, 5));
      setSelectedTitle(QA_CANDIDATE_TITLES[2] ?? "");
      setWizardState((prev) => ({
        ...prev,
        titleRegenerationCount: prev.titleRegenerationCount + 1,
      }));
      return;
    }

    if (!draftId) {
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        const titles = await requestWizardTitles(draftId);
        setCandidateTitles(titles.candidateTitles);
        setSelectedTitle(titles.candidateTitles[0] ?? "");
        setWizardState((prev) => ({
          ...prev,
          titleRegenerationCount: prev.titleRegenerationCount + 1,
        }));
      } catch {
        setError(requestFailedMessage());
      }
    });
  }

  const handlePlanningEvent = (
    event: string,
    payload: PlanningEventPayload,
  ) => {
    switch (event) {
      case "init":
        setPlanningState("init");
        setPlanningProgress(10);
        addLog(payload.message || "初始化故事规划服务", "info");
        break;
      case "outline_start":
        setPlanningState("outline");
        setPlanningProgress(20);
        addLog(payload.message || "开始生成故事大纲结构...", "info");
        break;
      case "outline_chunk":
        setStreamOutline((prev) => prev + (payload.chunk || ""));
        setPlanningProgress((prev) => Math.min(60, prev + 0.05));
        break;
      case "outline_complete":
        setPlanningProgress(60);
        addLog(payload.message || "大纲起草完成！", "success");
        break;
      case "characters_start":
        setPlanningState("characters");
        setPlanningProgress(65);
        addLog(payload.message || "开始塑造人物设定档案...", "info");
        break;
      case "characters_chunk":
        setStreamCharacters((prev) => prev + (payload.chunk || ""));
        setPlanningProgress((prev) => Math.min(90, prev + 0.1));
        break;
      case "characters_complete":
        setPlanningProgress(90);
        addLog(payload.message || "角色设定生成完毕！", "success");
        if (payload.characters && Array.isArray(payload.characters)) {
          const charNames = payload.characters
            .map((c) => `${c.name} (${c.role})`)
            .join("、");
          addLog(`系统：提炼核心人物：${charNames}`, "info");
        }
        break;
      case "save_start":
        setPlanningState("saving");
        setPlanningProgress(95);
        addLog(payload.message || "正在将规划结果保存入库...", "info");
        break;
      case "save_complete":
        setPlanningProgress(98);
        addLog(payload.message || "规划大纲已成功固化！", "success");
        break;
      case "complete":
        setPlanningState("complete");
        setPlanningProgress(100);
        addLog(
          "系统：故事大纲与人物档案规划已全部就绪！即将进入工作台...",
          "success",
        );
        setTimeout(() => {
          router.push(`/novel/${payload.novelId}/plan`);
        }, 1200);
        break;
      case "error":
        setPlanningState("error");
        addLog(`故障：${payload.message || "AI 规划过程中止"}`, "error");
        break;
      default:
        break;
    }
  };

  async function startPlanningStream() {
    if (!draftId || !selectedTitle.trim()) {
      setError("Please choose or enter a title.");
      return;
    }

    setIsPlanningProgress(true);
    setPlanningState("init");
    setPlanningProgress(5);
    setPlanningLogs([]);
    setStreamOutline("");
    setStreamCharacters("");
    addLog(`系统：开始规划故事结构，选定小说标题为《${selectedTitle.trim()}》`);

    try {
      const response = await fetch(
        `/api/novel/${draftId}/confirm-title?stream=true`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: selectedTitle.trim() }),
        },
      );

      if (!response.ok || !response.body) {
        throw new Error("无法连接至规划引擎");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let currentEvent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          if (trimmed.startsWith("event: ")) {
            currentEvent = trimmed.slice(7).trim();
          } else if (trimmed.startsWith("data: ")) {
            const dataContent = trimmed.slice(5).trim();
            let payload: PlanningEventPayload = {};
            try {
              payload = JSON.parse(dataContent);
            } catch (_e) {
              continue;
            }
            handlePlanningEvent(currentEvent, payload);
          }
        }
      }
    } catch (err: unknown) {
      setPlanningState("error");
      const msg = err instanceof Error ? err.message : "规划通道异常中断";
      addLog(`故障：${msg}`, "error");
    }
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
      setError("Please choose or enter a title.");
      return;
    }

    startPlanningStream();
  }

  function renderOptionButton(
    option: { label: string; value: string; starred?: boolean },
    currentValue: string,
    onSelect: (value: string) => void,
  ) {
    return (
      <button
        className={`wizard-option ${currentValue === option.value ? "wizard-option-active" : ""}`}
        key={option.label}
        onClick={() => onSelect(option.value)}
        type="button"
      >
        <span>{option.label}</span>
        {option.starred ? <small>★ 偏好推荐</small> : null}
      </button>
    );
  }

  return (
    <main className="wizard-shell">
      <section className="wizard-frame">
        <header className="wizard-hero">
          <p className="wizard-kicker">第一阶段</p>
          <h1>小说创作向导</h1>
          <p>渐进式问答模式，每次仅显示一道问题。</p>
        </header>

        {isPlanningProgress ? (
          <section className="wizard-card wizard-planning-terminal">
            <div className="wizard-terminal-header">
              <div>
                <p className="wizard-kicker">系统规划中</p>
                <h2>AI 故事结构规划终端</h2>
              </div>
              <span
                className={`write-status-pill write-status-pill-large ${
                  planningState === "error"
                    ? "write-status-failed"
                    : planningState === "complete"
                      ? "write-status-completed"
                      : "write-status-writing"
                }`}
              >
                {planningState === "error"
                  ? "规划故障"
                  : planningState === "complete"
                    ? "规划完成"
                    : "正在构思"}
              </span>
            </div>

            <div className="terminal-progress-section">
              <div className="terminal-progress-bar-bg">
                <div
                  className="terminal-progress-bar-fill"
                  style={{ width: `${planningProgress}%` }}
                />
              </div>
              <div className="terminal-progress-labels">
                <span>规划总进度</span>
                <strong>{Math.round(planningProgress)}%</strong>
              </div>
            </div>

            <div className="terminal-workspace-grid">
              <div className="terminal-preview-surface">
                <div className="terminal-preview-meta">
                  <span>
                    {planningState === "outline"
                      ? "实时大纲构思预览"
                      : planningState === "characters"
                        ? "实时人物设定预览"
                        : "AI 构思预览"}
                  </span>
                  <strong>
                    {planningState === "outline"
                      ? `${streamOutline.length} 字`
                      : planningState === "characters"
                        ? `${streamCharacters.length} 字`
                        : "-"}
                  </strong>
                </div>
                <pre className="terminal-preview-text">
                  {planningState === "outline" ||
                  planningState === "characters" ||
                  planningState === "saving" ||
                  planningState === "complete"
                    ? planningState === "characters"
                      ? streamCharacters
                      : streamOutline || "AI 正在起草大纲框架..."
                    : "规划终端启动中，等待数据流建立..."}
                </pre>
              </div>

              <div className="terminal-log-panel">
                <div className="terminal-log-header">系统事件日志</div>
                <div className="terminal-log-rows">
                  {planningLogs.map((log, index) => (
                    <p
                      className={`terminal-log-row log-${log.type}`}
                      key={`${index}-${log.message}`}
                    >
                      <span className="log-time">[{log.timestamp}]</span>{" "}
                      <span className="log-text">{log.message}</span>
                    </p>
                  ))}
                  {planningState !== "complete" && planningState !== "error" ? (
                    <p className="terminal-log-row log-blink">
                      <span className="log-time">
                        [{new Date().toLocaleTimeString()}]
                      </span>{" "}
                      <span className="log-text">
                        AI 正在深度运算中<span className="dot-blink">...</span>
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {planningState === "error" ? (
              <div className="terminal-error-retry">
                <button
                  className="wizard-primary"
                  onClick={startPlanningStream}
                  type="button"
                >
                  重试规划故事结构
                </button>
              </div>
            ) : null}
          </section>
        ) : (
          <>
            {wizardState.phase === "layer1" ? (
              <section className="wizard-card">
                {wizardState.step === "q1" ? (
                  <>
                    <h2>问题 1 / 3</h2>
                    <p className="wizard-question">
                      你想要创作什么题材的小说？
                    </p>
                    <div className="wizard-option-grid">
                      {sortedGenreOptions.map((option) =>
                        renderOptionButton(
                          option,
                          layer1Draft.q1Genre,
                          (value) => updateLayer1Draft("q1Genre", value),
                        ),
                      )}
                    </div>
                    <textarea
                      className="wizard-textarea"
                      onChange={(event) =>
                        updateLayer1Draft("q1Idea", event.target.value)
                      }
                      placeholder="创意概要（可选，选择自由描述时建议填写）"
                      rows={3}
                      value={layer1Draft.q1Idea}
                    />
                    <button
                      className="wizard-primary"
                      onClick={handleLayer1Submit}
                      type="button"
                    >
                      继续
                    </button>
                  </>
                ) : null}

                {wizardState.step === "q2-type" ? (
                  <>
                    <h2>问题 2 / 3</h2>
                    <p className="wizard-question">主角是什么设定？</p>
                    <div className="wizard-option-grid">
                      {LAYER1_Q2_TYPE_OPTIONS.map((option) =>
                        renderOptionButton(
                          option,
                          layer1Draft.q2Type,
                          (value) => updateLayer1Draft("q2Type", value),
                        ),
                      )}
                    </div>
                    {layer1Draft.q2Type === WIZARD_FREE_TEXT_VALUE ? (
                      <input
                        className="wizard-input"
                        onChange={(event) =>
                          updateLayer1Draft("q2TypeCustom", event.target.value)
                        }
                        placeholder="输入你的自定义主角设定"
                        value={layer1Draft.q2TypeCustom}
                      />
                    ) : null}
                    <button
                      className="wizard-primary"
                      onClick={handleLayer1Submit}
                      type="button"
                    >
                      继续
                    </button>
                  </>
                ) : null}

                {wizardState.step === "q2-profession" ? (
                  <>
                    <h2>Q2 追问 1</h2>
                    <p className="wizard-question">
                      主角的职业或身份是？（简短回答即可）
                    </p>
                    <div className="wizard-option-grid">
                      {professionOptions.map((option) =>
                        renderOptionButton(
                          { label: option, value: option },
                          layer1Draft.q2Profession,
                          (value) => updateLayer1Draft("q2Profession", value),
                        ),
                      )}
                    </div>
                    <input
                      className="wizard-input"
                      onChange={(event) =>
                        updateLayer1Draft("q2Profession", event.target.value)
                      }
                      placeholder="自由输入职业或身份"
                      value={layer1Draft.q2Profession}
                    />
                    <button
                      className="wizard-primary"
                      onClick={handleLayer1Submit}
                      type="button"
                    >
                      继续
                    </button>
                  </>
                ) : null}

                {wizardState.step === "q2-personality" ? (
                  <>
                    <h2>Q2 追问 2</h2>
                    <p className="wizard-question">主角的核心性格是？</p>
                    <div className="wizard-option-grid">
                      {LAYER1_Q2_PERSONALITY_OPTIONS.map((option) =>
                        renderOptionButton(
                          option,
                          layer1Draft.q2Personality,
                          (value) => updateLayer1Draft("q2Personality", value),
                        ),
                      )}
                    </div>
                    {layer1Draft.q2Personality === WIZARD_FREE_TEXT_VALUE ? (
                      <input
                        className="wizard-input"
                        onChange={(event) =>
                          updateLayer1Draft(
                            "q2PersonalityCustom",
                            event.target.value,
                          )
                        }
                        placeholder="输入自定义性格描述"
                        value={layer1Draft.q2PersonalityCustom}
                      />
                    ) : null}
                    <button
                      className="wizard-primary"
                      onClick={handleLayer1Submit}
                      type="button"
                    >
                      继续
                    </button>
                  </>
                ) : null}

                {wizardState.step === "q2-supporting" ? (
                  <>
                    <h2>Q2 追问 3</h2>
                    <p className="wizard-question">
                      有没有已经想好的关键配角？比如对手、盟友、恋人？（可跳过）
                    </p>
                    <textarea
                      className="wizard-textarea"
                      onChange={(event) =>
                        updateLayer1Draft("q2Supporting", event.target.value)
                      }
                      placeholder="可选填写关键配角或关系网络"
                      rows={3}
                      value={layer1Draft.q2Supporting}
                    />
                    <div className="wizard-action-row">
                      <button
                        className="wizard-ghost"
                        onClick={() => updateLayer1Draft("q2Supporting", "")}
                        type="button"
                      >
                        清空
                      </button>
                      <button
                        className="wizard-primary"
                        onClick={handleLayer1Submit}
                        type="button"
                      >
                        继续
                      </button>
                    </div>
                  </>
                ) : null}

                {wizardState.step === "q3-conflict" ? (
                  <>
                    <h2>问题 3 / 3</h2>
                    <p className="wizard-question">小说的核心冲突是什么？</p>
                    <div className="wizard-option-grid">
                      {LAYER1_Q3_CONFLICT_OPTIONS.map((option) =>
                        renderOptionButton(
                          option,
                          layer1Draft.q3Conflict,
                          (value) => updateLayer1Draft("q3Conflict", value),
                        ),
                      )}
                    </div>
                    {layer1Draft.q3Conflict === WIZARD_FREE_TEXT_VALUE ? (
                      <textarea
                        className="wizard-textarea"
                        onChange={(event) =>
                          updateLayer1Draft(
                            "q3ConflictCustom",
                            event.target.value,
                          )
                        }
                        placeholder="输入自定义核心冲突"
                        rows={3}
                        value={layer1Draft.q3ConflictCustom}
                      />
                    ) : null}
                    <button
                      className="wizard-primary"
                      onClick={handleLayer1Submit}
                      type="button"
                    >
                      继续
                    </button>
                  </>
                ) : null}

                {wizardState.step === "q3-drive" ? (
                  <>
                    <h2>Q3 追问</h2>
                    <p className="wizard-question">
                      是什么推动主角不断向前？主角的内在驱动力是什么？
                    </p>
                    <div className="wizard-option-grid">
                      {LAYER1_Q3_DRIVE_OPTIONS.map((option) =>
                        renderOptionButton(
                          option,
                          layer1Draft.q3Drive,
                          (value) => updateLayer1Draft("q3Drive", value),
                        ),
                      )}
                    </div>
                    {layer1Draft.q3Drive === WIZARD_FREE_TEXT_VALUE ? (
                      <textarea
                        className="wizard-textarea"
                        onChange={(event) =>
                          updateLayer1Draft("q3DriveCustom", event.target.value)
                        }
                        placeholder="输入自定义驱动力"
                        rows={3}
                        value={layer1Draft.q3DriveCustom}
                      />
                    ) : null}
                    <button
                      className="wizard-primary"
                      onClick={handleLayer1Submit}
                      type="button"
                    >
                      完成第一层
                    </button>
                  </>
                ) : null}

                {wizardState.step === "summary" ? (
                  <>
                    <h2>第一层完成</h2>
                    <pre className="wizard-summary">
                      {buildLayer1Summary(wizardState.layer1Answers)}
                    </pre>
                    <p className="wizard-info">
                      核心定位已完成！接下来是深度定制环节（世界观、视角基调、主题、读者定位、章节数量等），每个问题都可以跳过或随机生成。准备好了吗？
                    </p>
                    <button
                      className="wizard-primary"
                      disabled={isPending}
                      onClick={handleEnterLayer2}
                      type="button"
                    >
                      进入第二层
                    </button>
                  </>
                ) : null}
              </section>
            ) : null}

            {wizardState.phase === "layer2" ? (
              <section className="wizard-card">
                <h2>第二层：深度定制与创作规格</h2>
                <p className="wizard-label">
                  每个问题都支持跳过、随机生成或直接跳转到 Q8。
                </p>

                {wizardState.step === "q4-world" ? (
                  <>
                    <p className="wizard-question">
                      Q4. 故事发生在什么样的世界？
                    </p>
                    <div className="wizard-option-grid">
                      {LAYER2_Q4_WORLD_OPTIONS.map((option) =>
                        renderOptionButton(
                          option,
                          layer2Draft.q4World,
                          (value) => {
                            if (value === WIZARD_RANDOM_VALUE) {
                              applyRandomAnswer("q4-world");
                              return;
                            }
                            updateLayer2Draft("q4World", value);
                          },
                        ),
                      )}
                    </div>
                    {layer2Draft.q4World === WIZARD_FREE_TEXT_VALUE ? (
                      <textarea
                        className="wizard-textarea"
                        onChange={(event) =>
                          updateLayer2Draft("q4WorldCustom", event.target.value)
                        }
                        placeholder="输入你的世界观设定"
                        rows={3}
                        value={layer2Draft.q4WorldCustom}
                      />
                    ) : null}
                  </>
                ) : null}

                {wizardState.step === "q4-details" ? (
                  <>
                    <p className="wizard-question">
                      Q4 追问：这个世界有什么独特的规则或设定要素？
                    </p>
                    <div className="wizard-option-grid">
                      {worldDetailOptions.map((option) =>
                        renderOptionButton(
                          { label: option, value: option },
                          layer2Draft.q4Details,
                          (value) => updateLayer2Draft("q4Details", value),
                        ),
                      )}
                      {renderOptionButton(
                        {
                          label: "暂时没想到，后面再定",
                          value: "暂时没想到，后面再定",
                        },
                        layer2Draft.q4Details,
                        (value) => updateLayer2Draft("q4Details", value),
                      )}
                    </div>
                    <textarea
                      className="wizard-textarea"
                      onChange={(event) =>
                        updateLayer2Draft("q4Details", event.target.value)
                      }
                      placeholder="简单描述规则、设定要素或留空"
                      rows={3}
                      value={layer2Draft.q4Details}
                    />
                  </>
                ) : null}

                {wizardState.step === "q5-perspective" ? (
                  <>
                    <p className="wizard-question">
                      Q5A. 你希望用什么视角讲故事？
                    </p>
                    <div className="wizard-option-grid">
                      {LAYER2_Q5_PERSPECTIVE_OPTIONS.map((option) =>
                        renderOptionButton(
                          option,
                          layer2Draft.q5Perspective,
                          (value) => {
                            if (value === WIZARD_RANDOM_VALUE) {
                              applyRandomAnswer("q5-perspective");
                              return;
                            }
                            updateLayer2Draft("q5Perspective", value);
                          },
                        ),
                      )}
                    </div>
                    {layer2Draft.q5Perspective === WIZARD_FREE_TEXT_VALUE ? (
                      <input
                        className="wizard-input"
                        onChange={(event) =>
                          updateLayer2Draft(
                            "q5PerspectiveCustom",
                            event.target.value,
                          )
                        }
                        placeholder="输入自定义叙事视角"
                        value={layer2Draft.q5PerspectiveCustom}
                      />
                    ) : null}
                  </>
                ) : null}

                {wizardState.step === "q5-tone" ? (
                  <>
                    <p className="wizard-question">Q5B. 故事的氛围风格是？</p>
                    <div className="wizard-option-grid">
                      {sortedToneOptions.map((option) =>
                        renderOptionButton(
                          option,
                          layer2Draft.q5Tone,
                          (value) => {
                            if (value === WIZARD_RANDOM_VALUE) {
                              applyRandomAnswer("q5-tone");
                              return;
                            }
                            updateLayer2Draft("q5Tone", value);
                          },
                        ),
                      )}
                    </div>
                    {layer2Draft.q5Tone === WIZARD_FREE_TEXT_VALUE ? (
                      <input
                        className="wizard-input"
                        onChange={(event) =>
                          updateLayer2Draft("q5ToneCustom", event.target.value)
                        }
                        placeholder="输入自定义整体基调"
                        value={layer2Draft.q5ToneCustom}
                      />
                    ) : null}
                  </>
                ) : null}

                {wizardState.step === "q6-theme" ? (
                  <>
                    <p className="wizard-question">
                      Q6. 这部小说最想表达的核心主题是什么？
                    </p>
                    <div className="wizard-option-grid">
                      {LAYER2_Q6_THEME_OPTIONS.map((option) =>
                        renderOptionButton(
                          option,
                          layer2Draft.q6Theme,
                          (value) => {
                            if (value === WIZARD_RANDOM_VALUE) {
                              applyRandomAnswer("q6-theme");
                              return;
                            }
                            updateLayer2Draft("q6Theme", value);
                          },
                        ),
                      )}
                    </div>
                    {layer2Draft.q6Theme === WIZARD_FREE_TEXT_VALUE ? (
                      <textarea
                        className="wizard-textarea"
                        onChange={(event) =>
                          updateLayer2Draft("q6ThemeCustom", event.target.value)
                        }
                        placeholder="输入自定义主题"
                        rows={3}
                        value={layer2Draft.q6ThemeCustom}
                      />
                    ) : null}
                  </>
                ) : null}

                {wizardState.step === "q7-audience" ? (
                  <>
                    <p className="wizard-question">Q7A. 主要写给谁看？</p>
                    <div className="wizard-option-grid">
                      {LAYER2_Q7_AUDIENCE_OPTIONS.map((option) =>
                        renderOptionButton(
                          option,
                          layer2Draft.q7Audience,
                          (value) => {
                            if (value === WIZARD_RANDOM_VALUE) {
                              applyRandomAnswer("q7-audience");
                              return;
                            }
                            updateLayer2Draft("q7Audience", value);
                          },
                        ),
                      )}
                    </div>
                    {layer2Draft.q7Audience === WIZARD_FREE_TEXT_VALUE ? (
                      <input
                        className="wizard-input"
                        onChange={(event) =>
                          updateLayer2Draft(
                            "q7AudienceCustom",
                            event.target.value,
                          )
                        }
                        placeholder="输入自定义目标读者"
                        value={layer2Draft.q7AudienceCustom}
                      />
                    ) : null}
                  </>
                ) : null}

                {wizardState.step === "q7-style-reference" ? (
                  <>
                    <p className="wizard-question">
                      Q7B. 有没有想模仿的作者或参考作品？（可跳过）
                    </p>
                    <div className="wizard-option-grid">
                      {styleReferenceOptions.map((option) =>
                        renderOptionButton(
                          { label: option, value: option },
                          layer2Draft.q7StyleReference,
                          (value) =>
                            updateLayer2Draft("q7StyleReference", value),
                        ),
                      )}
                      {renderOptionButton(
                        { label: "没有 / 不确定", value: "没有 / 不确定" },
                        layer2Draft.q7StyleReference,
                        (value) => updateLayer2Draft("q7StyleReference", value),
                      )}
                      {renderOptionButton(
                        { label: "🎲 随机生成", value: WIZARD_RANDOM_VALUE },
                        layer2Draft.q7StyleReference,
                        (value) => {
                          if (value === WIZARD_RANDOM_VALUE) {
                            applyRandomAnswer("q7-style-reference");
                          }
                        },
                      )}
                    </div>
                    <input
                      className="wizard-input"
                      onChange={(event) =>
                        updateLayer2Draft(
                          "q7StyleReference",
                          event.target.value,
                        )
                      }
                      placeholder="自由输入作者或参考作品"
                      value={layer2Draft.q7StyleReference}
                    />
                  </>
                ) : null}

                {wizardState.step === "q8-chapter-count" ? (
                  <>
                    <p className="wizard-question">Q8A. 你计划创作多少章？</p>
                    <div className="wizard-option-grid">
                      {sortedChapterOptions.map((option) =>
                        renderOptionButton(
                          option,
                          layer2Draft.q8ChapterCount,
                          (value) => updateLayer2Draft("q8ChapterCount", value),
                        ),
                      )}
                    </div>
                    {layer2Draft.q8ChapterCount ===
                    WIZARD_CUSTOM_CHAPTER_VALUE ? (
                      <input
                        className="wizard-input"
                        onChange={(event) =>
                          updateLayer2Draft(
                            "q8ChapterCustom",
                            event.target.value,
                          )
                        }
                        placeholder="输入具体章节数"
                        value={layer2Draft.q8ChapterCustom}
                      />
                    ) : null}
                  </>
                ) : null}

                {wizardState.step === "q8-special-requirements" ? (
                  <>
                    <p className="wizard-question">
                      Q8B. 有没有特殊要求？（均可跳过）
                    </p>
                    <div className="wizard-option-grid">
                      {LAYER2_Q8_SPECIAL_REQUIREMENT_OPTIONS.map((option) =>
                        renderOptionButton(
                          option,
                          layer2Draft.q8SpecialRequirementOption,
                          (value) => {
                            updateLayer2Draft(
                              "q8SpecialRequirementOption",
                              value,
                            );
                            if (value !== WIZARD_FREE_TEXT_VALUE) {
                              updateLayer2Draft("q8SpecialRequirements", value);
                            }
                          },
                        ),
                      )}
                    </div>
                    <textarea
                      className="wizard-textarea"
                      onChange={(event) =>
                        updateLayer2Draft(
                          "q8SpecialRequirements",
                          event.target.value,
                        )
                      }
                      placeholder="补充描述特殊要求，可留空"
                      rows={3}
                      value={layer2Draft.q8SpecialRequirements}
                    />
                  </>
                ) : null}

                {wizardState.step === "config-review" ? (
                  <>
                    <h3>创作配置确认</h3>
                    <pre className="wizard-summary">
                      {buildReviewSummary(
                        wizardState.layer1Answers,
                        wizardState.layer2Answers,
                      )}
                    </pre>
                    <div className="wizard-action-row">
                      <button
                        className="wizard-ghost"
                        onClick={() =>
                          setWizardState((prev) => ({
                            ...prev,
                            step: "q4-world",
                          }))
                        }
                        type="button"
                      >
                        我想修改某些设置
                      </button>
                      <button
                        className="wizard-primary"
                        disabled={isPending}
                        onClick={handleConfirmConfigAndTitles}
                        type="button"
                      >
                        确认，开始规划和创作！
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
                      onClick={() => applyRandomAnswer(wizardState.step)}
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
                      直接进 Q8
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
                <h2>第三层：标题生成</h2>
                <p className="wizard-label">
                  基于您的故事元素，以下是为您生成的候选标题，请选择：
                </p>
                {wizardState.titleRegenerationCount >
                TITLE_RETRY_HINT_THRESHOLD ? (
                  <p className="wizard-info">
                    您已尝试多轮选择，也可以直接在下方输入您心中的标题。
                  </p>
                ) : null}
                <div className="wizard-option-grid">
                  {titleCards.map((item) => (
                    <button
                      className={`wizard-option ${selectedTitle === item.title ? "wizard-option-active" : ""}`}
                      key={item.title}
                      onClick={() => setSelectedTitle(item.title)}
                      type="button"
                    >
                      <span>{`《${item.title}》`}</span>
                      <small>{`${item.technique}，${item.explanation}`}</small>
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
                    className="wizard-ghost"
                    disabled={isPending}
                    onClick={handleRegenerateTitles}
                    type="button"
                  >
                    重新生成一组新的候选标题
                  </button>
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
          </>
        )}

        {suggestion ? <p className="wizard-info">建议：{suggestion}</p> : null}
        {error ? <p className="wizard-error">{error}</p> : null}
      </section>
    </main>
  );
}
