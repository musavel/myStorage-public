import { useState, useEffect, useCallback } from 'react';
import {
  AISettings,
  AISettingsResponse,
  ModelsResponse,
  ModelsByProvider,
  ModelSelection,
} from '@/types/ai-models';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>({
    textModel: null,
    visionModel: null,
  });
  const [availableModels, setAvailableModels] = useState<ModelsByProvider>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 백엔드에서 사용 가능한 모델 목록 가져오기
  const fetchAvailableModels = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/models`);
      if (!response.ok) throw new Error('Failed to fetch models');

      const data: ModelsResponse = await response.json();
      setAvailableModels(data.models);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching models:', err);
    }
  }, []);

  // 백엔드에서 현재 설정 가져오기 (DB에서)
  const fetchCurrentSettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/ai/get-models`);
      if (!response.ok) throw new Error('Failed to fetch settings');

      const data: AISettingsResponse = await response.json();

      if (data.success && data.settings) {
        const newSettings: AISettings = {
          textModel: data.settings.text_model
            ? {
                provider: data.settings.text_model.provider,
                modelId: data.settings.text_model.model_id,
              }
            : null,
          visionModel: data.settings.vision_model
            ? {
                provider: data.settings.vision_model.provider,
                modelId: data.settings.vision_model.model_id,
              }
            : null,
        };

        setSettings(newSettings);
      }
    } catch (err) {
      console.error('Error fetching current settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch settings');
    }
  }, []);

  // 설정 저장 (DB에)
  const saveSettings = useCallback(
    async (newSettings: AISettings): Promise<boolean> => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`${API_URL}/api/ai/set-models`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            textModel: newSettings.textModel,
            visionModel: newSettings.visionModel,
          }),
        });

        if (!response.ok) throw new Error('Failed to save settings');

        const data = await response.json();
        if (data.success) {
          setSettings(newSettings);
          return true;
        }
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        console.error('Error saving settings:', err);
        return false;
      }
    },
    []
  );

  // 초기 로드
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);

      // DB에서 모델 목록과 설정 가져오기
      await Promise.all([fetchAvailableModels(), fetchCurrentSettings()]);

      setIsLoading(false);
    };

    init();
  }, [fetchAvailableModels, fetchCurrentSettings]);

  const isConfigured = settings.textModel !== null || settings.visionModel !== null;

  return {
    settings,
    availableModels,
    isLoading,
    error,
    isConfigured,
    saveSettings,
    fetchAvailableModels,
  };
}
