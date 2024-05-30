import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
import { ExportPage } from '../../pages';

export function App(props: AppRootProps) {
  return (
     <Routes>
       <Route path="*" element={<ExportPage />} />
     </Routes>
   );
 }
