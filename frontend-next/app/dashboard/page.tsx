"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

type DocumentItem = {
  id: number;
  name: string;
  size: string;
  date: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // FAKE backend
    setTimeout(() => {
      const tokenExpiredFromBackend = false;

      if (tokenExpiredFromBackend) {
        setTokenExpired(true);
        return;
      }

      setDocuments([
        { id: 1, name: "Project_v1.pdf", size: "50MB", date: "2025-10-06" },
        { id: 2, name: "Report_lab.pdf", size: "87MB", date: "2025-10-12" },
        { id: 3, name: "AWS_Billing.pdf", size: "33MB", date: "2025-09-25" },
      ]);
    }, 500);
  }, [router]);

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>Hi Martha!</div>
        <div className={styles.headerButtons}>
          <button className={styles.headerButton}>Your Account</button>
          <button
            className={styles.headerButton}
            onClick={() => {
              localStorage.removeItem("access_token");
              router.push("/login");
            }}
          >
            Log Out
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        {/* DOCUMENTS */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Your documents</div>

          <input
            className={styles.search}
            placeholder="Search documents"
          />

          {documents.map((doc) => (
            <div key={doc.id} className={styles.doc}>
              <div>
                <div className={styles.docName}>{doc.name}</div>
                <div className={styles.docMeta}>
                  Date: {doc.date} • Size: {doc.size}
                </div>
              </div>
              <button className={styles.download}>⬇</button>
            </div>
          ))}
        </div>

        {/* TOKEN */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Token preview</div>

          <div className={styles.tokenBox}>
            <div className={styles.tokenLabel}>HEADER:</div>
            <div>{`{"alg":"HS256","typ":"JWT"}`}</div>
            <br />
            <div className={styles.tokenLabel}>PAYLOAD:</div>
            <div>{`{"user_id":42,"role":"user","exp":1712345678}`}</div>
            <br />
            <div className={styles.tokenLabel}>SIGNATURE:</div>
            <div>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {tokenExpired && (
        <div className={styles.modalBg}>
          <div className={styles.modal}>
            <h2>Token expired</h2>
            <p>Your session has expired. Please log in again.</p>
            <button
              onClick={() => {
                localStorage.removeItem("access_token");
                router.push("/login");
              }}
            >
              Log in again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
