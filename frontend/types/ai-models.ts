// AI 모델 관련 타입 정의

export interface PricingInfo {
  input: number;
  output: number;
  input_audio?: number;
  input_over_128k?: number;
  output_over_128k?: number;
  input_over_200k?: number;
  output_over_200k?: number;
}

export interface AIModelConfig {
  name: string;
  input_modalities: string[];
  output_modalities: string[];
  pricing: PricingInfo;
}

export interface ModelsByProvider {
  [provider: string]: {
    [modelId: string]: AIModelConfig;
  };
}

export interface ModelSelection {
  provider: string;
  modelId: string;
}

export interface AISettings {
  textModel: ModelSelection | null;
  visionModel: ModelSelection | null;
}

export interface AISettingsResponse {
  success: boolean;
  settings: {
    text_model: { provider: string; model_id: string } | null;
    vision_model: { provider: string; model_id: string } | null;
  };
}

export interface ModelsResponse {
  success: boolean;
  models: ModelsByProvider;
}
