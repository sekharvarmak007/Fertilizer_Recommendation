import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import SoilInput from './pages/SoilInput'
import LeafUpload from './pages/LeafUpload'
import CropRecommendation from './pages/CropRecommendation'
import FertilizerRecommendation from './pages/FertilizerRecommendation'
import WeatherDashboard from './pages/WeatherDashboard'
import KnowledgeGraph from './pages/KnowledgeGraph'
import Chatbot from './pages/Chatbot'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/soil"          element={<SoilInput />} />
        <Route path="/leaf"          element={<LeafUpload />} />
        <Route path="/crop"          element={<CropRecommendation />} />
        <Route path="/fertilizer"    element={<FertilizerRecommendation />} />
        <Route path="/weather"       element={<WeatherDashboard />} />
        <Route path="/knowledge"     element={<KnowledgeGraph />} />
        <Route path="/chatbot"       element={<Chatbot />} />
      </Routes>
    </BrowserRouter>
  )
}
