import React from "react";
import { Routes, Route } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import AdminLayout from "./layouts/AdminLayout";
import NDashboard from "./pages/NAdmDashboard";

export default function NAdmin() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<NDashboard />} />
      </Route>
    </Routes>
  );
}
