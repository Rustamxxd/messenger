"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { signOut, deleteUser } from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { auth, db, uploadAvatar, updateUserProfile as updateFirebaseProfile } from "../lib/firebase";
import { logout, updateUserProfile as updateReduxProfile } from "@/app/store/userSlice";
import { Modal, message } from "antd";
import { MdDeleteOutline } from "react-icons/md";
import { FaRegSave, FaCamera } from "react-icons/fa";
import { IoExitOutline } from "react-icons/io5";
import styles from "@/styles/EditProfile.module.css";
import LoadingDots from "./LoadingDots";
import { LuInfo } from "react-icons/lu";
import * as Yup from "yup";
import { useFormik } from "formik";

export default function EditProfile() {
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    if (user) {
      setPreview(user.photoURL || null);
    }
  }, [user]);

  const validationSchema = Yup.object({
    displayName: Yup.string()
      .required("Имя обязательно")
      .max(20),
    about: Yup.string().max(70),
  });

  const formik = useFormik({
    initialValues: {
      displayName: user?.displayName || "",
      about: user?.about || "",
    },
    enableReinitialize: true,
    validationSchema,
    onSubmit: async (values) => {
      if (!user) return;
      setLoading(true);

      try {
        let avatarUrl = user.photoURL;

        if (avatar) {
          avatarUrl = await uploadAvatar(avatar);
        }

        await updateFirebaseProfile(user.uid, {
          displayName: values.displayName,
          about: values.about,
          photoURL: avatarUrl,
        });

        dispatch(updateReduxProfile({
          displayName: values.displayName,
          about: values.about,
          photoURL: avatarUrl,
        }));

        setShowSnackbar(true);
        setTimeout(() => setShowSnackbar(false), 3000);
      } catch (error) {
        console.error("Ошибка обновления профиля:", error);
        setShowSnackbar("Ошибка при сохранении");
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
      router.push("/login");

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
      {showSnackbar && (
        <div className={styles.snackbar}>
          <LuInfo className={styles.snackbarIcon} />
          Профиль успешно обновлён!
        </div>
      )}

      <h1 className={styles.title}>Редактировать профиль</h1>

      <div className={styles.avatarWrapper}>
        <img src={preview} alt="Avatar" className={styles.avatar} />
        <label className={styles.uploadLabel}>
          <FaCamera />
          Изменить фото
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </label>
      </div>

      <form onSubmit={formik.handleSubmit} className={styles.form}>
      {formik.touched.displayName && formik.errors.displayName && (
          <div className={styles.error}>{formik.errors.displayName}</div>
        )}
        <input
          type="text"
          name="displayName"
          value={formik.values.displayName}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder="Имя пользователя"
          maxLength={20}
          className={styles.input}
        />

        {formik.touched.about && formik.errors.about && (
          <div className={styles.error}>{formik.errors.about}</div>
        )}
        
        <div className={styles.textareaWrapper}>
          <textarea
            name="about"
            placeholder="О себе"
            value={formik.values.about}
            onChange={(e) => {
              if (e.target.value.length <= 70) {
                formik.handleChange(e);
              }
            }}
            onBlur={formik.handleBlur}
            className={styles.textarea}
          />
          <div className={styles.charCount}>
            {70 - formik.values.about.length}
          </div>
        </div>
        

        <button
          type="submit"
          disabled={loading}
          className={styles.button}
        >
          <FaRegSave /> {loading ? "Сохранение" : "Сохранить"}
          {loading && <LoadingDots />}
        </button>
      </form>

      <button onClick={handleLogout} className={styles.logoutButton}>
        <IoExitOutline /> Выйти
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
        <p className={styles.confirm}>
          Вы уверены, что хотите удалить аккаунт? <br />
          Это действие необратимо.
        </p>
      </Modal>
    </div>
  );
}