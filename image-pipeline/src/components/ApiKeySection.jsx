import { useState } from 'react'
import { listGoogleModels } from '../utils/api'

function ApiKeySection({ apiKey, googleApiKey, onSaveApiKey, onSaveGoogleApiKey }) {
  const [inputApiKey, setInputApiKey] = useState(apiKey)
  const [inputGoogleApiKey, setInputGoogleApiKey] = useState(googleApiKey)

  const handleSaveOpenAI = () => {
    onSaveApiKey(inputApiKey.trim())
  }

  const handleSaveGoogle = () => {
    onSaveGoogleApiKey(inputGoogleApiKey.trim())
  }

  const handleCheckModels = async () => {
    if (!googleApiKey || !googleApiKey.trim()) {
      console.error('Google API 키가 필요합니다. 먼저 API 키를 저장해주세요.')
      alert('Google API 키가 필요합니다. 먼저 API 키를 저장해주세요.')
      return
    }

    try {
      console.log('🔍 Google 모델 목록 조회 시작...')
      const result = await listGoogleModels(googleApiKey)
      
      console.log('📋 Google 모델 목록 조회 결과:')
      console.log(`총 ${result.count}개의 모델이 발견되었습니다.`)
      console.log('모델 목록:', result.models)
      
      // 이미지 생성 관련 모델만 필터링해서 추가로 출력
      const imageModels = result.models.filter(model => 
        model.name.toLowerCase().includes('image') || 
        model.name.toLowerCase().includes('imagen') ||
        model.name.toLowerCase().includes('flash-preview-image') ||
        model.name.toLowerCase().includes('exp-image-generation')
      )
      
      if (imageModels.length > 0) {
        console.log('🖼️ 이미지 생성 관련 모델들:')
        imageModels.forEach((model, index) => {
          console.log(`${index + 1}. ${model.name}`)
          if (model.description) {
            console.log(`   설명: ${model.description}`)
          }
        })
      }
      
      alert(`모델 목록 조회 완료! 총 ${result.count}개 모델 발견. 자세한 내용은 콘솔을 확인하세요.`)
      
    } catch (error) {
      console.error('❌ Google 모델 목록 조회 실패:', error)
      alert(`모델 목록 조회 실패: ${error.message}`)
    }
  }

  return (
    <section className="api-section">
      <h2>🔑 API 설정</h2>
      
      {/* OpenAI API 키 */}
      <div className="input-group">
        <label htmlFor="openaiApiKey">OpenAI API 키 (DALL-E 2, 3, gpt-image-1용):</label>
        <div className="api-input-container">
          <input 
            type="password" 
            id="openaiApiKey"
            value={inputApiKey}
            onChange={(e) => setInputApiKey(e.target.value)}
            placeholder="sk-..."
          />
          <button onClick={handleSaveOpenAI} className="save-btn">
            저장
          </button>
        </div>
      </div>

      {/* Google API 키 */}
      <div className="input-group">
        <label htmlFor="googleApiKey">Google API 키 (Imagen 3용):</label>
        <div className="api-input-container">
          <input 
            type="password" 
            id="googleApiKey"
            value={inputGoogleApiKey}
            onChange={(e) => setInputGoogleApiKey(e.target.value)}
            placeholder="AIza..."
          />
          <button onClick={handleSaveGoogle} className="save-btn">
            저장
          </button>
          <button 
            onClick={handleCheckModels} 
            className="save-btn"
            style={{ marginLeft: '8px', backgroundColor: '#28a745' }}
            disabled={!googleApiKey}
          >
            📋 모델 목록 확인
          </button>
        </div>
      </div>

      <div className="api-help">
        <p><strong>💡 API 키 발급 방법:</strong></p>
        <ul>
          <li><strong>OpenAI:</strong> <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a></li>
          <li><strong>Google:</strong> <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a> 또는 <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
        </ul>
      </div>
    </section>
  )
}

export default ApiKeySection 