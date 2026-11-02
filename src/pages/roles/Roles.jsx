import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { roleService } from '../../services/api';
import DataTable from '../../components/DataTable';
import { formatDateTimeWib } from '../../utils/date';

export default function Roles() {
  const { pageTitle } = useOutletContext() || {};
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ namaRole: '', deskripsi: '', isActive: true });
  const [editData, setEditData] = useState({ id: 0, namaRole: '', deskripsi: '', isActive: true });
  const [selectedRole, setSelectedRole] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const showAlert = (_, message) => alert(message);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await roleService.getAll();
      setRoles(data || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      showAlert('error', 'Gagal memuat master peran.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await roleService.create(formData);
      if (res && res.success) {
        showAlert('success', res.message || 'Peran baru berhasil ditambahkan.');
        setShowModalCreate(false);
        setFormData({ namaRole: '', deskripsi: '', isActive: true });
        fetchRoles();
      } else {
        showAlert('error', res.message || 'Gagal menambahkan peran.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await roleService.update(editData.id, editData);
      if (res && res.success) {
        showAlert('success', res.message || 'Data peran berhasil diperbarui.');
        setShowModalEdit(false);
        fetchRoles();
      } else {
        showAlert('error', res.message || 'Gagal memperbarui peran.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    setSubmitting(true);
    try {
      const res = await roleService.delete(selectedRole.id);
      if (res && res.success) {
        showAlert('success', res.message || 'Peran berhasil dihapus.');
        setShowModalDelete(false);
        setSelectedRole(null);
        fetchRoles();
      } else {
        showAlert('error', res.message || 'Gagal menghapus peran.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Tidak dapat menghapus peran yang masih digunakan.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = useCallback((role) => {
    setEditData({
      id: role.id,
      namaRole: role.namaRole || role.displayName || '',
      deskripsi: role.deskripsi && role.deskripsi !== '-' ? role.deskripsi : '',
      isActive: role.isActive !== undefined ? role.isActive : true,
    });
    setShowModalEdit(true);
  }, []);

  const openDeleteModal = useCallback((role) => {
    setSelectedRole(role);
    setShowModalDelete(true);
  }, []);

  const columns = useMemo(
    () => [
      {
        header: 'NO',
        width: '56px',
        align: 'center',
        sortable: false,
        render: (row, globalIdx) => (
          <span style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.8rem' }}>{globalIdx + 1}</span>
        ),
      },
      {
        header: 'NAMA ROLE',
        accessor: 'namaRole',
        sortable: true,
        render: (r) => (
          <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.84rem' }}>
            {r.namaRole || r.displayName || '-'}
          </span>
        ),
      },
      {
        header: 'DESKRIPSI',
        accessor: 'deskripsi',
        sortable: true,
        render: (r) => (
          <span style={{ color: '#64748b', fontSize: '0.82rem' }}>
            {r.deskripsi && r.deskripsi !== '-' ? r.deskripsi : '-'}
          </span>
        ),
      },
      {
        header: 'STATUS',
        accessor: (r) => (r.isActive ? 'Aktif' : 'Nonaktif'),
        width: '120px',
        align: 'center',
        sortable: true,
        render: (r) =>
          r.isActive ? (
            <span className="status-pill pill-active">
              <span className="dot-indicator" />
              Aktif
            </span>
          ) : (
            <span className="status-pill pill-inactive">
              <span className="dot-indicator" />
              Nonaktif
            </span>
          ),
      },
      {
        header: 'TERDAFTAR',
        accessor: 'createdAt',
        width: '165px',
        sortable: true,
        render: (r) => (
          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
            {formatDateTimeWib(r.createdAt)}
          </span>
        ),
      },
      {
        header: 'AKSI',
        width: '120px',
        align: 'center',
        sortable: false,
        render: (r) => (
          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-table-action btn-table-edit"
              onClick={() => openEditModal(r)}
              title="Edit peran"
            >
              <i className="fas fa-pen" /> Edit
            </button>
            <button
              type="button"
              className="btn-table-action btn-table-del"
              onClick={() => openDeleteModal(r)}
              title="Hapus peran"
            >
              <i className="fas fa-trash" />
            </button>
          </div>
        ),
      },
    ],
    [openEditModal, openDeleteModal]
  );

  return (
    <div className="roles-container">
      {/* Breadcrumb Bar */}
      <div className="content-breadcrumb-bar">
        <div className="breadcrumb-nav">
          <span className="breadcrumb-current">{pageTitle || 'Master Roles'}</span>
          <span className="breadcrumb-separator">/</span>
        </div>
      </div>

      {/* DataTable Card */}
      <div className="admin-card">
        <div className="table-responsive p-3">
          <DataTable
            columns={columns}
            data={roles}
            loading={loading}
            keyField="id"
            defaultPageLength={10}
            searchPlaceholder="Cari peran..."
            emptyText="Belum ada data peran yang terdaftar."
            actions={
              <button
                type="button"
                className="btn-primary-admin"
                style={{
                  height: '32px',
                  padding: '0 12px',
                  fontSize: '0.8125rem',
                  borderRadius: '6px',
                  whiteSpace: 'nowrap',
                }}
                onClick={() => {
                  setFormData({ namaRole: '', deskripsi: '', isActive: true });
                  setShowModalCreate(true);
                }}
              >
                <i className="fas fa-plus" /> Tambahkan Peran
              </button>
            }
          />
        </div>
      </div>

      {/* Modal Tambah Peran */}
      <div className={`admin-modal-backdrop ${showModalCreate ? 'show' : ''}`}>
        <div className="admin-modal-card">
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-teal">
                <i className="fas fa-plus" />
              </div>
              <div>
                <h4 className="admin-modal-title">Tambah Peran Baru</h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>Buat peran akses baru untuk pengguna</p>
              </div>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowModalCreate(false)}>&times;</button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="admin-modal-content">
              <div className="form-field-group">
                <label className="form-field-label">Nama Peran <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-field-input"
                  placeholder="contoh: Staf Operasional"
                  required
                  value={formData.namaRole}
                  onChange={(e) => setFormData({ ...formData, namaRole: e.target.value })}
                />
                <p className="form-field-hint">Nama ini akan tampil sebagai identitas peran di seluruh sistem.</p>
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Deskripsi</label>
                <textarea
                  className="form-field-textarea"
                  rows="3"
                  placeholder="Jelaskan wewenang peran ini secara singkat..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                ></textarea>
              </div>
              <div className="form-field-group" style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    style={{ width: '16px', height: '16px', accentColor: '#1A396D' }}
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Status Peran Aktif</span>
                </label>
              </div>
            </div>
            <div className="admin-modal-foot">
              <button type="button" className="btn-secondary-admin" onClick={() => setShowModalCreate(false)}>Batal</button>
              <button type="submit" className="btn-primary-admin" disabled={submitting}>
                <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-check'}`} />
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Edit Peran */}
      <div className={`admin-modal-backdrop ${showModalEdit ? 'show' : ''}`}>
        <div className="admin-modal-card">
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-blue">
                <i className="fas fa-pen-to-square" />
              </div>
              <div>
                <h4 className="admin-modal-title">Edit Data Peran</h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>Perbarui informasi peran yang dipilih</p>
              </div>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowModalEdit(false)}>&times;</button>
          </div>
          <form onSubmit={handleEdit}>
            <div className="admin-modal-content">
              <div className="form-field-group">
                <label className="form-field-label">Nama Peran <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-field-input"
                  required
                  value={editData.namaRole}
                  onChange={(e) => setEditData({ ...editData, namaRole: e.target.value })}
                />
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Deskripsi</label>
                <textarea
                  className="form-field-textarea"
                  rows="3"
                  value={editData.deskripsi}
                  onChange={(e) => setEditData({ ...editData, deskripsi: e.target.value })}
                ></textarea>
              </div>
              <div className="form-field-group" style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    style={{ width: '16px', height: '16px', accentColor: '#1A396D' }}
                    checked={editData.isActive}
                    onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                  />
                  <span>Status Peran Aktif</span>
                </label>
              </div>
            </div>
            <div className="admin-modal-foot">
              <button type="button" className="btn-secondary-admin" onClick={() => setShowModalEdit(false)}>Batal</button>
              <button type="submit" className="btn-primary-admin" disabled={submitting}>
                <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-check'}`} />
                {submitting ? 'Memperbarui...' : 'Perbarui'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Hapus Peran */}
      <div className={`admin-modal-backdrop ${showModalDelete ? 'show' : ''}`}>
        <div className="admin-modal-card" style={{ maxWidth: '440px' }}>
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-red">
                <i className="fas fa-triangle-exclamation" />
              </div>
              <h4 className="admin-modal-title" style={{ color: '#dc2626' }}>Konfirmasi Hapus</h4>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowModalDelete(false)}>&times;</button>
          </div>
          <div className="admin-modal-content">
            <p style={{ margin: 0, color: '#334155', fontSize: '0.84rem', lineHeight: 1.6 }}>
              Apakah Anda yakin ingin menghapus peran <strong style={{ color: '#0f172a' }}>{selectedRole?.namaRole}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="admin-modal-foot">
            <button type="button" className="btn-secondary-admin" onClick={() => setShowModalDelete(false)}>Batal</button>
            <button
              type="button"
              className="btn-table-action btn-table-del"
              style={{ padding: '7px 14px', fontSize: '0.8rem' }}
              onClick={handleDelete}
              disabled={submitting}
            >
              <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-trash'}`} />
              {submitting ? 'Menghapus...' : 'Ya, Hapus'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
