import { describe, expect, it } from "vitest";

import { getOutlineSummaryLead, parseOutlineSummary } from "./outline-summary";

describe("outline-summary", () => {
  it("把管道分隔的章节摘要解析为标签和值列表", () => {
    const result = parseOutlineSummary(
      "章节: 第1章 | 标题: 失踪信号 | 核心事件: 主角发现异常信号 | 悬念钩子: 未知坐标再次闪烁",
    );

    expect(result).toEqual([
      { label: "章节", value: "第1章" },
      { label: "标题", value: "失踪信号" },
      { label: "核心事件", value: "主角发现异常信号" },
      { label: "悬念钩子", value: "未知坐标再次闪烁" },
    ]);
  });

  it("忽略空片段和缺失值片段", () => {
    const result = parseOutlineSummary(
      "章节: 第2章 |  | 标题: 轨道余震 | 无效片段 | 悬念钩子: ",
    );

    expect(result).toEqual([
      { label: "章节", value: "第2章" },
      { label: "标题", value: "轨道余震" },
    ]);
  });

  it("优先返回核心事件作为章节卡导语", () => {
    const lead = getOutlineSummaryLead(
      "章节: 第3章 | 核心事件: 反派暴露伪装 | 悬念钩子: 真相仍被掩埋",
    );

    expect(lead).toBe("反派暴露伪装");
  });
});
