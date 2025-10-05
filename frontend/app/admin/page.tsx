'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';

export default function AdminPage() {
  const { user, login, logout, isLoading } = useAuth();

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
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-black mb-4 inline-block">
            ← 홈으로
          </Link>
          <h1 className="text-4xl font-bold mb-2">관리자 모드</h1>
          <p className="text-gray-600">소장품을 추가, 수정, 삭제할 수 있습니다</p>
        </header>

        {!user ? (
          /* Login Required Message */
          <div className="border border-gray-200 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
            <p className="text-gray-600 mb-6">
              관리 기능을 사용하려면 Google 계정으로 로그인하세요.
            </p>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  console.error('Login Failed');
                  alert('로그인에 실패했습니다.');
                }}
                theme="outline"
                size="large"
              />
            </div>

            <div className="mt-8 text-sm text-gray-500">
              소유자 계정만 접근 가능합니다.
            </div>
          </div>
        ) : (
          /* Logged In View */
          <div>
            <div className="border border-gray-200 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">로그인됨</p>
                  <p className="font-bold">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:border-black transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>

            {/* Management Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/admin/books"
                className="border border-gray-200 rounded-lg p-6 hover:border-black transition-colors"
              >
                <h3 className="text-xl font-bold mb-2">📚 도서 관리</h3>
                <p className="text-gray-600 text-sm">도서 추가, 수정, 삭제</p>
              </Link>

              <Link
                href="/admin/board-games"
                className="border border-gray-200 rounded-lg p-6 hover:border-black transition-colors"
              >
                <h3 className="text-xl font-bold mb-2">🎲 보드게임 관리</h3>
                <p className="text-gray-600 text-sm">보드게임 추가, 수정, 삭제</p>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
