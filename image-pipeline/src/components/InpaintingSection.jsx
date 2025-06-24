import { useState, useRef, useEffect } from 'react'
import { performInpainting, loadImageToCanvas, loadImageUrlToCanvas, canvasToBlob } from '../utils/api'

function InpaintingSection({ 
  apiKey, 
  isGenerating, 
  setIsGenerating, 
  onGenerationComplete, 
  onError 
}) {
  const [inpaintPrompt, setInpaintPrompt] = useState('')
  const [brushSize, setBrushSize] = useState(20)
  const [originalImageData, setOriginalImageData] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)

  // 캔버스 초기화
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      clearMask()
    }
  }, [])

  // 마스크 지우기
  const clearMask = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 원본 이미지가 있으면 다시 그리기
    if (originalImageData) {
      ctx.globalCompositeOperation = 'multiply'
      ctx.putImageData(originalImageData, 0, 0)
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  // 마스크 그리기
  const drawMask = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // 마우스 이벤트 핸들러
  const handleMouseDown = (e) => {
    setIsDrawing(true)
    drawMask(e)
  }

  const handleMouseMove = (e) => {
    if (isDrawing) {
      drawMask(e)
    }
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  // 터치 이벤트 핸들러 (모바일)
  const handleTouchStart = (e) => {
    e.preventDefault()
    setIsDrawing(true)
    const touch = e.touches[0]
    const rect = canvasRef.current.getBoundingClientRect()
    const event = {
      clientX: touch.clientX,
      clientY: touch.clientY
    }
    drawMask(event)
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    if (isDrawing) {
      const touch = e.touches[0]
      const event = {
        clientX: touch.clientX,
        clientY: touch.clientY
      }
      drawMask(event)
    }
  }

  const handleTouchEnd = (e) => {
    e.preventDefault()
    setIsDrawing(false)
  }

  // 원본 이미지 로드
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const canvas = canvasRef.current
      const imageData = await loadImageToCanvas(file, canvas)
      setOriginalImageData(imageData)
      onError({ message: '원본 이미지가 로드되었습니다.' })
    } catch (error) {
      onError(new Error('이미지 로드에 실패했습니다.'))
    }
  }

  // 인페인팅 실행
  const handleInpainting = async () => {
    if (!apiKey) {
      onError(new Error('먼저 OpenAI API 키를 입력하고 저장해주세요.'))
      return
    }

    if (!originalImageData) {
      onError(new Error('먼저 원본 이미지를 업로드해주세요.'))
      return
    }

    if (!inpaintPrompt.trim()) {
      onError(new Error('인페인팅 프롬프트를 입력해주세요.'))
      return
    }

    if (isGenerating) return

    setIsGenerating(true)

    try {
      const canvas = canvasRef.current
      
      // 원본 이미지와 마스크를 분리
      const originalBlob = await canvasToBlob(canvas, originalImageData, 'original')
      const maskBlob = await canvasToBlob(canvas, originalImageData, 'mask')

      const response = await performInpainting(apiKey, {
        prompt: inpaintPrompt.trim(),
        image: originalBlob,
        mask: maskBlob
      })

      if (response.data && response.data.length > 0) {
        onGenerationComplete(response.data)
      } else {
        onError(new Error('인페인팅에 실패했습니다.'))
      }
    } catch (error) {
      onError(error)
    } finally {
      setIsGenerating(false)
    }
  }

  // 외부에서 이미지 URL로 로드하는 함수 (생성된 이미지를 인페인팅용으로 사용)
  const loadImageFromUrl = async (imageUrl) => {
    try {
      const canvas = canvasRef.current
      
      // data URI 또는 일반 URL 모두 처리 가능하도록 개선
      const imageData = await loadImageUrlToCanvas(imageUrl, canvas)
      setOriginalImageData(imageData)
      
      // 성공 메시지는 부모 컴포넌트에서 처리하도록 제거
    } catch (error) {
      onError(new Error('인페인팅용 이미지 로드에 실패했습니다.'))
    }
  }

  // 컴포넌트에 외부 접근 가능하도록 ref 노출
  useEffect(() => {
    if (window) {
      window.loadImageForInpainting = loadImageFromUrl
    }
  }, [])

  return (
    <section className="inpainting-section">
      <h2>🖌️ 인페인팅 (이미지 수정)</h2>
      
      <div className="inpainting-controls">
        <div className="input-group">
          <label htmlFor="originalImage">원본 이미지:</label>
          <input 
            type="file" 
            id="originalImage"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
          />
        </div>

        <div className="input-group">
          <label htmlFor="inpaintPrompt">수정 프롬프트:</label>
          <textarea 
            id="inpaintPrompt"
            value={inpaintPrompt}
            onChange={(e) => setInpaintPrompt(e.target.value)}
            placeholder="이미지에서 수정하고 싶은 내용을 설명해주세요..."
            rows={3}
          />
        </div>

        <div className="canvas-container">
          <canvas 
            ref={canvasRef}
            id="maskCanvas" 
            width="512" 
            height="512"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          <div className="canvas-controls">
            <button onClick={clearMask}>마스크 지우기</button>
            <div className="brush-control">
              <input 
                type="range" 
                id="brushSize"
                min="5" 
                max="50" 
                value={brushSize}
                onChange={(e) => setBrushSize(parseInt(e.target.value))}
              />
              <label htmlFor="brushSize">브러시 크기: {brushSize}px</label>
            </div>
          </div>
        </div>

        <button 
          onClick={handleInpainting}
          disabled={isGenerating || !apiKey || !originalImageData || !inpaintPrompt.trim()}
          className="primary-btn"
        >
          {isGenerating ? '인페인팅 실행 중...' : '인페인팅 실행'}
        </button>

        <div className="inpainting-help">
          <p>💡 사용 방법:</p>
          <ul>
            <li>원본 이미지를 업로드하세요</li>
            <li>수정하고 싶은 영역을 브러시로 칠하세요 (흰색 영역)</li>
            <li>해당 영역을 어떻게 바꿀지 프롬프트에 설명하세요</li>
            <li>gpt-image-1 모델만 인페인팅을 지원합니다</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

export default InpaintingSection 