import React, { useState, useMemo } from 'react';
import { MistakeRecord, SubjectCategory } from '../types';
import {
  Printer,
  Trash2,
  CheckSquare,
  Square,
  Search,
  Filter,
  Sparkles,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { HighlightText } from './HighlightText';

interface MistakeNotebookViewProps {
  mistakes: MistakeRecord[];
  onDeleteMistake: (id: string) => void;
  onUpdateMistake: (record: MistakeRecord) => void;
  onOpenPrintModal: (selected: MistakeRecord[]) => void;
  onSelectForWorkspace: (record: MistakeRecord) => void;
  onOpenSamplePicker: () => void;
}

const SUBJECT_OPTIONS: SubjectCategory[] = ['全部', '数学', '物理', '化学', '英语', '语文', '生物'];

export const MistakeNotebookView: React.FC<MistakeNotebookViewProps> = ({
  mistakes,
  onDeleteMistake,
  onUpdateMistake,
  onOpenPrintModal,
  onSelectForWorkspace,
  onOpenSamplePicker,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<SubjectCategory>('全部');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Filtered mistakes
  const filteredMistakes = useMemo(() => {
    return mistakes.filter(m => {
      // Subject filter
      if (selectedSubject !== '全部' && m.subject !== selectedSubject) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && m.masteryStatus !== selectedStatus) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inQuestion = m.questionText.toLowerCase().includes(query);
        const inKnowledge = m.knowledgePoint.toLowerCase().includes(query);
        const inDiagnosis = m.mistakeDiagnosis.toLowerCase().includes(query);
        const inKeywords = m.mistakeKeywords.some(k => k.toLowerCase().includes(query));
        if (!inQuestion && !inKnowledge && !inDiagnosis && !inKeywords) {
          return false;
        }
      }
      return true;
    });
  }, [mistakes, selectedSubject, selectedStatus, searchQuery]);

  // Select all / Deselect all
  const isAllSelected =
    filteredMistakes.length > 0 &&
    filteredMistakes.every(m => selectedIds.includes(m.id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMistakes.map(m => m.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`确定要删除选中的 ${selectedIds.length} 道错题吗？`)) {
      selectedIds.forEach(id => onDeleteMistake(id));
      setSelectedIds([]);
    }
  };

  const handleBatchPrint = () => {
    const toPrint = mistakes.filter(m => selectedIds.includes(m.id));
    if (toPrint.length === 0) {
      alert('请先勾选需要打印的错题！');
      return;
    }
    onOpenPrintModal(toPrint);
  };

  const handlePrintAllFiltered = () => {
    if (filteredMistakes.length === 0) return;
    onOpenPrintModal(filteredMistakes);
  };

  const handleToggleMastery = (m: MistakeRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus: Record<string, 'unmastered' | 'practicing' | 'mastered'> = {
      unmastered: 'practicing',
      practicing: 'mastered',
      mastered: 'unmastered',
    };
    const updated: MistakeRecord = {
      ...m,
      masteryStatus: nextStatus[m.masteryStatus] || 'practicing',
    };
    onUpdateMistake(updated);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6 pb-24 sm:pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-600" />
            我的错题本
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
            共收录 {mistakes.length} 道错题，已掌握{' '}
            <span className="font-bold text-emerald-600">
              {mistakes.filter(m => m.masteryStatus === 'mastered').length}
            </span>{' '}
            道 · 随时勾选组合生成 A4 纸质训练卷
          </p>
        </div>

        {/* Top Action buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isAllSelected ? (
              <>
                <CheckSquare className="w-4 h-4 text-amber-600" />
                取消全选
              </>
            ) : (
              <>
                <Square className="w-4 h-4 text-stone-400" />
                全选本页 ({filteredMistakes.length})
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleBatchPrint}
            disabled={selectedIds.length === 0}
            className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400 text-white shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4" />
            打印选中 ({selectedIds.length})
          </button>

          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBatchDelete}
              className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
              title="删除选中"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Subject Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {SUBJECT_OPTIONS.map(subj => {
            const count =
              subj === '全部'
                ? mistakes.length
                : mistakes.filter(m => m.subject === subj).length;
            const isActive = selectedSubject === subj;
            return (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedSubject(subj)}
                className={`px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <span>{subj}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Mastery Status */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索考点、题目文字、错因关键词..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto text-xs">
            <span className="text-stone-400 shrink-0">状态：</span>
            {[
              { id: 'all', label: '全部' },
              { id: 'unmastered', label: '待攻克' },
              { id: 'practicing', label: '练习中' },
              { id: 'mastered', label: '已掌握' },
            ].map(status => (
              <button
                key={status.id}
                type="button"
                onClick={() => setSelectedStatus(status.id)}
                className={`px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedStatus === status.id
                    ? 'bg-amber-100 text-amber-900 font-bold border border-amber-200'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Card List */}
      {filteredMistakes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 text-stone-400 flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-stone-800 text-base">暂无符合条件的错题</h3>
            <p className="text-xs text-stone-500 mt-1">您可以尝试调整筛选条件，或者上传并添加新的错题</p>
          </div>
          <button
            type="button"
            onClick={onOpenSamplePicker}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            载入精选错题库
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map(m => {
            const isSelected = selectedIds.includes(m.id);
            const isExpanded = expandedCardId === m.id;
            const hasVariants = m.variants && m.variants.length > 0;

            const dateStr = new Date(m.createdAt).toLocaleDateString('zh-CN', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={m.id}
                className={`bg-white rounded-2xl border transition-all duration-200 shadow-2xs hover:shadow-md ${
                  isSelected ? 'border-amber-500 ring-2 ring-amber-500/10' : 'border-stone-200/90'
                }`}
              >
                <div className="p-4 sm:p-5">
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(m.id)}
                        className="text-stone-400 hover:text-amber-600 transition-colors cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-amber-600" />
                        ) : (
                          <Square className="w-5 h-5 text-stone-300" />
                        )}
                      </button>

                      {/* Subject Badge */}
                      <span className="px-2.5 py-0.5 rounded-md bg-stone-900 text-white text-xs font-bold">
                        {m.subject}
                      </span>
                      <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                        {m.knowledgePoint}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Mastery toggle badge */}
                      <button
                        type="button"
                        onClick={e => handleToggleMastery(m, e)}
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                          m.masteryStatus === 'mastered'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : m.masteryStatus === 'practicing'
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                        title="点击切换掌握状态"
                      >
                        {m.masteryStatus === 'mastered' && (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            已攻克
                          </>
                        )}
                        {m.masteryStatus === 'practicing' && (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            强化中
                          </>
                        )}
                        {m.masteryStatus === 'unmastered' && (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            待攻克
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteMistake(m.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="删除错题"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question Stem preview */}
                  <div
                    onClick={() => setExpandedCardId(isExpanded ? null : m.id)}
                    className="cursor-pointer group"
                  >
                    <p className="text-stone-800 text-sm font-sans leading-relaxed line-clamp-3 mb-3">
                      {m.questionText}
                    </p>

                    {/* Mistake keywords */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-3">
                      <span className="text-[11px] text-rose-600 font-bold">易错剖析:</span>
                      {m.mistakeKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-full font-medium"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Detailed Content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-stone-100 space-y-3 animate-in fade-in duration-200">
                      {/* Standard solution */}
                      <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-xs sm:text-sm space-y-1.5">
                        <div className="font-bold text-stone-900">
                          【标准答案】：<span className="text-emerald-700">{m.standardAnswer}</span>
                        </div>
                        <div className="text-stone-700 whitespace-pre-wrap leading-relaxed">
                          <span className="font-bold">【名师解析】：</span>{m.analysis}
                        </div>
                      </div>

                      {/* Trap Analysis */}
                      <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200 text-xs sm:text-sm text-stone-800 leading-relaxed">
                        <div className="font-bold text-rose-900 mb-1 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          典型错因与易错陷阱：
                        </div>
                        <HighlightText text={m.mistakeDiagnosis} keywords={m.mistakeKeywords} />
                      </div>

                      {/* Variants list if existing */}
                      {hasVariants && (
                        <div className="space-y-2 pt-2">
                          <div className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            已生成的 3 道举一反三变式练习：
                          </div>
                          {m.variants.map((v, vIdx) => (
                            <div
                              key={v.id || vIdx}
                              className="p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl text-xs space-y-1"
                            >
                              <div className="font-bold text-amber-900">{v.typeTag || `变式 ${vIdx + 1}`}</div>
                              <div className="text-stone-800 whitespace-pre-wrap">{v.question}</div>
                              <div className="text-stone-600 pt-1">
                                <span className="font-semibold text-emerald-800">答案：</span>{v.answer}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Bottom Meta & Actions */}
                  <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        {dateStr}
                      </span>
                      <span>
                        {hasVariants ? (
                          <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                            已生成 3 道变式
                          </span>
                        ) : (
                          <span className="text-stone-400">尚未生成变式</span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectForWorkspace(m)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        {hasVariants ? '在工作台再练' : '去生成变式'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenPrintModal([m])}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-600" />
                        单题打印
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedCardId(isExpanded ? null : m.id)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
