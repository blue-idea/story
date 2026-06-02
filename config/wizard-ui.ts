export type WizardOption = {
  label: string;
  value: string;
};

export const WIZARD_FREE_TEXT_VALUE = "__free_text__";
export const WIZARD_RANDOM_VALUE = "__random__";
export const WIZARD_NONE_VALUE = "__none__";
export const WIZARD_CUSTOM_CHAPTER_VALUE = "__custom_chapter__";
export const TITLE_RETRY_HINT_THRESHOLD = 5;

export const LAYER1_Q1_GENRE_OPTIONS: WizardOption[] = [
  {
    label: "悬疑推理（侦探、破案、解谜）",
    value: "悬疑推理",
  },
  {
    label: "言情（现代都市 / 古代宫廷 / 穿越时空）",
    value: "言情",
  },
  {
    label: "奇幻玄幻（魔法、异世界、修真）",
    value: "奇幻玄幻",
  },
  {
    label: "科幻未来（科技、太空、末世）",
    value: "科幻未来",
  },
  {
    label: "武侠仙侠 / 历史架空（江湖、门派、朝堂权谋）",
    value: "武侠仙侠 / 历史架空",
  },
  {
    label: "都市现实 / 成长（生活、职场、社会）",
    value: "都市现实 / 成长",
  },
  {
    label: "⭐自由描述（我有明确的想法，让我自己说）",
    value: WIZARD_FREE_TEXT_VALUE,
  },
];

export const LAYER1_Q2_TYPE_OPTIONS: WizardOption[] = [
  {
    label: "男性主角（独角戏）",
    value: "男性主角（独角戏）",
  },
  {
    label: "女性主角（独角戏）",
    value: "女性主角（独角戏）",
  },
  {
    label: "双主角（男女双线 / 对手戏）",
    value: "双主角（男女双线 / 对手戏）",
  },
  {
    label: "群像戏（多线叙事）",
    value: "群像戏（多线叙事）",
  },
  {
    label: "⭐自由描述（我已想好角色设定）",
    value: WIZARD_FREE_TEXT_VALUE,
  },
];

export const LAYER1_Q2_PERSONALITY_OPTIONS: WizardOption[] = [
  {
    label: "热血正义（积极、勇敢、有担当）",
    value: "热血正义（积极、勇敢、有担当）",
  },
  {
    label: "冷静智慧（理性、谋略、高智商）",
    value: "冷静智慧（理性、谋略、高智商）",
  },
  {
    label: "温暖治愈（善良、温柔、有同理心）",
    value: "温暖治愈（善良、温柔、有同理心）",
  },
  {
    label: "高冷孤傲（冷漠、独立、强大）",
    value: "高冷孤傲（冷漠、独立、强大）",
  },
  {
    label: "阴暗腹黑（心机、算计、复仇）",
    value: "阴暗腹黑（心机、算计、复仇）",
  },
  {
    label: "成长逆袭（从弱到强、打脸升级）",
    value: "成长逆袭（从弱到强、打脸升级）",
  },
  {
    label: "自由描述",
    value: WIZARD_FREE_TEXT_VALUE,
  },
];

export const LAYER1_Q3_CONFLICT_OPTIONS: WizardOption[] = [
  {
    label: "生死存亡（生存危机、逃出生天）",
    value: "生死存亡（生存危机、逃出生天）",
  },
  {
    label: "查明真相（寻找答案、揭露秘密）",
    value: "查明真相（寻找答案、揭露秘密）",
  },
  {
    label: "爱情阻碍（追求真爱、克服阻碍）",
    value: "爱情阻碍（追求真爱、克服阻碍）",
  },
  {
    label: "复仇雪恨（复仇计划、伸张正义）",
    value: "复仇雪恨（复仇计划、伸张正义）",
  },
  {
    label: "权力争夺（竞争上位、资源争夺）",
    value: "权力争夺（竞争上位、资源争夺）",
  },
  {
    label: "成长突破（自我突破、实现价值）",
    value: "成长突破（自我突破、实现价值）",
  },
  {
    label: "守护保护（守护重要的人或事）",
    value: "守护保护（守护重要的人或事）",
  },
  {
    label: "自由描述",
    value: WIZARD_FREE_TEXT_VALUE,
  },
];

export const LAYER1_Q3_DRIVE_OPTIONS: WizardOption[] = [
  {
    label: "复仇（为某人/某事而战）",
    value: "复仇（为某人/某事而战）",
  },
  {
    label: "爱情（为所爱之人）",
    value: "爱情（为所爱之人）",
  },
  {
    label: "责任/使命（不得不做）",
    value: "责任/使命（不得不做）",
  },
  {
    label: "好奇心/求知欲（想知道真相）",
    value: "好奇心/求知欲（想知道真相）",
  },
  {
    label: "生存（活下去）",
    value: "生存（活下去）",
  },
  {
    label: "野心（想要得到某样东西）",
    value: "野心（想要得到某样东西）",
  },
  {
    label: "自由描述",
    value: WIZARD_FREE_TEXT_VALUE,
  },
];

export const LAYER2_Q4_WORLD_OPTIONS: WizardOption[] = [
  {
    label: "现实世界（当代中国或其他现实背景）",
    value: "现实世界（当代中国或其他现实背景）",
  },
  {
    label: "架空历史（特定朝代或虚构朝代）",
    value: "架空历史（特定朝代或虚构朝代）",
  },
  {
    label: "完全虚构世界（需自建规则体系，如魔法/修真体系）",
    value: "完全虚构世界（需自建规则体系，如魔法/修真体系）",
  },
  {
    label: "未来/科幻世界（科技水平、社会结构特殊）",
    value: "未来/科幻世界（科技水平、社会结构特殊）",
  },
  {
    label: "⭐自由描述（我已有详细设定）",
    value: WIZARD_FREE_TEXT_VALUE,
  },
  {
    label: "🎲 随机生成（根据题材智能生成世界观）",
    value: WIZARD_RANDOM_VALUE,
  },
];

export const LAYER2_Q5_PERSPECTIVE_OPTIONS: WizardOption[] = [
  {
    label: "第三人称限制视角（跟随主角的所见所感）",
    value: "第三人称限制视角（跟随主角的所见所感）",
  },
  {
    label: "第三人称全知视角（上帝视角，可切换角色）",
    value: "第三人称全知视角（上帝视角，可切换角色）",
  },
  {
    label: "第一人称（主角自述，代入感最强）",
    value: "第一人称（主角自述，代入感最强）",
  },
  {
    label: "多视角切换（每章或每段切换不同角色视角）",
    value: "多视角切换（每章或每段切换不同角色视角）",
  },
  {
    label: "⭐自由描述",
    value: WIZARD_FREE_TEXT_VALUE,
  },
  {
    label: "🎲 随机生成",
    value: WIZARD_RANDOM_VALUE,
  },
];

export const LAYER2_Q5_TONE_OPTIONS: WizardOption[] = [
  {
    label: "紧张刺激（快节奏、高冲突、悬念驱动）",
    value: "紧张刺激（快节奏、高冲突、悬念驱动）",
  },
  {
    label: "温情治愈（慢节奏、情感向、暖心）",
    value: "温情治愈（慢节奏、情感向、暖心）",
  },
  {
    label: "轻松幽默（喜剧感、轻松愉快）",
    value: "轻松幽默（喜剧感、轻松愉快）",
  },
  {
    label: "沉重深刻（探讨人性/社会、有文学性）",
    value: "沉重深刻（探讨人性/社会、有文学性）",
  },
  {
    label: "⭐自由描述",
    value: WIZARD_FREE_TEXT_VALUE,
  },
  {
    label: "🎲 随机生成",
    value: WIZARD_RANDOM_VALUE,
  },
];

export const LAYER2_Q6_THEME_OPTIONS: WizardOption[] = [
  {
    label: "成长与蜕变（主角的内在变化是核心）",
    value: "成长与蜕变（主角的内在变化是核心）",
  },
  {
    label: "正义与复仇（善恶对决、伸张正义）",
    value: "正义与复仇（善恶对决、伸张正义）",
  },
  {
    label: "爱与牺牲（感情线驱动，为所爱之人付出一切）",
    value: "爱与牺牲（感情线驱动，为所爱之人付出一切）",
  },
  {
    label: "权力与欲望（野心、争夺、堕落与救赎）",
    value: "权力与欲望（野心、争夺、堕落与救赎）",
  },
  {
    label: "生存与希望（绝境中的人性光辉）",
    value: "生存与希望（绝境中的人性光辉）",
  },
  {
    label: "自由与束缚（对抗命运/体制/偏见）",
    value: "自由与束缚（对抗命运/体制/偏见）",
  },
  {
    label: "⭐自由描述（我有明确主题）",
    value: WIZARD_FREE_TEXT_VALUE,
  },
  {
    label: "🎲 随机生成",
    value: WIZARD_RANDOM_VALUE,
  },
];

export const LAYER2_Q7_AUDIENCE_OPTIONS: WizardOption[] = [
  {
    label: "大众读者（番茄小说/网络文学受众，追求爽感和代入感）",
    value: "大众读者（番茄小说/网络文学受众，追求爽感和代入感）",
  },
  {
    label: "青少年读者（偏青春、成长、校园题材）",
    value: "青少年读者（偏青春、成长、校园题材）",
  },
  {
    label: "成熟读者（偏好深度、文学性、思想性）",
    value: "成熟读者（偏好深度、文学性、思想性）",
  },
  {
    label: "不确定 / 自由描述",
    value: WIZARD_FREE_TEXT_VALUE,
  },
  {
    label: "🎲 随机生成",
    value: WIZARD_RANDOM_VALUE,
  },
];

export const LAYER2_Q8_CHAPTER_OPTIONS: WizardOption[] = [
  {
    label: "10章（短篇，约3-5万字）",
    value: "10章（短篇，约3-5万字）",
  },
  {
    label: "15章（中短篇，约4.5-7.5万字）",
    value: "15章（中短篇，约4.5-7.5万字）",
  },
  {
    label: "20章（中篇，约6-10万字）⭐",
    value: "20章（中篇，约6-10万字）⭐",
  },
  {
    label: "30章（中长篇，约9-15万字）",
    value: "30章（中长篇，约9-15万字）",
  },
  {
    label: "50章（长篇，约15-25万字）",
    value: "50章（长篇，约15-25万字）",
  },
  {
    label: "自定义（输入具体数字）",
    value: WIZARD_CUSTOM_CHAPTER_VALUE,
  },
];

export const LAYER2_Q8_SPECIAL_REQUIREMENT_OPTIONS: WizardOption[] = [
  {
    label: "有必须包含的情节/场景（请描述）",
    value: "有必须包含的情节/场景（请描述）",
  },
  {
    label: "有绝对不能出现的内容（请描述）",
    value: "有绝对不能出现的内容（请描述）",
  },
  {
    label: "字数偏好（默认每章3000-8000字）",
    value: "字数偏好（默认每章3000-8000字）",
  },
  {
    label: "没有特殊要求，按标准来",
    value: "没有特殊要求，按标准来",
  },
  {
    label: "自由描述多个要求",
    value: WIZARD_FREE_TEXT_VALUE,
  },
];

const PROFESSION_RECOMMENDATIONS: Record<string, string[]> = {
  悬疑推理: ["侦探", "法医", "记者", "律师", "警探", "心理咨询师"],
  言情: ["设计师", "总裁", "医生", "律师", "演员", "古代宫妃"],
  奇幻玄幻: [
    "见习魔法师",
    "流亡王子",
    "宗门弟子",
    "赏金猎人",
    "炼药师",
    "异界学者",
  ],
  科幻未来: [
    "调查员",
    "工程师",
    "星舰驾驶员",
    "科研员",
    "赏金特工",
    "AI 训练师",
  ],
  "武侠仙侠 / 历史架空": ["少侠", "门派弟子", "将军", "史官", "谋士", "游侠"],
  "都市现实 / 成长": ["实习生", "创业者", "教师", "社工", "摄影师", "运动员"],
};

const WORLD_DETAIL_RECOMMENDATIONS: Record<string, string[]> = {
  悬疑推理: [
    "隐藏规则的封闭社区",
    "多方势力共享的秘密档案",
    "人人都在说谎的都市网络",
  ],
  言情: [
    "门第差异形成的情感秩序",
    "时代风气对爱情的限制",
    "身份错位造成的关系拉扯",
  ],
  奇幻玄幻: ["魔法或修真等级体系", "种族与宗门的权力版图", "禁忌力量的代价"],
  科幻未来: [
    "失控科技带来的伦理问题",
    "分层社会与资源垄断",
    "AI 与人类共存规则",
  ],
  "武侠仙侠 / 历史架空": [
    "江湖门派的秩序与恩怨",
    "朝堂与民间的双重权力结构",
    "修行资源与名望体系",
  ],
  "都市现实 / 成长": [
    "城市阶层流动的压力",
    "家庭与职场的双重期待",
    "社交媒体改变人生轨迹",
  ],
};

const STYLE_REFERENCE_RECOMMENDATIONS: Record<string, string[]> = {
  悬疑推理: ["东野圭吾", "紫金陈", "雷米", "周浩晖"],
  言情: ["顾漫", "墨香铜臭", "匪我思存", "桐华"],
  奇幻玄幻: ["猫腻", "烽火戏诸侯", "耳根", "辰东"],
  科幻未来: ["刘慈欣", "郝景芳", "特德·姜", "阿西莫夫"],
  "武侠仙侠 / 历史架空": ["金庸", "猫腻", "priest", "马伯庸"],
  "都市现实 / 成长": ["双雪涛", "班宇", "八月长安", "亦舒"],
};

const FALLBACK_PROFESSIONS = ["学生", "调查员", "医生", "商人", "自由职业者"];
const FALLBACK_WORLD_DETAILS = [
  "社会规则如何运转",
  "关键势力如何博弈",
  "特殊能力或资源的代价",
];
const FALLBACK_STYLE_REFERENCES = ["东野圭吾", "刘慈欣", "顾漫", "马伯庸"];

export function getProfessionOptionsByGenre(genre: string): string[] {
  return PROFESSION_RECOMMENDATIONS[genre] ?? FALLBACK_PROFESSIONS;
}

export function getWorldDetailOptionsByGenre(genre: string): string[] {
  return WORLD_DETAIL_RECOMMENDATIONS[genre] ?? FALLBACK_WORLD_DETAILS;
}

export function getStyleReferenceOptionsByGenre(genre: string): string[] {
  return STYLE_REFERENCE_RECOMMENDATIONS[genre] ?? FALLBACK_STYLE_REFERENCES;
}

export const QA_CANDIDATE_TITLES = [
  "霓虹子午线",
  "玻璃天空下的信号",
  "停电协议",
  "夜色里的第二真相",
  "未完成的星图",
];
