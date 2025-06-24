// OpenAI 이미지 모델 비용 계산 모듈
// 2025년 6월 기준 가격 정보 (최신 업데이트)

const PRICING = {
    'dall-e-2': {
        '1024x1024': 0.016,
        '1024x1792': 0.018,
        '1792x1024': 0.020
    },
    'dall-e-3': {
        '1024x1024': {
            standard: 0.040,
            hd: 0.080
        },
        '1024x1792': {
            standard: 0.080,
            hd: 0.120
        },
        '1792x1024': {
            standard: 0.080,
            hd: 0.120
        }
    },
    'gpt-image-1': {
        '1024x1024': {
            low: 0.011,
            medium: 0.042,
            high: 0.167
        },
        '1024x1536': {
            low: 0.016,
            medium: 0.063,
            high: 0.25
        },
        '1536x1024': {
            low: 0.016,
            medium: 0.063,
            high: 0.25
        }
    }
};

/**
 * 이미지 생성 비용을 계산합니다
 * @param {string} model - 모델명 (dall-e-2, dall-e-3, gpt-image-1)
 * @param {string} size - 이미지 크기 (예: 1024x1024)
 * @param {string} quality - 품질 (standard, hd, low, medium, high)
 * @param {number} numImages - 이미지 개수
 * @returns {number} 총 비용 (USD)
 */
export function calculateImageCost(model, size, quality, numImages = 1) {
    const pricing = PRICING[model];
    
    if (!pricing) {
        console.warn(`알 수 없는 모델: ${model}`);
        return 0;
    }

    let unitCost = 0;

    if (model === 'dall-e-2') {
        unitCost = pricing[size] || 0;
    } else if (model === 'dall-e-3') {
        const sizeInfo = pricing[size];
        if (sizeInfo) {
            if (typeof sizeInfo === 'object') {
                unitCost = sizeInfo[quality] || sizeInfo.standard || 0;
            } else {
                unitCost = sizeInfo;
            }
        }
    } else if (model === 'gpt-image-1') {
        const sizeInfo = pricing[size];
        if (sizeInfo) {
            unitCost = sizeInfo[quality] || sizeInfo.medium || 0;
        }
    }

    return unitCost * numImages;
}

/**
 * 모델별 지원되는 크기를 반환합니다
 * @param {string} model - 모델명
 * @returns {string[]} 지원되는 크기 배열
 */
export function getSupportedSizes(model) {
    const pricing = PRICING[model];
    if (!pricing) return [];
    
    return Object.keys(pricing);
}

/**
 * 모델과 크기에 따라 지원되는 품질을 반환합니다
 * @param {string} model - 모델명
 * @param {string} size - 이미지 크기
 * @returns {string[]} 지원되는 품질 배열
 */
export function getSupportedQualities(model, size) {
    const pricing = PRICING[model];
    if (!pricing) return [];
    
    const sizeInfo = pricing[size];
    if (!sizeInfo) return [];
    
    if (model === 'dall-e-2') {
        return ['standard'];
    } else if (model === 'dall-e-3') {
        if (typeof sizeInfo === 'object') {
            return Object.keys(sizeInfo);
        }
        return ['standard'];
    } else if (model === 'gpt-image-1') {
        return Object.keys(sizeInfo);
    }
    
    return [];
}

/**
 * 비용 정보를 포맷팅된 문자열로 반환합니다
 * @param {number} cost - 비용 (USD)
 * @returns {string} 포맷팅된 비용 문자열
 */
export function formatCost(cost) {
    return `$${cost.toFixed(3)}`;
}

/**
 * 모델별 추천 설정을 반환합니다
 * @param {string} model - 모델명
 * @returns {object} 추천 설정
 */
export function getRecommendedSettings(model) {
    const recommendations = {
        'dall-e-2': {
            size: '1024x1024',
            quality: 'standard',
            description: '가장 빠르고 경제적인 옵션'
        },
        'dall-e-3': {
            size: '1024x1024',
            quality: 'standard',
            description: '높은 품질과 자연어 이해력'
        },
        'gpt-image-1': {
            size: '1024x1024',
            quality: 'medium',
            description: '최신 모델, 인페인팅 지원'
        }
    };
    
    return recommendations[model] || {};
}

/**
 * 품질 표시명 매핑
 */
export const QUALITY_NAMES = {
    'standard': '표준',
    'hd': 'HD',
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High'
}; 