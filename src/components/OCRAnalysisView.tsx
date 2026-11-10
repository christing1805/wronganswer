import React, { useState, useEffect, useRef } from 'react';
import { MistakeRecord, VariantQuestion } from '../types';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Save,
  Printer,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  ChevronDown,
  ChevronUp,
  FileText,
  Trash2,
  ClipboardPaste,
} from 'lucide-react';
import { HighlightText } from './HighlightText';
import confetti from 'canvas-confetti';

interface OCRAnalysisViewProps {
  onSaveToNotebook: (record: MistakeRecord) => void;
  onOpenSamplePicker: () => void;
  onOpenPrintSingle: (record: MistakeRecord) => void;
  initialRecord?: MistakeRecord | null;
}

export const OCRAnalysisView: React.FC<OCRAnalysisViewProps> = ({
  onSaveToNotebook,
  onOpenSamplePicker,
  onOpenPrintSingle,
  initialRecord,
}) => {
  // Image and input state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  // Editable analysis result
  const [currentRecord, setCurrentRecord] = useState<MistakeRecord | null>(null);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [showOriginalSolution, setShowOriginalSolution] = useState(true);
  const [revealedVariantAnswers, setRevealedVariantAnswers] = useState<Record<string, boolean>>({});
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync if initialRecord passed
  useEffect(() => {
    if (initialRecord) {
      setCurrentRecord(initialRecord);
      setSelectedImage(initialRecord.originalImage || null);
    }
  }, [initialRecord]);

  // Support Ctrl+V paste image from clipboard anywhere on the page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('请选择有效的图片文件（JPG, PNG, WebP 等）');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  // 1. OCR + Recognition API
  const handleStartAnalysis = async () => {
    if (!selectedImage && !manualText.trim()) {
      setErrorMessage('请先上传错题照片，或在下方输入错题题目');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStep('正在识别文字与公式...');

    try {
      const stepTimer1 = setTimeout(() => setAnalysisStep('正在分析学科考点与解题步骤...'), 1500);
      const stepTimer2 = setTimeout(() => setAnalysisStep('正在诊断易错根源与审题误区...'), 3500);

      const res = await fetch('/api/ocr-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          rawText: manualText.trim() || undefined,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || '识别失败，请检查网络后重试');
      }

      const data = json.data;
      const newRecord: MistakeRecord = {
        id: 'mistake-' + Date.now(),
        createdAt: Date.now(),
        subject: data.subject || '数学',
        knowledgePoint: data.knowledgePoint || '核心考点',
        questionType: data.questionType || '解答题',
        difficulty: data.difficulty || '中等提高',
        originalImage: selectedImage || undefined,
        questionText: data.questionText || manualText,
        standardAnswer: data.standardAnswer || '',
        analysis: data.analysis || '',
        mistakeDiagnosis: data.mistakeDiagnosis || '',
        mistakeKeywords: data.mistakeKeywords || [],
        masteryStatus: 'unmastered',
        variants: [],
      };

      setCurrentRecord(newRecord);
      setShowOriginalSolution(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '识别解析异常，请重试');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  // 2. Generate Variants API
  const handleGenerateVariants = async () => {
    if (!currentRecord) return;

    setIsGeneratingVariants(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: currentRecord.questionText,
          subject: currentRecord.subject,
          knowledgePoint: currentRecord.knowledgePoint,
          difficulty: currentRecord.difficulty,
          previousKeywords: currentRecord.mistakeKeywords,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || '生成变式题失败，请稍后重试');
      }

      const data = json.data;
      const updated: MistakeRecord = {
        ...currentRecord,
        summaryFocus: data.summaryFocus || currentRecord.summaryFocus,
        variants: data.variants || [],
      };

      setCurrentRecord(updated);

      // Light confetti for fun
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '生成举一反三题目失败，请重试');
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  // 3. Save to notebook
  const handleSaveToNotebook = () => {
    if (!currentRecord) return;
    onSaveToNotebook(currentRecord);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);

    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e) {}
  };

  const toggleVariantAnswer = (id: string) => {
    setRevealedVariantAnswers(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 sm:pb-12">
      {/* Hero Intro */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          全科错题分析 · 考点智能提炼 · 举一反三训练
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          拍照识别错题，生成同考点变式练习
        </h1>
        <p className="text-sm text-stone-600 max-w-xl mx-auto">
          上传错题图片或粘贴题目，AI 自动提炼核心知识点与易错陷阱，一键生成 3 道递进式变式题并支持一键排版打印。
        </p>
      </div>

      {/* Top Upload Card */}
      <div className="bg-white rounded-2xl border-2 border-stone-200/90 shadow-sm p-5 sm:p-6 transition-all hover:border-amber-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-stone-900 text-base flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-600" />
            错题采集与上传
          </h2>
          <button
            type="button"
            onClick={onOpenSamplePicker}
            className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            试一试精选错题
          </button>
        </div>

        {/* Upload Dropzone */}
        {!selectedImage ? (
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleImageFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-6 sm:p-8 text-center bg-stone-50/60 hover:bg-amber-50/20 transition-all cursor-pointer group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleImageFile(e.target.files[0]);
                }
              }}
              accept="image/*"
              className="hidden"
            />
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Camera className="w-7 h-7" />
            </div>
            <p className="font-semibold text-stone-800 text-sm sm:text-base">
              点击选择错题图片，或拖拽图片到这里
            </p>
            <p className="text-xs text-stone-500 mt-1">
              支持 JPG、PNG、WebP | 支持直接键盘按 <kbd className="bg-stone-200 px-1 py-0.5 rounded text-[11px] font-mono">Ctrl+V</kbd> 粘贴截图
            </p>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-900/5 max-h-72 flex items-center justify-center p-2">
            <img
              src={selectedImage}
              alt="错题预览"
              className="max-h-68 max-w-full object-contain rounded-lg shadow-xs"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/90 backdrop-blur-xs hover:bg-white text-stone-700 text-xs px-2.5 py-1.5 rounded-lg shadow-sm border border-stone-200 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                更换图片
              </button>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs p-1.5 rounded-lg shadow-sm border border-rose-200 transition-colors cursor-pointer"
                title="删除图片"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleImageFile(e.target.files[0]);
                }
              }}
              accept="image/*"
              className="hidden"
            />
          </div>
        )}

        {/* Text fallback input */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span>或者直接粘贴/输入题目文本：</span>
          </div>
          <textarea
            rows={2}
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            placeholder="若无图片，可直接在此处输入错题题干、选项及你的错解..."
            className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all placeholder:text-stone-400"
          />
        </div>

        {/* Error notice */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Submit OCR Button */}
        <div className="mt-4 flex items-center justify-end">
          <button
            type="button"
            disabled={isAnalyzing || (!selectedImage && !manualText.trim())}
            onClick={handleStartAnalysis}
            className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>{analysisStep || '名师正在深入分析中...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>开始识别错题与知识点诊断</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Middle: Recognition & Diagnosis Result Area */}
      {currentRecord && (
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 sm:p-6 space-y-5 animate-in fade-in duration-300">
          {/* Header & Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-stone-900 text-white text-xs font-bold">
                {currentRecord.subject}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-semibold">
                {currentRecord.questionType}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium">
                难度：{currentRecord.difficulty}
              </span>
              <span className="text-xs text-stone-500 font-mono">
                考点：
                <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                  {currentRecord.knowledgePoint}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsEditingQuestion(!isEditingQuestion)}
                className="text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/70 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer font-medium"
              >
                <Edit3 className="w-3.5 h-3.5 text-stone-500" />
                {isEditingQuestion ? '完成编辑' : '手动修正题目'}
              </button>
            </div>
          </div>

          {/* Editable Question Body */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-800 flex items-center justify-between">
              <span>【识别题目内容】</span>
              {isEditingQuestion && (
                <span className="text-[11px] text-amber-600 font-normal">
                  （您可以直接修改任何文字或公式以确保准确）
                </span>
              )}
            </label>

            {isEditingQuestion ? (
              <div className="space-y-2">
                <textarea
                  rows={5}
                  value={currentRecord.questionText}
                  onChange={e =>
                    setCurrentRecord({ ...currentRecord, questionText: e.target.value })
                  }
                  className="w-full text-sm p-3 font-mono border-2 border-amber-400 rounded-xl focus:outline-none bg-amber-50/20"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-stone-500">学科：</span>
                    <input
                      type="text"
                      value={currentRecord.subject}
                      onChange={e => setCurrentRecord({ ...currentRecord, subject: e.target.value })}
                      className="border border-stone-300 rounded px-2 py-1 w-24 text-xs ml-1"
                    />
                  </div>
                  <div>
                    <span className="text-stone-500">核心考点：</span>
                    <input
                      type="text"
                      value={currentRecord.knowledgePoint}
                      onChange={e =>
                        setCurrentRecord({ ...currentRecord, knowledgePoint: e.target.value })
                      }
                      className="border border-stone-300 rounded px-2 py-1 w-48 text-xs ml-1"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 text-stone-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                {currentRecord.questionText}
              </div>
            )}
          </div>

          {/* Mistake & Trap Analysis - Highlighted Section */}
          <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>名师错因透析与易错点诊断</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {currentRecord.mistakeKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
              <HighlightText
                text={currentRecord.mistakeDiagnosis}
                keywords={currentRecord.mistakeKeywords}
              />
            </p>
          </div>

          {/* Collapsible Original Solution */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOriginalSolution(!showOriginalSolution)}
              className="w-full px-4 py-2.5 bg-stone-50 hover:bg-stone-100/80 flex items-center justify-between text-xs font-bold text-stone-700 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                原题标准答案与分步解析
              </span>
              {showOriginalSolution ? (
                <ChevronUp className="w-4 h-4 text-stone-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-400" />
              )}
            </button>

            {showOriginalSolution && (
              <div className="p-4 space-y-3 bg-white text-xs sm:text-sm">
                <div>
                  <span className="font-bold text-stone-900">【参考答案】：</span>
                  <span className="text-emerald-700 font-semibold font-mono">
                    {currentRecord.standardAnswer}
                  </span>
                </div>
                <div className="whitespace-pre-wrap text-stone-700 leading-relaxed">
                  <span className="font-bold text-stone-900">【分步思路】：</span>
                  {currentRecord.analysis}
                </div>
              </div>
            )}
          </div>

          {/* Student Note */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">
              📝 我的纠错心得 / 笔记（可选）
            </label>
            <input
              type="text"
              value={currentRecord.studentNote || ''}
              onChange={e => setCurrentRecord({ ...currentRecord, studentNote: e.target.value })}
              placeholder="记录自己的失分细节，如：计算粗心忘移项、审题看错条件..."
              className="w-full text-xs sm:text-sm px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
            />
          </div>

          {/* Primary Action Button: 生成举一反三题目 */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-stone-100">
            <div className="text-xs text-stone-500">
              💡 提炼考点：<strong className="text-stone-800">{currentRecord.knowledgePoint}</strong>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleGenerateVariants}
                disabled={isGeneratingVariants}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-stone-300 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isGeneratingVariants ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>正在生成举一反三题目...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>生成举一反三题目 (3道变式)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveToNotebook}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4 text-stone-600" />
                <span>保存错题库</span>
              </button>
            </div>
          </div>

          {saveSuccessNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                已成功保存到错题本！可随时在错题本页面进行复习与打印。
              </span>
            </div>
          )}
        </div>
      )}

      {/* Bottom: 举一反三变式题展示区 */}
      {currentRecord && currentRecord.variants && currentRecord.variants.length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-400">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                  举一反三专项变式练习（共3题）
                </h3>
                <p className="text-xs text-stone-500">
                  递进式题型：同源巩固 → 逆向探究 → 防坑拔高，专治考点漏洞
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateVariants}
                disabled={isGeneratingVariants}
                className="text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isGeneratingVariants ? 'animate-spin' : ''}`} />
                重新生成一组
              </button>
              <button
                type="button"
                onClick={() => onOpenPrintSingle(currentRecord)}
                className="text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                打印本组题目
              </button>
            </div>
          </div>

          {/* Summary Focus */}
          {currentRecord.summaryFocus && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-950 flex items-start gap-2.5">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">名师点拨突破口：</strong>
                <span>{currentRecord.summaryFocus}</span>
              </div>
            </div>
          )}

          {/* The 3 Variant Cards */}
          <div className="space-y-4">
            {currentRecord.variants.map((v, idx) => {
              const isAnswerShown = !!revealedVariantAnswers[v.id || idx];
              return (
                <div
                  key={v.id || idx}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 space-y-3.5 transition-all hover:border-amber-400"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                      {v.typeTag || `变式练习 ${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleVariantAnswer(v.id || String(idx))}
                      className="text-xs font-medium text-stone-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                    >
                      <span>{isAnswerShown ? '收起解析' : '查看答案与易错点'}</span>
                      {isAnswerShown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Question Stem */}
                  <div className="text-stone-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                    {v.question}
                  </div>

                  {/* Solution & Trap Analysis */}
                  {isAnswerShown && (
                    <div className="mt-3 pt-3 border-t border-stone-100 space-y-3 text-xs sm:text-sm animate-in fade-in duration-200">
                      <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/70">
                        <div className="font-bold text-emerald-900 mb-1">【参考答案】：</div>
                        <div className="text-emerald-800 font-mono font-semibold">{v.answer}</div>
                      </div>

                      <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 leading-relaxed text-stone-700 whitespace-pre-wrap">
                        <div className="font-bold text-stone-900 mb-1">【解题思路分析】：</div>
                        {v.analysis}
                      </div>

                      {/* Trap Analysis */}
                      <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200 text-rose-950 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                            易错点剖析与避坑指南
                          </span>
                          <div className="flex items-center gap-1">
                            {v.highlightKeywords.map((kw, kIdx) => (
                              <span
                                key={kIdx}
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200/60 text-rose-800"
                              >
                                #{kw}
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs leading-relaxed">
                          <HighlightText text={v.trapAnalysis} keywords={v.highlightKeywords} />
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action to Save or Print */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleSaveToNotebook}
              className="w-full sm:w-auto px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-400" />
              保存到错题本
            </button>
            <button
              type="button"
              onClick={() => onOpenPrintSingle(currentRecord)}
              className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              打印排版预览
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
