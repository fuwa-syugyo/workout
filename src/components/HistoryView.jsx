import React, { useState, useEffect } from 'react';
import { ChevronRight, Trophy, ArrowLeft, FileText } from 'lucide-react';
import { getExercises, getHistory, getPersonalBest, BODY_PARTS } from '../db';
import { format } from 'date-fns';

export default function HistoryView({ initialExerciseId }) {
  const [view, setView] = useState('list'); // 'list' or 'detail'
  const [exercises, setExercises] = useState([]);
  const [selectedEx, setSelectedEx] = useState(null);
  const [history, setHistory] = useState([]);
  const [pb, setPb] = useState(null);

  useEffect(() => {
    const all = getExercises();
    setExercises(all);

    if (initialExerciseId) {
      const ex = all.find(e => e.id === initialExerciseId);
      if (ex) {
        selectExercise(ex);
      }
    }
  }, [initialExerciseId]);

  const selectExercise = (ex) => {
    setSelectedEx(ex);
    setHistory(getHistory(ex.id));
    setPb(getPersonalBest(ex.id));
    setView('detail');
  };

  const goBack = () => {
    setView('list');
    setSelectedEx(null);
  };

  if (view === 'detail' && selectedEx) {
    return (
      <div className="page fade-in">
        <div className="header">
          <button onClick={goBack} style={{ background: 'none', color: 'white', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </button>
          <div style={{ fontWeight: '600', fontSize: '18px' }}>{selectedEx.name}</div>
          <div style={{ width: '24px' }}></div>
        </div>

        {pb && (
          <div className="card" style={{ background: 'linear-gradient(135deg, var(--bg-card), rgba(14, 165, 233, 0.1))', border: '1px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', marginBottom: '8px' }}>
              <Trophy size={20} /> <span style={{ fontWeight: '600' }}>自己ベスト</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700' }}>
              {pb.weight}kg x {pb.reps}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{pb.date}</div>
          </div>
        )}

        <h3 className="label" style={{ marginTop: '20px' }}>過去の記録</h3>
        <div className="card">
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>記録がありません</div>
          ) : (
            history.map(log => (
              <div key={log.id} style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{log.date}</div>
                {log.sets.map((s, i) => (
                  <div key={i} style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>セット {i + 1}</span>
                      <span style={{ color: 'white' }}>{s.weight}kg x {s.reps}</span>
                    </div>
                    {s.note && (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '8px', paddingLeft: '8px', borderLeft: '2px solid var(--border)', marginTop: '2px' }}>
                        {s.note}
                      </div>
                    )}
                  </div>
                ))}

                {/* Legacy Note Display */}
                {log.note && (
                  <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-element)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <FileText size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span style={{ whiteSpace: 'pre-wrap' }}>{log.note}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Group exercises by body part
  return (
    <div className="page fade-in">
      <div className="header">
        <h1 className="title">種目一覧</h1>
      </div>

      {BODY_PARTS.map(part => {
        const partExercises = exercises.filter(e => e.part === part);
        if (partExercises.length === 0) return null;
        return (
          <div key={part} style={{ marginBottom: '20px' }}>
            <h3 className="label" style={{ marginLeft: '4px' }}>{part}</h3>
            <div className="card" style={{ padding: '0' }}>
              {partExercises.map((ex, i) => (
                <button key={ex.id} className="history-item"
                  style={{
                    width: '100%', background: 'transparent', padding: '16px',
                    borderBottom: i === partExercises.length - 1 ? 'none' : '1px solid var(--border)',
                    textAlign: 'left',
                    color: 'var(--text-primary)'
                  }}
                  onClick={() => selectExercise(ex)}
                >
                  <span style={{ fontSize: '16px', fontWeight: '500' }}>{ex.name}</span>
                  <ChevronRight size={18} color="var(--text-secondary)" />
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  );
}
