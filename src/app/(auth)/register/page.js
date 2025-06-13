"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, registerUser } from "@/lib/firebase";
import { useDispatch } from "react-redux";
import { setUser } from "@/app/store/userSlice";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import styles from "@/styles/LoginPage.module.css";
import { FaGoogle } from "react-icons/fa";
import LoadingDots from "@/components/LoadingDots";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  const validateForm = () => {
    if (!displayName || displayName.trim().length === 0) {
      return "Имя пользователя обязательно.";
    }
    if (displayName.length > 20) {
      return "Имя не должно превышать 20 символов.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return "Введите корректный email.";
    }
    if (!password || password.length < 6) {
      return "Пароль должен содержать минимум 6 символов.";
    }
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setLoading(false);
      return;
    }

    try {
      const user = await registerUser(email, password, displayName);

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL || "",
      };

      dispatch(setUser(userData));
      router.push("/chat");
    } catch (err) {
      console.error("Ошибка при регистрации:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Этот email уже зарегистрирован.");
      } else if (err.code === "auth/invalid-email") {
        setError("Неверный формат email.");
      } else if (err.code === "auth/weak-password") {
        setError("Пароль слишком слабый.");
      } else {
        setError("Ошибка при регистрации. Попробуйте снова.");
      }
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
      
      // Создаем документ пользователя в Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        lastSeen: now,
        createdAt: serverTimestamp()
      });

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

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.title}>Регистрация</h1>

        {error && (
          <div style={{ textAlign: "center" }}>
            <p className={styles.errorMessage}>{error}</p>
          </div>
        )}


        <form onSubmit={handleRegister} className={styles.form}>
          <input
            type="text"
            placeholder="Имя пользователя"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={styles.input}
            maxLength={20}
            required
          />
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
            className={styles.button}
            disabled={loading}
          >
            {loading ? "Регистрация" : "Зарегистрироваться"}
            {loading && <LoadingDots />}
          </button>
        </form>

        <div className={styles.switchToRegister}>
          <a href="/login" className={styles.registerLink}>
            Уже есть аккаунт? Войдите
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
              Регистрация<LoadingDots />
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