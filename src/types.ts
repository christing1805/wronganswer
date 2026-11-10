export interface VariantQuestion {
  id: string;
  typeTag: string; // e.g. "变式一（同源情境巩固）", "变式二（逆向思维探究）", "变式三（防坑陷阱拓展）"
  question: string;
  answer: string;
  analysis: string;
  trapAnalysis: string;
  highlightKeywords: string[];
}

export interface MistakeRecord {
  id: string;
  createdAt: number;
  subject: string;
  knowledgePoint: string;
  questionType: string;
  difficulty: string;
  originalImage?: string;
  questionText: string;
  standardAnswer: string;
  analysis: string;
  mistakeDiagnosis: string;
  mistakeKeywords: string[];
  studentNote?: string;
  masteryStatus: 'unmastered' | 'practicing' | 'mastered';
  summaryFocus?: string;
  variants: VariantQuestion[];
}

export type SubjectCategory = '全部' | '数学' | '物理' | '化学' | '英语' | '语文' | '生物' | '其他';

export interface PrintSettings {
  includeOriginal: boolean;
  includeVariants: boolean;
  includeAnswers: boolean;
  answersAtEnd: boolean; // true = 试卷模式（解析汇总在卷末），false = 错题集模式（题目后紧随解析）
  paperSize: 'A4' | 'B5';
  fontSize: 'compact' | 'standard' | 'large';
  showWatermark: boolean;
  studentName: string;
  className: string;
  paperTitle: string;
  layoutColumns: 1 | 2; // 1栏或双栏中高考排版
}
