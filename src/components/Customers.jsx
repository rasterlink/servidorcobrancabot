import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Plus, Edit2, Trash2, Mail, Phone, Search } from 'lucide-react'
import './Customers.css'

function Customers() {
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    cpf_cnpj: '',
    pix_key: '',
    contract_number: '',
    vehicle_plate: '',
    vehicle_chassis: '',
    vehicle_brand: '',
    vehicle_model: '',
    active: true
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredCustomers(customers)
    } else {
      const filtered = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.cpf_cnpj && customer.cpf_cnpj.includes(searchTerm))
      )
      setFilteredCustomers(filtered)
    }
  }, [searchTerm, customers])

  async function loadCustomers() {
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
      setCustomers(data || [])
      setFilteredCustomers(data || [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
    } finally {
      setLoading(false)
    }
  }

  function openModal(customer = null) {
    if (customer) {
      setFormData(customer)
    } else {
      setFormData({
        id: null,
        name: '',
        email: '',
        phone: '',
        cpf_cnpj: '',
        pix_key: '',
        contract_number: '',
        vehicle_plate: '',
        vehicle_chassis: '',
        vehicle_brand: '',
        vehicle_model: '',
        active: true
      })
    }
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setFormData({
      id: null,
      name: '',
      email: '',
      phone: '',
      cpf_cnpj: '',
      pix_key: '',
      contract_number: '',
      vehicle_plate: '',
      vehicle_chassis: '',
      vehicle_brand: '',
      vehicle_model: '',
      active: true
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()

    try {
      if (formData.id) {
        const { error } = await supabase
          .from('customers')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            cpf_cnpj: formData.cpf_cnpj,
            pix_key: formData.pix_key,
            contract_number: formData.contract_number,
            vehicle_plate: formData.vehicle_plate,
            vehicle_chassis: formData.vehicle_chassis,
            vehicle_brand: formData.vehicle_brand,
            vehicle_model: formData.vehicle_model,
            active: formData.active
          })
          .eq('id', formData.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            cpf_cnpj: formData.cpf_cnpj,
            pix_key: formData.pix_key,
            contract_number: formData.contract_number,
            vehicle_plate: formData.vehicle_plate,
            vehicle_chassis: formData.vehicle_chassis,
            vehicle_brand: formData.vehicle_brand,
            vehicle_model: formData.vehicle_model,
            active: formData.active
          }])

        if (error) throw error
      }

      closeModal()
      loadCustomers()
    } catch (error) {
      console.error('Erro ao salvar cliente:', error)
      alert('Erro ao salvar cliente: ' + error.message)
    }
  }

  async function deleteCustomer(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadCustomers()
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      alert('Erro ao excluir cliente: ' + error.message)
    }
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div className="customers">
      <div className="page-header">
        <h2 className="page-title">Gerenciar Clientes</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Buscar por nome, email ou CPF/CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum cliente encontrado.</p>
          <button className="btn btn-primary" onClick={() => openModal()}>
            Adicionar Primeiro Cliente
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Telefone</th>
                <th>CPF/CNPJ</th>
                <th>Chave PIX</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>
                    <span className="email-cell">
                      <Mail size={16} />
                      {customer.email}
                    </span>
                  </td>
                  <td>
                    <span className="phone-cell">
                      <Phone size={16} />
                      {customer.phone || '-'}
                    </span>
                  </td>
                  <td>{customer.cpf_cnpj || '-'}</td>
                  <td>{customer.pix_key || '-'}</td>
                  <td>
                    <span className={`status-badge ${customer.active ? 'active' : 'inactive'}`}>
                      {customer.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => openModal(customer)}
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => deleteCustomer(customer.id)}
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{formData.id ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Telefone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>CPF/CNPJ</label>
                <input
                  type="text"
                  value={formData.cpf_cnpj}
                  onChange={(e) => setFormData({...formData, cpf_cnpj: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Chave PIX</label>
                <input
                  type="text"
                  placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                  value={formData.pix_key}
                  onChange={(e) => setFormData({...formData, pix_key: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Número do Contrato</label>
                <input
                  type="text"
                  placeholder="Número do contrato Rasterlink"
                  value={formData.contract_number}
                  onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Placa do Veículo</label>
                <input
                  type="text"
                  placeholder="ABC1234"
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData({...formData, vehicle_plate: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Chassi do Veículo</label>
                <input
                  type="text"
                  placeholder="9C2KF4300PR007083"
                  value={formData.vehicle_chassis}
                  onChange={(e) => setFormData({...formData, vehicle_chassis: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Marca do Veículo</label>
                <input
                  type="text"
                  placeholder="Honda, Yamaha, etc"
                  value={formData.vehicle_brand}
                  onChange={(e) => setFormData({...formData, vehicle_brand: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Modelo do Veículo</label>
                <input
                  type="text"
                  placeholder="ADV 150, CB 500, etc"
                  value={formData.vehicle_model}
                  onChange={(e) => setFormData({...formData, vehicle_model: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  />
                  Cliente Ativo
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {formData.id ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers
