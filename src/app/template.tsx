/** Re-mounts on every navigation, giving each route a short fade-in (opacity only; see .kip-page-in). */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="kip-page-in">{children}</div>;
}
