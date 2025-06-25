import React, { useRef, useState } from 'react';
import styles from '@/styles/CreateaGroupSidebar.module.css';
import { MdOutlineAddAPhoto } from "react-icons/md";
import { IoMdClose } from 'react-icons/io';
import { useFormik } from 'formik';
import * as Yup from 'yup';

export default function CreateGroupSidebar({ users, groupName, setGroupName, setGroupAvatar, groupAvatarPreview, setGroupAvatarPreview, groupDescription, setGroupDescription, onClose, onCreate }) {
  const fileInputRef = useRef();
  const [isFocused, setIsFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [sidebarOpening, setSidebarOpening] = useState(false);
  const [sidebarClosing, setSidebarClosing] = useState(false);

  React.useEffect(() => {
    setSidebarOpening(false);
    setTimeout(() => setSidebarOpening(true), 0);
  }, []);

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

  const formik = useFormik({
    initialValues: {
      name: groupName || '',
      description: groupDescription || '',
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required('Введите название группы').max(64, 'Максимум 64 символа'),
      description: Yup.string().max(255, 'Максимум 255 символов'),
    }),
    onSubmit: (values) => {
      setGroupName(values.name);
      setGroupDescription(values.description);
      onCreate(values.description);
    },
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGroupAvatar(file);
      setGroupAvatarPreview(URL.createObjectURL(file));
    }
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
      onTransitionEnd={handleSidebarTransitionEnd}
    >
      <button className={styles.closeBtn} onClick={handleClose}>×</button>
      <h2 className={styles.createGroupTitle}>Создать группу</h2>
      <div className={styles.createGroupAvatarWrapper}>
        <button
          className={styles.createGroupAvatarBtn}
          onClick={() => fileInputRef.current.click()}
          type="button"
        >
          {groupAvatarPreview ? (
            <img src={groupAvatarPreview} alt="avatar" className={styles.createGroupAvatarImg} />
          ) : (
            <img src="/assets/default-group.png" alt="avatar" className={styles.createGroupAvatarImg} />
          )}
        </button>
        {groupAvatarPreview && (
          <button
            type="button"
            className={styles.createGroupAvatarRemoveBtn}
            onClick={e => { e.stopPropagation(); setGroupAvatar(null); setGroupAvatarPreview(null); }}
            title="Убрать аватарку"
          >
            <IoMdClose />
          </button>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
      </div>
      <form onSubmit={formik.handleSubmit}>
        {formik.touched.name && formik.errors.name && (
          <div className={styles.error}>{formik.errors.name}</div>
        )}
        <div className={styles.floatingInputWrapper}>
          <label
            className={
              styles.floatingLabel +
              ((isFocused || formik.values.name) ? ' ' + styles.floatingLabelActive : '')
            }
            htmlFor="groupName"
          >Название группы</label>
          <input
            className={styles.createGroupInput}
            id="groupName"
            name="name"
            type="text"
            value={formik.values.name}
            onChange={formik.handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={e => { formik.handleBlur(e); setIsFocused(false); }}
            maxLength={64}
            autoComplete="off"
          />
          <div style={{ position: 'absolute', bottom: '-9px', right: '12px', fontSize: '12px', color: '#666', background: 'white', padding: '2px 6px', borderRadius: '4px' }}>
            {64 - formik.values.name.length}</div>
        </div>
        <div style={{ position: 'relative', width: '100%' }}>
          <label
            className={
              styles.floatingLabel +
              ((descFocused || formik.values.description) ? ' ' + styles.floatingLabelActive : '')
            }
            htmlFor="groupDescription"
          >Информация</label>
          <textarea
            className={styles.createGroupTextarea}
            id="groupDescription"
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            onFocus={() => setDescFocused(true)}
            onBlur={e => { formik.handleBlur(e); setDescFocused(false); }}
            maxLength={255}
          />
          <div className={styles.charCount}>{255 - formik.values.description.length}</div>
          {formik.touched.description && formik.errors.description && (
            <div className={styles.error}>{formik.errors.description}</div>
          )}
        </div>
        <div className={styles.createGroupMembersCount}>{users.length} участник{users.length === 1 ? '' : users.length < 5 ? 'а' : 'ов'}</div>
        <div className={styles.createGroupMembersList}>
          {users.map(u => (
            <div key={u.uid} className={styles.createGroupMemberItem}>
              <img src={u.photoURL} alt="avatar" className={styles.createGroupMemberAvatar} />
              <span className={styles.createGroupMemberName}>{u.displayName}</span>
            </div>
          ))}
        </div>
        <div className={styles.createGroupBtnRowFixed}>
          <button className={styles.createGroupCreateBtn} type="submit" disabled={!formik.values.name || users.length < 2}>Создать</button>
          <button className={styles.createGroupCancelBtn} type="button" onClick={handleClose}>Отмена</button>
        </div>
      </form>
    </aside>
  );
} 