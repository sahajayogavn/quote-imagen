import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { TemplateListPage } from './pages/TemplateListPage'
import { EditorPage } from './pages/EditorPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TemplateListPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
