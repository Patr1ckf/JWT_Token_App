"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";
import { FileText, Download } from "lucide-react";
import { apiFetch } from "@/app/lib/api";

/* ================= TYPES ================= */

type DocumentItem = {
  id: number;
  name: string;
  size: string;
  date: string;
  allowedRoles: string[];
};

type ModalState =
  | { type: "success"; message: string }
  | { type: "expired"; message: string }
  | null;

/* ================= HELPERS ================= */

function getTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

function decodeJwtPart(part: string) {
  try {
    return JSON.stringify(
      JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/"))),
      null,
      2
    );
  } catch {
    return "Invalid token";
  }
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ================= COMPONENT ================= */

export default function DashboardPage() {
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [expiresIn, setExpiresIn] = useState<number | null>(null);

  const [token, setToken] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  /* ===== INIT (CLIENT ONLY) ===== */

  useEffect(() => {
    const storedToken = localStorage.getItem("access_token");
    const storedName = localStorage.getItem("user_name");
    const storedRole = localStorage.getItem("user_role");

    if (!storedToken) {
      router.replace("/login");
      return;
    }

    setToken(storedToken);
    setUserName(storedName || "");
    setUserRole(storedRole || "");

    const exp = getTokenExp(storedToken);
    if (!exp) return;

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = exp - now;

      if (diff <= 0) {
        setExpiresIn(0);
        return; // ← NIC WIĘCEJ
      }

      setExpiresIn(diff);
    };


    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [router]);

  /* ===== LOAD DOCUMENTS ===== */

  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const data = await apiFetch("/documents");

        setDocuments(
          data.documents.map((doc: any, i: number) => ({
            id: i + 1,
            name: doc.name,
            size: doc.size,
            date: doc.date,
            allowedRoles: doc.allowed_roles,
          }))
        );
      } catch {
        localStorage.clear();
        router.replace("/login");
      }
    })();
  }, [token, router]);

  function getFileColor(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return "#0E91E2"; 
    case "ppt":
    case "pptx":
      return "#ea580c"; 
    case "xls":
    case "xlsx":
      return "#16a34a"; 
    case "doc":
    case "docx":
      return "#2563eb"; 
    default:
      return "#6b7280"; 
  }
}

  /* ===== DOWNLOAD ===== */

  async function downloadDocument(name: string) {
    if (!token) {
      setModal({
        type: "expired",
        message: "Your token has expired, please log in again",
      });
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/documents/download/${name}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (res.status === 401) {
      setModal({
        type: "expired",
        message: "Your token has expired, please log in again",
      });
      return;
    }

    if (res.status === 403) {
      alert("No access to this document");
      return;
    }

    if (!res.ok) {
      alert("Downloading failed");
      return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();

    URL.revokeObjectURL(url);

    setModal({
      type: "success",
      message: "Your file was downloaded",
    });
  }

  /* ================= RENDER ================= */

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>Hi {userName}!</div>
        <button
          className={styles.headerButton}
          onClick={() => {
            localStorage.clear();
            router.replace("/login");
          }}
        >
          Log out
        </button>
      </div>

      <div className={styles.content}>
        {/* DOCUMENTS */}
        <div className={styles.cardDOC}>
          <div className={styles.cardTitle}>Documents</div>

          {documents.map((doc) => {
            const hasAccess = doc.allowedRoles.includes(userRole);

            return (
              <div key={doc.id} className={styles.doc}>
                <div className={styles.docLeft}>
                  <div className={styles.docBar} />
                  <div
                    className={styles.docIcon}
                    style={{ color: getFileColor(doc.name) }}
                  >
                    <FileText size={28} />
                  </div>

                  <div className={styles.docInfo}>
                    <div className={styles.docName}>{doc.name}</div>
                    <div className={styles.docMeta}>
                      Date: {doc.date}
                      <br />
                      Size: {doc.size}
                    </div>
                  </div>
                </div>

                <button
                  className={styles.download}
                  disabled={!hasAccess}
                  title={
                    hasAccess
                      ? "Download document"
                      : "No access to this document"
                  }
                  onClick={() => downloadDocument(doc.name)}
                >
                  <Download size={20} />
                </button>
              </div>
            );
          })}
        </div>

        {/* TOKEN PREVIEW */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Token preview</div>

          {token ? (() => {
            const [header, payload, signature] = token.split(".");
            return (
              <div className={styles.tokenBox}>
                <div className={styles.tokenLabel}>HEADER:</div>
                <pre>{decodeJwtPart(header)}</pre>

                <div className={styles.tokenLabel}>PAYLOAD:</div>
                <pre>{decodeJwtPart(payload)}</pre>

                <div className={styles.tokenLabel}>SIGNATURE:</div>
                <pre>{signature}</pre>

                {expiresIn !== null && (
                  <div
                    style={{
                      marginTop: "12px",
                      color: expiresIn <= 10 ? "#dc2626" : "#22c55e",
                    }}
                  >
                    Token expires in:{" "}
                    <strong>{formatTime(expiresIn)}</strong>
                  </div>
                )}
              </div>
            );
          })() : (
            <div>No token</div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className={styles.modalBg}>
          <div className={styles.modal}>
            <h2
              className={
                modal.type === "success"
                  ? styles.modalSuccess
                  : styles.modalError
              }
            >
              {modal.type === "success" ? "Done!" : "Token expired"}
            </h2>
            <p>{modal.message}</p>
            <button
              onClick={() => {
                if (modal.type === "expired") {
                  localStorage.clear();
                  router.replace("/login");
                } else {
                  setModal(null);
                }
              }}
            >
              {modal.type === "expired" ? "Log in" : "OK"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
