import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";

import Home from "./pages/public/Home";
import DailyAm from "./pages/public/DailyAm";
import MonthlyAm from "./pages/public/MonthlyAm";
import YearlyAm from "./pages/public/YearlyAm";
import InputHarga from "./pages/public/InputHarga";
import Login from "./pages/public/LoginPage";
import Sale from "./pages/public/Sale";
import About from "./pages/public/About";

import AdmDashboard from "./pages/admin/AdmDashboard";
import AdmKelolaHarga from "./pages/admin/AdmKelolaHarga";
import AdmKelolaUser from "./pages/admin/AdmKelolaUser";

import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import AdminRoute from "./components/AdminRoute";

// NEW ADMIN
// import NAdmin from "./nAdmin/nAdmin";
import NAdminLayout from "./nAdmin/layouts/AdminLayout";
import NAdmDashboard from "./nAdmin/pages/NAdmDashboard";
import NAdmKelUser from "./nAdmin/pages/NAdmKelUser";
import NAdmProduct from "./nAdmin/pages/NAdmProduk";
import NAdmLayoutDefault from "./nAdmin/pages/NAdmLayoutDefault";


function App() {
  return (
    <router>
      <Routes>
        {/* Layout untuk User */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/price" element={<DailyAm />} />
          <Route path="/monthly-price" element={<MonthlyAm />} />
          <Route path="/yearly-price" element={<YearlyAm />} />
          <Route path="/sale" element={<Sale />} />
          <Route path="/about" element={<About />} />
          <Route path="/input-harga" element={
            <ProtectedRoute>
              <InputHarga />
            </ProtectedRoute>
          } />
          <Route path="/login" element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          } />
        </Route>

        {/* Layout untuk Admin =======================================================*/}
        <Route element={<AdminLayout />}>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdmDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/kelola-user"
            element={
              <AdminRoute>
                <AdmKelolaUser />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/harga"
            element={
              <AdminRoute>
                <AdmKelolaHarga />
              </AdminRoute>
            }
          />
        </Route>

        {/* Layout New Admin =======================================================*/}
        {/* <Route path="/nadmin/*" element={<NAdmin />} /> */}
        <Route element={<NAdminLayout />}>
          <Route
            path="/nadmin/*"
            element={
              <AdminRoute>
                <NAdmDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/nadmin/users"
            element={
              <AdminRoute>
                <NAdmKelUser />
              </AdminRoute>
            }
          />
          <Route
            path="/nadmin/products"
            element={
              <AdminRoute>
                <NAdmProduct />
              </AdminRoute>
            }
          />
          <Route
            path="/nadmin/default"
            element={
              <AdminRoute>
                <NAdmLayoutDefault />
              </AdminRoute>
            }
          />
        </Route>

      </Routes>
    </router>
  );
}

export default App;
