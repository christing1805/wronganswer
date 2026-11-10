import React, { useState } from 'react';
import { MistakeRecord, PrintSettings } from '../types';
import { X, Printer, Settings2, FileText, CheckCircle2, AlertTriangle, Eye, Layers } from 'lucide-react';
import { HighlightText } from './HighlightText';

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMistakes: MistakeRecord[];
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  selectedMistakes,
}) => {
  const [settings, setSettings] = useState<PrintSettings>({
    includeOriginal: true,
    includeVariants: true,
    includeAnswers: true,
    answersAtEnd: false, // false = 错题集模式(题后带解析), true = 模拟试卷模式(解析在卷末)
    paperSize: 'A4',
    fontSize: 'standard',
    showWatermark: false,
    studentName: '',
    className: '',
    paperTitle: '《错题举一反三专项巩固训练卷》',
    layoutColumns: 1,
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Calculate total questions
  const totalQuestions = selectedMistakes.reduce((acc, m) => {
    let count = 0;
    if (settings.includeOriginal) count += 1;
    if (settings.includeVariants) count += (m.variants?.length || 0);
    return count;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-stone-900/80 backdrop-blur-xs overflow-hidden">
      {/* Sidebar Controls (Hidden on Print) */}
      <aside className="w-84 sm:w-96 bg-white border-r border-stone-200 flex flex-col h-full shadow-2xl z-10 no-print">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-sm sm:text-base">打印排版与 PDF 预览</h2>
              <p className="text-xs text-stone-500">已选 {selectedMistakes.length} 组错题 (共 {totalQuestions} 题)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">试卷标题</label>
            <input
              type="text"
              value={settings.paperTitle}
              onChange={e => setSettings({ ...settings, paperTitle: e.target.value })}
              className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">学生姓名</label>
              <input
                type="text"
                placeholder="例如：张三"
                value={settings.studentName}
                onChange={e => setSettings({ ...settings, studentName: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">班级/学号</label>
              <input
                type="text"
                placeholder="例如：高二(3)班"
                value={settings.className}
                onChange={e => setSettings({ ...settings, className: e.target.value })}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200">
            <label className="block text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-amber-600" />
              打印内容包含
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                <input
                  type="checkbox"
                  checked={settings.includeOriginal}
                  onChange={e => setSettings({ ...settings, includeOriginal: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>包含原错题与反思</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                <input
                  type="checkbox"
                  checked={settings.includeVariants}
                  onChange={e => setSettings({ ...settings, includeVariants: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>包含举一反三变式练习题</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-stone-700">
                <input
                  type="checkbox"
                  checked={settings.includeAnswers}
                  onChange={e => setSettings({ ...settings, includeAnswers: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span>打印参考答案与易错点剖析</span>
              </label>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200">
            <label className="block text-xs font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-amber-600" />
              排版模式与风格
            </label>
            <div className="space-y-2">
              <div
                onClick={() => setSettings({ ...settings, answersAtEnd: false })}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  !settings.answersAtEnd
                    ? 'border-amber-500 bg-amber-50/60 font-medium text-amber-900'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="font-semibold text-xs flex items-center justify-between">
                  <span>错题集模式（逐题附解析）</span>
                  {!settings.answersAtEnd && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">每道题目下方直接附带答案、分步解析与易错点剖析，适合平时自查自纠。</p>
              </div>

              <div
                onClick={() => setSettings({ ...settings, answersAtEnd: true })}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  settings.answersAtEnd
                    ? 'border-amber-500 bg-amber-50/60 font-medium text-amber-900'
                    : 'border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <div className="font-semibold text-xs flex items-center justify-between">
                  <span>模拟考卷模式（解析在卷末附录）</span>
                  {settings.answersAtEnd && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">正文纯题目留出答题空格，答案与易错点总结分页集中排在卷末，适合实战测验。</p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200">
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">版面分栏</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, layoutColumns: 1 })}
                className={`py-1.5 text-xs rounded-md border font-medium transition-colors ${
                  settings.layoutColumns === 1
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                单栏标准排版
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, layoutColumns: 2 })}
                className={`py-1.5 text-xs rounded-md border font-medium transition-colors ${
                  settings.layoutColumns === 2
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                }`}
              >
                双栏密卷排版
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-2">
          <button
            onClick={handlePrint}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            立即打印 / 另存为 PDF
          </button>
          <p className="text-[11px] text-center text-stone-500">
            在打印窗口中将目标打印机选择为“另存为 PDF”即可保存高清电子文档
          </p>
        </div>
      </aside>

      {/* Main Preview Area (Will print cleanly!) */}
      <main className="flex-1 bg-stone-100 overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
        <div
          id="printable-paper"
          className="bg-white w-full max-w-[210mm] min-h-[297mm] p-8 sm:p-12 shadow-xl border border-stone-300 rounded-sm relative text-stone-900 leading-relaxed"
          style={{
            fontSize: settings.fontSize === 'compact' ? '13px' : settings.fontSize === 'large' ? '15px' : '14px',
          }}
        >
          {/* Header */}
          <div className="text-center pb-4 mb-6 border-b-2 border-stone-900">
            <h1 className="font-serif-sc text-2xl sm:text-3xl font-bold tracking-wider text-stone-900 mb-3">
              {settings.paperTitle || '错题举一反三专项巩固训练卷'}
            </h1>
            <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-stone-700 font-mono px-4 border-t border-dashed border-stone-300 pt-2">
              <div>
                <span>姓名：</span>
                <span className="inline-block min-w-20 border-b border-stone-800 text-center font-bold">
                  {settings.studentName || '_________'}
                </span>
              </div>
              <div>
                <span>班级：</span>
                <span className="inline-block min-w-20 border-b border-stone-800 text-center font-bold">
                  {settings.className || '_________'}
                </span>
              </div>
              <div>
                <span>日期：</span>
                <span className="font-medium">{todayStr}</span>
              </div>
              <div className="border border-stone-800 px-3 py-0.5 rounded text-xs font-bold bg-stone-50">
                得分：_________
              </div>
            </div>
            <div className="text-[11px] text-stone-500 mt-2 italic text-left px-4">
              ※ 命题寄语：举一反三，融会贯通；看清陷阱，避开常错点，稳步提高！
            </div>
          </div>

          {/* Exam Body */}
          <div className={settings.layoutColumns === 2 ? 'columns-1 sm:columns-2 gap-8' : 'space-y-8'}>
            {selectedMistakes.map((mistake, mIdx) => (
              <div key={mistake.id} className="print-avoid-break mb-8 pb-6 border-b border-stone-200 last:border-b-0">
                {/* Section Tag */}
                <div className="flex items-center gap-2 mb-3 bg-stone-100/80 px-3 py-1.5 rounded text-xs font-semibold text-stone-800 border-l-4 border-amber-600">
                  <span className="bg-amber-600 text-white px-1.5 py-0.5 rounded text-[10px]">
                    第 {mIdx + 1} 组
                  </span>
                  <span>学科：{mistake.subject}</span>
                  <span>| 核心考点：{mistake.knowledgePoint}</span>
                  <span>({mistake.difficulty})</span>
                </div>

                {/* 1. Original Question */}
                {settings.includeOriginal && (
                  <div className="mb-5 bg-amber-50/20 p-3 rounded-lg border border-amber-200/50 print-avoid-break">
                    <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-amber-900">
                      <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                      【原题再现与反思】
                    </div>
                    <div className="text-stone-900 whitespace-pre-wrap font-sans leading-relaxed mb-3">
                      {mistake.questionText}
                    </div>

                    {/* If mistake note exists */}
                    {mistake.studentNote && (
                      <div className="text-xs text-stone-600 bg-white p-2 rounded border border-stone-200 mb-2 italic">
                        <span className="font-semibold text-amber-800">错因笔记：</span>
                        {mistake.studentNote}
                      </div>
                    )}

                    {/* If NOT answersAtEnd and includeAnswers */}
                    {!settings.answersAtEnd && settings.includeAnswers && (
                      <div className="mt-3 pt-2 border-t border-amber-200/60 text-xs space-y-1.5 bg-white/80 p-2.5 rounded">
                        <div className="font-bold text-stone-900">
                          【参考答案】<span className="text-emerald-700">{mistake.standardAnswer}</span>
                        </div>
                        <div className="text-stone-700 whitespace-pre-wrap">
                          <span className="font-bold">【解析】：</span>{mistake.analysis}
                        </div>
                        <div className="text-rose-900 bg-rose-50/80 p-2 rounded border border-rose-200/60 mt-1">
                          <span className="font-bold">【易错点警示】：</span>
                          <HighlightText text={mistake.mistakeDiagnosis} keywords={mistake.mistakeKeywords} />
                        </div>
                      </div>
                    )}

                    {/* Blank answer lines for student testing in exam mode */}
                    {settings.answersAtEnd && (
                      <div className="my-3 border border-dashed border-stone-300 rounded p-4 text-xs text-stone-400 bg-stone-50/50">
                        【学生作答区】：
                        <div className="h-16"></div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Variant Questions */}
                {settings.includeVariants && mistake.variants && mistake.variants.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-stone-900 text-white rounded text-[10px]">
                        举一反三
                      </span>
                      同考点变式巩固训练（共 {mistake.variants.length} 题）
                    </div>

                    {mistake.variants.map((v, vIdx) => (
                      <div
                        key={v.id || vIdx}
                        className="pl-3 border-l-2 border-amber-400 py-1 print-avoid-break"
                      >
                        <div className="text-xs font-bold text-amber-800 mb-1">
                          {v.typeTag || `变式练习 ${vIdx + 1}`}
                        </div>
                        <div className="text-stone-900 whitespace-pre-wrap leading-relaxed mb-2 font-sans">
                          {v.question}
                        </div>

                        {/* Blank answer area in exam mode */}
                        {settings.answersAtEnd && (
                          <div className="my-2 border border-dashed border-stone-300 rounded p-3 text-xs text-stone-400 bg-stone-50/40">
                            【解题过程与答案】：
                            <div className="h-16"></div>
                          </div>
                        )}

                        {/* Direct answer in notebook mode */}
                        {!settings.answersAtEnd && settings.includeAnswers && (
                          <div className="text-xs bg-stone-50 p-2.5 rounded border border-stone-200 space-y-1.5 mt-2">
                            <div>
                              <span className="font-bold text-stone-900">【参考答案】：</span>
                              <span className="text-emerald-700 font-semibold">{v.answer}</span>
                            </div>
                            <div className="text-stone-700 whitespace-pre-wrap">
                              <span className="font-bold">【思路点拨】：</span>{v.analysis}
                            </div>
                            <div className="text-rose-900 bg-rose-50 p-2 rounded border border-rose-200">
                              <span className="font-bold">【易错避坑】：</span>
                              <HighlightText text={v.trapAnalysis} keywords={v.highlightKeywords} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 3. Answers at End (Exam Mode appendix) */}
          {settings.answersAtEnd && settings.includeAnswers && (
            <div className="print-page-break mt-12 pt-8 border-t-2 border-stone-900">
              <div className="text-center pb-4 mb-6 border-b border-stone-400">
                <h2 className="text-xl font-bold font-serif-sc text-stone-900">
                  《参考答案、详细解析与易错点透析》
                </h2>
                <p className="text-xs text-stone-500 mt-1">建议独立完成所有练习后再查阅解析，逐题核对易错警示！</p>
              </div>

              <div className="space-y-6">
                {selectedMistakes.map((mistake, mIdx) => (
                  <div key={mistake.id} className="print-avoid-break pb-4 border-b border-dashed border-stone-200">
                    <div className="font-bold text-sm text-stone-900 mb-2">
                      第 {mIdx + 1} 组（{mistake.subject} · {mistake.knowledgePoint}）
                    </div>

                    {settings.includeOriginal && (
                      <div className="text-xs mb-3 pl-3 border-l-2 border-amber-600 space-y-1">
                        <div className="font-semibold text-amber-900">【原题答案与解析】：</div>
                        <div className="text-emerald-800 font-bold">答案：{mistake.standardAnswer}</div>
                        <div className="text-stone-700 whitespace-pre-wrap">{mistake.analysis}</div>
                        <div className="text-rose-900 bg-rose-50 p-2 rounded border border-rose-200 mt-1">
                          <span className="font-bold">【原题典型错因】：</span>
                          <HighlightText text={mistake.mistakeDiagnosis} keywords={mistake.mistakeKeywords} />
                        </div>
                      </div>
                    )}

                    {settings.includeVariants && mistake.variants && (
                      <div className="space-y-3 pl-3">
                        {mistake.variants.map((v, vIdx) => (
                          <div key={v.id || vIdx} className="text-xs border-l-2 border-stone-400 pl-2 space-y-1">
                            <div className="font-bold text-stone-800">{v.typeTag || `变式 ${vIdx + 1}`}：</div>
                            <div className="text-emerald-800 font-bold">答案：{v.answer}</div>
                            <div className="text-stone-700 whitespace-pre-wrap">{v.analysis}</div>
                            <div className="text-rose-900 bg-rose-50/80 p-2 rounded border border-rose-200">
                              <span className="font-bold">【避坑提醒】：</span>
                              <HighlightText text={v.trapAnalysis} keywords={v.highlightKeywords} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-[11px] text-stone-400 pt-8 mt-12 border-t border-stone-200 font-mono">
            — 错题举一反三打印机 · 坚持纠错，每日进步 —
          </div>
        </div>
      </main>
    </div>
  );
};
