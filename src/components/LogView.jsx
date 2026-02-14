import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, CheckCircle, X, Trophy, ExternalLink, FileText, Pencil, ChevronDown } from 'lucide-react';
import { BODY_PARTS, getExercises, addWorkoutLog, updateWorkoutLog, addExercise, updateExercise, deleteExercise, getPersonalBest, getLogsByDate } from '../db';
import { format } from 'date-fns';

// Fallback for crypto.randomUUID() in insecure contexts
const uuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export default function LogView({ onGoToHistory, editingLog, onClearEditing, targetDate }) {
  const [activePart, setActivePart] = useState(BODY_PARTS[0]);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Set entry state: list of objects { weight, reps, note, id }
  const [sets, setSets] = useState([{ weight: '', reps: '', note: '', id: Date.now() }]);

  const [successMsg, setSuccessMsg] = useState('');

  // Add/Edit Exercise Modal State
  const [showAddExModal, setShowAddExModal] = useState(false);
  const [exerciseModalMode, setExerciseModalMode] = useState('create'); // 'create' or 'edit'
  const [newExName, setNewExName] = useState('');
  const [editingExId, setEditingExId] = useState(null);

  // PB State
  const [currentPb, setCurrentPb] = useState(null);

  // Auto-edit mode (when selecting an exercise that has a log for "today")
  const [autoEditingLog, setAutoEditingLog] = useState(null);

  useEffect(() => {
    refreshExercises();
  }, [activePart]);

  // Handle editing mode (log editing)
  useEffect(() => {
    if (editingLog) {
      const all = getExercises();
      const ex = all.find(e => e.id === editingLog.exerciseId);
      if (ex) {
        setActivePart(ex.part);
      }
      // Populate sets with notes
      setSets(editingLog.sets.map(s => ({
        ...s,
        note: s.note || '',
        id: uuid()
      })));
    }
  }, [editingLog]);

  // When exercises update (or activePart changes), sets selectedExercise if editing
  useEffect(() => {
    if (editingLog && exercises.length > 0) {
      const ex = exercises.find(e => e.id === editingLog.exerciseId);
      if (ex && (!selectedExercise || selectedExercise.id !== ex.id)) {
        handleSelectExercise(ex.id);
        // Sets are already handled in the other useEffect, but just in case
      }
    }
  }, [exercises, editingLog]);

  const refreshExercises = () => {
    const all = getExercises();
    setExercises(all.filter(e => e.part === activePart));
    if (!editingLog) {
      // Don't reset everything if we are just updating the list after edit/delete
      // But we need to check if selectedExercise still exists
      if (selectedExercise) {
        const exists = all.find(e => e.id === selectedExercise.id && e.part === activePart);
        if (!exists) setSelectedExercise(null);
      } else {
        setSelectedExercise(null);
      }
      // Reset sets if not editing
      setSets([{ weight: '', reps: '', note: '', id: Date.now() }]);
    }
  };

  const handleSelectExercise = (exId) => {
    const all = getExercises();
    const ex = all.find(x => x.id === exId);
    setSelectedExercise(ex);

    if (ex) {
      setCurrentPb(getPersonalBest(ex.id));

      // Check if a log already exists for this exercise on the target date
      const dateToMatch = targetDate ? format(targetDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      const todaysLogs = getLogsByDate(dateToMatch);
      const existingLog = todaysLogs.find(l => l.exerciseId === ex.id);

      if (existingLog) {
        setAutoEditingLog(existingLog);
        setSets(existingLog.sets.map(s => ({
          ...s,
          note: s.note || '',
          id: uuid()
        })));
      } else {
        setAutoEditingLog(null);
        setSets([{ weight: '', reps: '', note: '', id: Date.now() }]);
      }
    } else {
      setCurrentPb(null);
      setAutoEditingLog(null);
      setSets([{ weight: '', reps: '', note: '', id: Date.now() }]);
    }
  };

  const handleSetChange = (id, field, value) => {
    setSets(sets.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSetRow = () => {
    const lastSet = sets[sets.length - 1];
    setSets([...sets, {
      weight: lastSet ? lastSet.weight : '',
      reps: lastSet ? lastSet.reps : '',
      note: '',
      id: Date.now()
    }]);
  };

  const removeSetRow = (index) => {
    if (sets.length === 1) return;
    const newSets = [...sets];
    newSets.splice(index, 1);
    setSets(newSets);
  };

  const saveWorkout = () => {
    if (!selectedExercise) return;

    // Filter out empty sets
    const validSets = sets
      .filter(s => s.weight && s.reps)
      .map(s => ({
        weight: parseFloat(s.weight),
        reps: parseInt(s.reps),
        note: s.note || ''
      }));

    if (validSets.length === 0) return;

    const activeEditingLog = editingLog || autoEditingLog;

    if (activeEditingLog) {
      // Pass '' for global note to preserve signature
      updateWorkoutLog(activeEditingLog.id, activeEditingLog.date, selectedExercise.id, validSets, '');

      // Update PB immediately
      if (selectedExercise) {
        setCurrentPb(getPersonalBest(selectedExercise.id));
      }

      setSuccessMsg('更新しました！');

      // If it was an auto-edit, keep the data but show success
      if (autoEditingLog && !editingLog) {
        // Just refresh the PB
      }

      setTimeout(() => {
        setSuccessMsg('');
        if (onClearEditing && editingLog) onClearEditing();
      }, 1500);
    } else {
      const dateToSave = targetDate ? format(targetDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      const newLog = addWorkoutLog(dateToSave, selectedExercise.id, validSets, '');
      setSuccessMsg('保存しました！');
      // After saving, it becomes the "auto editing log" for this session
      setAutoEditingLog(newLog);
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  const cancelEdit = () => {
    if (onClearEditing) onClearEditing();
    setSelectedExercise(null);
    setSets([{ weight: '', reps: '', note: '', id: Date.now() }]);
    setAutoEditingLog(null);
  };

  // Exercise Management
  const openCreateExerciseModal = () => {
    setExerciseModalMode('create');
    setNewExName('');
    setShowAddExModal(true);
  };

  const openEditExerciseModal = (e) => {
    e.stopPropagation();
    if (!selectedExercise) return;
    setExerciseModalMode('edit');
    setEditingExId(selectedExercise.id);
    setNewExName(selectedExercise.name);
    setShowAddExModal(true);
  };

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDeleteExercise = (e) => {
    e.stopPropagation();
    if (!selectedExercise) return;
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedExercise) {
      deleteExercise(selectedExercise.id);
      setSelectedExercise(null);
      refreshExercises();
      setShowDeleteModal(false);
    }
  };

  const handleSaveExercise = () => {
    if (!newExName) return;
    let newExId = null;

    if (exerciseModalMode === 'create') {
      const newEx = addExercise(newExName, activePart);
      newExId = newEx.id;
    } else {
      updateExercise(editingExId, newExName, activePart);
      newExId = editingExId;
      // If we are currently editing the selected exercise, update its name in state
      if (selectedExercise && selectedExercise.id === editingExId) {
        setSelectedExercise({ ...selectedExercise, name: newExName });
      }
    }

    refreshExercises();
    setShowAddExModal(false);

    // Auto-select the newly created/edited exercise
    if (newExId) {
      handleSelectExercise(newExId);
    }

    setNewExName('');
    setEditingExId(null);
  };

  return (
    <div className="page fade-in">
      <div className="header">
        <h1 className="title">{(editingLog || autoEditingLog) ? '記録の編集' : '記録'}</h1>
        <div className="date">
          {editingLog
            ? editingLog.date
            : (targetDate ? format(targetDate, 'yyyy-MM-dd') : format(new Date(), 'MMM d, yyyy'))}
        </div>
      </div>

      {successMsg && (
        <div className="card" style={{ borderColor: 'var(--success)', color: 'var(--success)', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <CheckCircle size={20} /> {successMsg}
        </div>
      )}

      {(editingLog || targetDate) && (
        <div style={{ marginBottom: '10px' }}>
          <button onClick={cancelEdit} style={{ color: 'var(--text-secondary)', background: 'none', textDecoration: 'underline' }}>
            {targetDate ? 'カレンダーに戻る' : 'キャンセルして新規作成へ戻る'}
          </button>
        </div>
      )}

      {/* Part Selector */}
      <div className="part-selector">
        {BODY_PARTS.map(part => (
          <button
            key={part}
            className={`chip ${activePart === part ? 'active' : ''}`}
            onClick={() => {
              setSelectedExercise(null);
              setAutoEditingLog(null);
              setActivePart(part);
              setIsDropdownOpen(true);
            }}
          >
            {part}
          </button>
        ))}
      </div>

      <div style={{ height: '20px' }}></div>

      {/* Exercise Selector */}
      <div style={{ marginBottom: '8px' }}>
        <label className="label" style={{ marginBottom: 0 }}>種目を選択</label>
      </div>

      <div className="card" style={{ padding: '10px', display: 'flex', gap: '8px', alignItems: 'center', overflow: 'visible' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div
            className="input"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          >
            <span style={{ color: selectedExercise ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {selectedExercise?.name || '種目を選択...'}
            </span>
            <ChevronDown size={16} color="var(--text-secondary)" />
          </div>

          {isDropdownOpen && (
            <>
              {/* Overlay to close dropdown when clicking outside */}
              <div
                style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 99 }}
                onClick={() => setIsDropdownOpen(false)}
              />
              <div style={{
                position: 'absolute', top: '110%', left: 0, width: '100%',
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: '12px', zIndex: 100,
                maxHeight: '250px', overflowY: 'auto', boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
              }}>
                {exercises.length === 0 ? (
                  <div style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>
                    種目がありません
                  </div>
                ) : (
                  exercises.map(ex => (
                    <div
                      key={ex.id}
                      onClick={() => {
                        handleSelectExercise(ex.id);
                        setIsDropdownOpen(false);
                      }}
                      style={{
                        padding: '12px',
                        borderBottom: '1px solid var(--border)',
                        cursor: 'pointer',
                        color: selectedExercise?.id === ex.id ? 'var(--accent)' : 'var(--text-primary)',
                        background: selectedExercise?.id === ex.id ? 'var(--bg-element)' : 'transparent'
                      }}
                    >
                      {ex.name}
                    </div>
                  ))
                )}
                <div
                  onClick={() => {
                    openCreateExerciseModal();
                    setIsDropdownOpen(false);
                  }}
                  style={{
                    padding: '12px',
                    cursor: 'pointer',
                    color: 'var(--accent)',
                    fontWeight: '600',
                    borderTop: '1px solid var(--border)',
                    textAlign: 'center'
                  }}
                >
                  + 新しい種目を追加
                </div>
              </div>
            </>
          )}
        </div>

        {selectedExercise && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={openEditExerciseModal} style={{ padding: '8px', color: 'var(--text-secondary)', background: 'var(--bg-element)', borderRadius: '8px' }}>
              <Pencil size={16} />
            </button>
            <button onClick={handleDeleteExercise} style={{ padding: '8px', color: 'var(--danger)', background: 'var(--bg-element)', borderRadius: '8px' }}>
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {selectedExercise && (
        <div className="fade-in">
          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div className="card" style={{ flex: 1, marginBottom: 0, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80px', background: 'var(--bg-card)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Trophy size={14} color="var(--accent)" /> 自己ベスト
              </div>
              {currentPb ? (
                <div style={{ fontWeight: '700', fontSize: '18px' }}>{currentPb.weight}kg x {currentPb.reps}</div>
              ) : (
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>--</div>
              )}
            </div>

            <button
              className="card"
              onClick={() => onGoToHistory && onGoToHistory(selectedExercise.id)}
              style={{ flex: 1, marginBottom: 0, padding: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '80px', background: 'var(--bg-element)', border: '1px solid var(--border)' }}
            >
              <ExternalLink size={20} style={{ marginBottom: '4px' }} />
              <span style={{ fontSize: '12px', fontWeight: '500' }}>過去の履歴を見る</span>
            </button>
          </div>

          <div className="card" style={{ padding: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', gap: '10px', marginBottom: '10px', paddingLeft: '4px' }}>
              <div className="label" style={{ marginBottom: 0 }}>Weight (kg)</div>
              <div className="label" style={{ marginBottom: 0 }}>Reps</div>
              <div></div>
            </div>

            {sets.map((s, i) => (
              <div key={s.id} style={{ marginBottom: '16px', borderBottom: i !== sets.length - 1 ? '1px dashed var(--border)' : 'none', paddingBottom: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 40px', gap: '10px', marginBottom: '8px' }}>
                  <input
                    type="number"
                    className="input"
                    value={s.weight}
                    onChange={e => handleSetChange(s.id, 'weight', e.target.value)}
                    placeholder="0"
                  />
                  <input
                    type="number"
                    className="input"
                    value={s.reps}
                    onChange={e => handleSetChange(s.id, 'reps', e.target.value)}
                    placeholder="0"
                  />
                  <button onClick={() => removeSetRow(i)} style={{ color: 'var(--danger)', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
                <input
                  className="input"
                  style={{ fontSize: '12px', padding: '8px', background: 'var(--bg-app)' }}
                  value={s.note}
                  onChange={e => handleSetChange(s.id, 'note', e.target.value)}
                  placeholder="メモ"
                />
              </div>
            ))}

            <button className="btn btn-secondary" onClick={addSetRow} style={{ marginTop: '0px' }}>
              <Plus size={18} /> セットを追加
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button className="btn" onClick={saveWorkout}>
              <Save size={18} /> {editingLog ? '更新する' : '保存する'}
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Exercise Modal */}
      {showAddExModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowAddExModal(false)}>
          <div style={{
            background: 'var(--bg-card)', width: '90%', maxWidth: '400px',
            borderRadius: '16px', padding: '20px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3>{exerciseModalMode === 'create' ? `種目を追加 (${activePart})` : '種目を編集'}</h3>
              <button onClick={() => setShowAddExModal(false)} style={{ background: 'none', color: 'white' }}><X /></button>
            </div>
            <input
              className="input"
              value={newExName}
              onChange={e => setNewExName(e.target.value)}
              placeholder="種目名を入力..."
              autoFocus
            />
            <button className="btn" style={{ marginTop: '20px' }} onClick={handleSaveExercise}>
              {exerciseModalMode === 'create' ? '追加' : '更新'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setShowDeleteModal(false)}>
          <div style={{
            background: 'var(--bg-card)', width: '90%', maxWidth: '320px',
            borderRadius: '16px', padding: '20px'
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '10px' }}>種目を削除しますか？</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '14px' }}>
              「{selectedExercise?.name}」と、これまでの全ての記録が削除されます。この操作は取り消せません。
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>キャンセル</button>
              <button className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={confirmDelete}>削除する</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
