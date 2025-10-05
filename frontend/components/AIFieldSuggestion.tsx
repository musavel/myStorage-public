'use client';

import { useState, useEffect } from 'react';
import { useAISettings } from '@/hooks/useAISettings';

interface AIFieldSuggestionProps {
  collectionName: string;
  description: string;
  onApply: (fields: any) => void;
  onCancel: () => void;
}

export default function AIFieldSuggestion({
  collectionName,
  description,
  onApply,
  onCancel,
}: AIFieldSuggestionProps) {
  const { settings } = useAISettings();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedFields, setSuggestedFields] = useState<any>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setSuggestedFields(data.fields);
      setProvider(data.provider);
    } catch (err: any) {
      console.error('AI suggestion error:', err);
      setError(err.message || 'AI 필드 추천 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-suggest on mount if collection name exists
  useEffect(() => {
    if (collectionName) {
      handleSuggest();
    }
  }, []); // Only run once on mount

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
              <p className="text-sm font-semibold text-red-800">오류 발생</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={handleSuggest}
            className="mt-3 w-full px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Success State */}
      {suggestedFields && !isLoading && !error && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border-2 border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-sm font-semibold text-slate-700">
                추천 완료 {provider && `(${provider})`}
              </span>
            </div>
            <pre className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 overflow-x-auto max-h-64 border border-slate-200">
              {JSON.stringify(suggestedFields, null, 2)}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg text-slate-700 font-semibold hover:border-slate-700 hover:bg-white transition-all"
            >
              취소
            </button>
            <button
              onClick={() => onApply(suggestedFields)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-md hover:shadow-lg"
            >
              적용
            </button>
          </div>
        </div>
      )}

      {/* No AI Model Warning */}
      {!settings.textModel && !isLoading && !suggestedFields && !error && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800">AI 모델 미설정</p>
              <p className="text-xs text-yellow-700 mt-1">
                기본 모델로 추천을 받습니다. 관리자 모드에서 AI 모델을 설정하면 더 나은 결과를 얻을 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
