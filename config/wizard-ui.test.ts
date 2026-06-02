import { describe, expect, it } from "vitest";

import {
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
} from "./wizard-ui";

describe("wizard-ui 配置", () => {
  it("Layer1 题材选项应与文档一致", () => {
    expect(LAYER1_Q1_GENRE_OPTIONS.map((option) => option.label)).toEqual([
      "悬疑推理（侦探、破案、解谜）",
      "言情（现代都市 / 古代宫廷 / 穿越时空）",
      "奇幻玄幻（魔法、异世界、修真）",
      "科幻未来（科技、太空、末世）",
      "武侠仙侠 / 历史架空（江湖、门派、朝堂权谋）",
      "都市现实 / 成长（生活、职场、社会）",
      "⭐自由描述（我有明确的想法，让我自己说）",
    ]);
  });

  it("Layer1 主角与冲突选项应与文档一致", () => {
    expect(LAYER1_Q2_TYPE_OPTIONS.map((option) => option.label)).toEqual([
      "男性主角（独角戏）",
      "女性主角（独角戏）",
      "双主角（男女双线 / 对手戏）",
      "群像戏（多线叙事）",
      "⭐自由描述（我已想好角色设定）",
    ]);
    expect(LAYER1_Q2_PERSONALITY_OPTIONS.map((option) => option.label)).toEqual(
      [
        "热血正义（积极、勇敢、有担当）",
        "冷静智慧（理性、谋略、高智商）",
        "温暖治愈（善良、温柔、有同理心）",
        "高冷孤傲（冷漠、独立、强大）",
        "阴暗腹黑（心机、算计、复仇）",
        "成长逆袭（从弱到强、打脸升级）",
        "自由描述",
      ],
    );
    expect(LAYER1_Q3_CONFLICT_OPTIONS.map((option) => option.label)).toEqual([
      "生死存亡（生存危机、逃出生天）",
      "查明真相（寻找答案、揭露秘密）",
      "爱情阻碍（追求真爱、克服阻碍）",
      "复仇雪恨（复仇计划、伸张正义）",
      "权力争夺（竞争上位、资源争夺）",
      "成长突破（自我突破、实现价值）",
      "守护保护（守护重要的人或事）",
      "自由描述",
    ]);
    expect(LAYER1_Q3_DRIVE_OPTIONS.map((option) => option.label)).toEqual([
      "复仇（为某人/某事而战）",
      "爱情（为所爱之人）",
      "责任/使命（不得不做）",
      "好奇心/求知欲（想知道真相）",
      "生存（活下去）",
      "野心（想要得到某样东西）",
      "自由描述",
    ]);
  });

  it("Layer2 定制选项应与文档一致", () => {
    expect(LAYER2_Q4_WORLD_OPTIONS.map((option) => option.label)).toEqual([
      "现实世界（当代中国或其他现实背景）",
      "架空历史（特定朝代或虚构朝代）",
      "完全虚构世界（需自建规则体系，如魔法/修真体系）",
      "未来/科幻世界（科技水平、社会结构特殊）",
      "⭐自由描述（我已有详细设定）",
      "🎲 随机生成（根据题材智能生成世界观）",
    ]);
    expect(LAYER2_Q5_PERSPECTIVE_OPTIONS.map((option) => option.label)).toEqual(
      [
        "第三人称限制视角（跟随主角的所见所感）",
        "第三人称全知视角（上帝视角，可切换角色）",
        "第一人称（主角自述，代入感最强）",
        "多视角切换（每章或每段切换不同角色视角）",
        "⭐自由描述",
        "🎲 随机生成",
      ],
    );
    expect(LAYER2_Q5_TONE_OPTIONS.map((option) => option.label)).toEqual([
      "紧张刺激（快节奏、高冲突、悬念驱动）",
      "温情治愈（慢节奏、情感向、暖心）",
      "轻松幽默（喜剧感、轻松愉快）",
      "沉重深刻（探讨人性/社会、有文学性）",
      "⭐自由描述",
      "🎲 随机生成",
    ]);
    expect(LAYER2_Q6_THEME_OPTIONS.map((option) => option.label)).toEqual([
      "成长与蜕变（主角的内在变化是核心）",
      "正义与复仇（善恶对决、伸张正义）",
      "爱与牺牲（感情线驱动，为所爱之人付出一切）",
      "权力与欲望（野心、争夺、堕落与救赎）",
      "生存与希望（绝境中的人性光辉）",
      "自由与束缚（对抗命运/体制/偏见）",
      "⭐自由描述（我有明确主题）",
      "🎲 随机生成",
    ]);
    expect(LAYER2_Q7_AUDIENCE_OPTIONS.map((option) => option.label)).toEqual([
      "大众读者（番茄小说/网络文学受众，追求爽感和代入感）",
      "青少年读者（偏青春、成长、校园题材）",
      "成熟读者（偏好深度、文学性、思想性）",
      "不确定 / 自由描述",
      "🎲 随机生成",
    ]);
    expect(LAYER2_Q8_CHAPTER_OPTIONS.map((option) => option.label)).toEqual([
      "10章（短篇，约3-5万字）",
      "15章（中短篇，约4.5-7.5万字）",
      "20章（中篇，约6-10万字）⭐",
      "30章（中长篇，约9-15万字）",
      "50章（长篇，约15-25万字）",
      "自定义（输入具体数字）",
    ]);
  });
});
