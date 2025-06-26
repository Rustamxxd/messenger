import React, { useState, useEffect } from 'react';
import styles from '@/styles/CreateaGroupSidebar.module.css';
import { Checkbox, Spin } from 'antd';

export default function UserSelectSidebar({ open, onClose, users, loading, onSelect, existingIds = [] }) {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [sidebarOpening, setSidebarOpening] = useState(false);
  const [sidebarClosing, setSidebarClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setSidebarOpening(false);
      setTimeout(() => setSidebarOpening(true), 0);
    }
  }, [open]);

  const handleSidebarTransitionEnd = (e) => {
    if (sidebarClosing && e.propertyName === 'right') {
      setSidebarClosing(false);
      onClose();
    }
  };

  const handleClose = () => {
    setSidebarClosing(true);
    setSidebarOpening(false);
  };

  const filteredUsers = users.filter(u =>
    (u.displayName || '').toLowerCase().includes(search.toLowerCase()) && !existingIds.includes(u.uid)
  );

  const toggleUser = (u) => {
    setSelected(prev =>
      prev.some(sel => sel.uid === u.uid)
        ? prev.filter(sel => sel.uid !== u.uid)
        : [...prev, u]
    );
  };

  return (
    <aside
      className={
        styles.createGroupSidebar + ' ' +
        (sidebarClosing
          ? styles.sidebarClosed
          : sidebarOpening
            ? styles.sidebarOpen
            : styles.sidebarClosed)
      }
      style={{ zIndex: 3002 }}
      onTransitionEnd={handleSidebarTransitionEnd}
    >
      <button className={styles.closeBtn} onClick={handleClose}>×</button>
      <h2 className={styles.createGroupTitle}>Добавить участников</h2>
      <input
        className={styles.createGroupInput}
        type="text"
        placeholder="Поиск пользователей..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 18, width: '100%' }}
      />
      <div className={styles.createGroupMembersList} style={{ minHeight: 200 }}>
        {loading ? (
          <div style={{ color: '#888', textAlign: 'center', padding: 24 }}><Spin size="large" /></div>
        ) : filteredUsers.length > 0 ? filteredUsers.map(u => (
          <div key={u.uid} className={styles.createGroupMemberItem} style={{ cursor: 'pointer', padding: '5px' }} onClick={() => toggleUser(u)}>
            <img src={u.photoURL || '/assets/default-avatar.png'} alt="avatar" className={styles.createGroupMemberAvatar} />
            <span className={styles.createGroupMemberName}>{u.displayName}</span>
            <Checkbox checked={selected.some(sel => sel.uid === u.uid)} style={{ marginLeft: 'auto', scale: 1.1, marginRight: '3px'}} />
          </div>
        )) : (
          <div style={{ color: '#888', textAlign: 'center', padding: 24 }}>Нет пользователей</div>
        )}
      </div>
      <div className={styles.createGroupBtnRowFixed}>
        <button
          className={styles.createGroupCreateBtn}
          type="button"
          disabled={selected.length === 0}
          onClick={() => { onSelect(selected); setSelected([]); }}
        >
          Добавить
        </button>
        <button className={styles.createGroupCancelBtn} type="button" onClick={handleClose}>Отмена</button>
      </div>
    </aside>
  );
} 