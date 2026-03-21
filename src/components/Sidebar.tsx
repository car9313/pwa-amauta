import { BarChart2, Home, Target, Trophy, User } from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
    const navigate = useNavigate();
  return (
   <aside className="fixed bottom-0 left-0 w-full md:top-0 md:h-screen md:w-64 bg-white border-r md:border-b-0 border-t z-50 flex md:flex-col p-2 md:p-4 justify-around md:justify-start gap-2">
        <div className="hidden md:block text-3xl font-black text-primary p-4 mb-6">AMAUTA</div>
        <SidebarItem icon={<Home />} label="Aprender" active />
        <SidebarItem icon={<Target />} label="Práctica" />
        <SidebarItem icon={<Trophy />} label="Ligas" />
        <SidebarItem icon={<User />} label="Perfil" onClick={() => navigate('/profiles')} />
        <SidebarItem icon={<BarChart2 />} label="Panel" onClick={() => navigate('/dashboard')} />
      </aside>

  )
}