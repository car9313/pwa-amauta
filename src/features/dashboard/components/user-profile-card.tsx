import { AmautaCard, AmautaCardContent } from "@/components/amauta";

type UserProfileCardProps = {
  name: string;
  role: string;
  level?: string;
};

export function UserProfileCard({ name, role, level }: UserProfileCardProps) {
  return (
    <AmautaCard className="border-border/70 bg-muted/40 shadow-sm">
      <AmautaCardContent className="flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amauta-blue-light text-amauta-blue">
          <span className="text-xl font-semibold" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
        </div>

        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">
            {level ? `${level} - ${role}` : role}
          </p>
        </div>
      </AmautaCardContent>
    </AmautaCard>
  );
}
