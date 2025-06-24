import { useState } from 'react'

function ApiKeySection({ apiKey, onSaveApiKey }) {
  const [inputApiKey, setInputApiKey] = useState(apiKey)

  const handleSave = () => {
    onSaveApiKey(inputApiKey.trim())
  }

  return (
    <section className="api-section">
      <h2>🔑 API 설정</h2>
      <div className="input-group">
        <label htmlFor="apiKey">OpenAI API 키:</label>
        <div className="api-input-container">
          <input 
            type="password" 
            id="apiKey"
            value={inputApiKey}
            onChange={(e) => setInputApiKey(e.target.value)}
            placeholder="sk-..."
          />
          <button onClick={handleSave} className="save-btn">
            저장
          </button>
        </div>
      </div>
    </section>
  )
}

export default ApiKeySection 