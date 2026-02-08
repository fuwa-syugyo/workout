import React from 'react';
import { PlusCircle, Calendar, History } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${activeTab === 'log' ? 'active' : ''}`}
        onClick={() => setActiveTab('log')}
      >
        <PlusCircle />
        <span>記録</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
        onClick={() => setActiveTab('calendar')}
      >
        <Calendar />
        <span>カレンダー</span>
      </button>
      <button
        className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
        onClick={() => setActiveTab('history')}
      >
        <History />
        <span>履歴</span>
      </button>
    </nav>
  );
}
