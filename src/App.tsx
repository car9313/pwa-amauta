import { HeroSection } from "./components/hero/hero-section"
import { Header } from "./components/layout/header"
import { ConnectionStatus } from "./components/pwa/ConnectionStatus"


function App() {
  return (
    <>
     {/* <ConnectionStatus /> */}
     <Header />
      <main>
          <HeroSection />
           </main>
      </>
    
  
  )
}

export default App
