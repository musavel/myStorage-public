'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Collection, Item, getCollectionBySlug } from '@/lib/api';
import ItemModal from '@/components/ItemModal';
import BulkImportModal from '@/components/BulkImportModal';
import { FieldDefinition } from '@/components/FieldDefinitionEditor';

export default function ItemsManagePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<string>('all'); // 'all' 또는 특정 필드 key
  const [sortKey, setSortKey] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCollection();
    }
  }, [user, slug]);

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
      alert('컬렉션을 찾을 수 없습니다.');
      router.push('/admin/collections');
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

  const handleCreateNew = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    await fetchItems();
  };

  const handleDelete = async (itemId: string) => {
    if (!collection) return;
    if (!confirm('정말 이 아이템을 삭제하시겠습니까?')) {
      return;
    }

    setDeletingId(itemId);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/items/${collection.id}/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      await fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('아이템 삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAndSortedItems.map(item => item._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!collection || selectedIds.size === 0) return;

    if (!confirm(`선택한 ${selectedIds.size}개의 아이템을 삭제하시겠습니까?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const deletePromises = Array.from(selectedIds).map(itemId =>
        fetch(`/api/items/${collection.id}/${itemId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      await Promise.all(deletePromises);
      setSelectedIds(new Set());
      await fetchItems();
    } catch (error) {
      console.error('Error deleting items:', error);
      alert('아이템 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
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

  // 각 필드의 최대 글자 수 계산
  const fieldMaxLengths = useMemo(() => {
    const lengths: Record<string, number> = {};
    fields.forEach((field) => {
      const maxLength = Math.max(
        field.label.length, // 헤더 길이
        ...filteredAndSortedItems.map((item) => {
          const value = item.metadata[field.key];
          return value ? String(value).length : 0;
        })
      );
      lengths[field.key] = maxLength;
    });
    return lengths;
  }, [fields, filteredAndSortedItems]);

  // 글자 수에 따른 셀 스타일 계산
  const getCellStyle = (fieldKey: string) => {
    const length = fieldMaxLengths[fieldKey] || 10;

    // 10자 이하: 최소 너비만
    if (length <= 10) {
      return { minWidth: '150px' };
    }
    // 10~50자: 적당한 너비
    else if (length <= 50) {
      return { minWidth: '300px', maxWidth: '450px' };
    }
    // 50~100자: 넓은 너비
    else if (length <= 100) {
      return { minWidth: '450px', maxWidth: '750px' };
    }
    // 100자 이상: 매우 넓은 너비
    else {
      return { minWidth: '750px', maxWidth: '9000px' };
    }
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로그인이 필요합니다.</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link
            href="/admin/collections"
            className="text-sm text-slate-600 hover:text-amber-600 mb-4 inline-block group"
          >
            <span className="inline-flex items-center gap-1">
              <svg
                className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              컬렉션 목록
            </span>
          </Link>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center shadow-inner">
                <span className="text-4xl">{collection.icon || '📦'}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{collection.name}</h1>
                <p className="text-slate-600 mt-1">
                  {collection.description || '아이템을 추가하고 관리하세요'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  🗑️ 선택 삭제 ({selectedIds.size})
                </button>
              )}
              <button
                onClick={() => setIsBulkImportOpen(true)}
                className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-semibold hover:border-amber-400 hover:bg-amber-50 transition-all"
              >
                📋 CSV 일괄 등록
              </button>
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-amber-100 rounded-lg font-semibold hover:from-slate-600 hover:to-slate-700 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all"
              >
                + 새 아이템
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search and Filter */}
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="bg-white rounded-lg border-2 border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="flex-1 flex gap-2">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="px-3 py-2 border-2 border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white"
              >
                <option value="all">전체</option>
                {fields
                  .filter((field) => field.searchable === true || field.key === 'title')
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
            <div className="flex gap-2 items-center">
              <label className="text-sm font-semibold text-slate-700">정렬:</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="px-4 py-2 border-2 border-slate-300 rounded-lg focus:border-amber-500 focus:outline-none"
              >
                <option value="created_at">등록일</option>
                {fields
                  .filter((field) => field.sortable === true || field.key === 'title')
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
          <div className="text-center py-12">
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
            <p className="text-slate-500 mb-6">
              {searchQuery ? '다른 검색어를 입력해보세요' : '첫 번째 아이템을 만들어보세요'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateNew}
                className="px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 text-amber-100 rounded-lg font-semibold hover:from-slate-600 hover:to-slate-700 hover:shadow-[0_0_20px_rgba(251,191,36,0.2)] transition-all"
              >
                + 새 아이템
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size > 0 && selectedIds.size === filteredAndSortedItems.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                      />
                    </th>
                    {fields.map((field) => (
                      <th
                        key={field.key}
                        className="px-6 py-4 text-left text-sm font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors whitespace-nowrap"
                        onClick={() => toggleSort(field.key)}
                      >
                        <span className="flex items-center gap-2">
                          {field.label}
                          {sortKey === field.key && (
                            <span className="text-amber-600">
                              {sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 whitespace-nowrap">등록일</th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-slate-700 whitespace-nowrap">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredAndSortedItems.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-amber-50 transition-colors"
                    >
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item._id)}
                          onChange={(e) => handleSelectItem(item._id, e.target.checked)}
                          className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                        />
                      </td>
                      {fields.map((field) => (
                        <td
                          key={field.key}
                          className="px-6 py-4 text-sm text-slate-700"
                          style={{
                            ...getCellStyle(field.key),
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}
                        >
                          {item.metadata[field.key] || '-'}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(item)}
                            className="px-3 py-1 text-sm border-2 border-slate-300 rounded-lg text-slate-700 hover:border-amber-400 hover:bg-amber-50 transition-all"
                          >
                            편집
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            className="px-3 py-1 text-sm border-2 border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Item Modal */}
      {collection && (
        <>
          <ItemModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            collection={collection}
            item={editingItem}
          />
          <BulkImportModal
            isOpen={isBulkImportOpen}
            onClose={() => setIsBulkImportOpen(false)}
            onComplete={fetchItems}
            collection={collection}
          />
        </>
      )}
    </div>
  );
}
