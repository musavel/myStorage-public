'use client';

import { useState } from 'react';

export interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

interface FieldDefinitionEditorProps {
  fields: FieldDefinition[];
  onChange: (fields: FieldDefinition[]) => void;
  onRequestAISuggestion: () => void;
}

export default function FieldDefinitionEditor({
  fields,
  onChange,
  onRequestAISuggestion,
}: FieldDefinitionEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const addField = () => {
    const newField: FieldDefinition = {
      key: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
    };
    onChange([...fields, newField]);
    setEditingIndex(fields.length);
  };

  const updateField = (index: number, updates: Partial<FieldDefinition>) => {
    const updated = fields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    onChange(updated);
  };

  const deleteField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
    setSelectedIndices(new Set([...selectedIndices].filter(i => i !== index)));
  };

  const deleteSelected = () => {
    onChange(fields.filter((_, i) => !selectedIndices.has(i)));
    setSelectedIndices(new Set());
  };

  const toggleSelect = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === fields.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(fields.map((_, i) => i)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">필드 정의</h3>
          <span className="text-xs text-slate-500">({fields.length}개)</span>
        </div>
        <div className="flex gap-2">
          {selectedIndices.size > 0 && (
            <button
              type="button"
              onClick={deleteSelected}
              className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
            >
              선택 삭제 ({selectedIndices.size})
            </button>
          )}
          <button
            type="button"
            onClick={onRequestAISuggestion}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI 추천
          </button>
          <button
            type="button"
            onClick={addField}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 text-white text-xs font-semibold rounded-lg hover:bg-slate-600 transition-all shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            필드 추가
          </button>
        </div>
      </div>

      {/* Table */}
      {fields.length > 0 ? (
        <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-100 to-stone-100">
              <tr>
                <th className="w-10 px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIndices.size === fields.length && fields.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300"
                  />
                </th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Key</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Label</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Type</th>
                <th className="px-3 py-3 text-center font-semibold text-slate-700">필수</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700">Placeholder</th>
                <th className="w-20 px-3 py-3 text-center font-semibold text-slate-700">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {fields.map((field, index) => (
                <tr key={index} className={`hover:bg-slate-50 ${selectedIndices.has(index) ? 'bg-amber-50' : ''}`}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIndices.has(index)}
                      onChange={() => toggleSelect(index)}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => updateField(index, { key: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-amber-400 focus:outline-none"
                      placeholder="field_name"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-amber-400 focus:outline-none"
                      placeholder="필드명"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={field.type}
                      onChange={(e) => updateField(index, { type: e.target.value as any })}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-amber-400 focus:outline-none"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="select">Select</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-amber-400 focus:outline-none"
                      placeholder="예시..."
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => deleteField(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="삭제"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
          <p className="text-sm text-slate-500 mb-3">아직 필드가 없습니다</p>
          <div className="flex gap-2 justify-center">
            <button
              type="button"
              onClick={addField}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-slate-600 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              직접 추가
            </button>
            <button
              type="button"
              onClick={onRequestAISuggestion}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI로 추천받기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
