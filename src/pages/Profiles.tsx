import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import { db, type ChildProfile } from "@/db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function Profiles() {
  const navigate = useNavigate();
  const { user, setCurrentProfileId, logout } = useAppStore();
  
  const userId = user?.id ? Number(user.id) : null;

  const profiles = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as ChildProfile[]);
      return db.childProfiles.where("userId").equals(userId).toArray();
    },
    [userId]
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectProfile = (profile: ChildProfile) => {
    setCurrentProfileId(profile.id!);
    navigate("/learn");
  };

  const handleCreateProfile = async () => {
    if (!userId) return;
    await db.childProfiles.add({
      userId,
      name: `Aprendiz ${Math.floor(Math.random() * 100)}`,
      avatar: `https://picsum.photos/seed/${Math.random()}/200/200`,
      totalPoints: 0,
      totalStars: 0,
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary font-black text-4xl animate-pulse">
        Cargando...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
      <h1 className="text-4xl md:text-5xl font-black mb-12 text-center text-foreground">
        ¿Quién va a aprender hoy?
      </h1>

      <div className="flex flex-wrap justify-center gap-10 max-w-5xl">
        {profiles?.map((profile) => (
          <div
            key={profile.id}
            onClick={() => handleSelectProfile(profile)}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-transparent group-hover:border-primary group-hover:scale-110 transition-all shadow-xl">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="object-cover w-full h-full"
              />
            </div>
            <span className="mt-4 text-2xl font-bold text-muted-foreground group-hover:text-primary transition-colors">
              {profile.name}
            </span>
          </div>
        ))}

        <div
          onClick={handleCreateProfile}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-secondary flex items-center justify-center border-4 border-dashed border-muted-foreground group-hover:border-primary group-hover:bg-white transition-all shadow-xl">
            <PlusCircle className="w-16 h-16 text-muted-foreground group-hover:text-primary" />
          </div>
          <span className="mt-4 text-2xl font-bold text-muted-foreground group-hover:text-primary transition-colors">
            Añadir Perfil
          </span>
        </div>
      </div>

      <div className="mt-20 flex gap-4">
        <Button
          variant="ghost"
          className="text-muted-foreground font-bold"
          onClick={() => navigate("/dashboard")}
        >
          PANEL PARENTAL
        </Button>
        <Button
          variant="ghost"
          className="text-destructive font-bold"
          onClick={handleLogout}
        >
          CERRAR SESIÓN
        </Button>
      </div>
    </div>
  );
}