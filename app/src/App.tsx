import { useEffect, useState } from 'react'
import './App.css'
import SideNav from './SideNav'
import { Outlet } from 'react-router-dom'
import Login from './Login'

import { loginUser } from './api/userService'
import { useLocation } from 'react-router-dom'


function App() {
  
  const [ isAuthenticated, setIsAuthenticated ] = useState(
    !!localStorage.getItem('token')
  )

  const location = useLocation()

  useEffect(()=> {
    if(location.pathname === "/pos"){
      setShowNav(false)
    } else {
      setShowNav(true)
    }
  }, [location.pathname])

  const [ showNav , setShowNav ] = useState(true)

    const handleLogin = async (credentials: {
    username: string;
    password: string;
  }) => {

    // Connect your login API here.
    try {
      const data = await loginUser(credentials)

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      setIsAuthenticated(true)

      console.log("Login successful")
    } catch (error) {
      throw error
    }
    
  };
  

  return (
    <>
      {
        /**
         * <div className="flex flex-row">
              { showNav && <SideNav />}

        <Outlet />
      </div>
         */
      }
      {
        isAuthenticated ? (
          <div className="flex flex-row bg-gradient-to-br from-white via-sky-50 to-sky-200">
              { showNav && <SideNav />}

            <Outlet />
          </div>
        ) : (
          <Login onLogin={handleLogin}/>
        )
      }
    </>
  )
}

export default App
