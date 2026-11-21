import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { createBrowserRouter, RouterProvider} from 'react-router-dom'

import Dashboard from "./Dashboard.tsx"
import POS from './POS.tsx'
import Products from './Products.tsx'
import Reports from './Reports.tsx'
import Orders from './Orders.tsx'
import Inventory from './Inventory.tsx'
import Settings from './Settings.tsx'
import Users from './Users.tsx'
import Employees from './Employees.tsx'
import Queuing from './Queing.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Dashboard />
      },

      {
        path: "pos",
        element: <POS />
      },

      {
        path: "products",
        element: <Products />
      },

      {
        path: "reports",
        element: <Reports />
      },

      {
        path: "orders",
        element: <Orders />
      },

      {
        path: "inventory",
        element: <Inventory />
      },

      {
        path: "settings",
        element: <Settings />
      },

      {
        path: "users",
        element: <Users />
      },

      {
        path: "employees",
        element: <Employees />
      },

      {
        path: "queue",
        element: <Queuing />
      }


    
    ]

  },

  {

  }
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
