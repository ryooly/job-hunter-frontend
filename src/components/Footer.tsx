import {
  LogoIcon,
  InstagramIcon,
  LinkedInIcon,
  YouTubeIcon,
  TwitterIcon,
} from "./Icons";

const COLUMNS: { title: string; links: string[] }[] = [
  {
    title: "Jobseekers",
    links: ["Spesialisasi", "Jobseeker Guide", "Lowongan Remote"],
  },
  { title: "Perusahaan", links: ["Start Hiring", "Employer Branding"] },
  {
    title: "About Job Hunter",
    links: ["Contact Us", "Blog", "Privacy Policy", "Terms of Use"],
  },
];

const SOCIALS: { label: string; Icon: typeof InstagramIcon }[] = [
  { label: "Instagram", Icon: InstagramIcon },
  { label: "LinkedIn", Icon: LinkedInIcon },
  { label: "YouTube", Icon: YouTubeIcon },
  { label: "Twitter", Icon: TwitterIcon },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {COLUMNS.map((column) => (
            <div className="footer-col" key={column.title}>
              <h3>{column.title}</h3>
              {column.links.map((link) => (
                <a href="#" key={link}>
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="footer-social">
          <h3>Ikuti komunitas kami</h3>
          <div className="footer-social-links">
            {SOCIALS.map(({ label, Icon }) => (
              <a
                className="social-btn"
                href="#"
                key={label}
                aria-label={`Job Hunter di ${label}`}
              >
                <Icon width={18} height={18} />
              </a>
            ))}
          </div>
        </div>

        <div className="footer-bottom">
          <span className="logo logo-sm">
            <LogoIcon width={20} height={20} />
            <span>
              Job<b>Hunter</b>
            </span>
          </span>
          <p>© 2026 Job Hunter. Interface clone for learning purposes.</p>
        </div>
      </div>
    </footer>
  );
}
