import React from 'react';
import './Layout.css';

const Layout = ({ left, center, right }) => {
    return (
        <div className="app-layout">
            <aside className="pane pane-left">
                {left}
            </aside>
            <main className="pane pane-center">
                {center}
            </main>
            <aside className="pane pane-right">
                {right}
            </aside>
        </div>
    );
};

export default Layout;
