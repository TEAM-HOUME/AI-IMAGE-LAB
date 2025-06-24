function LoadingSpinner({ message = "이미지 생성 중...", progress = null }) {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>{message}</p>
      {progress && (
        <div className="progress-info">
          <p>{progress}</p>
        </div>
      )}
    </div>
  )
}

export default LoadingSpinner 