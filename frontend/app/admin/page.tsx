'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAISettings } from '@/hooks/useAISettings';
import ModelSelectionModal from '@/components/ModelSelectionModal';

export default function AdminPage() {
  const { user, login, logout, isLoading } = useAuth();
  const {
    settings: aiSettings,
    availableModels,
    saveSettings: saveAISettings,
  } = useAISettings();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    try {
      if (credentialResponse.credential) {
        await login(credentialResponse.credential);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('로그인에 실패했습니다. 소유자 계정인지 확인해주세요.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <header className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm text-slate-600 hover:text-amber-600 mb-6 group">
            <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로
          </Link>
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent">
            관리자 모드
          </h1>
          <p className="text-slate-600 text-lg">소장품을 추가, 수정, 삭제할 수 있습니다</p>
        </header>

        {!user ? (
          /* Login Required Message */
          <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-3 text-slate-900">로그인이 필요합니다</h2>
            <p className="text-slate-600 mb-8 text-lg">
              관리 기능을 사용하려면 Google 계정으로 로그인하세요
            </p>

            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  console.error('Login Failed');
                  alert('로그인에 실패했습니다.');
                }}
                theme="filled_black"
                size="large"
                shape="pill"
              />
            </div>

            <p className="text-sm text-gray-500">
              🔒 소유자 계정만 접근 가능합니다
            </p>
          </div>
        ) : (
          /* Logged In View */
          <div>
            {/* User Info Card */}
            <div className="bg-white rounded-xl shadow-sm border-2 border-slate-200 p-6 mb-8">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg flex items-center justify-center text-amber-100 font-bold text-lg shadow-md">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">로그인됨</p>
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-sm text-slate-600">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="px-5 py-2.5 border-2 border-slate-300 rounded-lg hover:border-slate-700 hover:bg-slate-700 hover:text-amber-100 transition-all font-medium text-slate-700"
                >
                  로그아웃
                </button>
              </div>
            </div>

            {/* Management Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Collections Management */}
              <Link
                href="/admin/collections"
                className="group bg-white rounded-xl shadow-sm border-2 border-slate-200 p-8 hover:border-amber-400 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center text-3xl shadow-lg">
                    📦
                  </div>
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-900">컬렉션 관리</h3>
                <p className="text-slate-600">컬렉션 추가, 수정, 삭제</p>
              </Link>

              {/* AI Settings */}
              <button
                onClick={() => setIsAIModalOpen(true)}
                className="group bg-white rounded-xl shadow-sm border-2 border-slate-200 p-8 hover:border-amber-400 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all text-left"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center text-3xl shadow-lg">
                    🤖
                  </div>
                  <svg className="w-6 h-6 text-slate-400 group-hover:text-amber-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-slate-900">AI 모델 설정</h3>
                <p className="text-slate-600 mb-3">
                  {aiSettings.textModel || aiSettings.visionModel
                    ? 'AI 모델 변경'
                    : 'AI 모델 선택'}
                </p>
                {(aiSettings.textModel || aiSettings.visionModel) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                    {aiSettings.textModel && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        텍스트: {aiSettings.textModel.modelId}
                      </div>
                    )}
                    {aiSettings.visionModel && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        비전: {aiSettings.visionModel.modelId}
                      </div>
                    )}
                  </div>
                )}
              </button>
            </div>
          </div>
        )}

        {/* AI Model Selection Modal */}
        <ModelSelectionModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          onSave={saveAISettings}
          currentSettings={aiSettings}
          availableModels={availableModels}
        />
      </div>
    </div>
  );
}
