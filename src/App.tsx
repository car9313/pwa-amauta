import { Header } from './components/layout/header'
import { UpdateToast } from './components/UpdateToast'
import { LessonPage } from './pages/LessonPage'


function App() {
  return (
    <>
     <Header />
      <LessonPage />
      <UpdateToast />
    </>
  )
}

export default App
