import { notFound } from "next/navigation";

import { PlanDashboardPreview } from "../../../components/plan/plan-dashboard-preview";

const PREVIEW_OUTLINE = `# Outline

城市广播塔在暴雨夜重启，一段被删改的灾难录音重新传播。林夏必须在三章内追索录音源头、识别同盟与背叛，并在最后一次直播前阻止更大规模的混乱。`;

const PREVIEW_CHARACTER_PROFILES = [
  {
    name: "林夏",
    role: "主角",
    summary: "前调查记者，擅长从残缺证据中追索因果。",
  },
  {
    name: "周岚",
    role: "盟友",
    summary: "广播工程师，掌握塔台旧系统的隐藏入口。",
  },
  {
    name: "顾亭",
    role: "对手",
    summary: "市政发言人，试图把灾难真相永久封存。",
  },
];

const PREVIEW_CHAPTERS = [
  {
    chapterNumber: 1,
    title: "雨夜信号",
    outlineSummary:
      "章节定位: 开端 | 核心事件: 林夏在暴雨中收到失真录音并锁定广播塔 | 冲突升级: 未知黑客抢先一步删除备份 | 章节悬念: 她在录音里听见自己三年前的声音",
  },
  {
    chapterNumber: 2,
    title: "封存档案",
    outlineSummary:
      "章节定位: 深挖 | 核心事件: 林夏与周岚潜入旧档案室寻找广播塔维护记录 | 冲突升级: 顾亭派人封锁出口并切断电源 | 章节悬念: 维护记录显示事故当晚有第四名未登记值班者",
  },
  {
    chapterNumber: 3,
    title: "最后直播",
    outlineSummary:
      "章节定位: 对决 | 核心事件: 林夏在直播前恢复完整录音并对峙顾亭 | 冲突升级: 城市开始传播伪造警报引发恐慌 | 章节悬念: 直播按键按下前，周岚承认自己也删除过关键片段",
  },
];

export default function Task015PreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <PlanDashboardPreview
      chapters={PREVIEW_CHAPTERS}
      characterProfiles={PREVIEW_CHARACTER_PROFILES}
      outline={PREVIEW_OUTLINE}
    />
  );
}
