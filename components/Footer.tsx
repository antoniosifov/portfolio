import { Mark } from "./Logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <p className="footer-brand">
          <Mark className="footer-mark" /> © 2026 Anton Iosifov
        </p>
        <p>Full-Stack Software Engineer · Israel / Remote</p>
        <a href="#top">Back to top ↑</a>
      </div>
    </footer>
  );
}
