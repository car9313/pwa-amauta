import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/stores/useAppStore";
import { db, type ChildProfile } from "@/db/db";
import { useLiveQuery } from "dexie-react-hooks";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { SAMPLE_COURSE } from "@/features/lessons/sample-data";
import Sidebar from "@/components/Sidebar";

export default function LearnPage() {
  const navigate = useNavigate();
  const { currentProfileId } = useAppStore();

  // Consulta reactiva: obtiene el perfil actual desde Dexie
  const currentProfile = useLiveQuery<ChildProfile | undefined>(
    () => {
      if (!currentProfileId) return Promise.resolve(undefined);
      return db.childProfiles.get(currentProfileId);
    },
    [currentProfileId]
  );

  // Redirigir si no hay perfil seleccionado
  if (!currentProfileId) {
    navigate('/profiles', { replace: true });
    return null;
  }
  // Mostrar carga mientras se obtiene el perfil
  if (currentProfile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-primary font-black text-4xl animate-pulse">
        Cargando perfil...
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pl-64">
      {/* Sidebar */}
      <Sidebar/>
      {/* Main Content */}
      <div className="max-w-2xl mx-auto p-4 md:pt-12">
        {/* Header with Stats */}
        <header className="flex justify-between items-center mb-12 bg-white/80 backdrop-blur-md sticky top-0 p-4 rounded-2xl shadow-sm z-40 border-b-4 border-secondary">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="font-black text-orange-500 text-xl">0</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            <span className="font-black text-yellow-600 text-xl">{currentProfile.totalStars}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">P</div>
            <span className="font-black text-primary text-xl">{currentProfile.totalPoints}</span>
          </div>
        </header>

        {/* Path Map */}
        <div className="space-y-16 pb-24">
          {SAMPLE_COURSE.units.map((unit, unitIdx) => (
            <div key={unit.id} className="space-y-10">
              <div className="bg-primary p-6 rounded-3xl text-white shadow-lg border-b-8 border-primary/70 mb-8 relative">
                <h2 className="text-lg font-bold opacity-80 uppercase tracking-widest">Unidad {unitIdx + 1}</h2>
                <h3 className="text-3xl font-black">{unit.title}</h3>
                <Button className="mt-4 bg-white text-primary hover:bg-white/90 duo-button border-white/70">GUÍA</Button>
                <div className="absolute right-6 -bottom-5 bg-accent p-3 rounded-2xl shadow-lg rotate-3 hidden md:block">
                  <Star className="w-10 h-10 fill-white text-white" />
                </div>
              </div>

              <div className="flex flex-col items-center gap-12 relative">
                {unit.lessons.map((lesson, idx) => {
                  const isAvailable = idx === 0; // Mock: primera lección disponible
                  return (
                    <div
                      key={lesson.id}
                      className="lesson-path-node"
                      style={{ transform: `translateX(${idx % 2 === 0 ? '-30px' : '30px'})` }}
                      onClick={() => isAvailable && navigate(`/lesson/${lesson.id}`)}
                    >
                      <div className={`
                        w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl border-b-8 transition-all
                        ${isAvailable
                          ? 'bg-primary border-primary/70 text-white cursor-pointer active:translate-y-1 active:border-b-0'
                          : 'bg-muted border-muted-foreground/30 text-muted-foreground grayscale opacity-50'}
                      `}>
                        {lesson.icon}
                      </div>
                      <span className="mt-2 font-black text-muted-foreground whitespace-nowrap">
                        {lesson.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

