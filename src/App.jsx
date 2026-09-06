import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LogView from './components/LogView';
import CalendarView from './components/CalendarView';
import HistoryView from './components/HistoryView';

function App() {
  const [activeTab, setActiveTab] = useState('log');
  const [initialHistoryExId, setInitialHistoryExId] = useState(null);
  const [historyFromLog, setHistoryFromLog] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [logTargetDate, setLogTargetDate] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'history') {
      setInitialHistoryExId(null);
      setHistoryFromLog(false);
    }
    if (tab !== 'log') {
      setEditingLog(null);
      setLogTargetDate(null);
    }
  };

  const handleGoToHistory = (exerciseId) => {
    setInitialHistoryExId(exerciseId);
    setHistoryFromLog(true);
    setActiveTab('history');
  };

  const handleBackFromHistory = () => {
    setHistoryFromLog(false);
    setInitialHistoryExId(null);
    setActiveTab('log');
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    setLogTargetDate(null);
    setHistoryFromLog(false);
    setActiveTab('log');
  };

  const handleCalendarAddLog = (date) => {
    setLogTargetDate(date);
    setEditingLog(null);
    setHistoryFromLog(false);
    setActiveTab('log');
  };

  const clearEditing = () => {
    setEditingLog(null);
    setLogTargetDate(null);
  };

  return (
    <>
      <div className="container">
        <div style={{ display: activeTab === 'log' ? 'block' : 'none' }}>
          <LogView
            onGoToHistory={handleGoToHistory}
            editingLog={editingLog}
            onClearEditing={clearEditing}
            targetDate={logTargetDate}
          />
        </div>
        <div style={{ display: activeTab === 'calendar' ? 'block' : 'none' }}>
          <CalendarView
            isActive={activeTab === 'calendar'}
            onEditLog={handleEditLog}
            onAddLog={handleCalendarAddLog}
          />
        </div>
        <div style={{ display: activeTab === 'history' ? 'block' : 'none' }}>
          <HistoryView
            isActive={activeTab === 'history'}
            initialExerciseId={initialHistoryExId}
            isFromLog={historyFromLog}
            onBack={handleBackFromHistory}
          />
        </div>
      </div>
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />
    </>
  );
}

export default App;
