import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { updateUserProfile, uploadAvatar } from "../lib/firebase";

export default function EditProfile() {
  const router = useRouter();
  const user = useSelector((state) => state.user.user);

  const [nickname, setNickname] = useState("");
  const [about, setAbout] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      setNickname(user.displayName || "");
      setAbout(user.about || "");
    }
  }, [user]);

  const handleSaveChanges = async () => {
    setLoading(true);
    let avatarUrl = user.photoURL;
    if (avatar) avatarUrl = await uploadAvatar(avatar);

    try {
      await updateUserProfile(user.uid, { nickname, about, avatarUrl });
      router.push("/profile");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Редактировать профиль</h1>
      <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
      <textarea value={about} onChange={(e) => setAbout(e.target.value)} />
      <input type="file" onChange={(e) => setAvatar(e.target.files[0])} />
      <button onClick={handleSaveChanges} disabled={loading}>
        {loading ? "Сохранение..." : "Сохранить"}
      </button>
    </div>
  );
}
