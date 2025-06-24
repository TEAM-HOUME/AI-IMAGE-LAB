import { downloadImage } from '../utils/api'

function ImageResults({ images, onError, onUseForInpainting }) {
  const handleDownload = async (imageData, index) => {
    try {
      const filename = `generated_image_${Date.now()}_${index + 1}.png`
      
      if (imageData.b64_json) {
        // b64_json 데이터가 있으면 직접 다운로드
        const link = document.createElement('a')
        link.href = imageData.url // 이미 data URI로 변환된 상태
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else if (imageData.url) {
        // URL 형식이면 기존 다운로드 함수 사용
        await downloadImage(imageData.url, filename)
      } else {
        throw new Error('다운로드할 이미지 데이터가 없습니다.')
      }
    } catch (error) {
      onError(error)
    }
  }

  const handleUseForInpainting = (imageUrl) => {
    if (window.loadImageForInpainting) {
      window.loadImageForInpainting(imageUrl)
      onUseForInpainting(imageUrl)
    }
  }

  if (!images || images.length === 0) {
    return (
      <section className="results-section">
        <h2>📸 생성된 이미지</h2>
        <div className="no-images">
          <p>아직 생성된 이미지가 없습니다.</p>
          <p>위에서 프롬프트를 입력하고 이미지를 생성해보세요!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="results-section">
      <h2>📸 생성된 이미지</h2>
      <div className="image-grid">
        {images.map((imageData, index) => (
          <div key={index} className="image-item">
            <img 
              src={imageData.url} 
              alt={`생성된 이미지 ${index + 1}`}
              loading="lazy"
            />
            <div className="image-actions">
              <button 
                onClick={() => handleDownload(imageData, index)}
                className="download-btn"
              >
                📥 다운로드
              </button>
              <button 
                onClick={() => handleUseForInpainting(imageData.url)}
                className="inpaint-btn"
              >
                🖌️ 인페인팅용으로 사용
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ImageResults 