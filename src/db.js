export const BODY_PARTS = ['胸', '背中', '脚', '肩', '腕', '腹筋', '有酸素', 'その他'];

const DEFAULT_EXERCISES = [
  { id: 'bp', name: 'ベンチプレス', part: '胸' },
  { id: 'fly', name: 'ダンベルフライ', part: '胸' },
  { id: 'dl', name: 'デッドリフト', part: '背中' },
  { id: 'pull', name: '懸垂', part: '背中' },
  { id: 'sq', name: 'スクワット', part: '脚' },
  { id: 'ext', name: 'レッグエクステンション', part: '脚' },
  { id: 'ohp', name: 'ミリタリープレス', part: '肩' },
  { id: 'lat', name: 'サイドレイズ', part: '肩' },
  { id: 'cur', name: 'ダンベルカール', part: '腕' },
  { id: 'tri', name: 'トライセプスエクステンション', part: '腕' },
];

const STORAGE_KEY = 'gym_tracker_v1';

export const getStore = () => {
  const str = localStorage.getItem(STORAGE_KEY);
  if (!str) {
    const init = { exercises: DEFAULT_EXERCISES, logs: [] };
    saveStore(init);
    return init;
  }
  return JSON.parse(str);
};

export const saveStore = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const addWorkoutLog = (dateStr, exerciseId, sets, note = '') => {
  const store = getStore();
  const newLog = {
    id: crypto.randomUUID(),
    date: dateStr,
    exerciseId,
    sets,
    note,
    timestamp: Date.now()
  };
  store.logs.push(newLog);
  saveStore(store);
  return newLog;
};

export const updateWorkoutLog = (id, dateStr, exerciseId, sets, note = '') => {
  const store = getStore();
  const index = store.logs.findIndex(l => l.id === id);
  if (index !== -1) {
    store.logs[index] = { ...store.logs[index], date: dateStr, exerciseId, sets, note };
    saveStore(store);
  }
};

export const getLogsByDate = (dateStr) => {
  const store = getStore();
  return store.logs.filter(l => l.date === dateStr);
};

export const getAllLogs = () => {
  return getStore().logs;
};

export const getExercises = () => {
  return getStore().exercises;
};

export const addExercise = (name, part) => {
  const store = getStore();
  const newEx = { id: crypto.randomUUID(), name, part };
  store.exercises.push(newEx);
  saveStore(store);
  return newEx;
};

export const updateExercise = (id, name, part) => {
  const store = getStore();
  const index = store.exercises.findIndex(e => e.id === id);
  if (index !== -1) {
    store.exercises[index] = { ...store.exercises[index], name, part };
    saveStore(store);
  }
};

export const deleteExercise = (id) => {
  const store = getStore();
  // Remove exercise
  store.exercises = store.exercises.filter(e => e.id !== id);
  // Remove associated logs
  store.logs = store.logs.filter(l => l.exerciseId !== id);
  saveStore(store);
};

export const getPersonalBest = (exerciseId) => {
  const logs = getHistory(exerciseId);
  let maxVol = 0;
  let bestSet = null;

  logs.forEach(log => {
    log.sets.forEach(set => {
      const vol = set.weight * set.reps;
      if (vol > maxVol) {
        maxVol = vol;
        bestSet = { weight: set.weight, reps: set.reps, date: log.date };
      }
    });
  });
  return bestSet;
};

export const getHistory = (exerciseId) => {
  const store = getStore();
  return store.logs
    .filter(l => l.exerciseId === exerciseId)
    .sort((a, b) => b.timestamp - a.timestamp);
};
