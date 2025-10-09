'use client';

import { useState, useEffect } from 'react';
import { useAISettings } from '@/hooks/useAISettings';
import { FieldDefinition } from './FieldDefinitionEditor';

interface AIFieldSuggestionProps {
  collectionName: string;
  description: string;
  existingFields: FieldDefinition[];
  onApply: (fields: FieldDefinition[]) => void;
  onCancel: () => void;
}

export default function AIFieldSuggestion({
  collectionName,
  description,
  existingFields,
  onApply,
  onCancel,
}: AIFieldSuggestionProps) {
  const { settings } = useAISettings();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedFields, setSuggestedFields] = useState<FieldDefinition[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateKeys, setDuplicateKeys] = useState<Set<string>>(new Set());

  const handleSuggest = async () => {
    if (!collectionName) {
      setError('컬렉션 이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const requestBody: any = {
        collection_name: collectionName,
        description: description || undefined,
      };

      // Use selected text model if available
      if (settings.textModel) {
        requestBody.provider = settings.textModel.provider;
        requestBody.model_id = settings.textModel.modelId;
      }

      const response = await fetch('/api/ai/suggest-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'AI 필드 추천에 실패했습니다.');
      }

      const data = await response.json();

      // Convert API response to FieldDefinition array
      let fields: FieldDefinition[] = [];
      if (Array.isArray(data.fields)) {
        fields = data.fields;
      } else if (data.fields && data.fields.fields && Array.isArray(data.fields.fields)) {
        fields = data.fields.fields;
      }

      setSuggestedFields(fields);
      setProvider(data.provider);

      // Select all fields by default
      setSelectedIndices(new Set(fields.map((_, i) => i)));

      // Check for duplicate keys
      const existingKeys = new Set(existingFields.map(f => f.key));
      const duplicates = new Set(fields.filter(f => existingKeys.has(f.key)).map(f => f.key));
      setDuplicateKeys(duplicates);
    } catch (err: any) {
      console.error('AI suggestion error:', err);
      setError(err.message || 'AI 필드 추천 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-suggest on mount if collection name exists and settings are loaded
  useEffect(() => {
    if (!collectionName) {
      setError('컬렉션 이름을 먼저 입력해주세요.');
      return;
    }

    // settings가 아직 로드 중일 수 있으므로 textModel이 있을 때만 실행
    if (settings.textModel) {
      handleSuggest();
    } else if (settings.textModel === null) {
      // settings가 로드되었지만 textModel이 없는 경우
      setError('AI 모델이 설정되지 않았습니다. 관리자 페이지에서 AI 모델을 먼저 설정해주세요.');
    }
  }, [settings.textModel]); // settings.textModel이 변경될 때마다 실행

  const toggleSelect = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === suggestedFields.length && suggestedFields.length > 0) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(suggestedFields.map((_, i) => i)));
    }
  };

  const handleApplySelected = () => {
    const selectedFields = suggestedFields.filter((_, i) =>
      selectedIndices.has(i) && !duplicateKeys.has(suggestedFields[i].key)
    );
    onApply(selectedFields);
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-stone-50 border-2 border-amber-300 rounded-xl p-6 space-y-4 shadow-inner">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">AI 필드 추천</h3>
            <p className="text-xs text-slate-600">
              {settings.textModel
                ? `${settings.textModel.provider} - ${settings.textModel.modelId}`
                : '기본 모델 사용'}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-700 font-medium">AI가 필드를 추천하고 있습니다...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">AI 필드 추천 실패</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
              <p className="text-xs text-slate-600 mt-2">
                💡 AI 기능은 선택 사항입니다. 이 창을 닫고 수동으로 필드를 추가하거나, 컬렉션을 생성할 수 있습니다.
              </p>
            </div>
          </div>
          {!error.includes('AI 모델이 설정되지') && (
            <button
              onClick={handleSuggest}
              className="mt-3 w-full px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
            >
              다시 시도
            </button>
          )}
        </div>
      )}

      {/* Success State - Preview Panel */}
      {suggestedFields.length > 0 && !isLoading && !error && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border-2 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-stone-50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-sm font-semibold text-slate-700">
                  추천 필드 미리보기 {provider && `(${provider})`}
                </span>
                <span className="text-xs text-slate-500">
                  ({selectedIndices.size}/{suggestedFields.length} 선택)
                </span>
              </div>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
              >
                {selectedIndices.size === suggestedFields.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>

            {/* Field List */}
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="w-10 px-3 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIndices.size === suggestedFields.length && suggestedFields.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Key</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Label</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">Type</th>
                    <th className="px-3 py-2 text-center font-semibold text-slate-700">필수</th>
                    <th className="px-3 py-2 text-left font-semibold text-slate-700">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {suggestedFields.map((field, index) => {
                    const isDuplicate = duplicateKeys.has(field.key);
                    const isSelected = selectedIndices.has(index);
                    return (
                      <tr
                        key={index}
                        className={`
                          ${isDuplicate ? 'bg-red-50 opacity-60' : isSelected ? 'bg-amber-50' : 'hover:bg-slate-50'}
                        `}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(index)}
                            disabled={isDuplicate}
                            className="rounded border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <code className="text-xs bg-slate-100 px-2 py-1 rounded">{field.key}</code>
                        </td>
                        <td className="px-3 py-2 text-slate-700">{field.label}</td>
                        <td className="px-3 py-2">
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {field.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {field.required ? (
                            <span className="text-xs text-red-600 font-semibold">필수</span>
                          ) : (
                            <span className="text-xs text-slate-400">선택</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {isDuplicate && (
                            <span className="text-xs font-semibold text-red-600 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              중복
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Duplicate Warning */}
            {duplicateKeys.size > 0 && (
              <div className="p-3 bg-red-50 border-t-2 border-red-200">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-red-800">중복된 필드</p>
                    <p className="text-xs text-red-600 mt-0.5">
                      다음 필드는 이미 존재하여 추가할 수 없습니다: {Array.from(duplicateKeys).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg text-slate-700 font-semibold hover:border-slate-700 hover:bg-white transition-all"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleApplySelected}
              disabled={selectedIndices.size === 0 || selectedIndices.size === duplicateKeys.size}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              선택한 필드 추가 ({selectedIndices.size - Array.from(selectedIndices).filter(i => duplicateKeys.has(suggestedFields[i].key)).length})
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
