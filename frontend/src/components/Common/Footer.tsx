export function Footer() {
  return (
    <footer className="relative border-t border-cellar-700/50 px-4 py-3 text-center text-xs text-parchment-200/40">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent" />
      © {new Date().getFullYear()} OeniVault AI · BuildTronix
    </footer>
  );
}
