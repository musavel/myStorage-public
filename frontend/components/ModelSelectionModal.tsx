'use client';

import { useState, useEffect } from 'react';
import {
  AISettings,
  ModelsByProvider,
  ModelSelection,
  AIModelConfig,
} from '@/types/ai-models';

interface ModelSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AISettings) => Promise<boolean>;
  currentSettings: AISettings;
  availableModels: ModelsByProvider;
}

export default function ModelSelectionModal({
  isOpen,
  onClose,
  onSave,
  currentSettings,
  availableModels,
}: ModelSelectionModalProps) {
  const [textModel, setTextModel] = useState<ModelSelection | null>(
    currentSettings.textModel
  );
  const [visionModel, setVisionModel] = useState<ModelSelection | null>(
    currentSettings.visionModel
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTextModel(currentSettings.textModel);
    setVisionModel(currentSettings.visionModel);
  }, [currentSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave({ textModel, visionModel });
    setIsSaving(false);

    if (success) {
      onClose();
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}/1M tokens`;
  };

  const getModelInfo = (provider: string, modelId: string): AIModelConfig | null => {
    return availableModels[provider]?.[modelId] || null;
  };

  const renderModelSelect = (
    type: 'text' | 'vision',
    value: ModelSelection | null,
    onChange: (selection: ModelSelection | null) => void
  ) => {
    const filterModality = type === 'vision' ? 'image' : 'text';

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          {type === 'text' ? '텍스트 모델' : '비전 모델'}
        </label>
        <select
          value={value ? `${value.provider}:${value.modelId}` : ''}
          onChange={(e) => {
            if (!e.target.value) {
              onChange(null);
              return;
            }
            const [provider, modelId] = e.target.value.split(':');
            onChange({ provider, modelId });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">선택 안 함</option>
          {Object.entries(availableModels).map(([provider, models]) =>
            Object.entries(models)
              .filter(([_, config]) =>
                type === 'text'
                  ? config.input_modalities.includes('text')
                  : config.input_modalities.includes('image')
              )
              .map(([modelId, config]) => (
                <option key={`${provider}:${modelId}`} value={`${provider}:${modelId}`}>
                  {config.name} - {formatPrice(config.pricing.input)} input,{' '}
                  {formatPrice(config.pricing.output)} output
                </option>
              ))
          )}
        </select>

        {value && (() => {
          const info = getModelInfo(value.provider, value.modelId);
          if (!info) return null;

          return (
            <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
              <div className="font-medium">{info.name}</div>
              <div className="text-gray-600 mt-1">
                입력: {info.input_modalities.join(', ')}
              </div>
              <div className="text-gray-600">
                출력: {info.output_modalities.join(', ')}
              </div>
              <div className="text-gray-600 mt-1">
                <div>입력: {formatPrice(info.pricing.input)}</div>
                <div>출력: {formatPrice(info.pricing.output)}</div>
                {info.pricing.input_audio && (
                  <div>오디오 입력: {formatPrice(info.pricing.input_audio)}</div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">AI 모델 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {renderModelSelect('text', textModel, setTextModel)}
          {renderModelSelect('vision', visionModel, setVisionModel)}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            disabled={isSaving}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:bg-gray-400"
            disabled={isSaving}
          >
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
