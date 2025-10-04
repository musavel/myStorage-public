import Link from 'next/link';
import { getBoardGames } from '@/lib/api';

export default async function BoardGamesPage() {
  const boardGames = await getBoardGames();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="text-sm text-gray-500 hover:text-black mb-4 inline-block">
            ← 홈으로
          </Link>
          <h1 className="text-4xl font-bold mb-2">보드게임</h1>
          <p className="text-gray-600">총 {boardGames.length}개</p>
        </header>

        {/* Board Games Grid */}
        {boardGames.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            등록된 보드게임이 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boardGames.map((game) => (
              <div
                key={game.id}
                className="border border-gray-200 rounded-lg p-6 hover:border-black transition-colors"
              >
                {/* Image */}
                {game.image_url && (
                  <div className="mb-4 bg-gray-100 rounded aspect-square flex items-center justify-center">
                    <img
                      src={game.image_url}
                      alt={game.title}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                {/* Title */}
                <h2 className="text-xl font-bold mb-2 line-clamp-2">{game.title}</h2>

                {/* Designer */}
                {game.designer && (
                  <p className="text-gray-600 mb-2">{game.designer}</p>
                )}

                {/* Game Info */}
                <div className="text-sm text-gray-500 space-y-1">
                  {(game.min_players || game.max_players) && (
                    <div>
                      인원: {game.min_players || '?'}-{game.max_players || '?'}명
                    </div>
                  )}
                  {(game.min_playtime || game.max_playtime) && (
                    <div>
                      시간: {game.min_playtime || '?'}-{game.max_playtime || '?'}분
                    </div>
                  )}
                  {game.complexity && <div>난이도: {game.complexity}</div>}
                  {game.category && <div>분류: {game.category}</div>}
                  {game.location && <div>위치: {game.location}</div>}
                </div>

                {/* Description */}
                {game.description && (
                  <p className="mt-4 text-sm text-gray-600 line-clamp-3">
                    {game.description}
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
