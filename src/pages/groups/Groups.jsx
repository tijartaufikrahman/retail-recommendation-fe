import { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { groupService, menuService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/DataTable';
import { formatDateTimeWib } from '../../utils/date';

const POPULAR_ICONS = [
  'fas fa-folder',
  'fas fa-folder-tree',
  'fas fa-folder-open',
  'fas fa-layer-group',
  'fas fa-users-gear',
  'fas fa-bars',
  'fas fa-gear',
  'fas fa-database',
  'fas fa-shield-halved',
  'fas fa-chart-pie',
  'fas fa-box-archive',
  'fas fa-table',
];

export default function Groups() {
  const { pageTitle } = useOutletContext() || {};
  const [groups, setGroups] = useState([]);
  const [allMenus, setAllMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [showModalEdit, setShowModalEdit] = useState(false);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [showModalSubMenus, setShowModalSubMenus] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconTarget, setIconTarget] = useState('create');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    iconClass: 'fas fa-folder',
    placement: 'sidebar',
    orderIndex: 0,
    isActive: true,
    isOpenDefault: true,
    note: '',
  });

  const [editData, setEditData] = useState({
    id: 0,
    name: '',
    iconClass: 'fas fa-folder',
    placement: 'sidebar',
    orderIndex: 0,
    isActive: true,
    isOpenDefault: true,
    note: '',
  });

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const showAlert = (_, message) => alert(message);

  // For adding menu to group in modal
  const [addMenuId, setAddMenuId] = useState('');
  const [addOrder, setAddOrder] = useState(1);

  const { refreshNavigation } = useAuth();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [gData, mData] = await Promise.all([
        groupService.getAll(),
        menuService.getAll(),
      ]);
      setGroups(gData || []);
      setAllMenus(mData || []);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
      showAlert('error', 'Gagal memuat grup menu navigasi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await groupService.create(formData);
      if (res && res.success) {
        showAlert('success', res.message || 'Grup menu baru berhasil dibuat.');
        setShowModalCreate(false);
        setFormData({
          name: '',
          iconClass: 'fas fa-folder',
          placement: 'sidebar',
          orderIndex: groups.length + 1,
          isActive: true,
          isOpenDefault: true,
          note: '',
        });
        fetchData();
        if (refreshNavigation) refreshNavigation();
      } else {
        showAlert('error', res.message || 'Gagal membuat grup menu.');
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
      const res = await groupService.update(editData.id, editData);
      if (res && res.success) {
        showAlert('success', res.message || 'Data grup menu berhasil diperbarui.');
        setShowModalEdit(false);
        fetchData();
        if (refreshNavigation) refreshNavigation();
      } else {
        showAlert('error', res.message || 'Gagal memperbarui grup menu.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGroup) return;
    setSubmitting(true);
    try {
      const res = await groupService.delete(selectedGroup.id);
      if (res && res.success) {
        showAlert('success', res.message || 'Grup menu berhasil dihapus.');
        setShowModalDelete(false);
        setSelectedGroup(null);
        fetchData();
        if (refreshNavigation) refreshNavigation();
      } else {
        showAlert('error', res.message || 'Gagal menghapus grup menu.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Tidak dapat menghapus grup menu.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = useCallback((group) => {
    setEditData({
      id: group.id,
      name: group.name,
      iconClass: group.iconClass || 'fas fa-folder',
      placement: group.placement || 'sidebar',
      orderIndex: group.orderIndex || 0,
      isActive: group.isActive !== false,
      isOpenDefault: group.isOpenDefault !== false,
      note: group.note || '',
    });
    setShowModalEdit(true);
  }, []);

  const openDeleteModal = useCallback((group) => {
    setSelectedGroup(group);
    setShowModalDelete(true);
  }, []);

  const openSubMenusModal = useCallback(async (group) => {
    setSelectedGroup(group);
    setAddMenuId('');
    setAddOrder((group.subMenus?.length || 0) + 1);
    setShowModalSubMenus(true);

    try {
      const mData = await menuService.getAll();
      setAllMenus(Array.isArray(mData) ? mData : (mData?.data || []));
      const fresh = await groupService.getById(group.id);
      if (fresh) {
        setSelectedGroup(fresh);
        setAddOrder((fresh.subMenus?.length || 0) + 1);
      }
    } catch (e) {
      console.error('Failed to fetch group detail:', e);
    }
  }, []);

  const handleAddMenuToGroup = async () => {
    if (!addMenuId || !selectedGroup) {
      showAlert('error', 'Pilih menu yang ingin ditambahkan.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await groupService.addMenuToGroup(selectedGroup.id, Number(addMenuId), addOrder);
      if (res && res.success) {
        showAlert('success', 'Sub-menu berhasil ditambahkan ke grup.');
        const updatedGroups = await groupService.getAll();
        const list = Array.isArray(updatedGroups) ? updatedGroups : (updatedGroups?.data || []);
        setGroups(list);

        const fresh = await groupService.getById(selectedGroup.id);
        const groupObj = fresh || list.find((g) => g.id === selectedGroup.id);
        setSelectedGroup(groupObj || null);
        setAddMenuId('');
        setAddOrder((groupObj?.subMenus?.length || 0) + 1);
        if (refreshNavigation) refreshNavigation();
      } else {
        showAlert('error', res.message || 'Gagal menambahkan sub-menu.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Menu sudah ada di dalam grup ini.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMenuFromGroup = async (menuId) => {
    if (!selectedGroup) return;
    setSubmitting(true);
    try {
      const res = await groupService.removeMenuFromGroup(selectedGroup.id, menuId);
      if (res && res.success) {
        showAlert('success', 'Sub-menu berhasil dikeluarkan dari grup.');
        const updatedGroups = await groupService.getAll();
        const list = Array.isArray(updatedGroups) ? updatedGroups : (updatedGroups?.data || []);
        setGroups(list);

        const fresh = await groupService.getById(selectedGroup.id);
        const groupObj = fresh || list.find((g) => g.id === selectedGroup.id);
        setSelectedGroup(groupObj || null);
        if (refreshNavigation) refreshNavigation();
      } else {
        showAlert('error', res.message || 'Gagal menghapus sub-menu.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDefaultOpen = async (isOpen) => {
    if (!selectedGroup) return;
    try {
      await groupService.toggleDefaultOpen(selectedGroup.id, isOpen);
      setSelectedGroup({ ...selectedGroup, isOpenDefault: isOpen });
      fetchData();
      if (refreshNavigation) refreshNavigation();
    } catch (err) {
      console.error(err);
    }
  };

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
        render: (_g, globalIdx) => (
          <span style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.8rem' }}>{globalIdx + 1}</span>
        ),
      },
      {
        header: 'IKON',
        width: '68px',
        align: 'center',
        sortable: false,
        render: (g) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <span className="table-row-avatar" title={g.iconClass || 'fas fa-folder'}>
              <i className={g.iconClass || 'fas fa-folder'} />
            </span>
          </div>
        ),
      },
      {
        header: 'GRUP NAVIGASI',
        accessor: 'name',
        sortable: true,
        render: (g) => (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <strong style={{ color: '#0f172a', fontSize: '0.85rem' }}>{g.name}</strong>
            {g.isOpenDefault && (
              <span
                style={{
                  fontSize: '10px',
                  background: '#EEF3F9',
                  color: '#1A396D',
                  border: '1px solid #DEE8F5',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 600,
                }}
              >
                Auto-Open
              </span>
            )}
          </div>
        ),
      },
      {
        header: 'CATATAN',
        accessor: 'note',
        sortable: true,
        render: (g) => <span style={{ color: '#64748b', fontSize: '0.78rem' }}>{g.note || '-'}</span>,
      },
      {
        header: 'SUB-MENU',
        width: '150px',
        align: 'center',
        sortable: false,
        render: (g) => (
          <button
            type="button"
            className="btn-table-action btn-table-view"
            onClick={() => openSubMenusModal(g)}
            title="Kelola Sub-Menu"
          >
            <i className="fas fa-list-check" /> {g.subMenus?.length || 0} Sub-Menu
          </button>
        ),
      },
      {
        header: 'STATUS',
        accessor: (g) => (g.isActive ? 'Aktif' : 'Nonaktif'),
        width: '120px',
        align: 'center',
        sortable: true,
        render: (g) =>
          g.isActive ? (
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
        render: (g) => (
          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
            {formatDateTimeWib(g.createdAt)}
          </span>
        ),
      },
      {
        header: 'AKSI',
        width: '120px',
        align: 'center',
        sortable: false,
        render: (g) => (
          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-table-action btn-table-edit"
              onClick={() => openEditModal(g)}
              title="Edit grup"
            >
              <i className="fas fa-pen" /> Edit
            </button>
            <button
              type="button"
              className="btn-table-action btn-table-del"
              onClick={() => openDeleteModal(g)}
              title="Hapus grup"
            >
              <i className="fas fa-trash" />
            </button>
          </div>
        ),
      },
    ],
    [openSubMenusModal, openEditModal, openDeleteModal]
  );

  return (
    <div className="groups-container">
      {/* Breadcrumb Bar */}
      <div className="content-breadcrumb-bar">
        <div className="breadcrumb-nav">
          <span className="breadcrumb-current">{pageTitle || 'Kelola Group Menu'}</span>
          <span className="breadcrumb-separator">/</span>
        </div>
      </div>

      {/* Admin Card with DataTable */}
      <div className="admin-card">
        <div className="table-responsive p-3">
          <DataTable
            columns={columns}
            data={groups}
            loading={loading}
            keyField="id"
            defaultPageLength={10}
            searchPlaceholder="Cari grup menu..."
            emptyText="Belum ada data grup menu navigasi."
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
                    name: '',
                    iconClass: 'fas fa-folder',
                    placement: 'sidebar',
                    orderIndex: groups.length + 1,
                    isActive: true,
                    isOpenDefault: true,
                    note: '',
                  });
                  setShowModalCreate(true);
                }}
              >
                <i className="fas fa-plus" /> Tambah Grup Baru
              </button>
            }
          />
        </div>
      </div>

      {/* Modal Tambah Grup */}
      <div className={`admin-modal-backdrop ${showModalCreate ? 'show' : ''}`}>
        <div className="admin-modal-card" style={{ maxWidth: '500px' }}>
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-teal">
                <i className="fas fa-folder-plus" />
              </div>
              <div>
                <h4 className="admin-modal-title">Tambah Grup Menu</h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>Buat wadah grup accordion baru</p>
              </div>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowModalCreate(false)}>&times;</button>
          </div>
          <form onSubmit={handleCreate}>
            <div className="admin-modal-content">
              <div className="form-field-group">
                <label className="form-field-label">Nama Grup <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-field-input"
                  placeholder="Contoh: Manajemen Pengguna"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
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
                  placeholder="Catatan tambahan mengenai grup ini..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                ></textarea>
              </div>

              <div className="form-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    style={{ width: '16px', height: '16px', accentColor: '#1A396D' }}
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span>Status Grup Aktif</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    style={{ width: '16px', height: '16px', accentColor: '#1A396D' }}
                    checked={formData.isOpenDefault}
                    onChange={(e) => setFormData({ ...formData, isOpenDefault: e.target.checked })}
                  />
                  <span>Otomatis Terbuka Saat Halaman Dimuat (Auto-Open)</span>
                </label>
              </div>
            </div>
            <div className="admin-modal-foot">
              <button type="button" className="btn-secondary-admin" onClick={() => setShowModalCreate(false)}>Batal</button>
              <button type="submit" className="btn-primary-admin" disabled={submitting}>
                <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-check'}`} />
                {submitting ? 'Menyimpan...' : 'Simpan Grup'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Edit Grup */}
      <div className={`admin-modal-backdrop ${showModalEdit ? 'show' : ''}`}>
        <div className="admin-modal-card" style={{ maxWidth: '500px' }}>
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-blue">
                <i className="fas fa-pen-to-square" />
              </div>
              <div>
                <h4 className="admin-modal-title">Edit Grup Menu</h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>Perbarui data konfigurasi grup</p>
              </div>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowModalEdit(false)}>&times;</button>
          </div>
          <form onSubmit={handleEdit}>
            <div className="admin-modal-content">
              <div className="form-field-group">
                <label className="form-field-label">Nama Grup <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className="form-field-input"
                  required
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
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

              <div className="form-field-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    style={{ width: '16px', height: '16px', accentColor: '#1A396D' }}
                    checked={editData.isActive}
                    onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                  />
                  <span>Status Grup Aktif</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    style={{ width: '16px', height: '16px', accentColor: '#1A396D' }}
                    checked={editData.isOpenDefault}
                    onChange={(e) => setEditData({ ...editData, isOpenDefault: e.target.checked })}
                  />
                  <span>Otomatis Terbuka Saat Halaman Dimuat (Auto-Open)</span>
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

      {/* Modal Hapus Grup */}
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
              Apakah Anda yakin ingin menghapus grup menu <strong style={{ color: '#0f172a' }}>{selectedGroup?.name}</strong>?
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

      {/* Modal Kelola Sub-Menu */}
      <div className={`admin-modal-backdrop ${showModalSubMenus ? 'show' : ''}`}>
        <div className="admin-modal-card" style={{ maxWidth: '640px' }}>
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-teal">
                <i className="fas fa-list-check" />
              </div>
              <div>
                <h4 className="admin-modal-title">Sub-Menu di Grup: {selectedGroup?.name}</h4>
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>Daftarkan menu anak yang muncul di dalam dropdown ini</p>
              </div>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowModalSubMenus(false)}>&times;</button>
          </div>
          <div className="admin-modal-content">
            {/* Box Tambah Sub-Menu */}
            <div className="submenus-add-card">
              <h5 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                <i className="fas fa-plus-circle" style={{ color: '#1A396D', marginRight: '6px' }} />
                Tambahkan Menu ke Grup Ini
              </h5>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <label className="form-field-label" style={{ fontSize: '0.74rem' }}>Pilih Menu Navigasi</label>
                  <select
                    className="form-field-select"
                    value={addMenuId}
                    onChange={(e) => setAddMenuId(e.target.value)}
                  >
                    <option value="">-- Pilih Menu --</option>
                    {allMenus.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label} ({m.routeUrl})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ width: '90px' }}>
                  <label className="form-field-label" style={{ fontSize: '0.74rem' }}>Urutan</label>
                  <input
                    type="number"
                    className="form-field-input"
                    value={addOrder}
                    onChange={(e) => setAddOrder(Number(e.target.value))}
                    min="1"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    className="btn-primary-admin"
                    onClick={handleAddMenuToGroup}
                    disabled={submitting || !addMenuId}
                    style={{ height: '36px', padding: '0 14px' }}
                  >
                    <i className="fas fa-plus" /> Tambah
                  </button>
                </div>
              </div>
            </div>

            {/* List Sub-Menu saat ini */}
            <h5 style={{ margin: '16px 0 8px', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              Daftar Sub-Menu Terdaftar ({selectedGroup?.subMenus?.length || 0})
            </h5>

            {!selectedGroup?.subMenus || selectedGroup.subMenus.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <i className="fas fa-folder-open" style={{ fontSize: '24px', color: '#94a3b8', display: 'block', marginBottom: '6px' }} />
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Belum ada sub-menu di dalam grup ini.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedGroup.subMenus.map((sm, idx) => (
                  <div
                    key={sm.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 700, color: '#1A396D', fontSize: '0.75rem', width: '20px' }}>
                        #{sm.orderIndex || idx + 1}
                      </span>
                      <span className="icon-preview-box" style={{ width: '28px', height: '28px', fontSize: '13px' }}>
                        <i className={sm.iconClass || 'fas fa-circle-dot'} />
                      </span>
                      <div>
                        <strong style={{ color: '#0f172a', fontSize: '0.82rem' }}>{sm.label}</strong>
                        <small style={{ display: 'block', color: '#94a3b8', fontSize: '0.72rem' }}>{sm.routeUrl}</small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-table-action btn-table-del"
                      onClick={() => handleRemoveMenuFromGroup(sm.id || sm.menuId)}
                      disabled={submitting}
                      title="Keluarkan dari grup"
                    >
                      <i className="fas fa-xmark" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pengaturan Default Buka */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '0.8rem', color: '#0f172a' }}>Otomatis Terbuka (Auto-Open)</strong>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
                  Grup dropdown langsung terbuka saat pengguna memuat aplikasi
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  style={{ width: '18px', height: '18px', accentColor: '#1A396D' }}
                  checked={selectedGroup?.isOpenDefault || false}
                  onChange={(e) => handleToggleDefaultOpen(e.target.checked)}
                />
              </label>
            </div>
          </div>
          <div className="admin-modal-foot">
            <button type="button" className="btn-secondary-admin" onClick={() => setShowModalSubMenus(false)}>Tutup</button>
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
                <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>Pilih ikon representatif untuk grup navigasi</p>
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
