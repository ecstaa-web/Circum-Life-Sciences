import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="page-bg min-h-screen">
      <Navbar />
      <main className="pt-24">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
