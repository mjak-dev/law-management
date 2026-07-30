import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, Edit, ExternalLink, Calendar, Scale } from 'lucide-react';
import { api } from '../utils/api';
import { Modal, Loader } from './Common';

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    title: '',
    client_id: '',
    case_number: '',
    practice_area: '',
    court: '',
    description: '',
    status: 'Open'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const casesData = await api.getCases();
      const clientsData = await api.getClients();
      setCases(casesData);
      setClients(clientsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.title || !form.client_id || !form.case_number || !form.practice_area) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const data = {
        ...form,
        client_id: parseInt(form.client_id, 10)
      };
      const newCase = await api.createCase(data);
      setCases([newCase, ...cases]);
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to create case.');
    }
  };

  const handleEditClick = (c) => {
    setSelectedCase(c);
    setForm({
      title: c.title,
      client_id: c.client_id.toString(),
      case_number: c.case_number,
      practice_area: c.practice_area,
      court: c.court || '',
      description: c.description || '',
      status: c.status
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.updateCase(selectedCase.id, form);
      // reload
      const updated = await api.getCases();
      setCases(updated);
      setIsEditOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Failed to update case.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this case? All associated tasks & invoices will also be deleted.")) return;
    try {
      await api.deleteCase(id);
      setCases(cases.filter(c => c.id !== id));
    } catch (err) {
      alert("Error deleting case: " + err.message);
    }
  };

  const resetForm = () => {
    setForm({
      title: '',
      client_id: '',
      case_number: '',
      practice_area: '',
      court: '',
      description: '',
      status: 'Open'
    });
    setSelectedCase(null);
  };

  const generateCaseNumber = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setForm({ ...form, case_number: `CASE-${year}-${rand}` });
  };

  const filteredCases = cases.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.case_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.practice_area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="header-container">
        <div className="header-title">
          <h1>Cases & Matters</h1>
          <p>Create, track, and archive legal briefs, litigations, and agreements.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setIsCreateOpen(true); }}>
          <Plus size={16} /> Open Case
        </button>
      </div>

      <div className="actions-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by case title, case number, client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : filteredCases.length === 0 ? (
        <div className="empty-state">
          <Scale size={48} />
          <h3>No legal cases found</h3>
          <p>Get started by logging your first client legal dispute or matter docket.</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Case Ref / ID</th>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Practice Area</th>
                  <th>Status</th>
                  <th>Court Docket</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--primary)' }}>
                        {c.case_number}
                      </code>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Opened: {new Date(c.date_opened).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>
                    <td>{c.client_name}</td>
                    <td>{c.practice_area}</td>
                    <td>
                      <span className={`badge badge-${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>{c.court || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px' }} onClick={() => handleEditClick(c)}>
                          <Edit size={14} />
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', color: 'var(--accent-rose)' }} onClick={() => handleDelete(c.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Open Legal Case/Matter">
        <form onSubmit={handleCreateSubmit}>
          {error && <div style={{ color: 'var(--accent-rose)', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

          <div className="form-group">
            <label>Matter Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Acme Breach of Contract Dispute"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Associated Client *</label>
            <select
              className="form-control"
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              required
            >
              <option value="">-- Choose Client Profile --</option>
              {clients.map(cl => (
                <option key={cl.id} value={cl.id}>{cl.name} ({cl.company || 'Individual'})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Case Docket Number *</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CASE-2026-9481"
                value={form.case_number}
                onChange={(e) => setForm({ ...form, case_number: e.target.value })}
                style={{ flex: 1 }}
                required
              />
              <button type="button" className="btn btn-secondary" onClick={generateCaseNumber}>
                Generate
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Practice Area *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Corporate Litigation, Patent Law"
              value={form.practice_area}
              onChange={(e) => setForm({ ...form, practice_area: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Court Jurisdiction / Venue</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. US District Court - Delaware"
              value={form.court}
              onChange={(e) => setForm({ ...form, court: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Case Summary / Description</label>
            <textarea
              className="form-control"
              placeholder="Provide a detailed description of case backgrounds, legal claims, and milestones..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Open Case File
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Modify Case Details">
        <form onSubmit={handleEditSubmit}>
          {error && <div style={{ color: 'var(--accent-rose)', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

          <div className="form-group">
            <label>Matter Title *</label>
            <input
              type="text"
              className="form-control"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              className="form-control"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Open">Open / Active</option>
              <option value="Pending">Pending / Suspended</option>
              <option value="Closed">Closed / Settled</option>
            </select>
          </div>

          <div className="form-group">
            <label>Court Jurisdiction</label>
            <input
              type="text"
              className="form-control"
              value={form.court}
              onChange={(e) => setForm({ ...form, court: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Case Summary</label>
            <textarea
              className="form-control"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
