import React from 'react';

interface HighlightTextProps {
  text: string;
  keywords?: string[];
  className?: string;
  highlightClass?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  keywords = [],
  className = '',
  highlightClass = 'bg-amber-100 text-amber-900 font-semibold px-1 py-0.5 rounded border border-amber-200/80 shadow-xs inline-block my-0.5',
}) => {
  if (!text) return null;
  if (!keywords || keywords.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Filter valid non-empty keywords and escape regex
  const validKeywords = keywords
    .map(k => k.trim())
    .filter(k => k.length > 0)
    .sort((a, b) => b.length - a.length);

  if (validKeywords.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const escaped = validKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = validKeywords.some(
          kw => kw.toLowerCase() === part.toLowerCase()
        );
        if (isMatch) {
          return (
            <mark key={index} className={highlightClass}>
              {part}
            </mark>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
