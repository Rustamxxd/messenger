"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { uploadAvatar } from "@/lib/firebase";
import {
  updateGroupProfile,
  removeGroupMember,
  promoteGroupMember,
} from "@/app/store/groupSlice";

import styles from "@/styles/EditProfile.module.css";

export default function EditGroup({ groupId }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const group = useSelector((state) =>
    state.groups.list.find((g) => g.id === groupId)
  );
  const currentUser = useSelector((state) => state.user.user);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description || "");
      setPreview(group.photoURL || null);
    }
  }, [group]);

  const isOwner = group?.ownerId === currentUser?.uid;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveChanges = async () => {
    if (!group) return;
    setLoading(true);
    try {
      let avatarUrl = group.photoURL;
      if (avatar) {
        avatarUrl = await uploadAvatar(avatar);
      }

      dispatch(
        updateGroupProfile({
          id: group.id,
          name,
          description,
          photoURL: avatarUrl,
        })
      );

      setSuccessMessage("Группа успешно обновлена!");
      setTimeout(() => {
        setSuccessMessage("");
        router.push(`/group/${group.id}`);
      }, 2000);
    } catch (e) {
      console.error(e);
      setSuccessMessage("Ошибка при обновлении");
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = (memberId) => {
    dispatch(promoteGroupMember({ groupId: group.id, userId: memberId }));
  };

  const handleRemove = (memberId) => {
    dispatch(removeGroupMember({ groupId: group.id, userId: memberId }));
  };

  return (
    <div className={styles.container}>
      {successMessage && (
        <p className={styles.successMessage}>{successMessage}</p>
      )}

      <h1 className={styles.title}>Редактировать группу</h1>

      <div className={styles.avatarWrapper}>
        {preview && (
          <img src={preview} alt="Аватар" className={styles.avatar} />
        )}
        <input type="file" onChange={handleAvatarChange} />
      </div>

      <input
        type="text"
        placeholder="Название группы"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.input}
      />

      <textarea
        placeholder="Описание"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={styles.textarea}
      />

      <button
        onClick={handleSaveChanges}
        disabled={loading}
        className={styles.button}
      >
        {loading ? "Сохранение..." : "Сохранить"}
      </button>

      <h2 className={styles.title} style={{ marginTop: 30 }}>
        Участники
      </h2>

      {group?.members?.map((member) => (
        <div key={member.id} className={styles.memberItem}>
          <span>{member.displayName}</span>
          <span className={styles.role}>
            {member.role === "admin" ? "Админ" : "Участник"}
          </span>
          {isOwner && member.id !== currentUser.uid && (
            <div className={styles.memberActions}>
              {member.role !== "admin" && (
                <button onClick={() => handlePromote(member.id)}>Сделать админом</button>
              )}
              <button onClick={() => handleRemove(member.id)}>Удалить</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}