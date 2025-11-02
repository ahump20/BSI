import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Main Footer Links */}
        <div className="footer-section">
          <h3>Legal</h3>
          <ul>
            <li>
              <Link href="/terms">Terms of Service</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/cookies">Cookie Policy</Link>
            </li>
            <li>
              <Link href="/dmca">DMCA Policy</Link>
            </li>
            <li>
              <Link href="/accessibility">Accessibility</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Privacy Rights</h3>
          <ul>
            <li>
              <Link href="/gdpr">GDPR Rights (EU)</Link>
            </li>
            <li>
              <Link href="/ccpa">CCPA Rights (California)</Link>
            </li>
            <li>
              <Link href="/opt-out">Opt-Out Preferences</Link>
            </li>
            <li>
              <Link href="/data-request">Request Your Data</Link>
            </li>
            <li>
              <Link href="/delete-account">Delete Your Data</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Transparency</h3>
          <ul>
            <li>
              <Link href="/data-transparency">Data Transparency</Link>
            </li>
            <li>
              <Link href="/attribution">Data Attribution</Link>
            </li>
            <li>
              <Link href="/dpa">Data Processing Addendum</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Features</h3>
          <ul>
            <li>
              <Link href="/games">Games</Link>
            </li>
            <li>
              <Link href="/performance">Performance</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>Contact</h3>
          <ul>
            <li>
              <a href="mailto:legal@blazesportsintel.com">Legal Inquiries</a>
            </li>
            <li>
              <a href="mailto:privacy@blazesportsintel.com">Privacy Questions</a>
            </li>
            <li>
              <a href="mailto:support@blazesportsintel.com">Support</a>
            </li>
            <li>
              <a href="mailto:accessibility@blazesportsintel.com">Accessibility</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright and Attribution */}
      <div className="footer-bottom">
        <p>
          &copy; {currentYear} Blaze Sports Intel. All rights reserved.
        </p>
        <p className="footer-disclaimer">
          Sports data provided by SportsDataIO, MLB Advanced Media, ESPN, NCAA, and other licensed providers.
          Not affiliated with or endorsed by any professional sports league or team.
        </p>
      </div>
    </footer>
  );
}
