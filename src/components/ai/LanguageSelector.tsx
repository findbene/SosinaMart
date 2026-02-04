'use client';

import React from 'react';
import { Language } from '@/types/chat';
import { LANGUAGE_LABELS } from '@/lib/constants';

interface Props {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

const LanguageSelector: React.FC<Props> = ({ currentLanguage, onLanguageChange }) => {
  return (
    <div className="flex items-center gap-2">
      <select
        value={currentLanguage}
        onChange={(e) => onLanguageChange(e.target.value as Language)}
        className="bg-white border-2 border-amber-100 rounded-xl px-3 py-1.5 text-xs font-black text-amber-900 uppercase tracking-widest focus:ring-2 focus:ring-amber-500 outline-none transition-all cursor-pointer shadow-sm"
      >
        {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
