import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { menuService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/DataTable';
import { formatDateTimeWib } from '../../utils/date';

const POPULAR_ICONS = [
  'fas fa-layer-group',
  'fas fa-users-gear',
  'fas fa-users',
  'fas fa-user-shield',
  'fas fa-id-badge',
  'fas fa-user-tag',
  'fas fa-bars',
  'fas fa-folder-tree',
  'fas fa-folder',
  'fas fa-circle-dot',
  'fas fa-gear',
  'fas fa-table',
  'fas fa-chart-pie',
  'fas fa-database',
  'fas fa-key',
  'fas fa-file-invoice',
  'fas fa-calendar-days',
  'fas fa-shield-halved',
  'fas fa-link',
  'fas fa-envelope',
  'fas fa-globe',
  'fas fa-lock',
  'fas fa-bell',
];

export default function Menus() {
  const { pageTitle } = useOutletContext() || {};
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconTarget, setIconTarget] = useState('create');

  // Forms
  const [formData, setFormData] = useState({
    label: '',
    routeUrl: '',
    iconClass: 'fas fa-circle-dot',
    placement: 'sidebar',
    orderIndex: 0,
    note: '',
    isActive: true,
  });

  const [editData, setEditData] = useState({
    id: 0,
    label: '',
    routeUrl: '',
    iconClass: 'fas fa-circle-dot',
    placement: 'sidebar',
    orderIndex: 0,
    note: '',
    isActive: true,
  });

  const [selectedMenu, setSelectedMenu] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const showAlert = (_, message) => alert(message);

  const { refreshNavigation } = useAuth();

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await menuService.getAll();
      setMenus(data || []);
    } catch (err) {
      console.error('Failed to fetch menus:', err);
      showAlert('error', 'Gagal memuat master menu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await menuService.create(formData);
      if (res && res.success) {
        showAlert('success', res.message || 'Menu baru berhasil ditambahkan.');
        setShowModalCreate(false);
        setFormData({
          label: '',
          routeUrl: '',
          iconClass: 'fas fa-circle-dot',
          placement: 'sidebar',
          orderIndex: menus.length + 1,
          note: '',
          isActive: true,
        });
        fetchMenus();
        if (refreshNavigation) refreshNavigation();
      } else {
        showAlert('error', res.message || 'Gagal menambahkan menu.');
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
      const res = await menuService.update(editData.id, editData);
      if (res && res.success) {
        showAlert('success', res.message || 'Data menu berhasil diperbarui.');
        setShowModalEdit(false);
        fetchMenus();
        if (refreshNavigation) refreshNavigation();
      } else {
        showAlert('error', res.message || 'Gagal memperbarui menu.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMenu) return;
    setSubmitting(true);
    try {
      const res = await menuService.delete(selectedMenu.id);
      if (res && res.success) {
        showAlert('success', res.message || 'Menu berhasil dihapus.');
        setShowModalDelete(false);
        setSelectedMenu(null);
        fetchMenus();
        if (refreshNavigation) refreshNavigation();
      } else {
        showAlert('error', res.message || 'Gagal menghapus menu.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Tidak dapat menghapus menu yang masih digunakan.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = useCallback((menu) => {
    setEditData({
      id: menu.id,
      label: menu.label,
      routeUrl: menu.routeUrl,
      iconClass: menu.iconClass || 'fas fa-circle-dot',
      placement: menu.placement || 'sidebar',
      orderIndex: menu.orderIndex || 0,
      note: menu.note || '',
      isActive: menu.isActive !== false,
    });
    setShowModalEdit(true);
  }, []);

  const openDeleteModal = useCallback((menu) => {
    setSelectedMenu(menu);
    setShowModalDelete(true);
  }, []);

  const selectIcon = (icon) => {
    if (iconTarget === 'create') {
      setFormData({ ...formData, iconClass: icon });
    } else {
      setEditData({ ...editData, iconClass: icon });
    }
    setShowIconPicker(false);
  };

  const columns = useMemo(
    () => [
      {
        header: 'NO',
        width: '56px',
        align: 'center',
        sortable: false,
        render: (_m, globalIdx) => (
          <span style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.8rem' }}>{globalIdx + 1}</span>
        ),
      },
      {
        header: 'IKON',
        width: '68px',
        align: 'center',
        sortable: false,
        render: (m) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className="table-row-avatar" title={m.iconClass || 'fas fa-circle-dot'}>
              <i className={m.iconClass || 'fas fa-circle-dot'} />
            </span>
          </div>
        ),
      },
      {
        header: 'NAMA MENU',
        accessor: 'label',
        sortable: true,
        render: (m) => (
          <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{m.label}</strong>
        ),
      },
      {
        header: 'URL / ROUTE PATH',
        accessor: 'routeUrl',
        sortable: true,
        render: (m) =>
          m.routeUrl ? (
            <span className="code-tag">{m.routeUrl}</span>
          ) : (
            <span style={{ color: '#94a3b8' }}>-</span>
          ),
      },
      {
        header: 'CATATAN',
        accessor: 'note',
        sortable: true,
        render: (m) => <span style={{ color: '#64748b', fontSize: '0.78rem' }}>{m.note || '-'}</span>,
      },
      {
        header: 'STATUS',
        accessor: (m) => (m.isActive ? 'Aktif' : 'Nonaktif'),
        width: '120px',
        align: 'center',
        sortable: true,
        render: (m) =>
          m.isActive ? (
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
        render: (m) => (
          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
            {formatDateTimeWib(m.createdAt)}
          </span>
        ),
      },
      {
        header: 'AKSI',
        width: '120px',
        align: 'center',
        sortable: false,
        render: (m) => (
          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-table-action btn-table-edit"
              onClick={() => openEditModal(m)}
              title="Edit menu"
            >
              <i className="fas fa-pen" /> Edit
            </button>
            <button
              type="button"
              className="btn-table-action btn-table-del"
              onClick={() => openDeleteModal(m)}
              title="Hapus menu"
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
    <div className="menus-container">
      {/* Breadcrumb Bar */}
      <div className="content-breadcrumb-bar">
        <div className="breadcrumb-nav">
          <span className="breadcrumb-current">{pageTitle || 'Master Menu'}</span>
          <span className="breadcrumb-separator">/</span>
        </div>
      </div>

      {/* Admin Card with DataTable */}
      <div className="admin-card">
        <div className="table-responsive p-3">
          <DataTable
            columns={columns}
            data={menus}
            loading={loading}
            keyField="id"
            defaultPageLength={10}
            searchPlaceholder="Cari menu navigasi..."
            emptyText="Belum ada data menu navigasi yang terdaftar."
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
                  setFormData({
                    label: '',
                    routeUrl: '',
                    iconClass: 'fas fa-circle-dot',
                    placement: 'sidebar',
                    orderIndex: menus.length + 1,
                    note: '',
                    isActive: true,
                  });
                  setShowModalCreate(true);
                }}
              >
                <i className="fas fa-plus" /> Tambah Menu
              </button>
            }
          />
        </div>
      </div>

      {/* Modal Tambah Menu */}
      <div className={`admin-modal-backdrop ${showModalCreate ? 'show' : ''}`}>
        <div className="admin-modal-card">
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-teal">
                <i className="fas fa-plus" />
              </div>
              <div>
                <h4 className="admin-modal-title">Tambah Menu Navigasi</h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>Daftarkan tautan menu navigasi baru</p>
              </div>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowModalCreate(false)}>&times;</button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="admin-modal-content">
              <div className="form-field-group">
                <label className="form-field-label">Label Menu <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-field-input"
                  placeholder="Contoh: Master Pengguna"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">URL / Route Path <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-field-input"
                  placeholder="Contoh: /users atau /roles"
                  required
                  value={formData.routeUrl}
                  onChange={(e) => setFormData({ ...formData, routeUrl: e.target.value })}
                />
                <p className="form-field-hint">Format rute tanpa spasi (misal: /roles atau /menus).</p>
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Ikon FontAwesome</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="icon-preview-box">
                    <i className={formData.iconClass} />
                  </span>
                  <input
                    type="text"
                    className="form-field-input"
                    value={formData.iconClass}
                    onChange={(e) => setFormData({ ...formData, iconClass: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-secondary-admin"
                    style={{ padding: '0 12px', height: '36px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      setIconTarget('create');
                      setShowIconPicker(true);
                    }}
                  >
                    <i className="fas fa-icons" style={{ color: '#1A396D' }} /> Pilih Ikon
                  </button>
                </div>
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Catatan / Note</label>
                <textarea
                  className="form-field-input"
                  rows="2"
                  placeholder="Catatan tambahan mengenai menu ini..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
                  <span>Status Menu Aktif</span>
                </label>
              </div>
            </div>
            <div className="admin-modal-foot">
              <button type="button" className="btn-secondary-admin" onClick={() => setShowModalCreate(false)}>Batal</button>
              <button type="submit" className="btn-primary-admin" disabled={submitting}>
                <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-check'}`} />
                {submitting ? 'Menyimpan...' : 'Simpan Menu'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Edit Menu */}
      <div className={`admin-modal-backdrop ${showModalEdit ? 'show' : ''}`}>
        <div className="admin-modal-card">
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-blue">
                <i className="fas fa-pen-to-square" />
              </div>
              <div>
                <h4 className="admin-modal-title">Edit Menu Navigasi</h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>Perbarui data menu navigasi</p>
              </div>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowModalEdit(false)}>&times;</button>
          </div>
          <form onSubmit={handleEdit}>
            <div className="admin-modal-content">
              <div className="form-field-group">
                <label className="form-field-label">Label Menu <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-field-input"
                  required
                  value={editData.label}
                  onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">URL / Route Path <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-field-input"
                  required
                  value={editData.routeUrl}
                  onChange={(e) => setEditData({ ...editData, routeUrl: e.target.value })}
                />
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Ikon FontAwesome</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="icon-preview-box">
                    <i className={editData.iconClass} />
                  </span>
                  <input
                    type="text"
                    className="form-field-input"
                    value={editData.iconClass}
                    onChange={(e) => setEditData({ ...editData, iconClass: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-secondary-admin"
                    style={{ padding: '0 12px', height: '36px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => {
                      setIconTarget('edit');
                      setShowIconPicker(true);
                    }}
                  >
                    <i className="fas fa-icons" style={{ color: '#1A396D' }} /> Pilih Ikon
                  </button>
                </div>
              </div>

              <div className="form-field-group">
                <label className="form-field-label">Catatan / Note</label>
                <textarea
                  className="form-field-input"
                  rows="2"
                  value={editData.note}
                  onChange={(e) => setEditData({ ...editData, note: e.target.value })}
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
                  <span>Status Menu Aktif</span>
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

      {/* Modal Hapus Menu */}
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
              Apakah Anda yakin ingin menghapus menu <strong style={{ color: '#0f172a' }}>{selectedMenu?.label}</strong> ({selectedMenu?.routeUrl})?
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

      {/* Icon Picker Modal */}
      <div className={`admin-modal-backdrop ${showIconPicker ? 'show modal-stacked' : ''}`}>
        <div className="admin-modal-card" style={{ maxWidth: '500px' }}>
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-teal">
                <i className="fas fa-icons" />
              </div>
              <div>
                <h4 className="admin-modal-title">Pilih Ikon FontAwesome</h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>Pilih ikon representatif untuk menu navigasi</p>
              </div>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowIconPicker(false)}>&times;</button>
          </div>
          <div className="admin-modal-content" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              {POPULAR_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => selectIcon(icon)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '12px 6px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1A396D';
                    e.currentTarget.style.background = '#EEF3F9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                >
                  <i className={icon} style={{ fontSize: '20px', color: '#1A396D' }} />
                  <span style={{ fontSize: '10px', color: '#64748b', textAlign: 'center', wordBreak: 'break-all' }}>
                    {icon.replace('fas fa-', '')}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="admin-modal-foot">
            <button type="button" className="btn-secondary-admin" onClick={() => setShowIconPicker(false)}>Tutup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
