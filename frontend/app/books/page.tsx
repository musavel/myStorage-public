import Link from 'next/link';
import { getBooks } from '@/lib/api';

export default async function BooksPage() {
  const books = await getBooks();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-black mb-4 inline-block">
            ← 홈으로
          </Link>
          <h1 className="text-4xl font-bold mb-2">도서</h1>
          <p className="text-gray-600">총 {books.length}권</p>
        </header>

        {/* Books Grid */}
        {books.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            등록된 도서가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-black transition-colors"
              >
                {/* Image */}
                {book.image_url && (
                  <div className="mb-4 bg-gray-100 rounded aspect-[2/3] flex items-center justify-center">
                    <img
                      src={book.image_url}
                      alt={book.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                {/* Title */}
                <h2 className="text-xl font-bold mb-2 line-clamp-2">{book.title}</h2>

                {/* Author */}
                {book.author && (
                  <p className="text-gray-600 mb-2">{book.author}</p>
                )}

                {/* Details */}
                <div className="text-sm text-gray-500 space-y-1">
                  {book.publisher && <div>출판: {book.publisher}</div>}
                  {book.category && <div>분류: {book.category}</div>}
                  {book.location && <div>위치: {book.location}</div>}
                </div>

                {/* Description */}
                {book.description && (
                  <p className="mt-4 text-sm text-gray-600 line-clamp-3">
                    {book.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
