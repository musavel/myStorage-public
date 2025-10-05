'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BoardGame, getBoardGames, getCollections, Collection, createBoardGame, updateBoardGame, deleteBoardGame } from '@/lib/api';

export default function AdminBoardGamesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [boardGames, setBoardGames] = useState<BoardGame[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<BoardGame | null>(null);
  const [formData, setFormData] = useState<Partial<BoardGame>>({
    collection_id: 1,
    title: '',
    designer: '',
    publisher: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/admin');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gamesData, collectionsData] = await Promise.all([
        getBoardGames(),
        getCollections(),
      ]);
      setBoardGames(gamesData);
      setCollections(collectionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGame) {
        await updateBoardGame(editingGame.id, formData);
      } else {
        await createBoardGame(formData);
      }
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Failed to save board game:', error);
      alert('보드게임 저장에 실패했습니다.');
    }
  };

  const handleEdit = (game: BoardGame) => {
    setEditingGame(game);
    setFormData(game);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteBoardGame(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete board game:', error);
      alert('보드게임 삭제에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      collection_id: 1,
      title: '',
      designer: '',
      publisher: '',
    });
    setEditingGame(null);
    setIsFormOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <Link href="/admin" className="text-sm text-gray-500 hover:text-black mb-4 inline-block">
            ← 관리 대시보드
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">🎲 보드게임 관리</h1>
              <p className="text-gray-600">{boardGames.length}개의 보드게임</p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              + 보드게임 추가
            </button>
          </div>
        </header>

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingGame ? '보드게임 수정' : '보드게임 추가'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">컬렉션 *</label>
                  <select
                    value={formData.collection_id}
                    onChange={(e) => setFormData({ ...formData, collection_id: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  >
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">제목 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">디자이너</label>
                    <input
                      type="text"
                      value={formData.designer || ''}
                      onChange={(e) => setFormData({ ...formData, designer: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">출판사</label>
                    <input
                      type="text"
                      value={formData.publisher || ''}
                      onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">최소 인원</label>
                    <input
                      type="number"
                      value={formData.min_players || ''}
                      onChange={(e) => setFormData({ ...formData, min_players: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">최대 인원</label>
                    <input
                      type="number"
                      value={formData.max_players || ''}
                      onChange={(e) => setFormData({ ...formData, max_players: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">플레이 시간(분)</label>
                    <input
                      type="number"
                      value={formData.min_playtime || ''}
                      onChange={(e) => setFormData({ ...formData, min_playtime: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">카테고리</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="예: 전략, 파티, 협동"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">설명</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:border-black transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {editingGame ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Board Games List */}
        <div className="space-y-4">
          {boardGames.map((game) => (
            <div key={game.id} className="border border-gray-200 rounded-lg p-4 hover:border-black transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{game.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {game.designer && `${game.designer} · `}
                    {game.publisher && `${game.publisher} · `}
                    {game.min_players && game.max_players && `${game.min_players}-${game.max_players}인 · `}
                    {game.category && `${game.category}`}
                  </p>
                  {game.description && (
                    <p className="text-gray-700 text-sm">{game.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(game)}
                    className="px-3 py-1 border border-gray-300 rounded hover:border-black transition-colors text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(game.id)}
                    className="px-3 py-1 border border-red-300 text-red-600 rounded hover:border-red-600 transition-colors text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
