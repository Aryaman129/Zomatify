import React from 'react';
import { Outlet } from 'react-router-dom';
import MobileNavbar from '../common/MobileNavbar';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 72px; /* Space for mobile navigation */
`;

const MainContent = styled.main`
  flex: 1;
  padding: 0;
  overflow-x: hidden;
`;

const MainLayout: React.FC = () => {
  return (
    <LayoutContainer>
      <MainContent>
        <Outlet />
      </MainContent>
      <MobileNavbar />
    </LayoutContainer>
  );
};

export default MainLayout;
