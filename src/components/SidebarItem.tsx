export function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-4 p-4 rounded-xl font-black text-lg transition-colors w-full
        ${active ? 'bg-secondary text-primary border-2 border-primary/20' : 'text-muted-foreground hover:bg-secondary/50'}
      `}
    >
      <span className={active ? 'text-primary' : 'text-muted-foreground'}>{icon}</span>
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}