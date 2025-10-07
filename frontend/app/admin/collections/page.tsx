'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import CollectionModal from '@/components/CollectionModal';
import { Collection } from '@/lib/api';

export default function CollectionsManagePage() {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchCollections();
    }
  }, [user]);

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections');
      const data = await res.json();
      setCollections(data);
    } catch (error) {
      console.error('Failed to fetch collections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingCollection(null);
    setIsModalOpen(true);
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setIsModalOpen(true);
  };

  const handleSave = async (collection: Collection) => {
    await fetchCollections();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 컬렉션을 삭제하시겠습니까? 모든 아이템도 함께 삭제됩니다.')) {
      return;
    }

    setDeletingId(id);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/collections/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete collection');
      }

      await fetchCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('컬렉션 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link href="/admin" className="text-sm text-slate-600 hover:text-amber-600 mb-4 inline-block group">
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              관리자 모드
            </span>
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">컬렉션 관리</h1>
              <p className="text-slate-600 mt-1">컬렉션을 추가하고 관리하세요</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-amber-100 rounded-lg font-semibold hover:from-slate-600 hover:to-slate-700 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all"
            >
              + 새 컬렉션
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-slate-500">로딩 중...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-16 text-center shadow-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-6xl">📦</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">아직 컬렉션이 없습니다</h3>
            <p className="text-slate-500 mb-6">첫 번째 컬렉션을 만들어보세요</p>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-amber-100 rounded-lg font-semibold hover:from-slate-600 hover:to-slate-700 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all"
            >
              + 새 컬렉션
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-amber-300 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center shadow-inner">
                    <span className="text-3xl">{collection.icon || '📦'}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(collection.id)}
                    disabled={deletingId === collection.id}
                    className="text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{collection.name}</h3>
                {collection.description && (
                  <p className="text-sm text-slate-600 mb-4">{collection.description}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(collection)}
                    className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition-all"
                  >
                    편집
                  </button>
                  <Link
                    href={`/admin/collections/${collection.slug}/items`}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-amber-100 rounded-lg text-sm font-medium hover:from-slate-600 hover:to-slate-700 transition-all text-center"
                  >
                    아이템 관리
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collection Modal */}
      <CollectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        collection={editingCollection}
      />
    </div>
  );
}
