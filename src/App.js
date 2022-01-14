import './App.css';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NumOfRows from './elements/NumOfRows';
import StackedBar from './elements/StackedBar';
import TestPage from './elements/TestPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NumOfRows/>} />
        <Route path="/stackedbar" element={<StackedBar/>} />
        <Route path="/test" element={<TestPage/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
