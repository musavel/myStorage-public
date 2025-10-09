'use client';

import { useState, useEffect } from 'react';
import { FieldDefinition } from './FieldDefinitionEditor';

interface MappingConfirmationModalProps {
  isOpen: boolean;
  onConfirm: (useMapping: boolean) => void;
  onCancel: () => void;
  savedMapping: Record<string, string> | null; // 백엔드 형식: {scraped_key: user_key}
  fieldDefinitions: FieldDefinition[];
}

export default function MappingConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  savedMapping,
  fieldDefinitions,
}: MappingConfirmationModalProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!isOpen || !savedMapping) return null;

  // 백엔드 형식의 매핑 정보 파싱
  const mappingConfig = savedMapping.mapping || savedMapping;
  const ignoreUnmapped = savedMapping.ignore_unmapped ?? true;

  // 매핑이 현재 필드 정의와 일치하는지 확인
  const userFieldKeys = fieldDefinitions.map(f => f.key);
  const mappedUserKeys = Object.values(mappingConfig);
  const hasMismatch = mappedUserKeys.some(key => !userFieldKeys.includes(key as string));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 max-w-2xl w-full m-4">
        {/* Header */}
        <div className="bg-gradient-to-b from-white to-stone-50 border-b-2 border-slate-200 px-8 py-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-slate-900">저장된 매핑 발견</h2>
          <p className="text-slate-600 mt-2">
            이전에 설정한 필드 매핑이 있습니다. 이 매핑을 사용하시겠습니까?
          </p>
          {hasMismatch && (
            <div className="mt-4 bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-amber-900">주의: 필드 정의 불일치</p>
                  <p className="text-sm text-amber-800 mt-1">
                    저장된 매핑의 일부 필드가 현재 컬렉션의 필드 정의와 일치하지 않습니다.
                    매핑을 삭제하고 새로 설정하는 것을 권장합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="mb-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-90' : ''}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              매핑 상세 정보 {showDetails ? '숨기기' : '보기'}
            </button>
          </div>

          {showDetails && (
            <div className="bg-slate-50 rounded-lg p-4 mb-4 border-2 border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3">필드 매핑:</h3>
              <div className="space-y-2">
                {Object.entries(mappingConfig).map(([scrapedKey, userKey]) => (
                  <div key={scrapedKey} className="flex items-center gap-3 text-sm">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-mono">
                      {scrapedKey}
                    </span>
                    <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    <span className={`px-3 py-1 rounded font-mono ${
                      userFieldKeys.includes(userKey as string)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {userKey as string}
                    </span>
                    {!userFieldKeys.includes(userKey as string) && (
                      <span className="text-xs text-red-600">(필드 없음)</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-300">
                <p className="text-sm text-slate-600">
                  <strong>매핑되지 않은 필드:</strong>{' '}
                  {ignoreUnmapped ? '무시됨' : '원래 키로 유지'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900">
              <strong>매핑 사용:</strong> 스크래핑된 데이터의 필드 이름이 설정한 매핑에 따라 변환됩니다.
            </p>
            <p className="text-sm text-blue-900 mt-2">
              <strong>매핑 사용 안 함:</strong> 스크래핑된 원본 필드 이름 그대로 저장되며, 저장된 매핑은 유지됩니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-t from-white to-stone-50 border-t-2 border-slate-200 px-8 py-4 rounded-b-2xl flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            매핑 사용 안 함
          </button>
          <button
            onClick={() => onConfirm(true)}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg font-semibold hover:from-amber-500 hover:to-amber-600 transition-all"
          >
            매핑 사용
          </button>
        </div>
      </div>
    </div>
  );
}
