import Link from 'next/link';

export default function AdminPage() {
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

        {/* Login Required Message */}
        <div className="border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600 mb-6">
            관리 기능을 사용하려면 Google 계정으로 로그인하세요.
          </p>

          <button className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
            Google로 로그인
          </button>

          <div className="mt-8 text-sm text-gray-500">
            소유자 계정만 접근 가능합니다.
          </div>
        </div>

        {/* Management Links (for after login) */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50 pointer-events-none">
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
    </div>
  );
}
