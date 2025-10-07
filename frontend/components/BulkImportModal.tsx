'use client';

import { useState, useEffect, useRef } from 'react';
import { Collection } from '@/lib/api';

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

  const handleUpload = async () => {
    if (!file) {
      alert('CSV 파일을 선택해주세요.');
      return;
    }

    setIsProcessing(true);
    setProgress({ total: 0, completed: 0, failed: 0, progress: 0, errors: [] });

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('collection_id', collection.id.toString());

      const response = await fetch('/api/scraper/bulk-scrape-csv', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'CSV 처리에 실패했습니다.');
      }

      const data = await response.json();
      setResult(data);
      setProgress({
        total: data.total,
        completed: data.success,
        failed: data.failed,
        progress: 100,
        errors: data.errors || [],
      });

      // 성공 시 3초 후 자동 닫기
      if (data.success > 0) {
        setTimeout(() => {
          onComplete();
          handleClose();
        }, 3000);
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
    onClose();
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

          {/* 사용 안내 */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-2">📋 CSV 파일 형식</h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>첫 번째 컬럼에 URL을 입력하세요</li>
              <li>첫 번째 행은 헤더(URL, link, 주소)로 사용 가능</li>
              <li>UTF-8 인코딩을 사용하세요</li>
              <li>예시: https://product.kyobobook.co.kr/detail/S000001713046</li>
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

          {/* 버튼 */}
          <div className="flex gap-3 pt-4 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 border-2 border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {result ? '닫기' : '취소'}
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
        </div>
      </div>
    </div>
  );
}
