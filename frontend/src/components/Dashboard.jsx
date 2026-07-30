import React, { useState, useEffect } from 'react';
import { Briefcase, Users, Calendar, DollarSign, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../utils/api';
import { Loader } from './Common';

export default function Dashboard({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const statsData = await api.getStats();
        const tasksData = await api.getTasks();
        setStats(statsData);
        setTasks(tasksData.slice(0, 4)); // Show top 4 upcoming tasks
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <Loader />;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div>
      <div className="kpi-grid">
        <div className="kpi-card" onClick={() => setActiveTab('cases')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <span className="kpi-title">Active Matters</span>
            <span className="kpi-value">{stats?.active_cases || 0}</span>
          </div>
          <div className="kpi-icon-wrapper indigo">
            <Briefcase size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab('clients')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <span className="kpi-title">Total Clients</span>
            <span className="kpi-value">{stats?.total_clients || 0}</span>
          </div>
          <div className="kpi-icon-wrapper emerald">
            <Users size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab('tasks')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <span className="kpi-title">Pending Tasks</span>
            <span className="kpi-value">{stats?.pending_tasks || 0}</span>
          </div>
          <div className="kpi-icon-wrapper amber">
            <Calendar size={22} />
          </div>
        </div>

        <div className="kpi-card" onClick={() => setActiveTab('billing')} style={{ cursor: 'pointer' }}>
          <div className="kpi-info">
            <span className="kpi-title">Unpaid Accounts</span>
            <span className="kpi-value">{formatCurrency(stats?.unpaid_invoices || 0)}</span>
          </div>
          <div className="kpi-icon-wrapper rose">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3>Upcoming Schedule & Tasks</h3>
            <button className="theme-toggle-btn" onClick={() => setActiveTab('tasks')}>
              View All <ArrowRight size={14} />
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state" style={{ margin: 0, padding: '30px' }}>
              <CheckCircle2 size={36} />
              <h3>All caught up!</h3>
              <p>No pending tasks on your calendar.</p>
            </div>
          ) : (
            <div className="recent-activity-list">
              {tasks.map((task) => (
                <div className="activity-item" key={task.id}>
                  <div className={`activity-badge ${task.status === 'Completed' ? 'badge-completed' : 'badge-pending'}`} style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <Calendar size={18} style={{ color: task.priority === 'High' ? 'var(--accent-rose)' : 'var(--primary)' }} />
                  </div>
                  <div className="activity-details">
                    <div className="activity-text">{task.title}</div>
                    <div className="activity-time">
                      Matter: <strong style={{ color: 'var(--text-primary)' }}>{task.case_title}</strong> &bull; Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <span className={`badge badge-${task.priority.toLowerCase()}`}>
                    {task.priority} Priority
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3>Aegis Quick Action</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Welcome to your Legal Practice Portal. Use the sidebar to log new matters, update clients, monitor milestones, or process invoice payments.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
            <button className="btn btn-primary" onClick={() => setActiveTab('cases')}>
              Manage Active Cases
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab('billing')}>
              Record Billing Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
