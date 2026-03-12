import { Outlet } from 'react-router-dom';
import { Header } from './layout/header';
;

export const Layout = () => {
  
  return (
    <div>
      
 <Header/>
 <main>
        <Outlet />
      </main>
    </div>
  );
};