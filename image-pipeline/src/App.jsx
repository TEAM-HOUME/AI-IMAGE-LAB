import { useState, useEffect } from 'react'
import './App.css'
import ApiKeySection from './components/ApiKeySection'
import ImageGenerationSection from './components/ImageGenerationSection'
// import InpaintingSection from './components/InpaintingSection'  // 임시 비활성화
import ImageResults from './components/ImageResults'
import LoadingSpinner from './components/LoadingSpinner'
import Message from './components/Message'

function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('openai_api_key') || '')
  const [googleApiKey, setGoogleApiKey] = useState(() => localStorage.getItem('google_api_key') || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState([])
  const [message, setMessage] = useState(null)

  // 메시지 표시 함수
  const showMessage = (text, type = 'info') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }

  // API 키 저장
  const handleSaveApiKey = (newApiKey) => {
    if (!newApiKey) {
      showMessage('API 키를 입력해주세요.', 'error')
      return
    }

    if (!newApiKey.startsWith('sk-')) {
      showMessage('올바른 OpenAI API 키 형식이 아닙니다.', 'error')
      return
    }

    setApiKey(newApiKey)
    localStorage.setItem('openai_api_key', newApiKey)
    showMessage('OpenAI API 키가 저장되었습니다.', 'success')
  }

  // Google API 키 저장
  const handleSaveGoogleApiKey = (newApiKey) => {
    if (!newApiKey) {
      showMessage('Google API 키를 입력해주세요.', 'error')
      return
    }

    setGoogleApiKey(newApiKey)
    localStorage.setItem('google_api_key', newApiKey)
    showMessage('Google API 키가 저장되었습니다.', 'success')
  }

  // 이미지 생성 완료 처리
  const handleGenerationComplete = (images) => {
    setGeneratedImages(images)
    showMessage(`${images.length}개의 이미지가 성공적으로 생성되었습니다.`, 'success')
  }

  // 에러 처리
  const handleError = (error) => {
    console.error('오류:', error)
    showMessage(`오류가 발생했습니다: ${error.message}`, 'error')
  }

  return (
    <div className="app">
      <div className="container">
        <header className="app-header">
          <h1>🎨 AI 이미지 생성 도구</h1>
          <p>OpenAI (DALL-E 2, DALL-E 3, gpt-image-1) 및 Google Imagen 3를 사용한 이미지 생성</p>
        </header>

        {message && <Message message={message} />}

        <ApiKeySection 
          apiKey={apiKey}
          googleApiKey={googleApiKey}
          onSaveApiKey={handleSaveApiKey}
          onSaveGoogleApiKey={handleSaveGoogleApiKey}
        />

        <ImageGenerationSection 
          apiKey={apiKey}
          googleApiKey={googleApiKey}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          onGenerationComplete={handleGenerationComplete}
          onError={handleError}
        />

        {/* 인페인팅 섹션 임시 비활성화 */}
        {/*
        <InpaintingSection 
          apiKey={apiKey}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          onGenerationComplete={handleGenerationComplete}
          onError={handleError}
          onSuccess={(message) => showMessage(message, 'success')}
        />
        */}

        <ImageResults 
          images={generatedImages}
          onError={handleError}
          onUseForInpainting={(imageUrl) => {
            // 인페인팅 섹션으로 이미지 전달하는 로직은 별도 구현
            showMessage('인페인팅 기능은 현재 비활성화되어 있습니다.', 'info')
          }}
        />

        {isGenerating && <LoadingSpinner />}
      </div>
    </div>
  )
}

export default App
