'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Book, getBooks, getCollections, Collection, createBook, updateBook, deleteBook } from '@/lib/api';

export default function AdminBooksPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<Partial<Book>>({
    collection_id: 1,
    title: '',
    author: '',
    publisher: '',
    isbn: '',
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
      const [booksData, collectionsData] = await Promise.all([
        getBooks(),
        getCollections(),
      ]);
      setBooks(booksData);
      setCollections(collectionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBook) {
        await updateBook(editingBook.id, formData);
      } else {
        await createBook(formData);
      }
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Failed to save book:', error);
      alert('도서 저장에 실패했습니다.');
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setFormData(book);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteBook(id);
      await loadData();
    } catch (error) {
      console.error('Failed to delete book:', error);
      alert('도서 삭제에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      collection_id: 1,
      title: '',
      author: '',
      publisher: '',
      isbn: '',
    });
    setEditingBook(null);
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
              <h1 className="text-4xl font-bold mb-2">📚 도서 관리</h1>
              <p className="text-gray-600">{books.length}권의 도서</p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              + 도서 추가
            </button>
          </div>
        </header>

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingBook ? '도서 수정' : '도서 추가'}
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
                    <label className="block text-sm font-medium mb-1">저자</label>
                    <input
                      type="text"
                      value={formData.author || ''}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
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

                <div>
                  <label className="block text-sm font-medium mb-1">ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn || ''}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">카테고리</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="예: 소설, 기술서, 에세이"
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
                    {editingBook ? '수정' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Books List */}
        <div className="space-y-4">
          {books.map((book) => (
            <div key={book.id} className="border border-gray-200 rounded-lg p-4 hover:border-black transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{book.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {book.author && `${book.author} · `}
                    {book.publisher && `${book.publisher} · `}
                    {book.category && `${book.category}`}
                  </p>
                  {book.description && (
                    <p className="text-gray-700 text-sm">{book.description}</p>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(book)}
                    className="px-3 py-1 border border-gray-300 rounded hover:border-black transition-colors text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
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
