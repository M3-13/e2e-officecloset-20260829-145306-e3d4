import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WardrobePage from './pages/WardrobePage'
import ItemFormPage from './pages/ItemFormPage'
import CategoriesPage from './pages/CategoriesPage'
import OutfitsPage from './pages/OutfitsPage'
import AccountPage from './pages/AccountPage'
import Impressum from './pages/Impressum'
import Datenschutz from './pages/Datenschutz'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/wardrobe" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/wardrobe" element={<WardrobePage />} />
            <Route path="/wardrobe/new" element={<ItemFormPage />} />
            <Route path="/wardrobe/:id/edit" element={<ItemFormPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/outfits" element={<OutfitsPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/impressum" element={<Impressum />} />
            <Route path="/datenschutz" element={<Datenschutz />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
