import { MistakeRecord } from '../types';

export const SAMPLE_MISTAKES: MistakeRecord[] = [
  {
    id: 'sample-math-1',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2 days ago
    subject: '数学',
    knowledgePoint: '二次函数区间最值与对称轴分类讨论',
    questionType: '解答题',
    difficulty: '中等提高',
    questionText: `已知函数 f(x) = x² - 2ax + 3 在闭区间 [0, 2] 上的最大值为 4，求实数 a 的所有可能取值。`,
    standardAnswer: `实数 a 的可能取值为 a = -1/4 或 a = 9/4。`,
    analysis: `【解题步骤点拨】
1. 函数 f(x) = (x - a)² + 3 - a² 是开口向上的二次抛物线，对称轴为直线 x = a。
2. 因为二次函数在闭区间 [0, 2] 上的最大值必然在区间的两个端点处取得（即 f(0) 或 f(2) 处）。
3. 比较两端点函数值：
   f(0) = 3
   f(2) = 2² - 2a·2 + 3 = 7 - 4a
4. 显然端点 f(0) = 3 < 4，因此最大值 4 绝不可能在 x = 0 处取得；最大值必须在 x = 2 处取得，且必须满足 f(2) ≥ f(0)。
   令 f(2) = 7 - 4a = 4，解得 4a = 3，即 a = 3/4。
   此时验证对称轴 a = 3/4：区间中点为 1，因为 a = 3/4 < 1，距离 x = 2 更远，最大值确在 x = 2，但此时 f(2)=4 > f(0)=3 成立。
5. 等等！如果对称轴落在右侧使得 f(0) 最大呢？由于 f(0) = 3 是定值且恒不等于 4，所以若最大值由 f(0) 提供则无解。
   但是若考虑到对称轴偏向某侧：端点距离对称轴的远近决定最大值。
   若对称轴 a ≤ 1，最远端点为 x = 2，f(2) = 7 - 4a = 4 => a = 3/4 (此时 a ≤ 1 满足)。
   若考虑二次函数与区间端点的几何性质，当最大值为 4 时必须严格验证区间端点取值。`,
    mistakeDiagnosis: `很多同学习惯盲目求导或只求顶点最小值，忽视了“闭区间二次函数最大值必在端点取得”的定理；或者误认为只要 f(0)=4（产生矛盾）或分类讨论时未验证“所求 a 是否真使得该端点为最大值”。`,
    mistakeKeywords: ['区间端点最值定理', '对称轴分类讨论', '忽略区间中点验证'],
    studentNote: '闭区间求二次函数最大值只要比较端点 f(0) 和 f(2) 哪个离对称轴更远即可！千万不要算错端点！',
    masteryStatus: 'practicing',
    summaryFocus: '针对二次函数在含参闭区间上的最值问题，重点强化“端点比较法”与“对称轴与区间中点位置关系”两个核心破题抓手。',
    variants: [
      {
        id: 'sample-v1',
        typeTag: '变式一（同源情境巩固）',
        question: `已知函数 g(x) = -x² + 2ax + 1 在闭区间 [1, 3] 上的最小值为 -8，求实数 a 的取值。`,
        answer: `a = -2 或 a = 2。`,
        analysis: `函数 g(x) 开口向下，在闭区间 [1, 3] 上的最小值必在两端点 x=1 或 x=3 处取得。
比较 g(1) = 2a 与 g(3) = 6a - 8。
分类讨论：
1) 若 g(1) ≤ g(3)，即 2a ≤ 6a - 8 => a ≥ 2，此时最小值为 g(1) = 2a = -8 => a = -4，但与 a ≥ 2 矛盾，舍去；
2) 若 g(3) ≤ g(1)，即 a ≤ 2，此时最小值为 g(3) = 6a - 8 = -8 => 6a = 0 => a = 0。检验 a=0 时 g(1)=0, g(3)=-8，成立！
注意当对称轴在区间外时还需结合题意仔细检验。`,
        trapAnalysis: `【避坑提醒】注意抛物线开口向下时，最小值在端点，而最大值可能在顶点。切勿把开口方向看反！`,
        highlightKeywords: ['开口方向反转', '端点取值判别', '分类讨论成立条件检验'],
      },
      {
        id: 'sample-v2',
        typeTag: '变式二（逆向思维探究）',
        question: `若函数 f(x) = x² - 4x + c 在区间 [0, 4] 上的最大值与最小值的差为 9，求实数 c 的值。`,
        answer: `本题不存在实数 c 满足条件（题目为探究题，由于差值只与二次项和一次项有关，实际上 max-min 恒为定值 4）。`,
        analysis: `对称轴为 x = 2，落在区间 [0, 4] 内部。
顶点最小值 f(2) = 4 - 8 + c = c - 4。
两端点 f(0) = c，f(4) = c。
所以最大值为 c，最小值为 c - 4。
无论 c 取何值，最大值与最小值的差恒为 c - (c - 4) = 4 ≠ 9。因此无解。`,
        trapAnalysis: `【思维突破】常数项 c 只引起图像的上下平移，绝不改变极差！很多学生盲目列方程解 c，陷入伪计算。`,
        highlightKeywords: ['上下平移不改变极差', '虚设参数的独立性', '警惕无解题型'],
      },
      {
        id: 'sample-v3',
        typeTag: '变式三（防坑陷阱拓展）',
        question: `已知函数 f(x) = x² - 2x + 1，当 x ∈ [t, t + 2] 时的最大值为 M(t)，若 M(t) = 4，求实数 t 的取值。`,
        answer: `t = -3 或 t = 1。`,
        analysis: `对称轴 x = 1。区间 [t, t + 2] 长度为 2，区间中点为 t + 1。
1) 当区间中点 t + 1 ≤ 1（即 t ≤ 0）时，左端点离对称轴更远，最大值为 f(t) = (t - 1)² = 4，解得 t - 1 = -2（因为 t ≤ 0），t = -1。代入检验 f(-1) = 4，此时区间为 [-1, 1]，端点 f(-1)=4 为最大值。
2) 当区间中点 t + 1 > 1（即 t > 0）时，右端点离对称轴更远，最大值为 f(t + 2) = (t + 1)² = 4，解得 t + 1 = 2 => t = 1。代入检验区间 [1, 3]，f(3) = 4 为最大值。
综上，t = -1 或 t = 1。`,
        trapAnalysis: `【易错点】区间长度固定但在轴上平移（动区间定轴），必须比较区间中点与对称轴的大小来确定哪个端点取最大值！`,
        highlightKeywords: ['动区间定轴模型', '区间中点比较法则', '去绝对值漏解'],
      },
    ],
  },
  {
    id: 'sample-physics-1',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    subject: '物理',
    knowledgePoint: '带电粒子在匀强磁场中的临界圆与极值轨迹',
    questionType: '解答题',
    difficulty: '压轴突破',
    questionText: `如图所示，在半径为 R 的圆形区域内存在垂直纸面向外的匀强磁场，磁感应强度为 B。一束质量为 m、电荷量为 +q 的粒子以不同大小的速度从边界上的 P 点沿切线方向射入磁场，不计粒子重力及相互作用。求：
(1) 粒子在磁场中运动的最长时间；
(2) 若粒子能射出磁场，其在磁场中运动时间与其进入速度的关系。`,
    standardAnswer: `(1) 最长时间为 t_max = πm / (qB)；(2) 当速度满足一定条件时，转过圆心角 θ 与射出点几何对应。`,
    analysis: `【解题关键点】
1. 粒子的轨道半径 r = mv / (qB)，圆周运动周期 T = 2πm / (qB) 与速度无关！
2. 轨迹圆与磁场圆同为圆，从切线射入时，弦切角与圆心角具有严格几何关联。
3. 当轨迹圆从磁场边界恰好转过 180°（即半圆）时离开，转过圆心角最大为 π，运动时间最长 t_max = T/2 = πm / (qB)。`,
    mistakeDiagnosis: `盲目认为速度越小时间越长，忽视了磁场边界圆对轨迹弧长的空间切割限制；混淆了周期不变性与轨迹所对圆心角的关系。`,
    mistakeKeywords: ['轨迹圆与边界圆的交点', '圆心角决定时间', '切线入射临界弧长'],
    studentNote: '粒子在磁场中时间 t = (θ/2π)·T，周期与速度无关，时间只取决于转过的圆心角 θ！',
    masteryStatus: 'unmastered',
    variants: [],
  },
  {
    id: 'sample-english-1',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 8,
    subject: '英语',
    knowledgePoint: '非谓语动词作状语与逻辑主语一致性',
    questionType: '选择题',
    difficulty: '中等提高',
    questionText: `______ from the top of the mountain, the entire city looks like a huge chessboard covered with shining lights.
A. Seeing
B. Having seen
C. Seen
D. To see`,
    standardAnswer: `正确答案：C. Seen`,
    analysis: `【精解透析】
本题考查非谓语动词作时间/条件状语。
做此类题的黄金法则：第一步寻找句子的真正逻辑主语！
主句的主语是 "the entire city"（整个城市）。
城市与动词 see 之间是被动关系（“城市被看见/从山顶俯瞰城市”），而不是城市主动去看。
过去分词 (Seen) 表被动和完成，此处用过去分词作状语。若用 Seeing，其逻辑主语必须是人（如 Seeing from the top, WE can find...）。`,
    mistakeDiagnosis: `汉语思维陷阱：“从山顶上看，整个城市……”，中文习惯省略施动者主语，导致很多同学凭借直觉选 A (Seeing)，忽视了英文主句主语与分词之间的主被动一致。`,
    mistakeKeywords: ['逻辑主语垂悬错误', '主被动关系判定', '汉语语感负迁移'],
    studentNote: '非谓语动词第一反应：看逗号后面的主句主语！如果主语不能发出该动作，果断排除主动形式！',
    masteryStatus: 'mastered',
    variants: [],
  },
  {
    id: 'sample-chemistry-1',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 12,
    subject: '化学',
    knowledgePoint: '水溶液中的离子平衡与三大守恒（电荷/物料/质子）',
    questionType: '选择题',
    difficulty: '中等提高',
    questionText: `常温下，向 0.1 mol/L 的 NaHCO₃ 溶液中，下列离子浓度关系正确的是：
A. c(Na⁺) + c(H⁺) = c(HCO₃⁻) + c(CO₃²⁻) + c(OH⁻)
B. c(Na⁺) = c(HCO₃⁻) + c(CO₃²⁻) + c(H₂CO₃)
C. c(OH⁻) = c(H⁺) + c(H₂CO₃) - c(CO₃²⁻)
D. c(Na⁺) > c(HCO₃⁻) > c(OH⁻) > c(CO₃²⁻) > c(H⁺)`,
    standardAnswer: `正确答案：B`,
    analysis: `【深度解析】
A项错误：电荷守恒漏乘电荷数！碳酸根带2个负电荷，应为 2c(CO₃²⁻)。
B项正确：物料守恒。碳原子无论以 HCO₃⁻, CO₃²⁻ 还是 H₂CO₃ 存在，总物质的量与 Na⁺ 等同，即 c(Na⁺) = c(HCO₃⁻) + c(CO₃²⁻) + c(H₂CO₃)。
C项错误：质子守恒：水电离出的 OH⁻ 来源于 HCO₃⁻ 水解产生 H₂CO₃，以及 HCO₃⁻ 电离产生的 H⁺。正确应为 c(OH⁻) = c(H⁺) + c(H₂CO₃) - c(CO₃²⁻) 的正负号需推导。
D项分析：HCO₃⁻水解大于电离，溶液呈碱性，c(OH⁻) > c(H⁺)，微弱电离生成 CO₃²⁻，微弱水解生成 H₂CO₃，排序应为 c(Na⁺) > c(HCO₃⁻) > c(OH⁻) > c(H₂CO₃) > c(CO₃²⁻) > c(H⁺)。`,
    mistakeDiagnosis: `最经典的“电荷守恒漏乘电荷数”失误（CO₃²⁻ 前漏乘系数 2）；以及将水解与电离强弱大小搞混。`,
    mistakeKeywords: ['电荷守恒系数遗漏', '物料守恒守恒项缺失', '水解大于电离关系'],
    studentNote: '写电荷守恒时，遇到带几个电荷的离子一定要在前面乘以几！',
    masteryStatus: 'unmastered',
    variants: [],
  },
];
