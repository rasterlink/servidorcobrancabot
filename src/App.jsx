import { useState } from 'react'
import Dashboard from './components/Dashboard'
import Customers from './components/Customers'
import Invoices from './components/Invoices'
import { FileText, Users, LayoutDashboard } from 'lucide-react'
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
        </nav>

        <main className="main-content">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'customers' && <Customers />}
          {activeTab === 'invoices' && <Invoices />}
        </main>
      </div>
    </div>
  )
}

export default App
