'use client';

import { useState, useEffect, useRef } from 'react';
import { Collection, Item } from '@/lib/api';
import { FieldDefinition } from './FieldDefinitionEditor';
import FieldMappingModal from './FieldMappingModal';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  collection: Collection;
  item?: Item | null;
}

type InputMode = 'manual' | 'url';

export default function ItemModal({
  isOpen,
  onClose,
  onSave,
  collection,
  item,
}: ItemModalProps) {
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [urlInput, setUrlInput] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapedData, setScrapedData] = useState<Record<string, any> | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [existingMapping, setExistingMapping] = useState<Record<string, string> | undefined>(undefined);
  const modalRef = useRef<HTMLDivElement>(null);

  // 필드 정의 가져오기
  const fields: FieldDefinition[] = collection.field_definitions?.fields || [];

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
    if (item) {
      setMetadata(item.metadata || {});
      setIsPublic(item.is_public !== undefined ? item.is_public : true);
      setInputMode('manual');
    } else {
      // 새 아이템: 빈 객체로 초기화
      setMetadata({});
      setIsPublic(true);
      setInputMode('manual');
      setUrlInput('');
    }
    setErrors({});
  }, [item, isOpen]);

  const handleScrapeUrl = async () => {
    if (!urlInput.trim()) {
      alert('URL을 입력해주세요.');
      return;
    }

    setIsScrapingUrl(true);
    try {
      const token = localStorage.getItem('auth_token');

      // 저장된 매핑 가져오기
      const mappingResponse = await fetch(`/api/scraper/get-mapping/${collection.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let savedMapping: Record<string, string> | undefined;
      if (mappingResponse.ok) {
        const mappingData = await mappingResponse.json();
        if (mappingData.mapping) {
          // 백엔드 형식 (스크래핑 → 사용자) → 프론트엔드 형식 (사용자 → 스크래핑)으로 변환
          const backendMapping = mappingData.mapping;
          savedMapping = {};
          Object.entries(backendMapping).forEach(([scrapedKey, userKey]) => {
            savedMapping![userKey as string] = scrapedKey;
          });
        }
      }

      const response = await fetch('/api/scraper/scrape-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: urlInput,
          collection_id: collection.id,
          apply_mapping: false, // 매핑 모달에서 처리
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'URL 크롤링에 실패했습니다.');
      }

      const data = await response.json();

      // 스크래핑한 데이터를 저장하고 매핑 모달 표시
      setScrapedData(data.metadata);
      setExistingMapping(savedMapping);
      setShowMappingModal(true);
    } catch (error: any) {
      console.error('URL scraping error:', error);
      alert(error.message || 'URL 크롤링 중 오류가 발생했습니다.');
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleMappingApply = async (
    mappedData: Record<string, any>,
    saveMapping: boolean,
    mapping: Record<string, string>
  ) => {
    // 매핑된 데이터를 폼에 적용
    setMetadata(mappedData);
    setInputMode('manual'); // 수동 모드로 전환하여 수정 가능하게

    // 매핑 저장 요청
    if (saveMapping) {
      try {
        const token = localStorage.getItem('auth_token');

        await fetch('/api/scraper/save-mapping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            collection_id: collection.id,
            mapping: mapping, // 역매핑된 형식 (스크래핑 필드 → 사용자 필드)
            ignore_unmapped: true,
          }),
        });
      } catch (error) {
        console.error('매핑 저장 실패:', error);
      }
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
    // 에러 제거
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (field.required && !metadata[field.key]) {
        newErrors[field.key] = `${field.label}은(는) 필수 항목입니다.`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      const token = localStorage.getItem('auth_token');

      let response;
      if (item) {
        // 수정
        response = await fetch(`/api/items/${collection.id}/${item._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ metadata, is_public: isPublic }),
        });
      } else {
        // 생성
        response = await fetch('/api/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            collection_id: collection.id,
            is_public: isPublic,
            metadata,
          }),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save item');
      }

      const savedItem = await response.json();
      onSave(savedItem);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('아이템 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: FieldDefinition) => {
    const value = metadata[field.key] || '';
    const hasError = !!errors[field.key];

    const baseInputClass = `w-full px-4 py-3 border-2 rounded-lg transition-all ${
      hasError
        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
        : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200'
    } focus:ring-2 focus:outline-none`;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={`${baseInputClass} min-h-[120px] resize-y`}
            required={field.required}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
            required={field.required}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={baseInputClass}
            required={field.required}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={baseInputClass}
            required={field.required}
          >
            <option value="">선택하세요</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'text':
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
            required={field.required}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b-2 border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">
            {item ? '아이템 수정' : '새 아이템'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 입력 모드 선택 (새 아이템일 때만) */}
          {!item && (
            <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    inputMode === 'manual'
                      ? 'bg-slate-700 text-amber-100'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  직접 입력
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('url')}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    inputMode === 'url'
                      ? 'bg-slate-700 text-amber-100'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  URL로 가져오기
                </button>
              </div>

              {inputMode === 'url' && (
                <div className="space-y-3">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://product.kyobobook.co.kr/detail/..."
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleScrapeUrl}
                    disabled={isScrapingUrl || !urlInput.trim()}
                    className="w-full px-4 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isScrapingUrl ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        정보 가져오는 중...
                      </span>
                    ) : (
                      '정보 가져오기'
                    )}
                  </button>
                  <p className="text-xs text-slate-500">
                    💡 교보문고, 알라딘 등의 도서 페이지 URL을 입력하면 자동으로 정보를 가져옵니다.<br />
                    ✓ 추출 정보: 제목, 저자, 출판사, 출판일, ISBN, 가격, 설명, 표지, 쪽수 | 카테고리는 교보문고만 지원
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-stone-50 border-2 border-slate-200 rounded-lg">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                공개 여부
              </label>
              <p className="text-xs text-slate-500">
                {isPublic ? '이 아이템이 공개 페이지에 표시됩니다' : '관리자만 볼 수 있습니다'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isPublic ? 'bg-amber-500' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {fields.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>필드 정의가 없습니다.</p>
              <p className="text-sm mt-2">컬렉션 편집에서 필드를 추가해주세요.</p>
            </div>
          ) : (
            fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
                {errors[field.key] && (
                  <p className="text-red-500 text-sm mt-1">{errors[field.key]}</p>
                )}
              </div>
            ))
          )}

          <div className="flex gap-3 pt-4 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-all"
              disabled={isSaving}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSaving || fields.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-amber-100 rounded-lg font-semibold hover:from-slate-600 hover:to-slate-700 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {item ? '저장 중...' : '생성 중...'}
                </span>
              ) : (
                <span>{item ? '저장' : '생성'}</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 필드 매핑 모달 */}
      {scrapedData && (
        <FieldMappingModal
          isOpen={showMappingModal}
          onClose={() => setShowMappingModal(false)}
          onApply={handleMappingApply}
          scrapedData={scrapedData}
          fieldDefinitions={fields}
          existingMapping={existingMapping}
        />
      )}
    </div>
  );
}
