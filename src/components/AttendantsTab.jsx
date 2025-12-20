import { useState, useEffect } from 'react'
import './AttendantsTab.css'

export default function AttendantsTab({ supabase }) {
  const [attendants, setAttendants] = useState([])
  const [loading, setLoading] = useState(true)
  const [newAttendant, setNewAttendant] = useState({ name: '', email: '' })
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({ name: '', email: '' })

  useEffect(() => {
    loadAttendants()
  }, [])

  const loadAttendants = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('attendants')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setAttendants(data)
    }
    setLoading(false)
  }

  const handleAddAttendant = async (e) => {
    e.preventDefault()
    if (!newAttendant.name.trim() || !newAttendant.email.trim()) {
      alert('Preencha nome e email')
      return
    }

    const { error } = await supabase
      .from('attendants')
      .insert([{
        name: newAttendant.name.trim(),
        email: newAttendant.email.trim().toLowerCase(),
        is_active: true
      }])

    if (error) {
      alert('Erro ao adicionar atendente: ' + error.message)
      return
    }

    setNewAttendant({ name: '', email: '' })
    loadAttendants()
  }

  const handleToggleActive = async (id, currentStatus) => {
    const { error } = await supabase
      .from('attendants')
      .update({ is_active: !currentStatus })
      .eq('id', id)

    if (error) {
      alert('Erro ao atualizar status: ' + error.message)
      return
    }

    loadAttendants()
  }

  const handleStartEdit = (attendant) => {
    setEditingId(attendant.id)
    setEditData({ name: attendant.name, email: attendant.email || '' })
  }

  const handleSaveEdit = async (id) => {
    if (!editData.name.trim()) {
      alert('Preencha o nome')
      return
    }

    const updateData = { name: editData.name.trim() }
    if (editData.email.trim()) {
      updateData.email = editData.email.trim().toLowerCase()
    }

    const { error } = await supabase
      .from('attendants')
      .update(updateData)
      .eq('id', id)

    if (error) {
      alert('Erro ao atualizar atendente: ' + error.message)
      return
    }

    setEditingId(null)
    loadAttendants()
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este atendente?')) {
      return
    }

    const { error } = await supabase
      .from('attendants')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Erro ao excluir atendente: ' + error.message)
      return
    }

    loadAttendants()
  }

  if (loading) {
    return <div className="attendants-tab"><div className="loading">Carregando...</div></div>
  }

  return (
    <div className="attendants-tab">
      <div className="attendants-header">
        <h2>Gerenciar Atendentes</h2>
        <p className="attendants-subtitle">Cadastre atendentes para atribuir conversas</p>
      </div>

      <div className="add-attendant-form">
        <h3>Adicionar Novo Atendente</h3>
        <form onSubmit={handleAddAttendant}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Nome completo"
              value={newAttendant.name}
              onChange={(e) => setNewAttendant({ ...newAttendant, name: e.target.value })}
              className="form-input"
            />
            <input
              type="email"
              placeholder="Email (opcional)"
              value={newAttendant.email}
              onChange={(e) => setNewAttendant({ ...newAttendant, email: e.target.value })}
              className="form-input"
            />
            <button type="submit" className="btn-add">Adicionar</button>
          </div>
        </form>
      </div>

      <div className="attendants-list">
        <h3>Atendentes Cadastrados ({attendants.length})</h3>
        {attendants.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum atendente cadastrado</p>
          </div>
        ) : (
          <div className="attendants-grid">
            {attendants.map((attendant) => (
              <div key={attendant.id} className={`attendant-card ${!attendant.is_active ? 'inactive' : ''}`}>
                {editingId === attendant.id ? (
                  <div className="edit-mode">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="edit-input"
                    />
                    <input
                      type="email"
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="edit-input"
                      placeholder="Email (opcional)"
                    />
                    <div className="edit-actions">
                      <button onClick={() => handleSaveEdit(attendant.id)} className="btn-save">Salvar</button>
                      <button onClick={() => setEditingId(null)} className="btn-cancel">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="attendant-info">
                      <div className="attendant-name">{attendant.name}</div>
                      {attendant.email && <div className="attendant-email">{attendant.email}</div>}
                      <div className="attendant-status">
                        <span className={`status-badge ${attendant.is_active ? 'active' : 'inactive'}`}>
                          {attendant.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                    <div className="attendant-actions">
                      <button onClick={() => handleStartEdit(attendant)} className="btn-edit">Editar</button>
                      <button
                        onClick={() => handleToggleActive(attendant.id, attendant.is_active)}
                        className="btn-toggle"
                      >
                        {attendant.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                      <button onClick={() => handleDelete(attendant.id)} className="btn-delete">Excluir</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
