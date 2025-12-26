import styles from "./Navbar.module.css";
import { Link } from "@tanstack/react-router";

export default function Navbar() {
  const navLinks = [
    { to: "/calendar", label: "Calendar" },
    { to: "/goals", label: "Goals" },
    { to: "/jobs", label: "Jobs" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <nav className={styles.navbar}>
      {navLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={styles.navLink}
          activeProps={{ "data-status": "active" }}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
