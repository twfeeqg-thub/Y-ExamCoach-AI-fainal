'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  className?: string;
  inline?: boolean;
}

/**
 * Parses text containing LaTeX expressions ($...$ or $$...$$) and renders them with KaTeX.
 * Handles mixed Arabic/English text safely and falls back cleanly if expression syntax is invalid.
 */
export const MathText: React.FC<MathTextProps> = ({ text, className = '', inline = false }) => {
  const renderedContent = useMemo(() => {
    if (!text || typeof text !== 'string') return '';

    // Regex to detect $$...$$ (block) and $...$ (inline)
    const blockRegex = /\$\$([\s\S]+?)\$\$/g;
    const inlineRegex = /\$([^\$\n]+?)\$/g;

    let processed = text;

    // 1. Process Block Math ($$...$$)
    processed = processed.replace(blockRegex, (_match, mathExpr) => {
      try {
        return `<div class="my-2 py-1 overflow-x-auto text-center ltr" dir="ltr">${katex.renderToString(
          mathExpr.trim(),
          { displayMode: true, throwOnError: false }
        )}</div>`;
      } catch {
        return `<pre class="text-xs text-rose-500 bg-rose-50 p-1 rounded font-mono">${mathExpr}</pre>`;
      }
    });

    // 2. Process Inline Math ($...$)
    processed = processed.replace(inlineRegex, (_match, mathExpr) => {
      try {
        return `<span class="inline-block px-1 align-baseline ltr" dir="ltr">${katex.renderToString(
          mathExpr.trim(),
          { displayMode: false, throwOnError: false }
        )}</span>`;
      } catch {
        return `<code class="text-xs text-rose-500 font-mono">${mathExpr}</code>`;
      }
    });

    // Convert newlines to breaks if not already in html
    processed = processed.replace(/\n/g, '<br />');

    return processed;
  }, [text]);

  const Component = inline ? 'span' : 'div';

  return (
    <Component
      className={`leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
};
