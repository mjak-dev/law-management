import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, DollarSign, Receipt, CreditCard } from 'lucide-react';
import { api } from '../utils/api';
import { Modal, Loader } from './Common';

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    case_id: '',
    amount: '',
    due_date: '',
    details: '',
    status: 'Unpaid'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const invoicesData = await api.getInvoices();
      const casesData = await api.getCases();
      setInvoices(invoicesData);
      setCases(casesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleTogglePaid = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'Paid' ? 'Unpaid' : 'Paid';
    try {
      await api.updateInvoiceStatus(id, nextStatus);
      setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status: nextStatus } : inv));
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;
    try {
      await api.deleteInvoice(id);
      setInvoices(invoices.filter(inv => inv.id !== id));
    } catch (err) {
      alert("Error deleting invoice: " + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.case_id || !form.amount || !form.due_date) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      const data = {
        case_id: parseInt(form.case_id, 10),
        amount: parseFloat(form.amount),
        due_date: new Date(form.due_date).toISOString(),
        details: form.details,
        status: form.status
      };
      const newInvoice = await api.createInvoice(data);
      setInvoices([newInvoice, ...invoices]);
      setIsModalOpen(false);
      setForm({ case_id: '', amount: '', due_date: '', details: '', status: 'Unpaid' });
    } catch (err) {
      setError(err.message || 'Failed to generate invoice.');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.case_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Financial aggregates
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOutstanding = invoices.filter(inv => inv.status !== 'Paid').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div>
      <div className="header-container">
        <div className="header-title">
          <h1>Billing & Accounts</h1>
          <p>Generate retainer invoices, record payments, and audit firm collections.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Raise Invoice
        </button>
      </div>

      <div className="kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-title">Total Invoiced</span>
            <span className="kpi-value">{formatCurrency(totalBilled)}</span>
          </div>
          <div className="kpi-icon-wrapper indigo">
            <Receipt size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-title">Payments Settled</span>
            <span className="kpi-value" style={{ color: 'var(--accent-emerald)' }}>{formatCurrency(totalPaid)}</span>
          </div>
          <div className="kpi-icon-wrapper emerald">
            <CreditCard size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-info">
            <span className="kpi-title">Outstanding Fees</span>
            <span className="kpi-value" style={{ color: 'var(--accent-amber)' }}>{formatCurrency(totalOutstanding)}</span>
          </div>
          <div className="kpi-icon-wrapper amber">
            <DollarSign size={22} />
          </div>
        </div>
      </div>

      <div className="actions-bar">
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="form-control search-input"
            placeholder="Search by client, matter, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : filteredInvoices.length === 0 ? (
        <div className="empty-state">
          <Receipt size={48} />
          <h3>No invoices issued</h3>
          <p>Click "Raise Invoice" to record billable hours or generate a retainer request.</p>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Client Profile</th>
                  <th>Legal Matter</th>
                  <th>Amount</th>
                  <th>Issued Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{inv.client_name}</div>
                    </td>
                    <td>{inv.case_title}</td>
                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(inv.amount)}</strong>
                    </td>
                    <td>{new Date(inv.issued_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>{new Date(inv.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>
                      <span className={`badge badge-${inv.status.toLowerCase()}`} style={{ cursor: 'pointer' }} onClick={() => handleTogglePaid(inv.id, inv.status)} title="Click to toggle status">
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', color: 'var(--accent-rose)' }} onClick={() => handleDelete(inv.id)}>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Issue Practice Invoice">
        <form onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--accent-rose)', marginBottom: '16px', fontSize: '0.9rem' }}>{error}</div>}

          <div className="form-group">
            <label>Legal Case Link *</label>
            <select
              className="form-control"
              value={form.case_id}
              onChange={(e) => setForm({ ...form, case_id: e.target.value })}
              required
            >
              <option value="">-- Choose Matter Folder --</option>
              {cases.map(cs => (
                <option key={cs.id} value={cs.id}>{cs.case_number} &bull; {cs.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Billing Amount (USD) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className="form-control"
              placeholder="e.g. 1500.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Invoice Due Date *</label>
            <input
              type="date"
              className="form-control"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Billing Notes / Itemization</label>
            <textarea
              className="form-control"
              placeholder="Provide itemized hours, consulting description, retainer terms, etc..."
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Generate Invoice
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
