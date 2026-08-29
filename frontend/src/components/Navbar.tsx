import { NavLink } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/wardrobe', label: 'Garderobe' },
  { to: '/categories', label: 'Kategorien' },
  { to: '/outfits', label: 'Outfits' },
  { to: '/account', label: 'Konto' },
  { to: '/register', label: 'Registrieren' },
  { to: '/login', label: 'Anmelden' },
]

const LEGAL_LINKS = [
  { to: '/impressum', label: 'Impressum' },
  { to: '/datenschutz', label: 'Datenschutz' },
]

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/wardrobe" className="navbar-brand">
          Red Carpet
        </NavLink>
        <div className="navbar-links">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="navbar-legal">
          {LEGAL_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav-link">
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
