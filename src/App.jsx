import React, { useState } from 'react';
import Navbar from './components/Navbar';
import LogView from './components/LogView';
import CalendarView from './components/CalendarView';
import HistoryView from './components/HistoryView';

function App() {
  const [activeTab, setActiveTab] = useState('log');
  const [initialHistoryExId, setInitialHistoryExId] = useState(null);
  const [editingLog, setEditingLog] = useState(null);
  const [logTargetDate, setLogTargetDate] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear transient states when switching tabs manually
    if (tab !== 'log') {
      setEditingLog(null);
      setLogTargetDate(null);
    } else {
      // If switching TO log tab manually (not via edit/add), clear these
      setEditingLog(null);
      setLogTargetDate(null);
    }
  };

  const handleGoToHistory = (exerciseId) => {
    setInitialHistoryExId(exerciseId);
    setActiveTab('history');
  };

  const handleEditLog = (log) => {
    setEditingLog(log);
    setLogTargetDate(null);
    setActiveTab('log');
  };

  const handleCalendarAddLog = (date) => {
    setLogTargetDate(date);
    setEditingLog(null);
    setActiveTab('log');
  }

  const clearEditing = () => {
    setEditingLog(null);
    setLogTargetDate(null);
  };

  return (
    <>
      <div className="container">
        {activeTab === 'log' && (
          <LogView
            onGoToHistory={handleGoToHistory}
            editingLog={editingLog}
            onClearEditing={clearEditing}
            targetDate={logTargetDate}
          />
        )}
        {activeTab === 'calendar' && <CalendarView onEditLog={handleEditLog} onAddLog={handleCalendarAddLog} />}
        {activeTab === 'history' && <HistoryView initialExerciseId={initialHistoryExId} />}
      </div>
      <Navbar activeTab={activeTab} setActiveTab={handleTabChange} />
    </>
  );
}

export default App;
