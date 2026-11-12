import React from 'react';

interface MathFractionProps {
  numerator: React.ReactNode;
  denominator: React.ReactNode;
  whole?: React.ReactNode;
  isNegative?: boolean;
}

/**
 * 中国中小学正规数学横杠分数组件（分子在上、分母在下、中带水平分数线一横，支持带分数与负数）
 */
export const MathFraction: React.FC<MathFractionProps> = ({
  numerator,
  denominator,
  whole,
  isNegative = false,
}) => {
  return (
    <span
      className="inline-block whitespace-nowrap align-middle font-serif text-current select-text print-avoid-break"
      style={{
        display: 'inline-block',
        whiteSpace: 'nowrap',
        verticalAlign: '-0.32em',
        lineHeight: 1,
        margin: '0 2px',
      }}
    >
      {isNegative && (
        <span
          className="inline-block font-sans font-medium select-none"
          style={{
            display: 'inline-block',
            verticalAlign: 'middle',
            marginRight: '2px',
            fontSize: '0.95em',
          }}
        >
          -
        </span>
      )}
      {whole && (
        <span
          className="inline-block font-sans font-bold select-text"
          style={{
            display: 'inline-block',
            verticalAlign: 'middle',
            marginRight: '2px',
            fontSize: '1em',
          }}
        >
          {whole}
        </span>
      )}
      <span
        className="inline-block text-center"
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          className="block font-medium"
          style={{
            display: 'block',
            borderBottom: '1.5px solid currentColor',
            padding: '0 2px 1px 2px',
            fontSize: '0.82em',
            lineHeight: 1.1,
            minWidth: '0.8em',
            textAlign: 'center',
          }}
        >
          {numerator}
        </span>
        <span
          className="block font-medium"
          style={{
            display: 'block',
            padding: '1px 2px 0 2px',
            fontSize: '0.82em',
            lineHeight: 1.1,
            minWidth: '0.8em',
            textAlign: 'center',
          }}
        >
          {denominator}
        </span>
      </span>
    </span>
  );
};

/**
 * 规范化中国中小学教材常用数学符号（×、÷、≤、≥、≠、△、∠、°、π等）并清理 LaTeX 冗余标记
 */
function cleanChineseMathSymbols(rawText: string): string {
  if (!rawText) return '';
  return rawText
    // 规范化 LaTeX 换行分数与多余空格
    .replace(/\\frac\s*\{\s*([^{}]+)\s*\}\s*\{\s*([^{}]+)\s*\}/g, (_m, p1, p2) => {
      const cleanP1 = p1.replace(/\s+/g, ' ').trim();
      const cleanP2 = p2.replace(/\s+/g, ' ').trim();
      return `\\frac{${cleanP1}}{${cleanP2}}`;
    })
    // 乘除运算符号
    .replace(/\\times(?![a-zA-Z])|\s*\*\s*/g, ' × ')
    .replace(/\\div(?![a-zA-Z])/g, ' ÷ ')
    .replace(/\\cdot(?![a-zA-Z])/g, ' · ')
    .replace(/\\pm(?![a-zA-Z])/g, '±')
    // 不等号与比较符号
    .replace(/\\leq?(?![a-zA-Z])/g, '≤')
    .replace(/\\geq?(?![a-zA-Z])/g, '≥')
    .replace(/\\neq(?![a-zA-Z])/g, '≠')
    .replace(/\\approx(?![a-zA-Z])/g, '≈')
    // 几何与推理符号
    .replace(/\\triangle(?![a-zA-Z])|\\Delta(?![a-zA-Z])/g, '△')
    .replace(/\\angle(?![a-zA-Z])/g, '∠')
    .replace(/\\perp(?![a-zA-Z])/g, '⊥')
    .replace(/\\parallel(?![a-zA-Z])/g, '∥')
    .replace(/\\cong(?![a-zA-Z])/g, '≌')
    .replace(/\\sim(?![a-zA-Z])/g, '∽')
    .replace(/\\odot(?![a-zA-Z])/g, '⊙')
    .replace(/\\because(?![a-zA-Z])/g, '∵')
    .replace(/\\therefore(?![a-zA-Z])/g, '∴')
    // 度数与常数
    .replace(/\^\\circ(?![a-zA-Z])|\\circ(?![a-zA-Z])/g, '°')
    .replace(/\\pi(?![a-zA-Z])/g, 'π')
    .replace(/\\alpha(?![a-zA-Z])/g, 'α')
    .replace(/\\beta(?![a-zA-Z])/g, 'β')
    .replace(/\\theta(?![a-zA-Z])/g, 'θ')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    // 清除包裹公式的美元符
    .replace(/\$\$/g, '')
    .replace(/\$([^\$]+)\$/g, '$1');
}

/**
 * 智能解析文本中的中国标准分数（横杠分数、带分数、括号分式、纯数字及代数分式）
 */
export function formatMathInString(text: string): React.ReactNode[] {
  if (!text) return [];

  const cleaned = cleanChineseMathSymbols(text);

  // 正则匹配：
  // 1. 带分数 LaTeX: (\d+)\\frac{A}{B}
  // 2. 普通 LaTeX 分数: \\frac{A}{B}
  // 3. 中文带分数: (\d+)\s*(?:又|\s+)(\d{1,4})\/(\d{1,4})
  // 4. 括号分子或分母算式: \(([^()]+)\)\/(\d+|[a-zA-Z]|\([^()]+\))
  // 5. 纯数字分数: (^|[^\d/])(-)?(\d{1,4})\/(\d{1,4})(?=[^\d/]|$)(?!\/\d)
  // 6. 常见中小学代数分式: (^|[^\d/a-zA-Z])([a-zA-Z])\/(\d{1,4}|[a-zA-Z])(?=[^\d/a-zA-Z]|$)
  const masterRegex = /(\d+)\\frac\{((?:[^{}]|\{[^{}]*\})+)\}\{((?:[^{}]|\{[^{}]*\})+)\}|(\\frac\{((?:[^{}]|\{[^{}]*\})+)\}\{((?:[^{}]|\{[^{}]*\})+)\})|(\d+)\s*(?:又|\s+)(\d{1,4})\/(\d{1,4})|\(([^()]+)\)\/(\d{1,4}|[a-zA-Z]|\([^()]+\))|((^|[^\d/])(-)?(\d{1,4})\/(\d{1,4})(?=[^\d/]|$)(?!\/\d))|((^|[^\d/a-zA-Z])([a-zA-Z])\/(\d{1,4}|[a-zA-Z])(?=[^\d/a-zA-Z]|$))/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = masterRegex.exec(cleaned)) !== null) {
    const matchStart = match.index;
    const matchEnd = masterRegex.lastIndex;

    if (match[1]) {
      // 1. 带分数 LaTeX: 1\frac{2}{3}
      if (matchStart > lastIndex) {
        elements.push(renderSupSub(cleaned.substring(lastIndex, matchStart)));
      }
      const whole = match[1];
      const num = match[2].trim();
      const den = match[3].trim();
      elements.push(
        <MathFraction
          key={`frac-mixed-latex-${matchStart}`}
          whole={whole}
          numerator={renderSupSub(num)}
          denominator={renderSupSub(den)}
        />
      );
      lastIndex = matchEnd;
    } else if (match[4]) {
      // 2. 普通 LaTeX: \frac{num}{den}
      if (matchStart > lastIndex) {
        elements.push(renderSupSub(cleaned.substring(lastIndex, matchStart)));
      }
      const num = match[5].trim();
      const den = match[6].trim();
      const isNeg = num.startsWith('-');
      const cleanNum = isNeg ? num.substring(1).trim() : num;
      elements.push(
        <MathFraction
          key={`frac-latex-${matchStart}`}
          isNegative={isNeg}
          numerator={renderSupSub(cleanNum)}
          denominator={renderSupSub(den)}
        />
      );
      lastIndex = matchEnd;
    } else if (match[7]) {
      // 3. 中文带分数: 1又2/3 或 1 2/3
      if (matchStart > lastIndex) {
        elements.push(renderSupSub(cleaned.substring(lastIndex, matchStart)));
      }
      const whole = match[7];
      const num = match[8];
      const den = match[9];
      elements.push(
        <MathFraction
          key={`frac-mixed-${matchStart}`}
          whole={whole}
          numerator={num}
          denominator={den}
        />
      );
      lastIndex = matchEnd;
    } else if (match[10]) {
      // 4. 括号分子式: (12+5)/20 或 (x+1)/2
      if (matchStart > lastIndex) {
        elements.push(renderSupSub(cleaned.substring(lastIndex, matchStart)));
      }
      const num = match[10].trim();
      let den = match[11].trim();
      if (den.startsWith('(') && den.endsWith(')')) {
        den = den.substring(1, den.length - 1);
      }
      elements.push(
        <MathFraction
          key={`frac-paren-${matchStart}`}
          numerator={renderSupSub(num)}
          denominator={renderSupSub(den)}
        />
      );
      lastIndex = matchEnd;
    } else if (match[12]) {
      // 5. 纯数字分数: 3/5, -1/4
      const prefix = match[13] || '';
      const textBeforeFraction = matchStart + prefix.length;
      if (textBeforeFraction > lastIndex) {
        elements.push(renderSupSub(cleaned.substring(lastIndex, textBeforeFraction)));
      }

      const isNeg = !!match[14];
      const num = match[15];
      const den = match[16];

      elements.push(
        <MathFraction
          key={`frac-num-${matchStart}`}
          isNegative={isNeg}
          numerator={num}
          denominator={den}
        />
      );
      lastIndex = matchEnd;
    } else if (match[17]) {
      // 6. 简单代数分式: x/2, 3/x
      const prefix = match[18] || '';
      const textBeforeFraction = matchStart + prefix.length;
      if (textBeforeFraction > lastIndex) {
        elements.push(renderSupSub(cleaned.substring(lastIndex, textBeforeFraction)));
      }

      const num = match[19];
      const den = match[20];

      elements.push(
        <MathFraction
          key={`frac-alg-${matchStart}`}
          numerator={num}
          denominator={den}
        />
      );
      lastIndex = matchEnd;
    }
  }

  // 尾部剩余文本
  if (lastIndex < cleaned.length) {
    elements.push(renderSupSub(cleaned.substring(lastIndex)));
  }

  return elements;
}

/**
 * 处理上下标（x², cm³, t_max, F_浮 等）
 */
function renderSupSub(text: string): React.ReactNode {
  if (!text) return null;

  if (!text.includes('^') && !text.includes('_')) {
    return text;
  }

  const subSuperRegex = /(\^\{([^{}]+)\}|\^([a-zA-Z0-9+-°]+))|(_\{([^{}]+)\}|_([a-zA-Z0-9+-\u4e00-\u9fa5]+))/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = subSuperRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.substring(lastIdx, m.index));
    }

    if (m[1]) {
      // 上标
      const val = m[2] || m[3];
      parts.push(
        <sup key={`sup-${m.index}`} className="text-[0.75em] leading-none">
          {val}
        </sup>
      );
    } else if (m[4]) {
      // 下标
      const val = m[5] || m[6];
      parts.push(
        <sub key={`sub-${m.index}`} className="text-[0.75em] leading-none">
          {val}
        </sub>
      );
    }

    lastIdx = subSuperRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return <React.Fragment key={text}>{parts}</React.Fragment>;
}

interface MathTextProps {
  text?: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text = '', className = '' }) => {
  if (!text) return null;
  return <span className={`inline ${className}`}>{formatMathInString(text)}</span>;
};
