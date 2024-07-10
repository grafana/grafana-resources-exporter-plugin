import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ExportPage, InitPage } from '../../pages';
import { AppRootProps } from 'types/pluginData';

export function App(props: AppRootProps) {

  const initPage = InitPage(props);
  return (
    <Routes>
      <Route path="/" element={initPage} />
      <Route path="/export" element={<ExportPage />} />
    </Routes>
  );
}
