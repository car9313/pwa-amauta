
import { useAppStore } from "@/stores/useAppStore";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, Star, Trophy, Activity, Calendar } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, type ChildProfile } from "@/db/db";
import { useNavigate } from "react-router-dom";

export default function ParentalDashboard() {
    const navigate=useNavigate()
   const { user, setCurrentProfileId, logout } = useAppStore();
  
  const userId = user?.id ? Number(user.id) : null;
 // const profiles = useLiveQuery(() => db.profiles.toArray());
  const profiles = useLiveQuery(
    () => {
      if (!userId) return Promise.resolve([] as ChildProfile[]);
      return db.childProfiles.where("userId").equals(userId).toArray();
    },
    [userId]
  );


  if (!user) {
    if (typeof window !== 'undefined') navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <Button variant="outline" className="duo-button duo-button-secondary" onClick={() =>navigate('/profiles')}>
            <ArrowLeft className="mr-2 w-4 h-4" /> Volver
          </Button>
          <div className="text-right">
            <h1 className="text-3xl font-black text-foreground">Panel Parental</h1>
            <p className="text-muted-foreground font-bold">Hola, {user.name}</p>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {profiles?.map(profile => (
            <Card key={profile.id} className="rounded-3xl shadow-xl overflow-hidden border-b-8 border-secondary">
              <CardHeader className="bg-primary text-white p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white bg-white">
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black">{profile.name}</CardTitle>
                    {/* <p className="font-bold opacity-80">Racha: {profile.streak} días</p> */}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatBox 
                    icon={<Trophy className="text-primary w-5 h-5" />} 
                    label="Puntos" 
                    value="1"
                   /*  value={profile.points.toString()}  */
                  />
                  <StatBox 
                    icon={<Star className="text-yellow-500 w-5 h-5" />} 
                    label="Estrellas" 
                    value="2"
                   /*  value={profile.stars.toString()}  */
                  />
                  <StatBox 
                    icon={<Activity className="text-accent w-5 h-5" />} 
                    label="Lecciones" 
                    value="12" 
                  />
                  <StatBox 
                    icon={<Calendar className="text-blue-500 w-5 h-5" />} 
                    label="Actividad" 
                    value="Alta" 
                  />
                </div>
                
                <div className="pt-4">
                  <h4 className="font-bold text-muted-foreground mb-2">Progreso Reciente</h4>
                  <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-2/3"></div>
                  </div>
                  <p className="text-xs text-right mt-1 font-bold text-muted-foreground">66% de la Unidad 1</p>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {profiles?.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-4 border-dashed border-muted text-muted-foreground">
              <User className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl font-bold">Aún no hay perfiles de aprendizaje.</p>
              <Button className="mt-4 duo-button duo-button-primary" onClick={() => navigate('/profiles')}>
                CREAR PRIMER PERFIL
              </Button>
            </div>
          )}
        </section>

        <section className="bg-white p-8 rounded-3xl shadow-lg border-2 border-secondary">
          <h2 className="text-2xl font-black mb-6">Ajustes y Seguridad</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-background rounded-2xl">
              <div>
                <h4 className="font-bold">Modo Offline</h4>
                <p className="text-sm text-muted-foreground">Permitir descarga de lecciones.</p>
              </div>
              <Button variant="outline">ACTIVADO</Button>
            </div>
            <div className="flex items-center justify-between p-4 bg-background rounded-2xl">
              <div>
                <h4 className="font-bold">Notificaciones</h4>
                <p className="text-sm text-muted-foreground">Recordatorios diarios de estudio.</p>
              </div>
              <Button variant="outline">CONFIGURAR</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="p-4 bg-background rounded-2xl flex flex-col items-center justify-center space-y-1">
      {icon}
      <span className="text-xs font-bold text-muted-foreground uppercase">{label}</span>
      <span className="text-xl font-black text-foreground">{value}</span>
    </div>
  );
}