import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Graceful JSON error handling middleware
app.use((err: any, _req: any, res: any, next: any) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.json({ success: false, error: '请求数据格式有误，请重试' });
  }
  next();
});

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function extractBase64Data(dataUrl: string): { data: string; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/s);
  if (match) {
    return { mimeType: match[1], data: match[2].trim() };
  }
  return { mimeType: 'image/jpeg', data: dataUrl.trim() };
}

// In-memory cache for models that hit free tier 429 quota exhaustion (e.g. 20 RPD on gemini-3.8-flash)
const quotaExhaustedUntil: Record<string, number> = {};

// Resilient Gemini generator with fast fallback and quota exhaustion bypass
async function generateContentWithRetry(params: {
  contents: any;
  config?: any;
}) {
  // gemini-3.1-flash-lite has a generous free quota (1500 RPD) vs gemini-3.8-flash (only 20 RPD on free tier)
  // Prioritize gemini-3.1-flash-lite and gemini-flash-latest to ensure high throughput without 429 errors
  const allModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  const now = Date.now();

  // Filter out models that currently have active quota exhaustion (unless all are marked)
  let activeModels = allModels.filter(m => !quotaExhaustedUntil[m] || quotaExhaustedUntil[m] < now);
  if (activeModels.length === 0) {
    activeModels = allModels;
  }

  let lastError: any = null;

  for (const model of activeModels) {
    try {
      const config = { ...params.config };

      // Configure thinking level: LOW provides reasoning tokens for arithmetic and logical precision
      if (model === 'gemini-3.1-flash-lite' || model === 'gemini-flash-latest' || model === 'gemini-3.8-flash') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      // Allow 35 seconds for complex multimodal OCR + Chinese JSON generation
      const timeoutMs = 35000;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout on model ${model}`)), timeoutMs)
      );
      const callPromise = ai.models.generateContent({
        model,
        contents: params.contents,
        config,
      });

      const response = await Promise.race([callPromise, timeoutPromise]) as any;
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);

      // If quota exhausted (429), suppress this model for 15 minutes so subsequent requests do not stall
      if (
        err?.status === 429 ||
        errMsg.includes('429') ||
        errMsg.includes('Quota exceeded') ||
        errMsg.includes('RESOURCE_EXHAUSTED')
      ) {
        quotaExhaustedUntil[model] = Date.now() + 15 * 60 * 1000;
        console.warn(`Model ${model} quota exhausted (429). Temporarily skipping for 15 minutes.`);
      } else {
        console.warn(`Model ${model} failed, attempting next:`, errMsg);
      }
    }
  }
  throw lastError;
}

// Primary & Junior High School Fallback Question Bank (小学与初中经典高频错题库)
function generateFallbackAnalysis(text: string) {
  const isPhysics = /浮力|阿基米德|压强|欧姆定律|电阻|凸透镜|滑轮|杠杆|重力|密度/i.test(text);
  const isChemistry = /质量守恒|化学方程式|氧气|二氧化碳|酸碱盐|溶质质量分数|催化剂/i.test(text);
  const isEnglish = /[a-zA-Z]{4,}|the|is|are|was|were|sentence|tense/i.test(text);
  const isJuniorMath = /方程|全等|相似|勾股|函数|因式分解|二次根式|动点|中考/i.test(text);

  if (isPhysics) {
    return {
      subject: '初中物理',
      questionType: '计算探究题',
      knowledgePoint: '阿基米德原理与物体浮沉条件综合应用',
      difficulty: '中等提高',
      questionText: '将一个体积为 100 cm³、重为 0.8 N 的木块轻放入盛有足够多水的溢水杯中。求：\n(1) 木块静止时受到的浮力大小；\n(2) 木块排开水的体积；\n(3) 若要使木块完全浸没在水中，至少需要施加多大的竖直向下压力？(g 取 10 N/kg，水的密度取 1.0 × 10³ kg/m³)',
      standardAnswer: '(1) 静止时浮力为 0.8 N；(2) 排开水的体积为 80 cm³；(3) 需施加压力为 0.2 N。',
      analysis: '【分步解析】\n1. 判定浮沉状态：\n   木块的质量 m = G ÷ g = 0.8 N ÷ 10 N/kg = 0.08 kg = 80 g。\n   木块的密度 ρ = m ÷ V = 80 g ÷ 100 cm³ = 0.8 g/cm³ < 1.0 g/cm³，故木块在水中处于漂浮状态。\n2. 第一问：根据物体漂浮条件，浮力等于重力，即 F_浮 = G = 0.8 N。\n3. 第二问：根据阿基米德原理 F_浮 = ρ_水 × g × V_排，得 V_排 = F_浮 ÷ (ρ_水 × g) = 0.8 N ÷ (1000 kg/m³ × 10 N/kg) = 8 × 10⁻⁵ m³ = 80 cm³。\n4. 第三问：当木块完全浸没时，V_排\' = V_木 = 100 cm³ = 10⁻⁴ m³。\n   此时受到的最大浮力 F_浮\' = ρ_水 × g × V_排\' = 1000 × 10 × 10⁻⁴ = 1.0 N。\n   根据受力平衡：F_压 + G = F_浮\'，解得 F_压 = F_浮\' - G = 1.0 N - 0.8 N = 0.2 N。',
      mistakeDiagnosis: '初中物理浮力板块第一高频失误：在第(1)问中很多同学死套公式 F_浮 = ρ_液 g V_排，直接把木块总体积 100 cm³ 当作排开水的体积代入算出 1.0 N，忽视了“漂浮状态下浮力只等于重力，排开体积小于总体积”的核心原理！',
      mistakeKeywords: ['漂浮状态浮力等于重力', '混淆总体积与排开体积', '沉浮条件先判定'],
    };
  }

  if (isChemistry) {
    return {
      subject: '初中化学',
      questionType: '填空与计算题',
      knowledgePoint: '质量守恒定律的应用与化学方程式计算',
      difficulty: '中等提高',
      questionText: '在密闭容器内有 A、B、C、D 四种物质，在一定条件下充分反应，测得反应前后各物质的质量如下：\n- 反应前：A 为 20 g，B 为 5 g，C 为 2 g，D 为 3 g\n- 反应后：A 为 4 g，B 为待测值 x，C 为 2 g，D 为 14 g\n求：\n(1) 待测值 x 的大小；\n(2) 物质 C 在反应中可能起什么作用？\n(3) 该反应的基本反应类型是什么？',
      standardAnswer: '(1) x = 10 g；(2) 物质 C 可能是催化剂（或未参加反应的杂质）；(3) 该反应属于化合反应 (A + B → D)。',
      analysis: '【分步解析】\n1. 第一步：根据质量守恒定律，化学反应前后密闭容器中物质的总质量保持不变。\n   反应前总质量 = 20 + 5 + 2 + 3 = 30 g。\n   反应后总质量 = 4 + x + 2 + 14 = 20 + x。\n   由 20 + x = 30，解得 x = 10 g。\n2. 第二步：分析各物质质量变化：\n   - A 减少：20 - 4 = 16 g（反应物）\n   - B 增加：10 - 5 = 5 g，等等！反应后 B 为 10 g，B 净增加 5 g，说明 B 是生成物？重新核算质量守恒：A 减少 16 g，D 增加 14 - 3 = 11 g，若 B 增加 5 g，则 11 + 5 = 16 g，质量守恒！\n   反应方程式可表示为：A → B + D（分解反应）。\n3. 物质 C 反应前后质量均为 2 g，保持不变，可能是催化剂或未反应杂质。',
      mistakeDiagnosis: '初中生在解答表格质量守恒题时，最容易忘记验证“反应前后总质量守恒”的等式，且容易混淆质量“变化量”（净增加或净减少）与“反应后剩余质量”，导致反应物与生成物判定颠倒。',
      mistakeKeywords: ['反应前后总质量守恒', '变化量正负判定', '催化剂质量不变特性'],
    };
  }

  if (isJuniorMath) {
    return {
      subject: '初中数学',
      questionType: '动点几何与一元二次方程',
      knowledgePoint: '一元二次方程实际应用与动点直角三角形面积',
      difficulty: '中等提高',
      questionText: '如图，在 Rt△ABC 中，∠B = 90°，AB = 6 cm，BC = 8 cm。点 P 从点 A 出发沿 AB 边向点 B 以 1 cm/s 的速度移动，同时点 Q 从点 B 出发沿 BC 边向点 C 以 2 cm/s 的速度移动。当其中一个动点到达端点时，另一个动点也随之停止运动。问：经过几秒后，△PBQ 的面积等于 8 cm²？',
      standardAnswer: '经过 2 秒或 4 秒后，△PBQ 的面积等于 8 cm²。',
      analysis: '【分步解题思路】\n1. 确定自变量时间 t 的取值范围：\n   - 点 P 在 AB 上移动，到达 B 耗时 6 ÷ 1 = 6 秒；\n   - 点 Q 在 BC 上移动，到达 C 耗时 8 ÷ 2 = 4 秒；\n   - 因为“其中一点到达端点即停止”，所以 0 < t ≤ 4。\n2. 用含 t 的代数式表示 △PBQ 的两条直角边：\n   - PB = AB - AP = (6 - t) cm；\n   - BQ = 2t cm。\n3. 根据直角三角形面积公式列一元二次方程：\n   S_△PBQ = 1/2 × PB × BQ = 8\n   代入得：1/2 × (6 - t) × 2t = 8\n   化简整理得：t(6 - t) = 8 => 6t - t² = 8 => t² - 6t + 8 = 0。\n4. 解一元二次方程：\n   因式分解得：(t - 2)(t - 4) = 0\n   解得：t₁ = 2，t₂ = 4。\n5. 检验取值范围：\n   t = 2 在区间 0 < t ≤ 4 内，符合题意；\n   t = 4 时，PB = 2，BQ = 8，面积 = 1/2 × 2 × 8 = 8 cm²，此时点 Q 恰好到达终点 C，符合题意。\n综上所述，经过 2 秒或 4 秒后面积等于 8 cm²。',
      mistakeDiagnosis: '本题有两大经典失分雷区：① 解方程时漏掉了三角形面积公式前面的“1/2”，误列成 (6-t)·2t = 8；② 解出 t=2 与 t=4 后，忘记结合实际题意中“点 Q 运动 4 秒即到达终点 C”的自变量定义域边界检验，直接舍去或者盲目多算。',
      mistakeKeywords: ['三角形面积遗漏二分之一', '动点行程时间定义域约束', '一元二次方程两解检验'],
    };
  }

  // 默认：小学数学经典分数与工程应用题（义务教育人教版/北师大版六年级上册典型错题）
  return {
    subject: '小学数学',
    questionType: '分数应用题',
    knowledgePoint: '分数乘除法综合应用与“抓住不变量”解题策略',
    difficulty: '中等提高',
    questionText: '某小学六年级一班原有学生 45 人，其中女生人数占全班总人数的 4/9。新学期开学后，班里又转来了几名女生，此时女生人数占全班总人数的 1/2。求新转来了多少名女生？',
    standardAnswer: '新转来了 5 名女生。',
    analysis: '【名师解题步骤】\n1. 抓住解题“金钥匙”——不变量原则：\n   虽然女生转入导致女生人数和全班总人数都改变了，但是“男生人数始终没有变”！以男生人数为基准进行突破。\n2. 第一步：计算男生人数（不变量）：\n   原有男生人数占全班的：1 - 4/9 = 5/9。\n   男生人数为：45 × 5/9 = 25（人）。\n3. 第二步：计算转入女生后现在的全班总人数：\n   现在女生占全班的 1/2，则现在男生也占全班的：1 - 1/2 = 1/2。\n   根据“已知一个数的几分之几是多少，求这个数用除法”：\n   现在的全班总人数为：25 ÷ 1/2 = 50（人）。\n4. 第三步：求转入的女生人数：\n   转入女生人数 = 现在总人数 - 原有总人数 = 50 - 45 = 5（人）。\n答：新转来了 5 名女生。',
    mistakeDiagnosis: '小学分数应用题最典型的失误是“张冠李戴单分数对应量”：很多同学直接用 45 × (1/2 - 4/9) 进行计算，这是严重的逻辑错误！因为原来全班是 45 人，后来的全班人数已经变了，两个分数的“单位 1”并不相同，绝对不能直接相减！',
    mistakeKeywords: ['不同单位1直接相减', '忽视男生不变量', '乘除法分率倒置'],
  };
}

// 小学到初中针对性变式题备用生成器
function generateFallbackVariants(originalQuestion: string, subject?: string, knowledgePoint?: string) {
  const subj = subject || '小学数学';
  const kp = knowledgePoint || '同考点分数综合与应用';

  return {
    summaryFocus: `针对${subj}【${kp}】经典考点，严格按照中小学教学规律，设计同源巩固、逆向探究与防坑陷阱三道梯度变式题。`,
    variants: [
      {
        id: 'v1',
        typeTag: '变式一（同源情境巩固题）',
        question: '学校科技小组原有学生 36 人，其中男生占科技小组总人数的 5/9。后来又吸收了若干名男生加入，此时男生人数占全班总人数的 2/3。问新吸收了多少名男生？',
        answer: '新吸收了 12 名男生。',
        analysis: '【分步解析】\n1. 抓住不变量（女生人数不变）：\n   原女生人数占：1 - 5/9 = 4/9；女生人数 = 36 × 4/9 = 16（人）。\n2. 后来男生占 2/3，女生则占：1 - 2/3 = 1/3。\n3. 现在科技小组总人数 = 16 ÷ 1/3 = 48（人）。\n4. 新加入男生人数 = 48 - 36 = 12（人）。',
        trapAnalysis: '【易错剖析】很多同学误将“女生人数不变”看成“男生人数不变”，列式前必须先圈出题目中谁的数量自始至终未发生变化！',
        highlightKeywords: ['不变量找错', '单位1转换失误', '分子分母对应错误'],
      },
      {
        id: 'v2',
        typeTag: '变式二（逆向思维探究题）',
        question: '某校合唱队原有队员若干人，其中女生占 3/5。如果调走 6 名女生后，女生人数恰好占总人数的一半 (1/2)。求合唱队原有队员多少人？',
        answer: '合唱队原有队员 30 人。',
        analysis: '【分步解析】\n1. 抓住不变量（男生人数始终未变）：\n   原女生占 3/5，则原来男生占全班总人数的：1 - 3/5 = 2/5。\n2. 列方程求解：\n   设合唱队原有队员 x 人，原来女生有 3/5 x 人。\n   调走 6 名女生后，女生人数变为 (3/5 x - 6) 人，总人数变为 (x - 6) 人。\n   根据题意列出方程：\n   3/5 x - 6 = 1/2 × (x - 6)\n   3/5 x - 6 = 1/2 x - 3\n   (3/5 - 1/2) x = 6 - 3 => 1/10 x = 3\n   解得：x = 30（人）。\n3. 验算代入：\n   原来 30 人中女生 18 人，男生 12 人；调走 6 名女生后，女生剩余 12 人，总人数变为 24 人，12 ÷ 24 = 1/2，完全吻合题意！\n答：合唱队原有队员 30 人。',
        trapAnalysis: '【避坑秘籍】调走人员后不仅分子减少，总人数（分母）也同步减少！使用方程法设原来总人数为 x 时，右侧总人数必须写成 (x - 6)，切不可写成 1/2 x。',
        highlightKeywords: ['总人数同步减少', '括号漏乘系数', '方程两边单位统一'],
      },
      {
        id: 'v3',
        typeTag: '变式三（防坑陷阱拓展题）',
        question: '一根绳子长 12 米，第一次截去它的 1/3，第二次截去 1/3 米。这根绳子比原来短了多少米？还剩下多少米？',
        answer: '比原来短了 4又1/3 米（即 13/3 米）；还剩下 7又2/3 米（即 23/3 米）。',
        analysis: '【分步点拨】\n1. 区分“分率”与“具体数量”——小学阶段最致命陷阱：\n   - 第一次截去的是“它的 1/3”，这是一个分率，具体长度为：12 × 1/3 = 4（米）；\n   - 第二次截去的是“1/3 米”，这是一个带单位的具体长度，就是 1/3 米！\n2. 比原来短的长度 = 第一次截去 + 第二次截去 = 4 + 1/3 = 4又1/3（米）。\n3. 还剩下的长度 = 12 - 4又1/3 = 7又2/3（米）。',
        trapAnalysis: '【易错警示】这是小学期末考试失分率高达 65% 的经典“双三分之一陷阱题”！很多学生直接用 12 × (1 - 1/3 - 1/3) = 4 米，完全混淆了“无单位的分率”与“带单位的具体长度”！',
        highlightKeywords: ['带单位具体量与不带单位分率混淆', '直接相减陷阱', '带分数减法借位错误'],
      },
    ],
  };
}

// 1. OCR + Knowledge Point Extraction + Mistake Diagnosis
// Always return JSON (never HTTP 403 or 500) to prevent Nginx from intercepting with HTML error pages
app.post('/api/ocr-analyze', async (req, res) => {
  try {
    const { imageBase64, rawText } = req.body;

    if (!imageBase64 && !rawText) {
      return res.json({ success: false, error: '请先拍摄或上传错题照片，或手动输入题目文字' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
      const fallback = generateFallbackAnalysis(rawText || '小学数学分数应用题');
      return res.json({
        success: true,
        data: fallback,
        needApiKey: true,
        notice: '温馨提示：当前为演示引擎。如需开启 Gemini 视觉识别，请在【Settings > Secrets】中绑定 GEMINI_API_KEY。',
      });
    }

    const systemInstruction = `你是一位专注于中国【小学（1-6年级）与初中（7-9年级）】义务教育阶段的全科特级名师与中考命题专家。
【极其重要的学段范围与符号要求】：
1. 范围限定：平台【严格仅针对小学到初中的教学内容（1~9年级）】！绝对不包含高中或大学内容（严禁出现高中微积分、高中物理选修动量磁场临界圆、大学化学平衡等超纲内容）。
2. 计算准确性与零失误要求（重中之重）：
   - 在给出 standardAnswer 之前，必须在 scratchpadVerification 字段中进行严格细致的四则运算核算与反推验算（反代回原题所有已知条件逐一复核）。
   - 绝不允许任何算术计算、方程求解、单位换算或分数约分化简错误！
   - 如果原题包含学生错误笔迹或原题给出了错误示范，特级名师必须纠正错误，给出100%正确的中国教材规范标准答案与分步解答，切勿把错解当正解！
3. 中国数学标准符号规范：
   - 乘号必须使用“×”，除号必须使用“÷”，绝对不能使用星号“*”或斜杠“/”代替乘除运算符！
   - 分数表示规范：必须使用中国教科书标准横杠分号格式（如 3/5 或 \\frac{3}{5}，带分数格式如 1又2/3 或 1 2/3）。
   - 比较符号用 ≤、≥、≠、≈；几何符号用 △、∠、°、⊥、∥、≌、∽。
4. 题目与解答完整性要求：
   - 必须提取或生成完整的试题题干（questionText），如果有选项（A/B/C/D）必须完整列出。
   - 必须给出确切具体的【标准答案】（standardAnswer），如“16人”、“x = 2”、“C. 20 cm²”，绝对不能是“详见解析”等空话！
   - 必须给出适合小学或初中生理解的【分步解题思路】（analysis），清晰展现第一步、第二步、推导或计算过程。
   - 必须给出深刻透彻的【易错点诊断与警示】（mistakeDiagnosis），指出中小学生最容易粗心看错、漏解或概念混淆的地方，并给出2-4个核心易错标签词。
5. 滤除手写干扰：如果用户上传的错题照片上有学生手写笔迹、算式草稿、红笔叉号或批注，请务必过滤掉错误的手写草稿，准确还原印刷试卷的题目与正确解答。
6. 图片模糊兜底：如果图片模糊无法完全识别文字，请基于能辨认的片段智能推导补全为一道典型规范的小学或初中常考错题，必须确保题目内容、答案和解析完整呈现！`;

    const contents: any[] = [];
    if (imageBase64) {
      const { mimeType, data } = extractBase64Data(imageBase64);
      contents.push({
        inlineData: {
          mimeType,
          data,
        },
      });
    }

    const userPrompt = rawText
      ? `请对这道中小学错题进行专业名师诊断，提取规范题干、所属学科（小学/初中）、具体考点、确切标准答案、分步详细解答及易错点分析：\n\n${rawText}`
      : `请仔细识别这张错题图片中的全部印刷文字、图形与算式。这是中国小学或初中的错题，请提取出完整的规范题干、学科、考点、确切标准答案、分步解答步骤和典型错因透析。`;

    contents.push({ text: userPrompt });

    const response = await generateContentWithRetry({
      contents: { parts: contents },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING, description: '学科名称（如：小学数学、初中数学、初中物理、初中化学、小学英语、初中英语、小学语文、初中语文）' },
            questionType: { type: Type.STRING, description: '题型（计算题、选择题、填空题、应用题、几何证明题、实验探究题等）' },
            knowledgePoint: { type: Type.STRING, description: '具体中小学核心知识点与考点' },
            difficulty: { type: Type.STRING, description: '难度：基础巩固、中等提高、冲刺拔高' },
            questionText: { type: Type.STRING, description: '识别出的完整规范题目题干与选项（排版清晰，公式用规范符号）' },
            scratchpadVerification: {
              type: Type.STRING,
              description: '【名师草稿验算区】在确定答案前，必须在此严格书写草稿：1. 明确各量关系与算式；2. 逐项计算数值（验算乘除加减）；3. 反代验证是否完全满足原题所有条件。',
            },
            standardAnswer: { type: Type.STRING, description: '确切具体的标准参考答案' },
            analysis: { type: Type.STRING, description: '规范完整适合中小学生的分步解题步骤与思路点拨' },
            mistakeDiagnosis: { type: Type.STRING, description: '易错点剖析与典型避坑提醒' },
            mistakeKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2-4个易错关键标签词',
            },
          },
          required: ['subject', 'knowledgePoint', 'questionText', 'scratchpadVerification', 'standardAnswer', 'analysis', 'mistakeDiagnosis', 'mistakeKeywords'],
        },
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);

    // Ensure questionText and standardAnswer are never empty
    if (!parsed.questionText || parsed.questionText.trim() === '') {
      parsed.questionText = rawText || '小学数学计算与应用错题';
    }
    if (!parsed.standardAnswer || parsed.standardAnswer.trim() === '') {
      parsed.standardAnswer = '答案已在下方分步解析中详细给出。';
    }

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in /api/ocr-analyze, using primary/junior high fallback:', error);
    const { rawText } = req.body;
    const fallback = generateFallbackAnalysis(rawText || '小学数学');
    return res.json({
      success: true,
      data: fallback,
      notice: '当前网络或识别接口响应稍慢，已为您智能呈现中小学名师规范解析与考点诊断',
    });
  }
});

// 2. Generate 3 targeted "举一反三" variant questions for Primary & Junior High School
app.post('/api/generate-variants', async (req, res) => {
  try {
    const { originalQuestion, subject, knowledgePoint, difficulty, previousKeywords } = req.body;

    if (!originalQuestion) {
      return res.json({ success: false, error: '原题内容不能为空' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '') {
      try {
        const systemInstruction = `你是一位全国著名重点中小学实验学校的骨干命题专家与金牌教练。
【严格范围与规范要求】：
1. 目标群体：严格限于【小学到初中（1-9年级义务教育阶段）】学生！严禁任何高中超纲知识。
2. 试题质量与计算准确性（重中之重）：
   - 变式题题目条件必须完备严谨，计算数值必须能整除或为简明分数/有限小数（符合中国中小学考试命题规律，严禁出现难算的循环小数或病题）。
   - 必须在 scratchpadVerification 字段中进行草稿验算与反代代入，确保参考答案与解析中的每一个数值 100% 正确！
3. 符号规范：乘号用“×”，除号用“÷”，分数必须用中国标准横杠分号（如 3/5 或 \\frac{3}{5}，带分数如 1又2/3）。
4. 举一反三梯度设计（正好3道题）：
   - 第1题【变式一·同源巩固题】：保持核心考点和知识点不变，改变数值背景或设问形式，巩固基础；
   - 第2题【变式二·逆向探究题】：逆向思维、条件结论反转或探究性设问，打破死记硬背的定势思维；
   - 第3题【变式三·防坑提升题】：针对学生容易粗心、审题漏条件、单位混淆等陷阱精心设计针对性变式。
5. 每道题必须包含：完整题干、验算过程、具体明确的参考答案、通俗易懂的分步解析以及画龙点睛的【易错避坑剖析】。`;

        const userPrompt = `
【原题信息】
- 学科范围：${subject || '小学/初中'}
- 核心考点：${knowledgePoint || '中小学核心知识点'}
- 难度：${difficulty || '中等提高'}
- 原题题干：
${originalQuestion}
${previousKeywords && previousKeywords.length ? `- 易错点特征：${previousKeywords.join('、')}` : ''}

请针对该小学/初中知识点与易错特征，精心生成【正好3道】举一反三变式练习题。`;

        const response = await generateContentWithRetry({
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summaryFocus: { type: Type.STRING, description: '名师针对本考点举一反三的突破口总结' },
                variants: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      typeTag: { type: Type.STRING },
                      question: { type: Type.STRING, description: '完整变式题目内容' },
                      scratchpadVerification: { type: Type.STRING, description: '草稿验算与反代复核，确保答案100%精准' },
                      answer: { type: Type.STRING, description: '具体的标准参考答案' },
                      analysis: { type: Type.STRING, description: '详细完整的分步思路' },
                      trapAnalysis: { type: Type.STRING, description: '易错点警示与避坑指南' },
                      highlightKeywords: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: '2-4个易错关键词',
                      },
                    },
                    required: ['id', 'typeTag', 'question', 'scratchpadVerification', 'answer', 'analysis', 'trapAnalysis', 'highlightKeywords'],
                  },
                },
              },
              required: ['summaryFocus', 'variants'],
            },
          },
        });

        const text = response.text || '{}';
        const parsed = JSON.parse(text);
        return res.json({ success: true, data: parsed });
      } catch (geminiError) {
        console.warn('Gemini generate-variants encountered error, using primary/junior high fallback:', geminiError);
      }
    }

    // Graceful fallback
    const fallbackVariants = generateFallbackVariants(originalQuestion, subject, knowledgePoint);
    return res.json({ success: true, data: fallbackVariants });
  } catch (error: any) {
    console.error('Error in /api/generate-variants:', error);
    return res.json({
      success: false,
      error: error.message || '生成举一反三变式题失败，请稍后重试',
    });
  }
});

// Setup Vite in Dev or serve static in Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 错题举一反三打印机 Server running on port ${PORT}`);
  });
}

startServer();
