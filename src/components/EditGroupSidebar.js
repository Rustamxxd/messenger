import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/CreateaGroupSidebar.module.css";
import { MdOutlineAddAPhoto } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { useFormik } from "formik";
import * as Yup from "yup";
import { doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db, uploadAvatar, uploadGroupAvatar } from "@/lib/firebase";
import LoadingDots from "./LoadingDots";
import { LuInfo } from "react-icons/lu";
import { MdMoreVert } from "react-icons/md";
import { useSelector } from 'react-redux';
import ContextMenu from './ContextMenu';
import chatWindowStyles from '@/styles/ChatWindow.module.css';

export default function EditGroupSidebar({ group, onClose }) {
  const fileInputRef = useRef();
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(group.photoURL || null);
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [sidebarOpening, setSidebarOpening] = useState(false);
  const [sidebarClosing, setSidebarClosing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteModalOpening, setDeleteModalOpening] = useState(false);
  const [deleteModalClosing, setDeleteModalClosing] = useState(false);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [members, setMembers] = useState([]);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, user: null });
  const [menuAnim, setMenuAnim] = useState(false);
  const menuRef = useRef(null);
  const user = useSelector((state) => state.user.user);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeModalOpening, setRemoveModalOpening] = useState(false);
  const [removeModalClosing, setRemoveModalClosing] = useState(false);
  const [pendingRemoveUser, setPendingRemoveUser] = useState(null);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [ownerModalOpening, setOwnerModalOpening] = useState(false);
  const [ownerModalClosing, setOwnerModalClosing] = useState(false);
  const [pendingOwnerUser, setPendingOwnerUser] = useState(null);
  const [showModeratorModal, setShowModeratorModal] = useState(false);
  const [moderatorModalOpening, setModeratorModalOpening] = useState(false);
  const [moderatorModalClosing, setModeratorModalClosing] = useState(false);
  const [pendingModeratorUser, setPendingModeratorUser] = useState(null);
  const [pendingModeratorAction, setPendingModeratorAction] = useState(null); // 'add' | 'remove'

  useEffect(() => {
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

  useEffect(() => {
    setPreview(group.photoURL || null);
  }, [group.photoURL]);

  useEffect(() => {
    async function fetchMembers() {
      if (!group?.members || group.members.length === 0) {
        setMembers([]);
        return;
      }
      const membersData = await Promise.all(
        group.members.map(async (m) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', m.id));
            const userData = userDoc.exists() ? userDoc.data() : {};
            return {
              ...m,
              displayName: userData.displayName || m.displayName,
              photoURL: userData.photoURL || m.photoURL || null,
            };
          } catch {
            return { ...m };
          }
        })
      );
      setMembers(membersData);
    }
    fetchMembers();
  }, [group?.members]);

  // Контекстное меню: закрытие по клику вне и Escape
  useEffect(() => {
    if (!contextMenu.visible) return;
    setTimeout(() => setMenuAnim(true), 10);
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAnim(false);
        setTimeout(() => setContextMenu({ ...contextMenu, visible: false }), 200);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setMenuAnim(false);
        setTimeout(() => setContextMenu({ ...contextMenu, visible: false }), 200);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [contextMenu]);

  // Позиционирование меню (чтобы не выходило за экран)
  const getMenuPosition = () => {
    if (!contextMenu.visible) return { top: 0, left: 0 };
    const menuWidth = 180, menuHeight = 100;
    let left = contextMenu.x;
    let top = contextMenu.y;
    // Если меню выходит за верх/низ экрана
    if (top + menuHeight > window.innerHeight - 8) top = window.innerHeight - menuHeight - 8;
    if (top < 8) top = 8;
    // left уже вычислен для появления слева
    return { top, left };
  };

  const handleRemoveUser = async (userId) => {
    setMenuAnim(false);
    setTimeout(() => setContextMenu({ ...contextMenu, visible: false }), 200);
    setShowRemoveModal(false);
    setPendingRemoveUser(null);
    // Firestore: удаление пользователя из группы
    try {
      const groupRef = doc(db, "chats", group.id);
      const groupSnap = await getDoc(groupRef);
      const groupData = groupSnap.data();
      const updatedMembers = groupData.members.filter(m => m.id !== userId);
      await updateDoc(groupRef, { members: updatedMembers });
    } catch (error) {
      alert("Ошибка при удалении пользователя: " + (error.message || error));
    }
  };

  const handleMakeOwner = async (userId) => {
    setMenuAnim(false);
    setTimeout(() => setContextMenu({ ...contextMenu, visible: false }), 200);
    setShowOwnerModal(false);
    setPendingOwnerUser(null);
    // Firestore: назначение нового владельца
    try {
      const groupRef = doc(db, "chats", group.id);
      const groupSnap = await getDoc(groupRef);
      const groupData = groupSnap.data();
      const updatedMembers = groupData.members.map(m =>
        m.id === userId ? { ...m, role: "owner" } :
        m.role === "owner" ? { ...m, role: "member" } : m
      );
      await updateDoc(groupRef, { members: updatedMembers, ownerId: userId });
      // Если текущий пользователь больше не владелец — закрыть EditGroupSidebar
      if (user.uid !== userId) {
        handleClose();
      }
    } catch (error) {
      alert("Ошибка при назначении владельца: " + (error.message || error));
    }
  };

  const handleOpenOwnerModal = (userId) => {
    setShowOwnerModal(true);
    setOwnerModalOpening(false);
    setOwnerModalClosing(false);
    setPendingOwnerUser(userId);
    setTimeout(() => setOwnerModalOpening(true), 0);
  };

  const handleCloseOwnerModal = () => {
    setOwnerModalClosing(true);
    setOwnerModalOpening(false);
  };

  const handleOwnerModalTransitionEnd = () => {
    if (ownerModalClosing) {
      setShowOwnerModal(false);
      setOwnerModalClosing(false);
      setOwnerModalOpening(false);
      setPendingOwnerUser(null);
    }
  };

  // Проверка: может ли текущий пользователь назначать модераторов
  const currentUserRole = user ? (members.find(m => m.id === user.uid)?.role) : null;
  const canManageModerators = currentUserRole === 'owner';
  const canRemoveUsers = currentUserRole === 'owner' || currentUserRole === 'moderator';
  const canManageOwners = currentUserRole === 'owner';
  const canDeleteGroup = currentUserRole === 'owner';

  const handleToggleModerator = async (userId, isModerator) => {
    setMenuAnim(false);
    setTimeout(() => setContextMenu({ ...contextMenu, visible: false }), 200);
    setShowModeratorModal(false);
    setPendingModeratorUser(null);
    setPendingModeratorAction(null);
    // Firestore update
    const groupRef = doc(db, "chats", group.id);
    const groupSnap = await getDoc(groupRef);
    const groupData = groupSnap.data();
    const updatedMembers = groupData.members.map(m =>
      m.id === userId ? { ...m, role: isModerator ? "member" : "moderator" } : m
    );
    await updateDoc(groupRef, { members: updatedMembers });
  };

  const handleOpenModeratorModal = (userId, isModerator) => {
    setShowModeratorModal(true);
    setModeratorModalOpening(false);
    setModeratorModalClosing(false);
    setPendingModeratorUser(userId);
    setPendingModeratorAction(isModerator ? 'remove' : 'add');
    setTimeout(() => setModeratorModalOpening(true), 0);
  };

  const handleCloseModeratorModal = () => {
    setModeratorModalClosing(true);
    setModeratorModalOpening(false);
  };

  const handleModeratorModalTransitionEnd = () => {
    if (moderatorModalClosing) {
      setShowModeratorModal(false);
      setModeratorModalClosing(false);
      setModeratorModalOpening(false);
      setPendingModeratorUser(null);
      setPendingModeratorAction(null);
    }
  };

  const formik = useFormik({
    initialValues: {
      name: group.name || "",
      description: group.description || "",
    },
    enableReinitialize: true,
    validationSchema: Yup.object({
      name: Yup.string().required("Введите название группы").max(64, "Максимум 64 символа"),
      description: Yup.string().max(255, "Максимум 255 символов"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        let photoURL = group.photoURL;
        if (avatar) {
          photoURL = await uploadGroupAvatar(avatar, group.id);
        } else if (avatarRemoved) {
          photoURL = '/assets/default-group.png';
        }
        const groupRef = doc(db, "chats", group.id);
        await updateDoc(groupRef, {
          name: values.name,
          description: values.description,
          photoURL,
          isGroup: true,
        });
        setShowSnackbar(true);
        setTimeout(() => {
          setShowSnackbar(false);
          handleClose();
        }, 2000);
      } catch (error) {
        alert("Ошибка при сохранении: " + (error.message || error));
      } finally {
        setLoading(false);
      }
    },
  });

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
      setAvatarRemoved(false);
    }
  };

  // --- Delete group modal logic ---
  const handleOpenDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteModalClosing(false);
    setDeleteModalOpening(false);
    setShowDeleteModal(true);
    setTimeout(() => {
      setDeleteModalOpening(true);
    }, 0);
  };
  const handleCloseDeleteModal = () => {
    setDeleteModalClosing(true);
    setDeleteModalOpening(false);
  };
  const handleDeleteModalTransitionEnd = async (e) => {
    if (deleteModalClosing && e.propertyName === 'opacity') {
      setShowDeleteModal(false);
      setDeleteModalClosing(false);
      setDeleteModalOpening(false);
    }
  };
  const handleDeleteGroup = async () => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, "chats", group.id));
      setShowDeleteModal(false);
      setDeleteModalClosing(false);
      handleClose();
      // Можно добавить window.location.reload() или редирект
    } catch (error) {
      alert("Ошибка при удалении: " + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRemoveModal = (userId) => {
    setShowRemoveModal(true);
    setRemoveModalOpening(false);
    setRemoveModalClosing(false);
    setPendingRemoveUser(userId);
    setTimeout(() => setRemoveModalOpening(true), 0);
  };

  const handleCloseRemoveModal = () => {
    setRemoveModalClosing(true);
    setRemoveModalOpening(false);
  };

  const handleRemoveModalTransitionEnd = () => {
    if (removeModalClosing) {
      setShowRemoveModal(false);
      setRemoveModalClosing(false);
      setRemoveModalOpening(false);
      setPendingRemoveUser(null);
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
      {showSnackbar && (
        <div
          className={styles.snackbar}
          style={{
            position: 'fixed',
            left: '50%',
            top: 50,
            transform: 'translateX(-50%)',
            background: 'rgba(40, 40, 40, 0.95)',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: 16,
            fontSize: '1.08rem',
            boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'snackbar-fadein-top 0.25s, snackbar-fadeout-top 0.25s 1.25s',
            pointerEvents: 'none',
          }}
        >
          <LuInfo className={styles.snackbarIcon} />
          Группа успешно обновлена!
        </div>
      )}
      <button className={styles.backBtn} onClick={handleClose}><FaArrowLeft /></button>
      <h2 className={styles.createGroupTitle}>Изменить</h2>
      <div className={styles.createGroupAvatarWrapper}>
        <button
          className={styles.createGroupAvatarBtn}
          onClick={() => fileInputRef.current.click()}
          type="button"
        >
          {preview ? (
            <img src={preview} alt="avatar" className={styles.createGroupAvatarImg} />
          ) : (
            <img src="/assets/default-group.png" alt="avatar" className={styles.createGroupAvatarImg} />
          )}
        </button>
        {preview && (
          <button
            type="button"
            className={styles.createGroupAvatarRemoveBtn}
            onClick={e => { e.stopPropagation(); setAvatar(null); setPreview(null); setAvatarRemoved(true); }}
            title="Убрать аватарку"
          >
            <IoMdClose />
          </button>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
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
              (formik.values.name ? " " + styles.floatingLabelActive : "")
            }
            htmlFor="groupName"
          >
            Название группы
          </label>
          <input
            className={styles.createGroupInput}
            id="groupName"
            name="name"
            type="text"
            value={formik.values.name}
            onChange={formik.handleChange}
            maxLength={64}
            autoComplete="off"
          />
          <div style={{ position: 'absolute', bottom: '-9px', right: '12px', fontSize: '12px', color: '#666', background: 'white', padding: '2px 6px', borderRadius: '4px' }}>
            {64 - formik.values.name.length}
          </div>
        </div>
        <div style={{ position: "relative", width: "100%" }}>
          <label
            className={
              styles.floatingLabel +
              (formik.values.description ? " " + styles.floatingLabelActive : "")
            }
            htmlFor="groupDescription"
          >
            Информация
          </label>
          <textarea
            className={styles.createGroupTextarea}
            id="groupDescription"
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            maxLength={255}
          />
          <div className={styles.charCount}>{255 - formik.values.description.length}</div>
          {formik.touched.description && formik.errors.description && (
            <div className={styles.error}>{formik.errors.description}</div>
          )}
        </div>
        <div>
          <div className={styles.createGroupMembersCount}>
            {members.length} участник{members.length === 1 ? '' : members.length < 5 && members.length > 1 ? 'а' : 'ов'}
          </div>
          <div className={styles.createGroupMembersList}>
            {members.length > 0 ? members.map(u => {
              const isModerator = u.role === 'moderator';
              return (
                <div key={u.id} className={styles.createGroupMemberItem}>
                  <img src={u.photoURL || '/assets/default-avatar.png'} alt="avatar" className={styles.createGroupMemberAvatar} />
                  <span className={styles.createGroupMemberName}>{u.displayName || 'Без имени'}</span>
                  {u.role === 'owner' && <span style={{ color: '#2196f3', fontSize: 13, marginLeft: 8 }}>Владелец</span>}
                  {isModerator && <span style={{ color: '#2196f3', fontSize: 13, marginLeft: 8 }}>Модератор</span>}
                  {user && u.id !== user.uid && !(currentUserRole === 'moderator' && (u.role === 'owner' || u.role === 'moderator')) && (
                    <button
                      type="button"
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', position: 'relative' }}
                      onClick={e => {
                        // Появление меню слева от кнопки
                        const menuWidth = 180;
                        let left = e.clientX - menuWidth;
                        if (left < 8) left = 8;
                        setContextMenu({ visible: true, x: left, y: e.clientY, user: u });
                        setMenuAnim(false);
                      }}
                    >
                      <MdMoreVert size={22} color="#888" />
                    </button>
                  )}
                </div>
              );
            }) : (
              <div style={{ color: '#888', padding: '12px 0', textAlign: 'center' }}>Нет участников</div>
            )}
          </div>
        </div>
        <div className={styles.createGroupBtnRowFixed}>
          <button className={styles.createGroupCreateBtn} type="submit" disabled={loading}>
            {loading ? <LoadingDots /> : "Сохранить"}
          </button>
          {canDeleteGroup && (
            <button
              className={styles.createGroupDeleteBtn}
              type="button"
              onClick={handleOpenDeleteModal}
              disabled={loading}
            >
              Удалить группу
            </button>
          )}
        </div>
      </form>

      {showDeleteModal && (
        <div
          className={
            styles.customModalOverlay + ' ' +
            (deleteModalClosing
              ? styles.modalClosed
              : deleteModalOpening
                ? styles.modalOpen
                : styles.modalClosed)
          }
        >
          <div
            className={styles.customModal}
            onTransitionEnd={handleDeleteModalTransitionEnd}
          >
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle2}>Удалить группу</p>
              <div className={styles.modalDesc2}>
                Вы точно хотите удалить <b>{group?.name || 'группу'}</b>?
              </div>
            </div>
            <div className={styles.modalBtnRow}>
              <button
                className={styles.modalBtn2 + ' ' + styles.modalBtnDanger2}
                onClick={handleDeleteGroup}
                disabled={loading}
              >
                УДАЛИТЬ ГРУППУ
              </button>
              <button
                className={styles.modalBtn2 + ' ' + styles.modalBtnCancel2}
                onClick={handleCloseDeleteModal}
                disabled={loading}
              >
                ОТМЕНА
              </button>
            </div>
          </div>
        </div>
      )}

      {contextMenu.visible && contextMenu.user && (
        <ul
          ref={menuRef}
          className={
            chatWindowStyles.contextMenu +
            ' ' + (menuAnim ? chatWindowStyles.contextMenuVisible : chatWindowStyles.contextMenuHidden)
          }
          style={{
            top: getMenuPosition().top,
            left: getMenuPosition().left,
            minWidth: 180,
            zIndex: 3000,
          }}
        >
          {canRemoveUsers && (
            <li
              onClick={() => handleOpenRemoveModal(contextMenu.user.id)}
            >
              <span className={chatWindowStyles.contextItem} style={{ color: '#d11616' }}>
                Удалить пользователя
              </span>
            </li>
          )}
          {canManageOwners && (
            <li
              onClick={() => handleOpenOwnerModal(contextMenu.user.id)}
            >
              <span className={chatWindowStyles.contextItem} style={{ color: '#2196f3' }}>
                Назначить владельцем
              </span>
            </li>
          )}
          {canManageModerators && contextMenu.user.id !== user.uid && (
            <li
              onClick={() => handleOpenModeratorModal(contextMenu.user.id, contextMenu.user.role === 'moderator')}
            >
              <span className={chatWindowStyles.contextItem} style={{ color: '#1976d2' }}>
                {contextMenu.user.role === 'moderator' ? 'Снять модератора' : 'Назначить модератором'}
              </span>
            </li>
          )}
        </ul>
      )}

      {showRemoveModal && (
        <div
          className={
            styles.customModalOverlay + ' ' +
            (removeModalClosing
              ? styles.modalClosed
              : removeModalOpening
                ? styles.modalOpen
                : styles.modalClosed)
          }
        >
          <div
            className={styles.customModal}
            onTransitionEnd={handleRemoveModalTransitionEnd}
          >
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle2}>Удалить пользователя</p>
              <div className={styles.modalDesc2}>
                Вы точно хотите удалить этого пользователя из группы?
              </div>
            </div>
            <div className={styles.modalBtnRow}>
              <button
                className={styles.modalBtn2 + ' ' + styles.modalBtnDanger2}
                onClick={() => handleRemoveUser(pendingRemoveUser)}
              >
                УДАЛИТЬ
              </button>
              <button
                className={styles.modalBtn2 + ' ' + styles.modalBtnCancel2}
                onClick={handleCloseRemoveModal}
              >
                ОТМЕНА
              </button>
            </div>
          </div>
        </div>
      )}

      {showOwnerModal && (
        <div
          className={
            styles.customModalOverlay + ' ' +
            (ownerModalClosing
              ? styles.modalClosed
              : ownerModalOpening
                ? styles.modalOpen
                : styles.modalClosed)
          }
        >
          <div
            className={styles.customModal}
            onTransitionEnd={handleOwnerModalTransitionEnd}
          >
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle2}>Назначить владельцем</p>
              <div className={styles.modalDesc2}>
                Вы точно хотите назначить этого пользователя владельцем группы?
              </div>
            </div>
            <div className={styles.modalBtnRow}>
              <button
                className={styles.modalBtn2 + ' ' + styles.modalBtnDanger2}
                onClick={() => handleMakeOwner(pendingOwnerUser)}
              >
                НАЗНАЧИТЬ
              </button>
              <button
                className={styles.modalBtn2 + ' ' + styles.modalBtnCancel2}
                onClick={handleCloseOwnerModal}
              >
                ОТМЕНА
              </button>
            </div>
          </div>
        </div>
      )}

      {showModeratorModal && (
        <div
          className={
            styles.customModalOverlay + ' ' +
            (moderatorModalClosing
              ? styles.modalClosed
              : moderatorModalOpening
                ? styles.modalOpen
                : styles.modalClosed)
          }
        >
          <div
            className={styles.customModal}
            onTransitionEnd={handleModeratorModalTransitionEnd}
          >
            <div className={styles.modalHeader}>
              <p className={styles.modalTitle2}>{pendingModeratorAction === 'add' ? 'Назначить модератором' : 'Снять модератора'}</p>
              <div className={styles.modalDesc2}>
                {pendingModeratorAction === 'add'
                  ? 'Вы точно хотите назначить этого пользователя модератором?'
                  : 'Вы точно хотите снять этого пользователя с роли модератора?'}
              </div>
            </div>
            <div className={styles.modalBtnRow}>
              <button
                className={styles.modalBtn2 + ' ' + styles.modalBtnDanger2}
                onClick={() => handleToggleModerator(pendingModeratorUser, pendingModeratorAction === 'remove')}
              >
                {pendingModeratorAction === 'add' ? 'НАЗНАЧИТЬ' : 'СНЯТЬ'}
              </button>
              <button
                className={styles.modalBtn2 + ' ' + styles.modalBtnCancel2}
                onClick={handleCloseModeratorModal}
              >
                ОТМЕНА
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
} 