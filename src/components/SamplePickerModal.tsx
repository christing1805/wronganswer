import React from 'react';
import { SAMPLE_MISTAKES } from '../data/samples';
import { MistakeRecord } from '../types';
import { X, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

interface SamplePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (sample: MistakeRecord) => void;
}

export const SamplePickerModal: React.FC<SamplePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">精选经典错题体验库</h3>
              <p className="text-xs text-stone-500">点击任意错题可一键载入工作台，体验知识点提取与举一反三</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
          {SAMPLE_MISTAKES.map(sample => (
            <div
              key={sample.id}
              onClick={() => {
                onSelect(sample);
                onClose();
              }}
              className="p-4 rounded-xl border border-stone-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all cursor-pointer group shadow-2xs hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-stone-900 text-white">
                    {sample.subject}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-medium">
                    {sample.difficulty}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {sample.knowledgePoint}
                  </span>
                </div>
                <div className="text-xs text-amber-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  载入体验
                </div>
              </div>

              <p className="text-sm text-stone-700 line-clamp-2 font-mono mb-2">
                {sample.questionText}
              </p>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                  易错预警:
                </span>
                {sample.mistakeKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-xs bg-rose-50 text-rose-700 border border-rose-200/60 px-2 py-0.5 rounded-full"
                  >
                    #{kw}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
