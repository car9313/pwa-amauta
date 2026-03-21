import { Card, CardContent } from "@/components/ui/card";

type UserProfileCardProps = {
  name: string;
  role: string;
  level?: string;
};

export function UserProfileCard({ name, role, level }: UserProfileCardProps) {
  return (
    <Card className="border-border/70 bg-muted/40 shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amauta-blue-light text-amauta-blue">
          <span className="text-xl font-semibold">👤</span>
        </div>

        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{name}</p>
          <p className="text-sm text-muted-foreground">
            {level ? `${level} - ${role}` : role}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}