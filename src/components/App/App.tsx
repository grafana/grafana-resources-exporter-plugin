import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ExportPage, InitPage } from '../../pages';
import { AppRootProps } from 'types/pluginData';

export function App(props: AppRootProps) {

  const initPage = InitPage(props);
  const exportPage = <ExportPage />;
  return (
    <Routes>
      <Route path="/*" element={props.meta.jsonData?.initialized ? exportPage : initPage} />
    </Routes>
  );
}
