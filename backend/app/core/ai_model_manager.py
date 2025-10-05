from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import json
import os


class PricingInfo(BaseModel):
    input: float
    output: float
    input_audio: Optional[float] = None
    input_over_128k: Optional[float] = None
    output_over_128k: Optional[float] = None
    input_over_200k: Optional[float] = None
    output_over_200k: Optional[float] = None


class AIModelConfig(BaseModel):
    name: str
    input_modalities: List[str]
    output_modalities: List[str]
    pricing: PricingInfo


class AIModelManager:
    def __init__(self, config_path: str = None):
        if config_path is None:
            # backend/app/data/ai_models.json 경로
            config_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                'data',
                'ai_models.json'
            )

        self.config_path = config_path
        self._models: Dict[str, Dict[str, AIModelConfig]] = {}
        self.load_models()

    def load_models(self):
        """JSON 파일에서 모델 설정을 로드"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            for provider, models in data.items():
                self._models[provider] = {}
                for model_id, config in models.items():
                    self._models[provider][model_id] = AIModelConfig(**config)

        except FileNotFoundError:
            raise FileNotFoundError(f"AI models config file not found: {self.config_path}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON in config file: {e}")

    def get_model(self, provider: str, model_id: str) -> Optional[AIModelConfig]:
        """특정 모델 설정 반환"""
        return self._models.get(provider, {}).get(model_id)

    def get_all_models(self) -> Dict[str, Dict[str, AIModelConfig]]:
        """모든 모델 설정 반환"""
        return self._models

    def get_provider_models(self, provider: str) -> Dict[str, AIModelConfig]:
        """특정 제공업체의 모든 모델 반환"""
        return self._models.get(provider, {})

    def list_providers(self) -> List[str]:
        """사용 가능한 제공업체 목록 반환"""
        return list(self._models.keys())

    def list_models(self, provider: str = None) -> List[str]:
        """모델 ID 목록 반환"""
        if provider:
            return list(self._models.get(provider, {}).keys())

        all_models = []
        for provider_models in self._models.values():
            all_models.extend(provider_models.keys())
        return all_models

    def get_models_by_modality(self, input_modality: str = None,
                              output_modality: str = None) -> Dict[str, Dict[str, AIModelConfig]]:
        """특정 모달리티를 지원하는 모델들 반환"""
        filtered_models = {}

        for provider, models in self._models.items():
            filtered_models[provider] = {}

            for model_id, config in models.items():
                match_input = input_modality is None or input_modality in config.input_modalities
                match_output = output_modality is None or output_modality in config.output_modalities

                if match_input and match_output:
                    filtered_models[provider][model_id] = config

        return {k: v for k, v in filtered_models.items() if v}

    def calculate_cost(self, provider: str, model_id: str,
                      input_tokens: int, output_tokens: int) -> float:
        """토큰 사용량 기반 비용 계산"""
        model = self.get_model(provider, model_id)
        if not model:
            raise ValueError(f"Model not found: {provider}/{model_id}")

        pricing = model.pricing

        # 기본 가격 사용 (per 1M tokens)
        input_cost = input_tokens * pricing.input / 1_000_000
        output_cost = output_tokens * pricing.output / 1_000_000

        return input_cost + output_cost


# 전역 인스턴스
_model_manager: Optional[AIModelManager] = None


def get_model_manager() -> AIModelManager:
    """AI 모델 매니저 싱글톤 인스턴스 반환"""
    global _model_manager
    if _model_manager is None:
        _model_manager = AIModelManager()
    return _model_manager
