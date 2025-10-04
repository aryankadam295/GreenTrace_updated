import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import ForFarmers from './components/ForFarmers';
import ForMerchants from './components/ForMerchants';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/for-farmers" element={<ForFarmers />} />
        <Route path="/for-merchants" element={<ForMerchants />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
