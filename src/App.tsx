import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { Camera, Search, Map as MapIcon, LayoutDashboard, Dog } from 'lucide-react'
import CatchPage from './pages/CatchPage'
import IdentifyPage from './pages/IdentifyPage'
import DogProfilePage from './pages/DogProfilePage'
import MapPage from './pages/MapPage'
import DashboardPage from './pages/DashboardPage'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-[100dvh]">
        <main className="flex-1 overflow-y-auto pb-16">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/catch" element={<CatchPage />} />
            <Route path="/identify" element={<IdentifyPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/dog/:id" element={<DogProfilePage />} />
          </Routes>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 flex items-center justify-around pb-safe z-50">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#0D7377]' : 'text-gray-500'}`
            }
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-medium">Dashboard</span>
          </NavLink>

          <NavLink
            to="/catch"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#0D7377]' : 'text-gray-500'}`
            }
          >
            <Camera size={24} />
            <span className="text-[10px] font-medium">Catch</span>
          </NavLink>

          <NavLink
            to="/identify"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#0D7377]' : 'text-gray-500'}`
            }
          >
            <Search size={24} />
            <span className="text-[10px] font-medium">Identify</span>
          </NavLink>

          <NavLink
            to="/map"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#0D7377]' : 'text-gray-500'}`
            }
          >
            <MapIcon size={24} />
            <span className="text-[10px] font-medium">Map</span>
          </NavLink>

          <NavLink
            to="/dog/recent"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-[#0D7377]' : 'text-gray-500'}`
            }
          >
            <Dog size={24} />
            <span className="text-[10px] font-medium">Dogs</span>
          </NavLink>
        </nav>
        <Toaster />
      </div>
    </Router>
  )
}

export default App
