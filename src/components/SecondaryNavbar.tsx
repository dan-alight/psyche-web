import React from "react";
import styles from "./SecondaryNavbar.module.css";

export default function SecondaryNavbar({
  children,
}: {
  children?: React.ReactNode;
}) {
  return <nav className={styles.secondaryNavbar}>{children}</nav>;
}
