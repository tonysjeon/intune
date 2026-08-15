import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="px-6 sm:px-10 lg:px-16">
      <div className="mx-auto flex w-full max-w-[78rem] items-center justify-between border-t border-white/10 px-2 py-8 text-xs text-white/35 sm:px-5 lg:px-8">
        <span>© 2026 InTune</span>
        <Link className="transition hover:text-white" href="/privacy">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
