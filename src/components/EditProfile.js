"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "firebase/auth";

import { auth, uploadAvatar, updateUserProfile as updateFirebaseProfile } from "../lib/firebase";
import { logout, updateUserProfile as updateReduxProfile } from "@/app/store/userSlice";

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
        router.push("/profile");
      }, 2000);
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

  return (
    <div className={styles.container}>
      {successMessage && <p className={styles.successMessage}>{successMessage}</p>}

      <h1 className={styles.title}>Редактировать профиль</h1>

      <div className={styles.avatarWrapper}>
        {preview && <img src={preview} alt="Аватар" className={styles.avatar} />}
        <input type="file" onChange={handleAvatarChange} />
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
        {loading ? "Сохранение..." : "Сохранить"}
      </button>

      <button onClick={handleLogout} className={styles.logoutButton}>
        Выйти
      </button>
    </div>
  );
}
