import './App.css';
import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import DailyNumOfRows from './elements/DailyNumOfRows';
import IndivNumOfRows from './elements/IndivNumOfRows';
import ValueOverview from './elements/ValueOverview';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DailyNumOfRows/>} />
        <Route path="/overview/:id" element={<ValueOverview/>} />
        <Route path="/indiv/:id" element={<IndivNumOfRows/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
