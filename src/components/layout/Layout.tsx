import React, { ReactNode } from 'react';
import Navbar from '../navbar/Navbar';

type LayoutProps = {
    children?: ReactNode;
};

const Layout:React.FC<LayoutProps> = ({children}) => {
    
    return <div>
        <>
        <Navbar />
        <main>{children}</main>
        </>
    </div>
}
export default Layout;