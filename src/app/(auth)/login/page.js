"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "@/app/store/userSlice";
import { auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import styles from "@/styles/LoginPage.module.css";
import { FaGoogle } from "react-icons/fa";
import LoadingDots from "@/components/LoadingDots";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();
  const user = useSelector((state) => state.user);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return "Введите корректный email.";
    }
    if (!password || password.length < 6) {
      return "Пароль должен быть не менее 6 символов.";
    }
    return null;
  };

  const handleEmailLogin = async () => {
    setError(null);
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
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
      console.error("Login error:", err);
      setError("Неверный email или пароль.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const now = new Date();

      // Обновляем lastSeen в Firestore
      await setDoc(doc(db, "users", user.uid), {
        lastSeen: now
      }, { merge: true });

      dispatch(setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        lastSeen: now
      }));

      router.push("/chat");
    } catch (error) {
      console.error("Ошибка при входе через Google:", error);
      setError("Ошибка при входе через Google");
    } finally {
      setGoogleLoading(false);
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
          
          {error && (
          <div style={{ textAlign: "center" }}>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className={styles.form}>
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
          <button
            type="submit"
            onClick={handleEmailLogin}
            className={`${styles.button} ${loading ? styles.loading : ""}`}
            disabled={loading}
          >
            {loading ? "Вход" : "Войти"}
            {loading && <LoadingDots />}
          </button>
        </form>

        <div className={styles.switchToRegister}>
          <a href="/register" className={styles.registerLink}>
            Нет аккаунта? Зарегистрируйтесь
          </a>
        </div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className={`${styles.button} ${styles.googleButton}`}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <>
              Вход<LoadingDots />
            </>
          ) : (
            <>
              <img
                src="/assets/google-icon.png"
                alt="Google"
                className={styles.googleIcon}
              />
              Продолжить с Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}