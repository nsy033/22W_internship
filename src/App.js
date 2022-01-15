import './App.css';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import DailyNumOfRows from './elements/DailyNumOfRows';
import IndivNumOfRows from './elements/IndivNumOfRows';
import StackedBar from './elements/StackedBar';
import TestPage from './elements/TestPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DailyNumOfRows/>} />
        <Route path="/indiv/:id" element={<IndivNumOfRows/>} />
        <Route path="/stackedbar" element={<StackedBar/>} />
        <Route path="/test" element={<TestPage/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
