import { useState } from 'react'
import { generateImage } from '../utils/api'
import { calculateImageCost, formatCost } from '../utils/pricing'

// 모델별 지원 파라미터 설정
const MODEL_CONFIGS = {
  'dall-e-2': {
    sizes: ['256x256', '512x512', '1024x1024'],
    qualities: ['standard'],
    styles: [],
    backgrounds: [],
    outputFormats: [],
    responseFormats: ['url', 'b64_json'],
    supportsCompression: false,
    maxImages: 10
  },
  'dall-e-3': {
    sizes: ['1024x1024', '1792x1024', '1024x1792'],
    qualities: ['standard', 'hd'],
    styles: ['vivid', 'natural'],
    backgrounds: [],
    outputFormats: [],
    responseFormats: ['url', 'b64_json'],
    supportsCompression: false,
    maxImages: 10 // 병렬 호출로 구현
  },
  'gpt-image-1': {
    sizes: ['1024x1024', '1536x1024', '1024x1536', 'auto'],
    qualities: ['auto', 'low', 'medium', 'high'],
    styles: [],
    backgrounds: ['transparent', 'opaque', 'auto'],
    outputFormats: ['png', 'jpeg', 'webp'],
    responseFormats: ['b64_json'], // 고정
    supportsCompression: true,
    maxImages: 10
  }
}

// 파라미터 한글 이름 매핑
const PARAMETER_NAMES = {
  qualities: {
    'standard': '표준',
    'hd': 'HD',
    'auto': '자동',
    'low': 'Low',
    'medium': 'Medium', 
    'high': 'High'
  },
  styles: {
    'vivid': '생생한',
    'natural': '자연스러운'
  },
  backgrounds: {
    'transparent': '투명',
    'opaque': '불투명',
    'auto': '자동'
  },
  outputFormats: {
    'png': 'PNG',
    'jpeg': 'JPEG',
    'webp': 'WebP'
  },
  responseFormats: {
    'url': 'URL',
    'b64_json': 'Base64'
  }
}

function ImageGenerationSection({ 
  apiKey, 
  isGenerating, 
  setIsGenerating, 
  onGenerationComplete, 
  onError 
}) {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('gpt-image-1')
  const [numImages, setNumImages] = useState(1)
  
  // 모델별 파라미터 state
  const [size, setSize] = useState('1024x1024')
  const [quality, setQuality] = useState('medium')
  const [style, setStyle] = useState('vivid')
  const [background, setBackground] = useState('auto')
  const [outputFormat, setOutputFormat] = useState('png')
  const [outputCompression, setOutputCompression] = useState(85)
  const [responseFormat, setResponseFormat] = useState('url')

  const currentConfig = MODEL_CONFIGS[model]
  
  // 모델 변경 시 기본값 설정
  const handleModelChange = (newModel) => {
    setModel(newModel)
    const config = MODEL_CONFIGS[newModel]
    
    // 기본값 설정
    setSize(config.sizes[0])
    setQuality(config.qualities[0])
    setStyle(config.styles[0] || '')
    setBackground(config.backgrounds[0] || 'auto')
    setOutputFormat(config.outputFormats[0] || 'png')
    setResponseFormat(config.responseFormats[0])
    
    // 이미지 개수가 최대치를 초과하면 조정
    if (numImages > config.maxImages) {
      setNumImages(config.maxImages)
    }
  }

  // 이미지 생성 처리
  const handleGenerate = async () => {
    if (!apiKey) {
      onError(new Error('먼저 OpenAI API 키를 입력하고 저장해주세요.'))
      return
    }

    if (!prompt.trim()) {
      onError(new Error('프롬프트를 입력해주세요.'))
      return
    }

    if (isGenerating) return

    setIsGenerating(true)

    try {
      const params = {
        model,
        prompt: prompt.trim(),
        size,
        quality,
        numImages
      }

      // 모델별 추가 파라미터
      if (model === 'dall-e-3' && style) {
        params.style = style
      }
      if (model === 'gpt-image-1') {
        if (background) params.background = background
        if (outputFormat) params.outputFormat = outputFormat
        if (currentConfig.supportsCompression) params.outputCompression = outputCompression
      }
      if ((model === 'dall-e-2' || model === 'dall-e-3') && responseFormat) {
        params.responseFormat = responseFormat
      }

      const response = await generateImage(apiKey, params)

      if (response.data && response.data.length > 0) {
        onGenerationComplete(response.data)
      } else {
        onError(new Error('이미지 생성에 실패했습니다.'))
      }
    } catch (error) {
      onError(error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 비용 계산
  const estimatedCost = calculateImageCost(model, size, quality, numImages)

  return (
    <section className="generation-section">
      <h2>🎨 이미지 생성</h2>
      
      <div className="form-grid">
        {/* 프롬프트 입력 */}
        <div className="input-group full-width">
          <label htmlFor="prompt">프롬프트:</label>
          <textarea 
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="생성하고 싶은 이미지를 자세히 설명해주세요..."
            rows={4}
          />
        </div>

        {/* 모델 선택 */}
        <div className="input-group">
          <label htmlFor="model">모델:</label>
          <select 
            id="model"
            value={model}
            onChange={(e) => handleModelChange(e.target.value)}
          >
            <option value="gpt-image-1">gpt-image-1 (최신)</option>
            <option value="dall-e-3">DALL-E 3</option>
            <option value="dall-e-2">DALL-E 2</option>
          </select>
        </div>

        {/* 이미지 개수 */}
        <div className="input-group">
          <label htmlFor="numImages">이미지 수:</label>
          <input 
            type="number"
            id="numImages"
            min="1"
            max={currentConfig.maxImages}
            value={numImages}
            onChange={(e) => setNumImages(Math.min(parseInt(e.target.value) || 1, currentConfig.maxImages))}
          />
          {model === 'dall-e-3' && numImages > 1 && (
            <small style={{ display: 'block', marginTop: '5px', color: '#666', fontSize: '0.8rem' }}>
              💡 DALL-E 3는 {numImages}번의 병렬 API 호출을 실행합니다.
            </small>
          )}
        </div>

        {/* 이미지 크기 */}
        <div className="input-group">
          <label htmlFor="size">크기:</label>
          <select 
            id="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            {currentConfig.sizes.map(sizeOption => (
              <option key={sizeOption} value={sizeOption}>
                {sizeOption}
              </option>
            ))}
          </select>
        </div>

        {/* 품질 */}
        <div className="input-group">
          <label htmlFor="quality">품질:</label>
          <select 
            id="quality"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
          >
            {currentConfig.qualities.map(qualityOption => (
              <option key={qualityOption} value={qualityOption}>
                {PARAMETER_NAMES.qualities[qualityOption] || qualityOption}
              </option>
            ))}
          </select>
        </div>

        {/* 스타일 (DALL-E 3만) */}
        {currentConfig.styles.length > 0 && (
          <div className="input-group">
            <label htmlFor="style">스타일:</label>
            <select 
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              {currentConfig.styles.map(styleOption => (
                <option key={styleOption} value={styleOption}>
                  {PARAMETER_NAMES.styles[styleOption] || styleOption}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 배경 (gpt-image-1만) */}
        {currentConfig.backgrounds.length > 0 && (
          <div className="input-group">
            <label htmlFor="background">배경:</label>
            <select 
              id="background"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
            >
              {currentConfig.backgrounds.map(bgOption => (
                <option key={bgOption} value={bgOption}>
                  {PARAMETER_NAMES.backgrounds[bgOption] || bgOption}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 출력 포맷 (gpt-image-1만) */}
        {currentConfig.outputFormats.length > 0 && (
          <div className="input-group">
            <label htmlFor="outputFormat">출력 포맷:</label>
            <select 
              id="outputFormat"
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
            >
              {currentConfig.outputFormats.map(formatOption => (
                <option key={formatOption} value={formatOption}>
                  {PARAMETER_NAMES.outputFormats[formatOption] || formatOption}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 출력 압축 (gpt-image-1만) */}
        {currentConfig.supportsCompression && (
          <div className="input-group">
            <label htmlFor="outputCompression">압축 레벨: {outputCompression}%</label>
            <input 
              type="range"
              id="outputCompression"
              min="0"
              max="100"
              value={outputCompression}
              onChange={(e) => setOutputCompression(parseInt(e.target.value))}
            />
          </div>
        )}

        {/* 응답 형식 (DALL-E 2, 3만) */}
        {currentConfig.responseFormats.length > 1 && (
          <div className="input-group">
            <label htmlFor="responseFormat">응답 형식:</label>
            <select 
              id="responseFormat"
              value={responseFormat}
              onChange={(e) => setResponseFormat(e.target.value)}
            >
              {currentConfig.responseFormats.map(formatOption => (
                <option key={formatOption} value={formatOption}>
                  {PARAMETER_NAMES.responseFormats[formatOption] || formatOption}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 비용 표시 */}
      <div className="cost-info">
        <p>💰 예상 비용: <strong>{formatCost(estimatedCost)}</strong></p>
      </div>

      {/* 생성 버튼 */}
      <button 
        onClick={handleGenerate}
        disabled={isGenerating || !apiKey || !prompt.trim()}
        className="primary-btn"
      >
        {isGenerating ? '이미지 생성 중...' : '이미지 생성'}
      </button>

      {/* 모델별 특징 안내 */}
      <div className="model-info">
        <h3>🔍 {model} 특징</h3>
        {model === 'dall-e-2' && (
          <ul>
            <li>빠르고 경제적인 이미지 생성</li>
            <li>이미지 편집 및 변형 지원</li>
            <li>다양한 해상도 옵션</li>
          </ul>
        )}
        {model === 'dall-e-3' && (
          <ul>
            <li>최고 품질의 이미지 생성</li>
            <li>텍스트 포함 이미지 생성 우수</li>
            <li>자연어 이해력 향상</li>
            <li>생생함과 자연스러움 스타일 선택</li>
          </ul>
        )}
        {model === 'gpt-image-1' && (
          <ul>
            <li>최신 모델, 최고 성능</li>
            <li>투명 배경 지원</li>
            <li>다양한 출력 포맷 (PNG, JPEG, WebP)</li>
            <li>이미지 편집(인페인팅) 지원</li>
            <li>압축 레벨 조절 가능</li>
          </ul>
        )}
      </div>
    </section>
  )
}

export default ImageGenerationSection 