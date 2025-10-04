import Link from 'next/link';
import { getCollections, getBooks, getBoardGames } from '@/lib/api';

export default async function Home() {
  const collections = await getCollections();
  const books = await getBooks();
  const boardGames = await getBoardGames();

  const ownerName = process.env.NEXT_PUBLIC_OWNER_NAME || 'My';

  const collectionCounts: Record<string, number> = {
    books: books.length,
    'board-games': boardGames.length,
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-4xl font-bold mb-2">{ownerName}'s Storage</h1>
          <p className="text-gray-600">개인 소장품 관리</p>
        </header>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/${collection.slug}`}
              className="block border border-gray-200 rounded-lg p-8 hover:border-black transition-colors"
            >
              <div className="flex flex-col items-center text-center">
                {/* Icon */}
                <div className="text-6xl mb-4">
                  {collection.icon || '📦'}
                </div>

                {/* Name */}
                <h2 className="text-2xl font-bold mb-2">{collection.name}</h2>

                {/* Description */}
                {collection.description && (
                  <p className="text-gray-600 mb-4">{collection.description}</p>
                )}

                {/* Count */}
                <div className="text-sm text-gray-500">
                  {collectionCounts[collection.slug] || 0}개 아이템
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Admin Link */}
        <div className="mt-16 text-center">
          <Link
            href="/admin"
            className="inline-block text-sm text-gray-500 hover:text-black transition-colors"
          >
            관리자 모드 →
          </Link>
        </div>
      </div>
    </div>
  );
}
