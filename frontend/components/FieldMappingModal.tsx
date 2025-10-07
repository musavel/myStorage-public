'use client';

import { useState, useEffect, useRef } from 'react';
import { FieldDefinition } from './FieldDefinitionEditor';

interface FieldMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (mappedData: Record<string, any>, saveMapping: boolean, mapping: Record<string, string>) => void;
  scrapedData: Record<string, any>;
  fieldDefinitions: FieldDefinition[];
  existingMapping?: Record<string, string>;
}

export default function FieldMappingModal({
  isOpen,
  onClose,
  onApply,
  scrapedData,
  fieldDefinitions,
  existingMapping,
}: FieldMappingModalProps) {
  // 사용자 필드 → 스크래핑 필드 매핑 (예: {"책제목": "title", "저자명": "author"})
  const [mapping, setMapping] = useState<Record<string, string>>({});
  // 사용자 필드 → 수동 입력 값 (스크래핑 데이터에 없는 경우)
  const [manualValues, setManualValues] = useState<Record<string, string>>({});
  const [saveMapping, setSaveMapping] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // 바깥 클릭으로 닫기
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setManualValues({});
      // 기존 매핑이 있으면 사용, 없으면 자동 매칭 시도
      if (existingMapping && Object.keys(existingMapping).length > 0) {
        setMapping(existingMapping);
      } else {
        autoMatch();
      }
    }
  }, [isOpen, scrapedData, fieldDefinitions, existingMapping]);

  const autoMatch = () => {
    const newMapping: Record<string, string> = {};
    const scrapedKeys = Object.keys(scrapedData);

    fieldDefinitions.forEach((field) => {
      // 정확히 일치하는 스크래핑 필드 찾기
      const exactMatch = scrapedKeys.find(key => key === field.key);
      if (exactMatch) {
        newMapping[field.key] = exactMatch;
        return;
      }

      // 유사한 이름 찾기
      const similarMatch = scrapedKeys.find(key =>
        key.toLowerCase().includes(field.key.toLowerCase()) ||
        field.key.toLowerCase().includes(key.toLowerCase()) ||
        key.toLowerCase().includes(field.label.toLowerCase()) ||
        field.label.toLowerCase().includes(key.toLowerCase())
      );

      if (similarMatch) {
        newMapping[field.key] = similarMatch;
      }
    });

    setMapping(newMapping);
  };

  const handleMappingChange = (userFieldKey: string, scrapedKey: string) => {
    setMapping(prev => ({
      ...prev,
      [userFieldKey]: scrapedKey,
    }));
    // 스크래핑 필드를 선택하면 수동 입력 값 제거
    if (scrapedKey) {
      setManualValues(prev => {
        const newValues = { ...prev };
        delete newValues[userFieldKey];
        return newValues;
      });
    }
  };

  const handleManualValueChange = (userFieldKey: string, value: string) => {
    setManualValues(prev => ({
      ...prev,
      [userFieldKey]: value,
    }));
  };

  const handleApply = () => {
    // 최종 데이터 생성: 매핑된 스크래핑 데이터 + 수동 입력 값
    const mappedData: Record<string, any> = {};

    fieldDefinitions.forEach((field) => {
      const scrapedKey = mapping[field.key];
      if (scrapedKey && scrapedData[scrapedKey] !== undefined) {
        // 스크래핑 데이터에서 가져오기
        mappedData[field.key] = scrapedData[scrapedKey];
      } else if (manualValues[field.key]) {
        // 수동 입력 값 사용
        mappedData[field.key] = manualValues[field.key];
      }
      // 둘 다 없으면 해당 필드는 비워둠
    });

    // 역매핑 생성: 백엔드는 "스크래핑 필드 → 사용자 필드" 형식을 기대함
    const backendMapping: Record<string, string> = {};
    Object.entries(mapping).forEach(([userKey, scrapedKey]) => {
      if (scrapedKey) {
        backendMapping[scrapedKey] = userKey;
      }
    });

    onApply(mappedData, saveMapping, backendMapping);
    onClose();
  };

  // 매핑 통계
  const mappedCount = fieldDefinitions.filter(f => mapping[f.key] || manualValues[f.key]).length;
  const unmappedCount = fieldDefinitions.length - mappedCount;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b-2 border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">필드 매핑 설정</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 안내 문구 */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>💡 필드 매핑이란?</strong><br />
              내 컬렉션의 각 필드에 스크래핑한 데이터를 할당하거나 직접 입력합니다.
              스크래핑 데이터에 없는 필드는 수동으로 입력할 수 있습니다.
            </p>
          </div>

          {/* 매핑 테이블 */}
          <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                    내 필드
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-bold text-slate-700">
                    ←
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                    스크래핑 데이터 선택
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-slate-700">
                    또는 직접 입력
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {fieldDefinitions.map((field) => {
                  const scrapedKey = mapping[field.key];
                  const hasScrapedData = !!(scrapedKey && scrapedData[scrapedKey] !== undefined);
                  const manualValue = manualValues[field.key] || '';

                  return (
                    <tr key={field.key} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-semibold text-slate-900">{field.label}</div>
                          <code className="text-xs text-slate-500 font-mono">{field.key}</code>
                          {field.required && (
                            <span className="ml-2 text-red-500 text-xs">*필수</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-400">
                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={scrapedKey || ''}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none text-sm"
                        >
                          <option value="">선택 안 함</option>
                          {Object.keys(scrapedData).map((key) => (
                            <option key={key} value={key}>
                              {key}: {String(scrapedData[key]).substring(0, 30)}
                              {String(scrapedData[key]).length > 30 && '...'}
                            </option>
                          ))}
                        </select>
                        {hasScrapedData && scrapedKey && (
                          <div className="mt-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            ✓ {String(scrapedData[scrapedKey]).substring(0, 50)}
                            {String(scrapedData[scrapedKey]).length > 50 && '...'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={manualValue}
                          onChange={(e) => handleManualValueChange(field.key, e.target.value)}
                          placeholder={hasScrapedData ? "스크래핑 데이터 사용 중" : "직접 입력"}
                          disabled={hasScrapedData}
                          className={`w-full px-3 py-2 border-2 rounded-lg text-sm ${
                            hasScrapedData
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'border-slate-300 focus:border-amber-500 focus:outline-none'
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 통계 및 옵션 */}
          <div className="space-y-4">
            {/* 매핑 통계 */}
            <div className="border-2 rounded-lg p-4 bg-slate-50 border-slate-200">
              <p className="text-sm font-semibold text-slate-700">
                📊 매핑 현황: {mappedCount} / {fieldDefinitions.length}개 필드
              </p>
              {unmappedCount > 0 && (
                <p className="text-xs text-slate-600 mt-1">
                  {unmappedCount}개 필드가 비어있습니다. 스크래핑 데이터를 선택하거나 직접 입력해주세요.
                </p>
              )}
            </div>

            {/* 설정 저장 옵션 */}
            <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <input
                type="checkbox"
                id="save-mapping"
                checked={saveMapping}
                onChange={(e) => setSaveMapping(e.target.checked)}
                className="mt-0.5 w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
              />
              <label htmlFor="save-mapping" className="text-sm text-amber-900 cursor-pointer">
                <strong>이 매핑 설정을 저장</strong>
                <span className="block text-xs text-amber-700 mt-1">
                  다음번 URL 스크래핑 시 자동으로 적용됩니다 (일괄 등록에도 적용)
                </span>
              </label>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={autoMatch}
              className="px-6 py-3 border-2 border-amber-400 text-amber-700 rounded-lg font-semibold hover:bg-amber-50 transition-all"
            >
              🤖 자동 매칭
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-amber-100 rounded-lg font-semibold hover:from-slate-600 hover:to-slate-700 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all"
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
