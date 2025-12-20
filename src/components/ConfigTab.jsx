import { useState, useEffect } from 'react'
import './ConfigTab.css'

export default function ConfigTab({ apiUrl }) {
  const [config, setConfig] = useState({
    openai_key: '',
    prompt: '',
    auto_reply: false
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch(`${apiUrl}/config`)
      const data = await res.json()
      setConfig(data)
    } catch (error) {
      console.error('Erro ao carregar config:', error)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    try {
      await fetch(`${apiUrl}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="config-tab">
      <div className="config-header">
        <h2>⚙️ Configurações</h2>
        <p>Configure a chave da OpenAI e o comportamento da IA</p>
      </div>

      <div className="config-form">
        <div className="form-group">
          <label>
            🔑 Chave OpenAI
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="get-key-link"
            >
              (Obter chave)
            </a>
          </label>
          <input
            type="password"
            className="form-input"
            placeholder="sk-proj-..."
            value={config.openai_key}
            onChange={(e) => setConfig({ ...config, openai_key: e.target.value })}
          />
          <small>Sua chave é armazenada de forma segura</small>
        </div>

        <div className="form-group">
          <label>🤖 Prompt do Sistema</label>
          <textarea
            className="form-textarea"
            rows={8}
            placeholder="Você é um assistente útil que..."
            value={config.prompt}
            onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
          />
          <small>Define como a IA vai se comportar nas respostas</small>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.auto_reply}
              onChange={(e) => setConfig({ ...config, auto_reply: e.target.checked })}
            />
            <span>✅ Ativar respostas automáticas</span>
          </label>
          <small>Quando ativado, a IA responderá automaticamente todas as mensagens recebidas</small>
        </div>

        <button
          className="btn btn-save"
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? 'Salvando...' : saved ? '✅ Salvo!' : '💾 Salvar Configurações'}
        </button>
      </div>

      <div className="config-tips">
        <h3>💡 Dicas</h3>
        <ul>
          <li><strong>Chave OpenAI:</strong> Necessária para usar a IA. Crie uma em platform.openai.com</li>
          <li><strong>Prompt:</strong> Seja específico sobre como quer que a IA responda</li>
          <li><strong>Auto-resposta:</strong> Desative se quiser revisar mensagens antes de responder</li>
        </ul>
      </div>
    </div>
  )
}
