import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { menuRoleService, roleService, menuService, groupService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/DataTable';
import { formatDateTimeWib } from '../../utils/date';

export default function MenuRoles() {
  const { pageTitle } = useOutletContext() || {};
  const { refreshNavigation } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [roles, setRoles] = useState([]);
  const [menuRoles, setMenuRoles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Role selection
  const roleIdParam = searchParams.get('roleId');
  const [selectedRoleId, setSelectedRoleId] = useState(roleIdParam ? Number(roleIdParam) : null);

  // Modals for Role Menu CRUD
  const [showModalForm, setShowModalForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showModalDelete, setShowModalDelete] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    type: 'menu', // 'menu' | 'group'
    targetId: '',
    orderIndex: 1,
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const showAlert = (_, message) => alert(message);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mrData, rData, mData, gData] = await Promise.all([
        menuRoleService.getAll(),
        roleService.getAll(),
        menuService.getAll(),
        groupService.getAll(),
      ]);
      setMenuRoles(mrData || []);
      setRoles(rData || []);
      setMenus(mData || []);
      setGroups(gData || []);
    } catch (err) {
      console.error('Failed to load menu roles:', err);
      showAlert('error', 'Gagal memuat data otorisasi menu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set default active role if not set or if current selectedId not found in roles
  useEffect(() => {
    if (roles.length > 0) {
      if (!selectedRoleId || !roles.some((r) => r.id === selectedRoleId)) {
        const initialId = roleIdParam && roles.some((r) => String(r.id) === String(roleIdParam))
          ? Number(roleIdParam)
          : roles[0].id;
        setSelectedRoleId(initialId);
      }
    }
  }, [roles, selectedRoleId, roleIdParam]);

  // Active Role Object
  const activeRole = useMemo(() => {
    if (!selectedRoleId || roles.length === 0) return null;
    return roles.find((r) => r.id === selectedRoleId) || roles[0] || null;
  }, [selectedRoleId, roles]);

  // Map of counts of assigned menus per role
  const roleMenuCountMap = useMemo(() => {
    const map = {};
    for (const item of menuRoles) {
      map[item.roleId] = (map[item.roleId] || 0) + 1;
    }
    return map;
  }, [menuRoles]);

  // Assignments filtered for active role
  const activeRoleMenuRoles = useMemo(() => {
    if (!activeRole) return [];
    return menuRoles
      .filter((mr) => mr.roleId === activeRole.id)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [activeRole, menuRoles]);

  // Handle selecting a role from left card
  const handleSelectRole = (role) => {
    setSelectedRoleId(role.id);
    setSearchParams({ roleId: role.id });
  };

  // Open Create Modal (Assign to active role)
  const handleOpenCreate = () => {
    if (!activeRole) return;
    setIsEditing(false);
    setEditingId(null);
    const initialTargetId = menus.length > 0 ? menus[0].id : '';
    setFormData({
      type: 'menu',
      targetId: initialTargetId,
      orderIndex: activeRoleMenuRoles.length + 1,
      isActive: true,
    });
    setShowModalForm(true);
  };

  // Open Edit Modal
  const handleOpenEdit = useCallback((item) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormData({
      type: item.type === 'group' ? 'group' : 'menu',
      targetId: item.type === 'group' ? item.groupId : item.menuId,
      orderIndex: item.orderIndex || 1,
      isActive: item.isActive !== false,
    });
    setShowModalForm(true);
  }, []);

  // Open Delete Modal
  const handleOpenDelete = useCallback((item) => {
    setSelectedItem(item);
    setShowModalDelete(true);
  }, []);

  const handleTypeChange = (newType) => {
    let target = '';
    if (newType === 'menu' && menus.length > 0) target = menus[0].id;
    else if (newType === 'group' && groups.length > 0) target = groups[0].id;

    setFormData((prev) => ({
      ...prev,
      type: newType,
      targetId: target,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeRole || !formData.targetId) {
      showAlert('error', 'Silakan pilih item navigasi terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const targetIdNum = Number(formData.targetId);
      const payload = {
        roleId: Number(activeRole.id),
        type: formData.type || 'menu',
        targetId: targetIdNum,
        menuId: formData.type === 'menu' ? targetIdNum : null,
        groupId: formData.type === 'group' ? targetIdNum : null,
        orderIndex: Number(formData.orderIndex) || 0,
        isActive: formData.isActive,
      };

      let res;
      if (isEditing) {
        res = await menuRoleService.update(editingId, payload);
      } else {
        res = await menuRoleService.assign(payload);
      }

      if (res && res.success) {
        showAlert('success', res.message || 'Item menu berhasil didaftarkan ke peran.');
        setShowModalForm(false);
        fetchData();
        if (refreshNavigation) refreshNavigation();
      } else {
        showAlert('error', res.message || 'Gagal menyimpan otorisasi menu.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      const res = await menuRoleService.delete(selectedItem.id);
      if (res && res.success) {
        showAlert('success', res.message || 'Menu berhasil dicabut dari peran.');
        setShowModalDelete(false);
        setSelectedItem(null);
        fetchData();
        if (refreshNavigation) refreshNavigation();
      } else {
        showAlert('error', res.message || 'Gagal menghapus otorisasi menu.');
      }
    } catch (err) {
      console.error(err);
      showAlert('error', err.response?.data?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Columns for Right Panel: Menu items of Active Role
  const roleMenuColumns = useMemo(
    () => [
      {
        header: 'NO',
        width: '52px',
        align: 'center',
        sortable: false,
        render: (_item, globalIdx) => (
          <span style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.8rem' }}>{globalIdx + 1}</span>
        ),
      },
      {
        header: 'URUTAN',
        accessor: 'orderIndex',
        width: '80px',
        align: 'center',
        sortable: true,
        render: (item) => (
          <span style={{ fontWeight: 700, color: '#1A396D', fontSize: '0.82rem' }}>
            #{item.orderIndex}
          </span>
        ),
      },
      {
        header: 'TIPE',
        accessor: (item) => (item.type === 'group' ? 'Grup' : 'Menu'),
        width: '100px',
        sortable: true,
        render: (item) =>
          item.type === 'group' ? (
            <span
              style={{
                fontSize: '11px',
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              Grup
            </span>
          ) : (
            <span
              style={{
                fontSize: '11px',
                background: '#f8fafc',
                color: '#475569',
                border: '1px solid #e2e8f0',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              Menu
            </span>
          ),
      },
      {
        header: 'ITEM NAVIGASI',
        accessor: 'namaNavigasi',
        sortable: true,
        render: (item) => (
          <div>
            <strong style={{ color: '#0f172a', fontSize: '0.84rem' }}>{item.namaNavigasi}</strong>
            {item.url && item.url !== '#' && (
              <div style={{ marginTop: '2px' }}>
                <span className="code-tag">{item.url}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        header: 'STATUS',
        accessor: (item) => (item.isActive ? 'Aktif' : 'Nonaktif'),
        width: '110px',
        align: 'center',
        sortable: true,
        render: (item) =>
          item.isActive ? (
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
        render: (item) => (
          <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
            {formatDateTimeWib(item.createdAt)}
          </span>
        ),
      },
      {
        header: 'AKSI',
        width: '120px',
        align: 'center',
        sortable: false,
        render: (item) => (
          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn-table-action btn-table-edit"
              onClick={() => handleOpenEdit(item)}
              title="Edit urutan atau status"
            >
              <i className="fas fa-pen" /> Edit
            </button>
            <button
              type="button"
              className="btn-table-action btn-table-del"
              onClick={() => handleOpenDelete(item)}
              title="Hapus dari peran"
            >
              <i className="fas fa-trash" />
            </button>
          </div>
        ),
      },
    ],
    [handleOpenEdit, handleOpenDelete]
  );

  return (
    <div className="menuroles-container">
      {/* Breadcrumb Bar (Sticky under topbar) */}
      <div className="content-breadcrumb-bar menuroles-breadcrumb-bar">
        <div className="breadcrumb-nav">
          <span className="breadcrumb-current">{pageTitle || 'Kelola Menu Roles'}</span>
          <span className="breadcrumb-separator">/</span>
        </div>
      </div>

      {/* Split Layout: Card Daftar Roles & Card Menu Navigasi Sejajar Dibawah Breadcrumb */}
      <div className="menuroles-split-layout">
        {/* Left Side: Card Daftar Roles */}
        <div className="role-selector-card">
          <div className="role-selector-head">
            <div>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>
                Daftar Roles
              </h4>
            </div>
            <span className="page-stat-chip" style={{ padding: '3px 8px', fontSize: '0.74rem' }}>
              {roles.length} Roles
            </span>
          </div>

          <div className="role-selector-list">
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                <i className="fas fa-spinner fa-spin" style={{ color: '#1A396D', marginRight: '6px' }} />
                <span style={{ fontSize: '0.8rem' }}>Memuat peran...</span>
              </div>
            ) : roles.map((r) => {
              const isSelected = activeRole?.id === r.id;
              const count = roleMenuCountMap[r.id] || 0;
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`role-selector-item ${isSelected ? 'active' : ''}`}
                  onClick={() => handleSelectRole(r)}
                >
                  <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                    <div className="role-item-name" title={r.namaRole} style={{ fontWeight: 700, fontSize: '0.84rem', color: isSelected ? '#1A396D' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.namaRole}
                    </div>
                    <div title={r.deskripsi || ''} style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.deskripsi || `${r.namaRole.toLowerCase().replace(/\s+/g, '_')}`}
                    </div>
                  </div>
                  <span
                    className={`status-pill ${count > 0 ? 'pill-active' : 'pill-inactive'}`}
                    style={{ fontSize: '0.7rem', padding: '2px 7px', flexShrink: 0 }}
                  >
                    {count} Menu
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detail Card Menu Navigasi (Sejajar dengan Card Daftar Roles) */}
        <div className="role-detail-card" style={{ minWidth: 0 }}>
          <div className="role-detail-head">
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>
                Menu Navigasi
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="page-stat-chip">
                <i className="fas fa-list-check" />
                {activeRoleMenuRoles.length} Item
              </span>
              <button
                type="button"
                className="btn-primary-admin"
                onClick={handleOpenCreate}
                disabled={!activeRole}
              >
                <i className="fas fa-plus" /> Tambah Item Navigasi
              </button>
            </div>
          </div>

          <div className="table-responsive" style={{ padding: 0, margin: 0, border: 'none' }}>
            <DataTable
              columns={roleMenuColumns}
              data={activeRoleMenuRoles}
              loading={loading}
              keyField="id"
              defaultPageLength={-1}
              showLengthMenu={false}
              showSearch={false}
              showPagination={false}
              showInfo={false}
              borderless={true}
              emptyHeight="280px"
              emptyText={
                activeRole
                  ? 'Belum ada data yang tersedia.'
                  : 'Pilih peran di sebelah kiri untuk melihat daftar menu navigasi.'
              }
            />
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL TAMBAH / EDIT MENU UNTUK ACTIVE ROLE
          ========================================================================= */}
      {activeRole && (
        <div className={`admin-modal-backdrop ${showModalForm ? 'show' : ''}`}>
          <div className="admin-modal-card" style={{ maxWidth: '540px' }}>
            <div className="admin-modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className={`modal-icon-circle ${isEditing ? 'modal-icon-blue' : 'modal-icon-teal'}`}>
                  <i className={`fas ${isEditing ? 'fa-pen-to-square' : 'fa-plus'}`} />
                </div>
                <div>
                  <h4 className="admin-modal-title">
                    {isEditing ? 'Edit Item Navigasi Peran' : `Daftarkan Menu ke Peran: ${activeRole.namaRole}`}
                  </h4>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8' }}>
                    Konfigurasi wewenang navigasi untuk peran ini
                  </p>
                </div>
              </div>
              <button type="button" className="btn-modal-close" onClick={() => setShowModalForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-content">
                {/* Target Role indicator (Locked) */}
                <div className="form-field-group">
                  <label className="form-field-label">Target Peran (Role)</label>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span className="status-pill pill-role">
                      {activeRole.namaRole}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      (Menu otomatis didaftarkan untuk peran ini)
                    </span>
                  </div>
                </div>

                {/* Tipe Navigasi */}
                <div className="form-field-group">
                  <label className="form-field-label">Tipe Navigasi <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="type-toggle-box">
                    <label className="type-radio-label">
                      <input
                        type="radio"
                        name="targetType"
                        value="menu"
                        checked={formData.type === 'menu'}
                        onChange={() => handleTypeChange('menu')}
                      />
                      <span><i className="fas fa-link" style={{ marginRight: '6px' }} /> Menu Mandiri</span>
                    </label>
                    <label className="type-radio-label">
                      <input
                        type="radio"
                        name="targetType"
                        value="group"
                        checked={formData.type === 'group'}
                        onChange={() => handleTypeChange('group')}
                      />
                      <span><i className="fas fa-folder" style={{ marginRight: '6px' }} /> Grup Dropdown</span>
                    </label>
                  </div>
                </div>

                {/* Pilihan Menu / Grup */}
                {formData.type === 'menu' ? (
                  <div className="form-field-group">
                    <label className="form-field-label">Pilih Menu Navigasi <span style={{ color: '#ef4444' }}>*</span></label>
                    <select
                      className="form-field-select"
                      value={formData.targetId}
                      onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                      required
                    >
                      <option value="">-- Pilih Menu --</option>
                      {menus.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label} ({m.routeUrl})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-field-group">
                    <label className="form-field-label">Pilih Grup Navigasi <span style={{ color: '#ef4444' }}>*</span></label>
                    <select
                      className="form-field-select"
                      value={formData.targetId}
                      onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                      required
                    >
                      <option value="">-- Pilih Grup --</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.subMenus?.length || 0} sub-menu)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Nomor Urut Tampil */}
                <div className="form-field-group">
                  <label className="form-field-label">Urutan Tampil di Sidebar <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="number"
                    className="form-field-input"
                    value={formData.orderIndex}
                    onChange={(e) => setFormData({ ...formData, orderIndex: e.target.value })}
                    min="1"
                    required
                  />
                  <p className="form-field-hint">Angka lebih kecil akan berada di posisi lebih atas pada menu sidebar.</p>
                </div>

                {/* Status Aktif */}
                <div className="form-field-group" style={{ marginTop: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      style={{ width: '16px', height: '16px', accentColor: '#1A396D' }}
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Status Navigasi Aktif</span>
                  </label>
                </div>
              </div>
              <div className="admin-modal-foot">
                <button type="button" className="btn-secondary-admin" onClick={() => setShowModalForm(false)}>Batal</button>
                <button type="submit" className="btn-primary-admin" disabled={submitting}>
                  <i className={`fas ${submitting ? 'fa-spinner fa-spin' : 'fa-check'}`} />
                  {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Daftarkan Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL HAPUS / CABUT MENU DARI ROLE
          ========================================================================= */}
      <div className={`admin-modal-backdrop ${showModalDelete ? 'show' : ''}`}>
        <div className="admin-modal-card" style={{ maxWidth: '440px' }}>
          <div className="admin-modal-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="modal-icon-circle modal-icon-red">
                <i className="fas fa-triangle-exclamation" />
              </div>
              <h4 className="admin-modal-title" style={{ color: '#dc2626' }}>Konfirmasi Cabut Menu</h4>
            </div>
            <button type="button" className="btn-modal-close" onClick={() => setShowModalDelete(false)}>&times;</button>
          </div>
          <div className="admin-modal-content">
            <p style={{ margin: 0, color: '#334155', fontSize: '0.84rem', lineHeight: 1.6 }}>
              Apakah Anda yakin ingin mencabut akses item <strong style={{ color: '#0f172a' }}>{selectedItem?.namaNavigasi}</strong> dari peran <strong style={{ color: '#0f172a' }}>{activeRole?.namaRole}</strong>?
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
              {submitting ? 'Mencabut...' : 'Ya, Cabut Akses'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
