import Link from 'next/link';
import { getCollections } from '@/lib/api';

export default async function Home() {
  const collections = await getCollections();
  const ownerName = process.env.NEXT_PUBLIC_OWNER_NAME || 'My';

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-slate-100">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 via-transparent to-amber-900/10"></div>
        <div className="relative max-w-6xl mx-auto px-8 py-16">
          <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
            {ownerName}'s Storage
          </h1>
          <p className="text-amber-200/80 text-lg tracking-wide">개인 소장품 창고</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Collections Grid */}
        {collections.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-5xl">📦</span>
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-900">아직 컬렉션이 없습니다</h2>
            <p className="text-slate-600 mb-8">관리자 모드에서 첫 번째 컬렉션을 만들어보세요</p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-700 text-amber-100 font-semibold rounded-xl hover:from-slate-700 hover:to-slate-600 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              관리자 모드로 이동
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.slug}`}
                className="group relative bg-white rounded-xl border-2 border-slate-200 p-8 hover:border-amber-400 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_20px_rgba(251,191,36,0.15)] transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/0 to-slate-50/0 group-hover:from-amber-50/30 group-hover:to-slate-50/30 rounded-xl transition-all duration-300"></div>
                <div className="relative flex flex-col items-center text-center">
                  {/* Icon */}
                  <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mb-5 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300 shadow-inner">
                    <span className="text-4xl">{collection.icon || '📦'}</span>
                  </div>

                  {/* Name */}
                  <h2 className="text-2xl font-bold mb-2 text-slate-900 group-hover:text-slate-800 transition-colors">
                    {collection.name}
                  </h2>

                  {/* Description */}
                  {collection.description && (
                    <p className="text-slate-600 text-sm leading-relaxed">{collection.description}</p>
                  )}

                  {/* Arrow Icon */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Admin Link */}
        <div className="mt-16 mb-8 text-center">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:border-amber-500 hover:text-slate-900 hover:shadow-lg transition-all group"
          >
            <svg className="w-4 h-4 group-hover:rotate-90 transition-transform text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            관리자 모드
          </Link>
        </div>
      </div>
    </div>
  );
}
