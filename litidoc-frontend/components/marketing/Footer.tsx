export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-sm text-slate-500">
            © {currentYear} LitiDoc. All rights reserved.
          </p>
          <nav className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              GitHub
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              Twitter
            </a>
            <a
              href="mailto:contact@litidoc.com"
              className="text-sm text-slate-500 transition-colors hover:text-slate-900"
            >
              Contact
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
