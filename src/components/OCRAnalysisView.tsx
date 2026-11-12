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
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { HighlightText } from './HighlightText';
import { MathText } from './MathText';
import { CameraModal } from './CameraModal';
import { SAMPLE_MISTAKES } from '../data/samples';
import confetti from 'canvas-confetti';

interface OCRAnalysisViewProps {
  onSaveToNotebook: (record: MistakeRecord) => void;
  onOpenSamplePicker: () => void;
  onOpenPrintSingle: (record: MistakeRecord) => void;
  initialRecord?: MistakeRecord | null;
}

// Client-side image compressor: scale large photos down to max 1600px width/height and quality 0.85
const compressImage = (dataUrl: string, maxDimension = 1600, quality = 0.85): Promise<string> => {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const OCRAnalysisView: React.FC<OCRAnalysisViewProps> = ({
  onSaveToNotebook,
  onOpenSamplePicker,
  onOpenPrintSingle,
  initialRecord,
}) => {
  // Image and input state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<'小学' | '初中'>('小学');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [needApiKeyPrompt, setNeedApiKeyPrompt] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Editable analysis result
  const [currentRecord, setCurrentRecord] = useState<MistakeRecord | null>(null);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [showOriginalSolution, setShowOriginalSolution] = useState(true);
  const [revealedVariantAnswers, setRevealedVariantAnswers] = useState<Record<string, boolean>>({});
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

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
    reader.onload = async e => {
      const rawResult = e.target?.result as string;
      const compressed = await compressImage(rawResult);
      setSelectedImage(compressed);
      setErrorMessage(null);
      setNeedApiKeyPrompt(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async (base64Image: string) => {
    const compressed = await compressImage(base64Image);
    setSelectedImage(compressed);
    setErrorMessage(null);
    setNeedApiKeyPrompt(false);
  };

  // 1. OCR + Recognition API
  const handleStartAnalysis = async () => {
    if (!selectedImage && !manualText.trim()) {
      setErrorMessage('请先拍摄/上传错题照片，或在下方输入错题题目');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    setNeedApiKeyPrompt(false);
    setAnalysisStep('【1/3】正在优化图像并识别文字与公式...');

    try {
      const stepTimer1 = setTimeout(() => setAnalysisStep('【2/3】正在提取核心学科考点与解题步骤...'), 1400);
      const stepTimer2 = setTimeout(() => setAnalysisStep('【3/3】正在诊断典型错因与审题盲区...'), 2800);

      const res = await fetch('/api/ocr-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          rawText: manualText.trim() || undefined,
          gradeStage: selectedGrade,
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const rawResponseText = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(rawResponseText);
      } catch (parseErr) {
        throw new Error('服务器正在准备中或网络超时，请稍后重新点击识别');
      }

      if (!json || !json.success) {
        if (json?.needApiKey || res.status === 403) {
          setNeedApiKeyPrompt(true);
        }
        throw new Error(json?.error || '识别失败，请检查网络后重试');
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

      // Scroll smoothly to the result card
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
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

      const rawResponseText = await res.text();
      let json: any = {};
      try {
        json = JSON.parse(rawResponseText);
      } catch (parseErr) {
        throw new Error('变式题生成响应异常，请稍后重新点击');
      }

      if (!json || !json.success) {
        throw new Error(json?.error || '生成变式题失败，请稍后重试');
      }

      const data = json.data;
      const updated: MistakeRecord = {
        ...currentRecord,
        summaryFocus: data.summaryFocus || currentRecord.summaryFocus,
        variants: data.variants || [],
      };

      setCurrentRecord(updated);

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

  // Quick load one of the samples
  const handleQuickLoadSample = (sample: MistakeRecord) => {
    setCurrentRecord(sample);
    setSelectedImage(sample.originalImage || null);
    setErrorMessage(null);
    setNeedApiKeyPrompt(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 sm:pb-12">
      {/* Hero Intro */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          专注小学（1-6年级）与初中（7-9年级）义务教育阶段
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          中小学错题举一反三打印机
        </h1>
        <p className="text-sm text-stone-600 max-w-xl mx-auto">
          专为中小学生打造：拍照识别错题、提炼考点漏洞，使用中国教材正规横杠分号与算式，智能生成 3 道举一反三变式题并支持 A4 排版打印。
        </p>

        {/* Grade Stage Quick Switcher */}
        <div className="pt-1 flex items-center justify-center gap-2">
          <span className="text-xs font-semibold text-stone-500">当前学段：</span>
          <div className="inline-flex p-1 bg-stone-100 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => setSelectedGrade('小学')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedGrade === '小学'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              🎒 小学（1~6年级）
            </button>
            <button
              type="button"
              onClick={() => setSelectedGrade('初中')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedGrade === '初中'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📖 初中（7~9年级）
            </button>
          </div>
        </div>
      </div>

      {/* Top Upload & Camera Capture Card */}
      <div className="bg-white rounded-2xl border-2 border-stone-200/90 shadow-sm p-5 sm:p-6 transition-all hover:border-amber-300">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-stone-900 text-base flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-600" />
            错题拍照与识别
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSamplePicker}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              精选错题库
            </button>
          </div>
        </div>

        {/* Upload & Camera Buttons */}
        {!selectedImage ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Live Camera Modal */}
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-400 bg-amber-50/40 hover:bg-amber-100/50 rounded-2xl transition-all group cursor-pointer shadow-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-md shadow-amber-600/20">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="font-bold text-amber-950 text-sm sm:text-base">
                  开启相机实时拍照
                </span>
                <span className="text-xs text-amber-700/80 mt-1">
                  带扫描对准框，适合电脑摄像头或手机
                </span>
              </button>

              {/* Option 2: Upload File / Album */}
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleImageFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-300 hover:border-stone-400 bg-stone-50 hover:bg-stone-100/60 rounded-2xl transition-all group cursor-pointer shadow-xs"
              >
                <div className="w-12 h-12 rounded-xl bg-stone-800 text-white flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="font-bold text-stone-800 text-sm sm:text-base">
                  选择相册图片 / 拖拽上传
                </span>
                <span className="text-xs text-stone-500 mt-1">
                  支持 JPG, PNG, WebP | 支持 <kbd className="bg-stone-200 px-1 py-0.5 rounded text-[10px] font-mono">Ctrl+V</kbd> 粘贴截图
                </span>
              </div>
            </div>

            {/* Hidden native inputs */}
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
            {/* Direct phone shutter fallback */}
            <input
              type="file"
              ref={cameraInputRef}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleImageFile(e.target.files[0]);
                }
              }}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-stone-200 bg-stone-900/5 max-h-76 flex items-center justify-center p-2">
            <img
              src={selectedImage}
              alt="错题照片预览"
              className="max-h-72 max-w-full object-contain rounded-lg shadow-sm"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                className="bg-white/95 backdrop-blur-xs hover:bg-white text-stone-800 text-xs px-2.5 py-1.5 rounded-lg shadow-sm border border-stone-200 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                重新拍照
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white/95 backdrop-blur-xs hover:bg-white text-stone-800 text-xs px-2.5 py-1.5 rounded-lg shadow-sm border border-stone-200 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                换图
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
          </div>
        )}

        {/* Quick Sample Chips to test in 1 click */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-stone-400 font-medium shrink-0">即刻体验示例：</span>
          {SAMPLE_MISTAKES.map(sample => (
            <button
              key={sample.id}
              type="button"
              onClick={() => handleQuickLoadSample(sample)}
              className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded-md border border-stone-200/80 transition-colors cursor-pointer font-medium flex items-center gap-1"
            >
              <span className="font-bold text-[11px] text-amber-700">[{sample.subject}]</span>
              <span className="truncate max-w-[120px]">{sample.knowledgePoint}</span>
            </button>
          ))}
        </div>

        {/* Text fallback input */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-1.5">
            <span>或者直接粘贴/输入题目文本：</span>
          </div>
          <textarea
            rows={2}
            value={manualText}
            onChange={e => setManualText(e.target.value)}
            placeholder="若无图片或不想拍照，可直接在此处输入错题题干、选项及你的错解..."
            className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all placeholder:text-stone-400"
          />
        </div>

        {/* API Key prompt card if API key is not yet bound */}
        {needApiKeyPrompt && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm space-y-2 animate-in fade-in">
            <div className="font-bold flex items-center gap-2 text-amber-900 text-sm">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>温馨提示：启用 Gemini AI 视觉识别与命题</span>
            </div>
            <p className="leading-relaxed text-amber-900">
              AI 视觉 OCR 识题与举一反三变式生成需调用 Google Gemini 3.8 Flash 模型。请在 AI Studio 界面右上角或左侧点击 <strong>Settings &gt; Secrets</strong> 面板，选择或添加您的 <code className="bg-amber-200/60 px-1 py-0.5 rounded font-mono font-bold">GEMINI_API_KEY</code>。
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onOpenSamplePicker}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                立即载入精选错题库体验
              </button>
              <span className="text-xs text-amber-700">（无需配置 Key 即可体验完整变式、错题本与 A4 打印）</span>
            </div>
          </div>
        )}

        {/* General Error notice */}
        {errorMessage && !needApiKeyPrompt && (
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
        <div ref={resultRef} className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-5 sm:p-6 space-y-5 animate-in fade-in duration-300 scroll-mt-20">
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
                <MathText text={currentRecord.questionText} />
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

          {/* Prominent Standard Solution & Step-by-Step Analysis */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
              <span className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                原题标准参考答案与名师分步思路
              </span>
              <span className="text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-medium">
                中小学教材规范步骤
              </span>
            </div>

            {/* Answer Box */}
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-2xs space-y-1">
              <span className="font-bold text-stone-900 text-xs sm:text-sm">【参考答案】：</span>
              <span className="text-emerald-700 font-bold text-sm sm:text-base ml-1">
                <MathText text={currentRecord.standardAnswer} />
              </span>
            </div>

            {/* Step-by-step thinking Box */}
            <div className="bg-white p-4 rounded-xl border border-stone-200/80 text-xs sm:text-sm leading-relaxed space-y-1.5 shadow-2xs">
              <div className="font-bold text-stone-900 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-stone-600" />
                【分步思路与详细步骤】：
              </div>
              <div className="text-stone-700 whitespace-pre-wrap pl-1">
                <MathText text={currentRecord.analysis} />
              </div>
            </div>
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
                    <MathText text={v.question} />
                  </div>

                  {/* Solution & Trap Analysis */}
                  {isAnswerShown && (
                    <div className="mt-3 pt-3 border-t border-stone-100 space-y-3 text-xs sm:text-sm animate-in fade-in duration-200">
                      <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/70">
                        <div className="font-bold text-emerald-900 mb-1">【参考答案】：</div>
                        <div className="text-emerald-800 font-mono font-semibold">
                          <MathText text={v.answer} />
                        </div>
                      </div>

                      <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 leading-relaxed text-stone-700 whitespace-pre-wrap">
                        <div className="font-bold text-stone-900 mb-1">【解题思路分析】：</div>
                        <MathText text={v.analysis} />
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

      {/* Camera Viewfinder Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </div>
  );
};
