import React from 'react';
import { Camera, BookOpen, Printer, Sparkles, HelpCircle } from 'lucide-react';

interface HeaderNavProps {
  currentTab: 'ocr' | 'notebook';
  onTabChange: (tab: 'ocr' | 'notebook') => void;
  notebookCount: number;
  onOpenSamplePicker: () => void;
  onOpenPrintAll: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  onTabChange,
  notebookCount,
  onOpenSamplePicker,
  onOpenPrintAll,
}) => {
  return (
    <>
      {/* Desktop / Tablet Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-2xs no-print">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-stone-900 font-serif-sc">
                  错题举一反三打印机
                </span>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  全科提分利器
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                拍照识别错题 · 考点智能变式 · 易错深度解析 · A4排版打印
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden sm:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              type="button"
              onClick={() => onTabChange('ocr')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'ocr'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              错题识别与生成
            </button>

            <button
              type="button"
              onClick={() => onTabChange('notebook')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTab === 'notebook'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              错题本
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold">
                {notebookCount}
              </span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSamplePicker}
              className="hidden md:flex text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 px-3 py-1.5 rounded-lg transition-colors items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              体验经典考题
            </button>

            <button
              type="button"
              onClick={onOpenPrintAll}
              className="text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 rounded-lg shadow-2xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">A4 排版打印</span>
              <span className="sm:hidden">打印</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-6 py-2 flex items-center justify-around shadow-lg no-print">
        <button
          type="button"
          onClick={() => onTabChange('ocr')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors cursor-pointer ${
            currentTab === 'ocr' ? 'text-amber-600 font-bold' : 'text-stone-500'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span className="text-[11px]">错题识别</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('notebook')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-colors relative cursor-pointer ${
            currentTab === 'notebook' ? 'text-amber-600 font-bold' : 'text-stone-500'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[11px]">错题本</span>
          {notebookCount > 0 && (
            <span className="absolute top-0 right-2 w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
              {notebookCount}
            </span>
          )}
        </button>
      </div>
    </>
  );
};
