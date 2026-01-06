"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // FAKE LOGIN – udajemy backend
    setTimeout(() => {
      localStorage.setItem("access_token", "FAKE_JWT_TOKEN");
      localStorage.setItem("user_name", "Martha");
      router.push("/dashboard");
    }, 800);
  }

  return (
    <div className={styles.page}>
      {/* LEWA STRONA */}
      <div className={styles.left}>
        <div className={styles.illustration} />
      </div>

      {/* PRAWA STRONA */}
      <div className={styles.right}>
        <form className={styles.card} onSubmit={handleSubmit}>
          <h1 className={styles.title}>Log in</h1>
          <p className={styles.subtitle}>Access your secure space</p>

          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="martha.collin@gmail.com"
          />

          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="************"
          />

          <button className={styles.button} disabled={loading}>
            {loading ? "Connecting..." : "Connect"}
          </button>

          <div className={styles.footer}>
            Forgot your password? <a href="#">Click here</a>
          </div>
        </form>
      </div>
    </div>
  );
}
