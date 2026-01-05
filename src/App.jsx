import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Customers from './components/Customers'
import Invoices from './components/Invoices'
import WhatsApp from './components/WhatsApp'
import BulkMessages from './components/BulkMessages'
import Boletos from './components/Boletos'
import ImportCustomers from './components/ImportCustomers'
import { FileText, Users, LayoutDashboard, MessageCircle, Send, DollarSign, Upload } from 'lucide-react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <FileText size={32} />
            <h1>Controlador de Boletos</h1>
          </div>
        </div>
      </header>

      <div className="app-container">
        <nav className="sidebar">
          <button
            className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>
          <button
            className={`nav-button ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={20} />
            Clientes
          </button>
          <button
            className={`nav-button ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            <FileText size={20} />
            Boletos
          </button>
          <button
            className={`nav-button ${activeTab === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setActiveTab('whatsapp')}
          >
            <MessageCircle size={20} />
            WhatsApp
          </button>
          <button
            className={`nav-button ${activeTab === 'bulk' ? 'active' : ''}`}
            onClick={() => setActiveTab('bulk')}
          >
            <Send size={20} />
            Envio em Massa
          </button>
          <button
            className={`nav-button ${activeTab === 'boletos' ? 'active' : ''}`}
            onClick={() => setActiveTab('boletos')}
          >
            <DollarSign size={20} />
            Boletos Asas
          </button>
          <button
            className={`nav-button ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <Upload size={20} />
            Importar Clientes
          </button>
        </nav>

        <main className="main-content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'customers' && <Customers />}
          {activeTab === 'invoices' && <Invoices />}
          {activeTab === 'whatsapp' && <WhatsApp />}
          {activeTab === 'bulk' && <BulkMessages />}
          {activeTab === 'boletos' && <Boletos />}
          {activeTab === 'import' && <ImportCustomers />}
        </main>
      </div>
    </div>
  )
}

export default App
