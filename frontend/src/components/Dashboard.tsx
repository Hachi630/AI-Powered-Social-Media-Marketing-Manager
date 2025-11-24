import { useState } from 'react';
import Header from './Header';
import ChatBox from './ChatBox';
import Sidebar from './Sidebar';
import styles from './Dashboard.module.css';

interface DashboardProps {
  isLoggedIn?: boolean;
}

export default function Dashboard({ isLoggedIn = false }: DashboardProps) {
  return (
    <div className={styles.dashboard}>
      <Header isLoggedIn={isLoggedIn} />
      <div className={styles.content}>
        {isLoggedIn && <Sidebar />}
        <div className={styles.mainContent}>
          <h1 className={styles.title}>What Can I Do For You Today?</h1>
          <ChatBox />
        </div>
      </div>
    </div>
  );
}

