'use client';

import { useState, useEffect } from 'react';
import { Collection } from '@/lib/api';
import AIFieldSuggestion from './AIFieldSuggestion';
import FieldDefinitionEditor, { FieldDefinition } from './FieldDefinitionEditor';

interface CollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (collection: Collection) => void;
  collection?: Collection | null;
}

// 이모지 리스트 (카테고리별)
const EMOJI_LIST = [
  { category: '일반', emojis: ['📦', '📚', '🎮', '🎲', '🎬', '🎵', '🎨', '📷', '⚽', '🎸'] },
  { category: '책/문서', emojis: ['📖', '📕', '📗', '📘', '📙', '📓', '📔', '📒', '📰', '📄'] },
  { category: '게임', emojis: ['🎯', '🎰', '🎪', '🃏', '🎴', '♟️', '🎳', '🎱', '🏀', '⚾'] },
  { category: '취미', emojis: ['🎭', '🖼️', '🎪', '🎨', '✏️', '🖌️', '🖍️', '📐', '📏', '✂️'] },
  { category: '컬렉션', emojis: ['💎', '💍', '👑', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '⭐'] },
];

export default function CollectionModal({
  isOpen,
  onClose,
  onSave,
  collection,
}: CollectionModalProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('📦');
  const [description, setDescription] = useState('');
  const [fieldDefinitions, setFieldDefinitions] = useState<FieldDefinition[]>([]);
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslatingSlug, setIsTranslatingSlug] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (collection) {
      setName(collection.name);
      setSlug(collection.slug);
      setIcon(collection.icon || '📦');
      setDescription(collection.description || '');

      // field_definitions를 배열로 변환
      if (collection.field_definitions && collection.field_definitions.fields) {
        setFieldDefinitions(collection.field_definitions.fields);
      } else {
        setFieldDefinitions([]);
      }
    } else {
      // Reset for new collection
      setName('');
      setSlug('');
      setIcon('📦');
      setDescription('');
      setFieldDefinitions([]);
    }
  }, [collection, isOpen]);

  // AI를 사용한 슬러그 영문 번역
  const handleTranslateSlug = async () => {
    if (!name) {
      alert('컬렉션 이름을 먼저 입력하세요.');
      return;
    }

    setIsTranslatingSlug(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/ai/translate-slug', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '슬러그 번역에 실패했습니다.');
      }

      const data = await response.json();
      setSlug(data.slug);
    } catch (error) {
      console.error('Slug translation error:', error);
      alert(error instanceof Error ? error.message : '슬러그 번역 중 오류가 발생했습니다.');
    } finally {
      setIsTranslatingSlug(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const collectionData = {
        name,
        slug: slug.trim() || undefined,  // 비어있으면 undefined (백엔드에서 자동 생성)
        icon,
        description,
        field_definitions: fieldDefinitions.length > 0 ? { fields: fieldDefinitions } : undefined,
      };

      const token = localStorage.getItem('auth_token');
      const url = collection
        ? `/api/collections/${collection.id}`
        : '/api/collections';
      const method = collection ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(collectionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save collection');
      }

      const savedCollection = await response.json();
      onSave(savedCollection);
      onClose();
    } catch (error) {
      console.error('Error saving collection:', error);
      alert(`컬렉션 저장에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAISuggestionApply = (aiFields: any) => {
    // AI 추천 결과를 배열로 변환
    if (Array.isArray(aiFields)) {
      setFieldDefinitions(aiFields);
    } else if (aiFields && aiFields.fields && Array.isArray(aiFields.fields)) {
      setFieldDefinitions(aiFields.fields);
    } else {
      setFieldDefinitions([]);
    }
    setShowAISuggestion(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-white to-stone-50 border-b-2 border-slate-200 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-700 bg-clip-text text-transparent">
              {collection ? '컬렉션 수정' : '새 컬렉션'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6 bg-gradient-to-b from-stone-50/50 to-white">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              컬렉션 이름 *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
              placeholder="예: 만화책, 보드게임, 레고"
            />
          </div>

          {/* Advanced Options Toggle */}
          <div className="border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <svg
                className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>{showAdvanced ? '고급 옵션 숨기기' : '고급 옵션 표시'}</span>
              <span className="text-slate-400">(슬러그 직접 설정)</span>
            </button>
          </div>

          {/* Slug (Advanced) */}
          {showAdvanced && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">
                  슬러그 (URL 주소) - 선택사항
                </label>
                {!collection && (
                  <button
                    type="button"
                    onClick={handleTranslateSlug}
                    disabled={isTranslatingSlug || !name}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:from-amber-200 hover:to-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {isTranslatingSlug ? (
                      <>
                        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        번역 중...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        AI로 영문 변환
                      </>
                    )}
                  </button>
                )}
              </div>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all bg-slate-50"
                placeholder={collection ? collection.slug : "비워두면 저장 시 자동 생성"}
                disabled={!!collection}
              />
              <p className="text-xs text-slate-500 mt-1.5">
                {collection ? (
                  <span>⚠️ 기존 컬렉션의 슬러그는 변경할 수 없습니다</span>
                ) : (
                  <span>💡 비워두면 <strong>저장 시</strong> AI가 자동으로 영문 슬러그를 만듭니다 (예: manga, lego)</span>
                )}
              </p>
            </div>
          )}

          {/* Icon */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">
                아이콘
              </label>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                {showEmojiPicker ? '이모지 선택 닫기' : '이모지 선택'}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center text-4xl shadow-inner">
                {icon}
              </div>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all"
                placeholder="이모지 입력 또는 선택"
              />
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="mt-3 p-4 bg-gradient-to-br from-slate-50 to-stone-50 border-2 border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                {EMOJI_LIST.map((group) => (
                  <div key={group.category} className="mb-4 last:mb-0">
                    <h4 className="text-xs font-bold text-slate-600 mb-2">{group.category}</h4>
                    <div className="grid grid-cols-10 gap-2">
                      {group.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setIcon(emoji);
                            setShowEmojiPicker(false);
                          }}
                          className="w-8 h-8 text-2xl hover:bg-amber-100 rounded-lg transition-colors flex items-center justify-center"
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              설명
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200 transition-all resize-none"
              placeholder="컬렉션에 대한 설명을 입력하세요"
            />
          </div>

          {/* Field Definition Editor */}
          <div>
            {showAISuggestion ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-700">
                    AI 필드 추천
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAISuggestion(false)}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    취소
                  </button>
                </div>
                <AIFieldSuggestion
                  collectionName={name}
                  description={description}
                  onApply={handleAISuggestionApply}
                  onCancel={() => setShowAISuggestion(false)}
                />
              </div>
            ) : (
              <FieldDefinitionEditor
                fields={fieldDefinitions}
                onChange={setFieldDefinitions}
                onRequestAISuggestion={() => setShowAISuggestion(true)}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-xl text-slate-700 font-semibold hover:border-slate-700 hover:bg-slate-50 transition-all"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving || !name}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-amber-100 font-semibold rounded-xl hover:from-slate-600 hover:to-slate-700 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isSaving ? (
                <>
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {collection ? '저장 중...' : '생성 중...'}
                  </span>
                </>
              ) : collection ? '수정' : '생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
