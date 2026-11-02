import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { userService, roleService } from '../../services/api';
import DataTable from '../../components/DataTable';
import { formatDateTimeWib } from '../../utils/date';

export default function Users() {
  const { pageTitle } = useOutletContext() || {};
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    namaLengkap: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  });

  const [editData, setEditData] = useState({
    id: 0,
    namaLengkap: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showAlert = (_, message) => alert(message);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      showAlert('error', 'Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const data = await roleService.getAll();
      setRoles(data || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [fetchUsers, fetchRoles]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.roleId) {
      showAlert('error', 'Silakan pilih peran untuk pengguna ini.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await userService.create({
        ...formData,
        roleId: Number(formData.roleId),
      });
      if (res && res.success) {
        showAlert('success', res.message || 'Pengguna baru berhasil ditambahkan.');
        setShowModalCreate(false);
        setFormData({ namaLengkap: '', email: '', password: '', roleId: roles[0]?.id || '', isActive: true });
        fetchUsers();
      } else {
        showAlert('error', res.message || 'Gagal menambahkan pengguna.');
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
    if (!editData.roleId) {
      showAlert('error', 'Silakan pilih peran untuk pengguna ini.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await userService.update(editData.id, {
        ...editData,
        roleId: Number(editData.roleId),
      });
      if (res && res.success) {
        showAlert('success', res.message || 'Data pengguna berhasil diperbarui.');
        setShowModalEdit(false);
        fetchUsers();
      } else {
        showAlert('error', res.message || 'Gagal memperbarui pengguna.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await userService.delete(selectedUser.id);
      if (res && res.success) {
        showAlert('success', res.message || 'Pengguna berhasil dihapus.');
        setShowModalDelete(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        showAlert('error', res.message || 'Gagal menghapus pengguna.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = useCallback((user) => {
    setEditData({
      id: user.id,
      namaLengkap: user.namaLengkap,
      email: user.email,
      password: '',
      roleId: user.roleId || '',
      isActive: user.isActive,
    });
    setShowModalEdit(true);
  }, []);

  const openDeleteModal = useCallback((user) => {
    setSelectedUser(user);
    setShowModalDelete(true);
  }, []);

  const columns = useMemo(
    () => [
      {
        header: 'NO',
        width: '56px',
        align: 'center',
        sortable: false,
        render: (_row, globalIdx) => (
          <span style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.8rem' }}>{globalIdx + 1}</span>
        ),
      },
      {
        header: 'KODE',
        accessor: 'code',
        width: '150px',
        sortable: true,
        render: (u) => {
          let codeVal = u.code;
          if (!codeVal || codeVal === '-' || String(codeVal).trim() === '') {
            if (u.createdAt) {
              const d = new Date(u.createdAt);
              if (!isNaN(d.getTime())) {
                const utc = d.getTime() + d.getTimezoneOffset() * 60000;
                const wib = new Date(utc + 7 * 3600000);
                const pad = (n) => String(n).padStart(2, '0');
                codeVal = `${pad(wib.getDate())}${pad(wib.getMonth() + 1)}${wib.getFullYear()}${pad(wib.getHours())}${pad(wib.getMinutes())}${pad(wib.getSeconds())}`;
              }
            }
          }
          return (
            <span style={{ color: '#334155', fontSize: '0.82rem', fontWeight: 600 }}>
              {codeVal || '-'}
            </span>
          );
        },
      },
      {
        header: 'NAMA PENGGUNA',
        accessor: 'namaLengkap',
        sortable: true,
        render: (u) => (
          <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{u.namaLengkap}</strong>
        ),
      },
      {
        header: 'EMAIL',
        accessor: 'email',
        sortable: true,
        render: (u) => (
          <span style={{ color: '#475569', fontSize: '0.82rem' }}>{u.email}</span>
        ),
      },
      {
        header: 'ROLE',
        accessor: 'roleName',
        sortable: true,
        render: (u) =>
          u.roleName ? (
            <span className="status-pill pill-role">
              {u.roleName}
            </span>
          ) : (
            <span style={{ color: '#94a3b8' }}>-</span>
          ),
      },
      {
        header: 'STATUS',
        accessor: (u) => (u.isActive ? 'Aktif' : 'Nonaktif'),
        width: '120px',
        align: 'center',
        sortable: true,
        render: (u) =>
          u.isActive ? (
            <span className="status-pill pill-active">
              <span className="dot-indicator" /> Aktif
            </span>
          ) : (
            <span className="status-pill pill-inactive">
              <span className="dot-indicator" /> Nonaktif
            </span>
          ),
      },
      {
        header: 'TERDAFTAR',
        accessor: 'createdAt',
        width: '165px',
        sortable: true,
        render: (u) => (
          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
            {formatDateTimeWib(u.createdAt)}
          </span>
        ),
      },
      {
        header: 'AKSI',
        width: '120px',
        align: 'center',
        sortable: false,
        render: (u) => (
          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-table-action btn-table-edit"
              onClick={() => openEditModal(u)}
              title="Edit pengguna"
            >
              <i className="fas fa-pen" /> Edit
            </button>
            <button
              type="button"
              className="btn-table-action btn-table-del"
              onClick={() => openDeleteModal(u)}
              title="Hapus pengguna"
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
    <div className="users-container">
      {/* Breadcrumb Bar */}
      <div className="content-breadcrumb-bar">
        <div className="breadcrumb-nav">
          <span className="breadcrumb-current">{pageTitle || 'Master Users'}</span>
          <span className="breadcrumb-separator">/</span>
        </div>
      </div>

      {/* Admin Card with DataTable */}
      <div className="admin-card">
        <div className="table-responsive p-3">
          <DataTable
            columns={columns}
            data={users}
            loading={loading}
            keyField="id"
            defaultPageLength={10}
            searchPlaceholder="Cari pengguna..."
            emptyText="Belum ada data pengguna yang terdaftar."
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
                  setFormData({ namaLengkap: '', email: '', password: '', roleId: roles[0]?.id || '', isActive: true });
                  setShowModalCreate(true);
                }}
              >
                <i className="fas fa-plus" /> Tambah Pengguna
              </button>
            }
          />
        </div>
      </div>

      {/* Modal Tambah Pengguna */}
      <div className={`admin-modal-backdrop ${showModalCreate ? 'show' : ''}`}>
        <div className="admin-modal-card">
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-teal">
                <i className="fas fa-user-plus" />
              </div>
              <div>
                <h4 className="admin-modal-title">Tambah Pengguna Baru</h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>Daftarkan akun pengguna baru ke sistem</p>
              </div>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowModalCreate(false)}>&times;</button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="admin-modal-content">
              <div className="form-field-group">
                <label className="form-field-label">Nama Lengkap <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-field-input"
                  placeholder="Nama lengkap pengguna"
                  required
                  value={formData.namaLengkap}
                  onChange={(e) => setFormData({ ...formData, namaLengkap: e.target.value })}
                />
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Alamat Email <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="email"
                  className="form-field-input"
                  placeholder="nama@email.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="form-field-hint">Email akan digunakan sebagai nama pengguna saat masuk ke aplikasi.</p>
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Peran (Role) <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-field-select"
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value ? Number(e.target.value) : '' })}
                  required
                >
                  <option value="">-- Pilih Peran Pengguna --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.namaRole || r.displayName || r.name || `Peran #${r.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Kata Sandi (Password) <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="password"
                  className="form-field-input"
                  placeholder="Minimal 6 karakter"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div className="form-field-group" style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    style={{ width: '16px', height: '16px', accentColor: '#1A396D' }}
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Status Akun Aktif</span>
                </label>
              </div>
            </div>
            <div className="admin-modal-foot">
              <button type="button" className="btn-secondary-admin" onClick={() => setShowModalCreate(false)}>Batal</button>
              <button type="submit" className="btn-primary-admin" disabled={submitting}>
                <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-check'}`} />
                {submitting ? 'Menyimpan...' : 'Simpan Pengguna'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Edit Pengguna */}
      <div className={`admin-modal-backdrop ${showModalEdit ? 'show' : ''}`}>
        <div className="admin-modal-card">
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-blue">
                <i className="fas fa-user-pen" />
              </div>
              <div>
                <h4 className="admin-modal-title">Edit Data Pengguna</h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>Perbarui informasi akun pengguna</p>
              </div>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowModalEdit(false)}>&times;</button>
          </div>
          <form onSubmit={handleEdit}>
            <div className="admin-modal-content">
              <div className="form-field-group">
                <label className="form-field-label">Nama Lengkap <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-field-input"
                  required
                  value={editData.namaLengkap}
                  onChange={(e) => setEditData({ ...editData, namaLengkap: e.target.value })}
                />
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Alamat Email <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="email"
                  className="form-field-input"
                  required
                  value={editData.email}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                />
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Peran (Role) <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  className="form-field-select"
                  value={editData.roleId || ''}
                  onChange={(e) => setEditData({ ...editData, roleId: e.target.value ? Number(e.target.value) : '' })}
                  required
                >
                  <option value="">-- Pilih Peran Pengguna --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.namaRole || r.displayName || r.name || `Peran #${r.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field-group">
                <label className="form-field-label">Ganti Password</label>
                <input
                  type="password"
                  className="form-field-input"
                  placeholder="Kosongkan jika tidak ingin mengubah password"
                  value={editData.password}
                  onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                />
              </div>
              <div className="form-field-group" style={{ marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    style={{ width: '16px', height: '16px', accentColor: '#1A396D' }}
                    checked={editData.isActive}
                    onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                  />
                  <span>Status Akun Aktif</span>
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

      {/* Modal Hapus Pengguna */}
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
              Apakah Anda yakin ingin menghapus akun pengguna <strong style={{ color: '#0f172a' }}>{selectedUser?.namaLengkap}</strong>?
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
