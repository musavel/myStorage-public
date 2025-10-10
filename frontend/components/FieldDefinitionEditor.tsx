'use client';

import { useState } from 'react';
import { useAISettings } from '@/hooks/useAISettings';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'url';
  required: boolean;
  placeholder?: string;
  options?: string[];
  // 표시 및 기능 옵션
  sortable?: boolean;      // 정렬 가능 여부
  searchable?: boolean;    // 검색 가능 여부
  showInPublic?: boolean;  // public 페이지에 표시 여부
}

interface FieldDefinitionEditorProps {
  fields: FieldDefinition[];
  onChange: (fields: FieldDefinition[]) => void;
  onRequestAISuggestion: () => void;
}

interface SortableFieldRowProps {
  field: FieldDefinition;
  index: number;
  isSelected: boolean;
  onToggleSelect: (index: number) => void;
  onUpdate: (index: number, updates: Partial<FieldDefinition>) => void;
  onDelete: (index: number) => void;
}

// Sortable field row component
function SortableFieldRow({
  field,
  index,
  isSelected,
  onToggleSelect,
  onUpdate,
  onDelete,
}: SortableFieldRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `field-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={isSelected ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50'}
    >
      <td className="px-3 py-2">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
          {...attributes}
          {...listeners}
          title="드래그하여 순서 변경"
        >
          ☰
        </button>
      </td>
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(index)}
          className="rounded border-slate-300"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={field.key}
          onChange={(e) => onUpdate(index, { key: e.target.value })}
          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-amber-400 focus:outline-none"
          placeholder="field_name"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={field.label}
          onChange={(e) => onUpdate(index, { label: e.target.value })}
          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-amber-400 focus:outline-none"
          placeholder="필드명"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={field.type}
          onChange={(e) => onUpdate(index, { type: e.target.value as any })}
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
          onChange={(e) => onUpdate(index, { required: e.target.checked })}
          className="rounded border-slate-300"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={field.placeholder || ''}
          onChange={(e) => onUpdate(index, { placeholder: e.target.value })}
          className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:border-amber-400 focus:outline-none"
          placeholder="예시..."
        />
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={field.sortable ?? false}
          onChange={(e) => onUpdate(index, { sortable: e.target.checked })}
          className="rounded border-slate-300"
          title="정렬 가능"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={field.searchable ?? false}
          onChange={(e) => onUpdate(index, { searchable: e.target.checked })}
          className="rounded border-slate-300"
          title="검색 가능"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={field.showInPublic ?? true}
          onChange={(e) => onUpdate(index, { showInPublic: e.target.checked })}
          className="rounded border-slate-300"
          title="공개 표시"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="text-red-500 hover:text-red-700 transition-colors"
          title="삭제"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

export default function FieldDefinitionEditor({
  fields,
  onChange,
  onRequestAISuggestion,
}: FieldDefinitionEditorProps) {
  const { settings } = useAISettings();
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // title 필드 찾기
  const titleField = fields.find(f => f.key === 'title');
  const otherFields = fields.filter(f => f.key !== 'title');

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id.toString().replace('field-', ''));
      const newIndex = parseInt(over.id.toString().replace('field-', ''));

      const reorderedFields = arrayMove(otherFields, oldIndex, newIndex);
      onChange(titleField ? [titleField, ...reorderedFields] : reorderedFields);

      // Update selected indices after reordering
      const newSelected = new Set<number>();
      selectedIndices.forEach((idx) => {
        if (idx === oldIndex) {
          newSelected.add(newIndex);
        } else if (oldIndex < newIndex && idx > oldIndex && idx <= newIndex) {
          newSelected.add(idx - 1);
        } else if (oldIndex > newIndex && idx >= newIndex && idx < oldIndex) {
          newSelected.add(idx + 1);
        } else {
          newSelected.add(idx);
        }
      });
      setSelectedIndices(newSelected);
    }
  };

  const addField = () => {
    const newField: FieldDefinition = {
      key: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
    };
    // title 필드를 맨 앞에 유지하고 새 필드 추가
    onChange(titleField ? [titleField, ...otherFields, newField] : [...fields, newField]);
  };

  const updateTitleField = (updates: Partial<FieldDefinition>) => {
    if (!titleField) return;
    onChange([{ ...titleField, ...updates }, ...otherFields]);
  };

  const updateField = (index: number, updates: Partial<FieldDefinition>) => {
    const updated = otherFields.map((field, i) =>
      i === index ? { ...field, ...updates } : field
    );
    onChange(titleField ? [titleField, ...updated] : updated);
  };

  const deleteField = (index: number) => {
    const updated = otherFields.filter((_, i) => i !== index);
    onChange(titleField ? [titleField, ...updated] : updated);
    setSelectedIndices(new Set([...selectedIndices].filter(i => i !== index)));
  };

  const deleteSelected = () => {
    const filtered = otherFields.filter((_, i) => !selectedIndices.has(i));
    onChange(titleField ? [titleField, ...filtered] : filtered);
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
    if (selectedIndices.size === otherFields.length && otherFields.length > 0) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(otherFields.map((_, i) => i)));
    }
  };

  return (
    <div className="space-y-6">
      {/* 필수 필드 (Title) */}
      {titleField && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-700">필수 필드 (Title)</h3>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">🔒 고정</span>
          </div>
          <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-blue-50/30">
            <div className="bg-white p-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Label</label>
                <input
                  type="text"
                  value={titleField.label}
                  onChange={(e) => updateTitleField({ label: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  placeholder="필드명"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Placeholder</label>
                <input
                  type="text"
                  value={titleField.placeholder || ''}
                  onChange={(e) => updateTitleField({ placeholder: e.target.value })}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:border-blue-400 focus:outline-none"
                  placeholder="예시..."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 추가 필드 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-700">추가 필드</h3>
            <span className="text-xs text-slate-500">({otherFields.length}개)</span>
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
              disabled={!settings.textModel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={!settings.textModel ? 'AI 모델을 먼저 설정해주세요 (관리자 페이지)' : 'AI로 필드 추천받기'}
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
        {otherFields.length > 0 ? (
          <div className="border-2 border-slate-200 rounded-xl overflow-hidden">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-slate-100 to-stone-100">
                  <tr>
                    <th className="w-10 px-3 py-3 text-center" title="드래그하여 순서 변경">
                      <span className="text-slate-500">☰</span>
                    </th>
                    <th className="w-10 px-3 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedIndices.size === otherFields.length && otherFields.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Key</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Label</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Type</th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-700">필수</th>
                    <th className="px-3 py-3 text-left font-semibold text-slate-700">Placeholder</th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-700" title="정렬 가능">정렬</th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-700" title="검색 가능">검색</th>
                    <th className="px-3 py-3 text-center font-semibold text-slate-700" title="공개 표시">공개</th>
                    <th className="w-20 px-3 py-3 text-center font-semibold text-slate-700">작업</th>
                  </tr>
                </thead>
                <SortableContext
                  items={otherFields.map((_, i) => `field-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  <tbody className="bg-white divide-y divide-slate-200">
                    {otherFields.map((field, index) => (
                      <SortableFieldRow
                        key={`field-${index}`}
                        field={field}
                        index={index}
                        isSelected={selectedIndices.has(index)}
                        onToggleSelect={toggleSelect}
                        onUpdate={updateField}
                        onDelete={deleteField}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center">
            <p className="text-sm text-slate-500 mb-3">추가 필드를 만들어보세요</p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={onRequestAISuggestion}
                disabled={!settings.textModel}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-semibold rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={!settings.textModel ? 'AI 모델을 먼저 설정해주세요 (관리자 페이지)' : 'AI로 필드 추천받기'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI로 추천받기
              </button>
              <button
                type="button"
                onClick={addField}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-700 text-white text-sm font-semibold rounded-lg hover:bg-slate-600 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                필드 추가
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
