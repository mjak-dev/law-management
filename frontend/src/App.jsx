import React, { useState, useEffect } from 'react';
import { Scale, LayoutDashboard, Users, FolderOpen, CheckSquare, Receipt, Sun, Moon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Cases from './components/Cases';
import Tasks from './components/Tasks';
import Billing from './components/Billing';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Sync theme to root element
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'clients':
        return <Clients />;
      case 'cases':
        return <Cases />;
      case 'tasks':
        return <Tasks />;
      case 'billing':
        return <Billing />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="logo-section">
            <Scale size={24} />
            <span>Aegis Practice</span>
          </div>

          <nav>
            <ul className="nav-links">
              <li>
                <div 
                  className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutDashboard size={18} /> Dashboard
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${activeTab === 'clients' ? 'active' : ''}`}
                  onClick={() => setActiveTab('clients')}
                >
                  <Users size={18} /> Clients
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${activeTab === 'cases' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cases')}
                >
                  <FolderOpen size={18} /> Cases
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${activeTab === 'tasks' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tasks')}
                >
                  <CheckSquare size={18} /> Tasks
                </div>
              </li>
              <li>
                <div 
                  className={`nav-item ${activeTab === 'billing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('billing')}
                >
                  <Receipt size={18} /> Billing
                </div>
              </li>
            </ul>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="theme-toggle-btn" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          
          <div className="user-profile">
            <div className="avatar">JD</div>
            <div className="user-info">
              <span className="user-name">John Doe, Esq.</span>
              <span className="user-role">Managing Partner</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Viewport */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
