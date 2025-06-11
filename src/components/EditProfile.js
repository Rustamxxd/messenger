"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { signOut, deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { auth, db, uploadAvatar, updateUserProfile as updateFirebaseProfile } from "../lib/firebase";
import { logout, updateUserProfile as updateReduxProfile } from "@/app/store/userSlice";
import { Modal, message } from "antd";
import { MdDeleteOutline, MdAddAPhoto } from "react-icons/md";
import { FaRegSave } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";
import styles from "@/styles/EditProfile.module.css";

export default function EditProfile() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [displayName, setDisplayName] = useState("");
  const [about, setAbout] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setAbout(user.about || "");
      setPreview(user.photoURL || null);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    if (!user) return;
    setLoading(true);
  
    try {
      let avatarUrl = user.photoURL;
  
      if (avatar) {
        avatarUrl = await uploadAvatar(avatar);
      }
  
      await updateFirebaseProfile(user.uid, {
        displayName: displayName,
        about,
        photoURL: avatarUrl,
      });
  
      dispatch(updateReduxProfile({
        displayName: displayName,
        about,
        photoURL: avatarUrl,
      }));
  
      setSuccessMessage("Профиль успешно обновлён!");
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Ошибка обновления профиля:", error);
      setSuccessMessage("Ошибка при сохранении");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      router.push("/login");
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };
  
 const showDeleteModal = () => setIsDeleteModalVisible(true);
  const handleCancelDelete = () => setIsDeleteModalVisible(false);

  const handleConfirmDelete = async () => {
    try {
      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);
      await deleteUser(auth.currentUser);

      dispatch(logout());
      router.push("/register");

      message.success("Аккаунт удалён");
    } catch (error) {
      console.error("Ошибка при удалении:", error);
      message.error("Ошибка удаления. Возможно, нужно повторно войти.");
    } finally {
      setIsDeleteModalVisible(false);
    }
  };



  return (
    <div className={styles.container}>
      {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

      <h1 className={styles.title}>Редактировать профиль</h1>

      <div className={styles.avatarWrapper}>
        {preview && <img src={preview} className={styles.avatar} />}
        <label className={styles.uploadLabel}>
        <input type="file" onChange={handleAvatarChange} accept="image/*" hidden />
      <MdAddAPhoto />  Выбрать аватар
      </label>
      </div>

      <input
        type="text"
        placeholder="Никнейм"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        className={styles.input}
      />

      <textarea
        placeholder="О себе"
        value={about}
        onChange={(e) => setAbout(e.target.value)}
        className={styles.textarea}
      />

      <button
        onClick={handleSaveChanges}
        disabled={loading}
        className={styles.button}
      >
        <FaRegSave /> {loading ? "Сохранение..." : "Сохранить"}
      </button>

      <button onClick={handleLogout} className={styles.logoutButton}>
        <CiLogout /> Выйти
      </button>

      <button onClick={showDeleteModal} className={styles.deleteButton}>
        <MdDeleteOutline /> Удалить аккаунт
      </button>

      <Modal
        title="Удалить аккаунт"
        open={isDeleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        <p className={styles.confirm}>Вы уверены, что хотите удалить аккаунт? <br></br> Это действие необратимо.</p>
      </Modal>

    </div>
  );
}
