import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, parseISO } from 'date-fns';
import { getAllLogs, getExercises } from '../db';

export default function CalendarView({ onEditLog, onAddLog }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    setLogs(getAllLogs());
    setExercises(getExercises());
  }, []);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getDayLogs = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return logs.filter(l => l.date === dateStr);
  };

  const hasWorkout = (date) => {
    return getDayLogs(date).length > 0;
  };

  return (
    <div className="page fade-in">
      <div className="header">
        <h1 className="title">カレンダー</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} style={{ background: 'none', color: 'white' }}><ChevronLeft /></button>
          <span style={{ fontWeight: '600' }}>{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} style={{ background: 'none', color: 'white' }}><ChevronRight /></button>
        </div>
      </div>

      <div className="calendar-grid">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', paddingBottom: '4px' }}>{d}</div>
        ))}
        {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map(day => {
          const active = hasWorkout(day);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={day.toString()}
              className={`calendar-day ${active ? 'has-workout' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => setSelectedDate(day)}
            >
              {format(day, 'd')}
              {active && <div className="workout-dot" />}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', justifyContent: 'center', overflow: 'auto', padding: '20px 0'
        }} onClick={() => setSelectedDate(null)}>
          <div style={{
            background: 'var(--bg-card)', width: '90%', maxWidth: '400px',
            borderRadius: '20px',
            padding: '20px', maxHeight: '70vh', overflowY: 'auto', margin: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px' }}>{format(selectedDate, 'MMMM d, yyyy')}</h2>
              <button onClick={() => setSelectedDate(null)} style={{ background: 'none', color: 'white' }}><X /></button>
            </div>

            <div style={{ maxHeight: 'calc(70vh - 120px)', overflowY: 'auto', marginBottom: '20px' }}>
              {getDayLogs(selectedDate).length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>
                  記録はありません
                </div>
              ) : (
                getDayLogs(selectedDate).map(log => {
                  const ex = exercises.find(e => e.id === log.exerciseId);
                  return (
                    <div
                      key={log.id}
                      style={{ marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px', cursor: 'pointer' }}
                      onClick={() => onEditLog && onEditLog(log)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <div style={{ color: 'var(--accent)', fontWeight: '600' }}>{ex?.name || 'Unknown'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>編集 &gt;</div>
                      </div>
                      {log.sets.map((s, i) => (
                        <div key={i} style={{ marginBottom: '4px' }}>
                          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>セット {i + 1}</span>
                            <span style={{ color: 'white' }}>{s.weight}kg x {s.reps}</span>
                          </div>
                          {s.note && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px', paddingLeft: '8px', borderLeft: '2px solid var(--border)', marginTop: '2px' }}>
                              {s.note}
                            </div>
                          )}
                        </div>
                      ))}
                      {log.note && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic', background: 'var(--bg-element)', padding: '6px', borderRadius: '6px' }}>
                          📝 {log.note}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              className="btn"
              onClick={() => onAddLog && onAddLog(selectedDate)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Plus size={18} /> この日の記録を追加
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
