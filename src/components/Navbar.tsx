import styles from "./Navbar.module.css";
import { Link } from "@tanstack/react-router";

export default function Navbar() {
  const links = [
    { to: "/calendar", label: "Calendar" },
    { to: "/goals", label: "Goals" },
  ];
  return (
    <nav className={styles.navbar}>
      {links.map((link) => (
        <Link key={link.to} to={link.to} className={styles.navLink}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
