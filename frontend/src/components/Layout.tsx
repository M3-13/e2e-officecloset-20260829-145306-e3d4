import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout() {
  return (
    <div className="layout">
      <Navbar />
      <main className="layout-main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
