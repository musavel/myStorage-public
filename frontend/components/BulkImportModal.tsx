'use client';

import { useState, useEffect, useRef } from 'react';
import { Collection } from '@/lib/api';
import MappingConfirmationModal from './MappingConfirmationModal';
import { FieldDefinition } from './FieldDefinitionEditor';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  collection: Collection;
}

interface ProgressState {
  total: number;
  completed: number;
  failed: number;
  progress: number;
  errors: string[];
}

interface ResultPreview {
  id: string;
  metadata: Record<string, any>;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  onComplete,
  collection,
}: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [showMappingConfirm, setShowMappingConfirm] = useState(false);
  const [savedMapping, setSavedMapping] = useState<Record<string, string> | null>(null);
  const [applyMapping, setApplyMapping] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createdItems, setCreatedItems] = useState<ResultPreview[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isProcessing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, isProcessing, onClose]);

  // 바깥 클릭으로 닫기 (진행 중이 아닐 때만)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setProgress(null);
      setResult(null);
    }
  };

  const handleDownloadTemplate = () => {
    // CSV 양식 생성 (UTF-8 BOM 포함)
    const csvContent = '\uFEFF' + 'title,URL,purchase_date\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${collection.slug}_import_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('CSV 파일을 선택해주세요.');
      return;
    }

    // 저장된 매핑 확인
    try {
      const token = localStorage.getItem('auth_token');
      const mappingResponse = await fetch(`/api/scraper/get-mapping/${collection.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (mappingResponse.ok) {
        const mappingData = await mappingResponse.json();
        if (mappingData.mapping && Object.keys(mappingData.mapping).length > 0) {
          // 매핑이 있으면 확인 모달 표시
          setSavedMapping(mappingData.mapping);
          setShowMappingConfirm(true);
          return;
        }
      }
    } catch (error) {
      console.error('Failed to fetch mapping:', error);
    }

    // 매핑이 없으면 바로 업로드
    await performUpload(false);
  };

  const performUpload = async (useMapping: boolean) => {
    setIsProcessing(true);
    setProgress({ total: 0, completed: 0, failed: 0, progress: 0, errors: [] });
    setApplyMapping(useMapping);

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('collection_id', collection.id.toString());
      formData.append('apply_mapping', useMapping.toString());

      // 스트리밍 엔드포인트 사용
      const response = await fetch('/api/scraper/bulk-scrape-csv-stream', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('CSV 업로드 실패');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const errors: string[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'start') {
                setProgress({
                  total: data.total,
                  completed: 0,
                  failed: 0,
                  progress: 0,
                  errors: [],
                });
                setCreatedItems([]);
              } else if (data.type === 'progress') {
                setProgress({
                  total: data.total,
                  completed: data.success,
                  failed: data.failed,
                  progress: data.progress,
                  errors,
                });
                // 생성된 아이템 추가
                if (data.item) {
                  setCreatedItems(prev => [...prev, data.item]);
                }
              } else if (data.type === 'error_item') {
                errors.push(data.message);
                setProgress({
                  total: data.total,
                  completed: data.success,
                  failed: data.failed,
                  progress: data.progress,
                  errors: [...errors],
                });
              } else if (data.type === 'complete') {
                setProgress({
                  total: data.total,
                  completed: data.success,
                  failed: data.failed,
                  progress: 100,
                  errors,
                });
                setResult(data);

                // 완료 시 확인 단계로 전환 (자동 닫기 제거)
                if (data.success > 0) {
                  setShowConfirmation(true);
                }
              } else if (data.type === 'error') {
                throw new Error(data.message);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      alert(error instanceof Error ? error.message : 'CSV 처리 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setProgress(null);
    setResult(null);
    setShowConfirmation(false);
    setCreatedItems([]);
    onClose();
  };

  const handleConfirmAndClose = () => {
    onComplete();
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl max-w-2xl w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-2 border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900">CSV 일괄 등록</h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 파일 선택 */}
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-amber-400 transition-all">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isProcessing}
              className="hidden"
              id="csv-file-input"
            />
            <label
              htmlFor="csv-file-input"
              className="cursor-pointer block"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">📄</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">
                {file ? file.name : 'CSV 파일 선택'}
              </p>
              <p className="text-sm text-slate-500">
                클릭하여 파일을 선택하세요
              </p>
            </label>
          </div>

          {/* 양식 다운로드 */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-amber-900">📋 CSV 양식</h3>
              <button
                onClick={handleDownloadTemplate}
                disabled={isProcessing}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                양식 다운로드
              </button>
            </div>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li><strong>title</strong> (메모용): 어떤 책인지 확인용 (실제 데이터에는 미포함)</li>
              <li><strong>URL</strong> (필수): 스크래핑할 페이지 주소</li>
              <li><strong>purchase_date</strong> (선택): 구매일 등 추가 정보 (YYYY-MM-DD 형식)</li>
              <li>UTF-8 인코딩 권장 (엑셀에서 열 때 인코딩 주의)</li>
            </ul>
          </div>

          {/* 진행 상황 */}
          {progress && (
            <div className="border-2 border-slate-200 rounded-lg p-6 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">처리 진행 상황</h3>
                <span className="text-2xl font-bold text-amber-600">
                  {Math.round(progress.progress)}%
                </span>
              </div>

              {/* 프로그레스 바 */}
              <div className="w-full bg-slate-200 rounded-full h-4 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>

              {/* 통계 */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-slate-600">전체</p>
                  <p className="text-2xl font-bold text-slate-900">{progress.total}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600">성공</p>
                  <p className="text-2xl font-bold text-green-600">{progress.completed}</p>
                </div>
                <div>
                  <p className="text-sm text-red-600">실패</p>
                  <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
                </div>
              </div>

              {/* 에러 목록 */}
              {progress.errors.length > 0 && (
                <div className="mt-4 max-h-40 overflow-y-auto">
                  <p className="text-sm font-semibold text-red-600 mb-2">오류 발생:</p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {progress.errors.map((error, idx) => (
                      <li key={idx} className="bg-red-50 p-2 rounded">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* 확인 단계 */}
          {showConfirmation && result && (
            <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-900">등록 완료</h3>
                  <p className="text-sm text-green-700">
                    {result.success}개 아이템이 성공적으로 등록되었습니다
                    {result.failed > 0 && ` (${result.failed}개 실패)`}
                  </p>
                </div>
              </div>

              {/* 생성된 아이템 미리보기 */}
              {createdItems.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-green-900 mb-2">등록된 아이템:</p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {createdItems.map((item, idx) => (
                      <div key={item.id} className="bg-white p-3 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-slate-900">
                          {idx + 1}. {item.metadata.title || item.metadata.name || '제목 없음'}
                        </p>
                        {item.metadata.author && (
                          <p className="text-xs text-slate-600 mt-1">저자: {item.metadata.author}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleConfirmAndClose}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                >
                  확인 및 닫기
                </button>
              </div>
            </div>
          )}

          {/* 버튼 */}
          {!showConfirmation && (
            <div className="flex gap-3 pt-4 border-t-2 border-slate-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!file || isProcessing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-amber-100 rounded-lg font-semibold hover:from-slate-600 hover:to-slate-700 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    처리 중...
                  </span>
                ) : (
                  '일괄 등록 시작'
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mapping Confirmation Modal */}
      <MappingConfirmationModal
        isOpen={showMappingConfirm}
        savedMapping={savedMapping}
        fieldDefinitions={collection.field_definitions?.fields || []}
        onConfirm={async (useMapping) => {
          setShowMappingConfirm(false);
          await performUpload(useMapping);
        }}
        onCancel={() => {
          setShowMappingConfirm(false);
        }}
      />
    </div>
  );
}
