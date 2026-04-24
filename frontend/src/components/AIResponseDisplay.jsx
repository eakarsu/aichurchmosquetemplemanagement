import React from 'react';
import { Sparkles } from 'lucide-react';

function AIResponseDisplay({ response, title, isLoading }) {
  if (!isLoading && !response) return null;

  const renderContent = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let listType = null;

    const flushList = () => {
      if (listItems.length > 0) {
        if (listType === 'ol') {
          elements.push(<ol key={`ol-${elements.length}`}>{listItems}</ol>);
        } else {
          elements.push(<ul key={`ul-${elements.length}`}>{listItems}</ul>);
        }
        listItems = [];
        listType = null;
      }
    };

    const formatInline = (str) => {
      const parts = [];
      let remaining = str;
      let keyIdx = 0;
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;
      while ((match = boldRegex.exec(remaining)) !== null) {
        if (match.index > lastIndex) {
          parts.push(remaining.slice(lastIndex, match.index));
        }
        parts.push(<strong key={`b-${keyIdx++}`}>{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < remaining.length) {
        parts.push(remaining.slice(lastIndex));
      }
      return parts.length > 0 ? parts : str;
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        return;
      }

      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(<h3 key={`h-${i}`}>{formatInline(trimmed.slice(2))}</h3>);
      } else if (trimmed.startsWith('## ')) {
        flushList();
        elements.push(<h4 key={`h-${i}`}>{formatInline(trimmed.slice(3))}</h4>);
      } else if (/^[-*]\s/.test(trimmed)) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        listItems.push(<li key={`li-${i}`}>{formatInline(trimmed.slice(2))}</li>);
      } else if (/^\d+[.)]\s/.test(trimmed)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        listItems.push(<li key={`li-${i}`}>{formatInline(trimmed.replace(/^\d+[.)]\s/, ''))}</li>);
      } else {
        flushList();
        elements.push(<p key={`p-${i}`}>{formatInline(trimmed)}</p>);
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="ai-response">
      <div className="ai-response-inner">
        <div className="ai-response-header">
          <Sparkles size={18} />
          <span>{title || 'AI Response'}</span>
        </div>
        {isLoading ? (
          <div className="ai-loading">
            <div className="loading-spinner" />
            <span>AI is thinking...</span>
          </div>
        ) : (
          <div className="ai-response-content">
            {renderContent(response)}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIResponseDisplay;
