export function StatBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 bg-background rounded-2xl flex flex-col items-center justify-center space-y-1">
      {icon}
      <span className="text-xs font-bold text-muted-foreground uppercase">{label}</span>
      <span className="text-xl font-black text-foreground">{value}</span>
    </div>
  );
}