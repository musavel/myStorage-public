'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Collection, Item, getCollectionBySlug } from '@/lib/api';
import { FieldDefinition } from '@/components/FieldDefinitionEditor';

type ViewMode = 'grid' | 'list';

interface ItemCardProps {
  item: Item;
  onDetailClick: () => void;
}

function ItemCard({ item, onDetailClick }: ItemCardProps) {
  // title 필드 찾기 (metadata에서 title, 제목, name, 이름 순으로 검색)
  const getTitle = () => {
    const titleKeys = ['title', '제목', 'name', '이름'];
    for (const key of titleKeys) {
      if (item.metadata[key]) {
        return String(item.metadata[key]);
      }
    }
    return 'Untitled';
  };

  // image 필드 찾기 (metadata에서 image, 이미지, 표지, cover 순으로 검색)
  const getImage = () => {
    const imageKeys = ['image_url', 'image', '이미지', '표지', 'cover', 'thumbnail'];
    for (const key of imageKeys) {
      if (item.metadata[key]) {
        const value = String(item.metadata[key]);
        // URL인지 확인
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
      }
    }
    return null;
  };

  const imageUrl = getImage();

  return (
    <div
      className="group bg-white rounded-xl border-2 border-slate-200 overflow-hidden hover:border-amber-400 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_20px_rgba(251,191,36,0.15)] transition-all duration-300 cursor-pointer"
      onClick={onDetailClick}
    >
      {/* 이미지 썸네일 */}
      {imageUrl && (
        <div className="relative w-full bg-slate-100 overflow-hidden">
          <img
            src={imageUrl}
            alt={getTitle()}
            className="w-full h-auto object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // 이미지 로드 실패 시 숨김
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      {/* 텍스트 콘텐츠 */}
      <div className="p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 line-clamp-2">
          {getTitle()}
        </h3>
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
          <button className="text-amber-600 hover:text-amber-700 font-semibold transition-colors">
            상세보기 →
          </button>
        </div>
      </div>
    </div>
  );
}

interface ItemDetailModalProps {
  item: Item | null;
  fields: FieldDefinition[];
  isOpen: boolean;
  onClose: () => void;
}

function ItemDetailModal({ item, fields, isOpen, onClose }: ItemDetailModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border-2 border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-white to-stone-50 border-b-2 border-slate-200 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">상세 정보</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-4">
          {fields.map((field) => {
            const value = item.metadata[field.key];
            if (!value) return null;

            // image_url은 표시하지 않음 (이미 이미지로 보여주므로)
            if (field.key === 'image_url') return null;

            // public 페이지에서 숨김 처리된 필드는 표시하지 않음
            // 디버깅: console.log(field.key, field.showInPublic);
            if (field.showInPublic === false) return null;

            // 공백과 줄바꿈 정리
            const cleanValue = String(value).replace(/\s+/g, ' ').trim();

            return (
              <div key={field.key} className="border-b border-slate-100 pb-4 last:border-0">
                <dt className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  {field.label}
                </dt>
                <dd className="text-slate-900 break-words">
                  {cleanValue}
                </dd>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-white to-stone-50 border-t-2 border-slate-200 px-8 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-amber-100 rounded-lg font-semibold hover:from-slate-600 hover:to-slate-700 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CollectionItemsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<string>('all'); // 'all' 또는 특정 필드 key
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  };

  useEffect(() => {
    fetchCollection();
  }, [slug]);

  useEffect(() => {
    if (collection) {
      fetchItems();
    }
  }, [collection]);

  const fetchCollection = async () => {
    try {
      const data = await getCollectionBySlug(slug);
      setCollection(data);
    } catch (error) {
      console.error('Failed to fetch collection:', error);
    }
  };

  const fetchItems = async () => {
    if (!collection) return;

    try {
      const res = await fetch(`/api/items?collection_id=${collection.id}`);
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 필드 정의 가져오기
  const fields: FieldDefinition[] = collection?.field_definitions?.fields || [];

  // 검색 및 정렬된 아이템
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // 검색
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = items.filter((item) => {
        if (searchField === 'all') {
          // 모든 필드에서 검색
          return Object.values(item.metadata).some((value) =>
            String(value).toLowerCase().includes(query)
          );
        } else {
          // 특정 필드에서만 검색
          const value = item.metadata[searchField];
          return value ? String(value).toLowerCase().includes(query) : false;
        }
      });
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortKey === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      } else {
        aValue = a.metadata[sortKey] || '';
        bValue = b.metadata[sortKey] || '';
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [items, searchQuery, searchField, sortKey, sortOrder]);

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-slate-100 flex items-center justify-center">
        <p className="text-slate-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-stone-100 to-slate-100">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 via-transparent to-amber-900/10"></div>
        <div className="relative max-w-6xl mx-auto px-8 py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-amber-300/80 hover:text-amber-300 mb-6 transition-colors group"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            전체 컬렉션
          </Link>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-600 to-amber-700 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)]">
              <span className="text-5xl">{collection.icon || '📦'}</span>
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                {collection.name}
              </h1>
              {collection.description && (
                <p className="text-amber-200/80 text-lg">{collection.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="bg-white rounded-lg border-2 border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 flex gap-2">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
              >
                <option value="all">전체</option>
                {fields
                  .filter((field) => field.searchable === true)
                  .map((field) => (
                    <option key={field.key} value={field.key}>
                      {field.label}
                    </option>
                  ))}
              </select>
              <input
                type="text"
                placeholder={searchField === 'all' ? '전체 검색...' : `${fields.find(f => f.key === searchField)?.label || ''} 검색...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all"
              />
            </div>

            {/* Sort */}
            <div className="flex gap-2 items-center">
              <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">정렬:</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none"
              >
                <option value="created_at">등록일</option>
                {fields
                  .filter((field) => field.sortable === true)
                  .map((field) => (
                    <option key={field.key} value={field.key}>
                      {field.label}
                    </option>
                  ))}
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border-2 border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
                title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1 border-2 border-slate-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-slate-700 text-amber-100'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
                title="그리드 뷰"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 3h7v7H3V3zm0 11h7v7H3v-7zm11-11h7v7h-7V3zm0 11h7v7h-7v-7z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 transition-all ${
                  viewMode === 'list'
                    ? 'bg-slate-700 text-amber-100'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
                title="리스트 뷰"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 결과 건수 */}
        {!isLoading && (
          <div className="mb-4">
            <p className="text-sm text-slate-600">
              총 <span className="font-semibold text-slate-900">{filteredAndSortedItems.length}</span>건
              {searchQuery && (
                <span className="text-slate-500 ml-1">
                  (전체 {items.length}건 중 검색됨)
                </span>
              )}
            </p>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-slate-500">로딩 중...</p>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-16 text-center shadow-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mx-auto mb-6 shadow-inner">
              <span className="text-6xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '아직 아이템이 없습니다'}
            </h3>
            <p className="text-slate-500">
              {searchQuery ? '다른 검색어를 입력해보세요' : '관리자가 곧 추가할 예정입니다'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          // Grid View
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedItems.map((item) => (
              <ItemCard key={item._id} item={item} onDetailClick={() => handleItemClick(item)} />
            ))}
          </div>
        ) : (
          // List View
          <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">제목</th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-slate-700">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAndSortedItems.map((item) => {
                    const titleKeys = ['title', '제목', 'name', '이름'];
                    let title = 'Untitled';
                    for (const key of titleKeys) {
                      if (item.metadata[key]) {
                        title = String(item.metadata[key]);
                        break;
                      }
                    }

                    return (
                      <tr key={item._id} className="hover:bg-amber-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                          {title}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleItemClick(item)}
                            className="text-amber-600 hover:text-amber-700 font-semibold text-sm transition-colors"
                          >
                            상세보기
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin Link */}
        <div className="mt-12 mb-8 text-center">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-700 hover:border-amber-500 hover:text-slate-900 hover:shadow-lg transition-all group"
          >
            <svg
              className="w-4 h-4 group-hover:rotate-90 transition-transform text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            관리자 모드
          </Link>
        </div>
      </div>

      {/* Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        fields={fields}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
