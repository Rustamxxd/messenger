"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/app/store/userSlice";
import { auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import styles from "@/styles/LoginPage.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.user);

  const handleEmailLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const profileData = userDoc.exists() ? userDoc.data() : {};

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        bio: profileData.bio || "",
      };

      await updateDoc(doc(db, "users", user.uid), {
        online: true,
        lastSeen: serverTimestamp(),
      });

      dispatch(setUser(userData));
      router.push("/chat");
    } catch (err) {
      setError("Неверный email или пароль.");
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const profileData = userDoc.exists() ? userDoc.data() : {};

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        bio: profileData.bio || "",
      };

      await updateDoc(doc(db, "users", user.uid), {
        online: true,
        lastSeen: serverTimestamp(),
      });

      dispatch(setUser(userData));
      router.push("/chat");
    } catch (error) {
      setError("Ошибка при входе через Google.");
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.uid) {
        updateDoc(doc(db, "users", user.uid), {
          online: false,
          lastSeen: serverTimestamp(),
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [user]);

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Вход</h1>
        {error && <p className={styles.errorMessage}>{error}</p>}
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
          <button type="submit" onClick={handleEmailLogin} className={styles.button}>
            Войти
          </button>
        </form>

        <div className={styles.switchToRegister}>
          <a href="/register" className={styles.registerLink}>
            Нет аккаунта? Зарегистрируйтесь
          </a>
        </div>
        <button
          onClick={handleGoogleLogin}
          className={`${styles.button} ${styles.googleButton}`}
        >
          <img
            src="/assets/google-icon.png"
            alt="Google"
            className={styles.googleIcon}
          />
          Продолжить с Google
        </button>
      </div>
    </div>
  );
}