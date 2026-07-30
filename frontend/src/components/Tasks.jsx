import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Calendar, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';
import { Modal, Loader } from './Common';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', case_id: '', due_date: '', priority: 'Medium' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const tasksData = await api.getTasks();
      const casesData = await api.getCases();
      setTasks(tasksData);
      setCases(casesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      await api.updateTask(id, nextStatus);
      setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    } catch (err) {
      alert("Failed to toggle status: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
    } catch (err) {
      alert("Error deleting task: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.case_id || !form.due_date) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const data = {
        ...form,
        case_id: parseInt(form.case_id, 10),
        due_date: new Date(form.due_date).toISOString()
      };
      const newTask = await api.createTask(data);
      setTasks([newTask, ...tasks]);
      setIsModalOpen(false);
      setForm({ title: '', case_id: '', due_date: '', priority: 'Medium' });
    } catch (err) {
      setError(err.message || 'Failed to create task.');
    }
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.case_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="header-container">
        <div className="header-title">
          <h1>Milestones & Tasks</h1>
          <p>Assign case deadlines, calendar filings, and check off litigation progress.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="actions-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by task title or case..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={48} />
          <h3>No tasks listed</h3>
          <p>Assign legal briefs, client call-backs, or court submissions to keep organized.</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>Done</th>
                  <th>Task Title</th>
                  <th>Related Matter</th>
                  <th>Due Date</th>
                  <th>Priority</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((t) => (
                  <tr key={t.id} style={{ opacity: t.status === 'Completed' ? 0.6 : 1 }}>
                    <td>
                      <button 
                        onClick={() => handleToggleStatus(t.id, t.status)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.status === 'Completed' ? 'var(--accent-emerald)' : 'var(--text-muted)' }}
                      >
                        {t.status === 'Completed' ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, textDecoration: t.status === 'Completed' ? 'line-through' : 'none' }}>
                        {t.title}
                      </div>
                    </td>
                    <td>{t.case_title}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {t.status !== 'Completed' && new Date(t.due_date) < new Date() && (
                          <span style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                            <AlertCircle size={12} /> Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', color: 'var(--accent-rose)' }} onClick={() => handleDelete(t.id)}>
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Practice Task">
        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--accent-rose)', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

          <div className="form-group">
            <label>Task Description *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Schedule mediation with opposing counsel"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Link to Legal Matter *</label>
            <select
              className="form-control"
              value={form.case_id}
              onChange={(e) => setForm({ ...form, case_id: e.target.value })}
              required
            >
              <option value="">-- Select Case File --</option>
              {cases.map(cs => (
                <option key={cs.id} value={cs.id}>{cs.case_number} &bull; {cs.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Due Date *</label>
            <input
              type="date"
              className="form-control"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Priority Level</label>
            <select
              className="form-control"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
