import React, { useState, useRef, useEffect } from "react";
import styles from "@/styles/CreateaGroupSidebar.module.css";
import { MdOutlineAddAPhoto } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { useFormik } from "formik";
import * as Yup from "yup";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, uploadAvatar, uploadGroupAvatar } from "@/lib/firebase";
import LoadingDots from "./LoadingDots";
import { LuInfo } from "react-icons/lu";

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
        <div className={styles.createGroupBtnRowFixed}>
          <button className={styles.createGroupCreateBtn} type="submit" disabled={loading}>
            {loading ? <LoadingDots /> : "Сохранить"}
          </button>
          <button
            className={styles.createGroupDeleteBtn}
            type="button"
            onClick={handleOpenDeleteModal}
            disabled={loading}
          >
            Удалить группу
          </button>
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
    </aside>
  );
} 