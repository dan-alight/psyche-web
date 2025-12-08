import React from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";

export default function Modal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className={styles.modalBackdrop}>{children}</div>,
    document.body
  );
}
