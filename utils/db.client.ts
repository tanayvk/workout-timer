import { nanoid } from "nanoid";
import initWasm from "@vlcn.io/crsqlite-wasm";
import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";

let sqlite, db: any;
let resolves: Function[] = [];

export const updatedAtTrigger = (tableName: string) => `
CREATE TRIGGER ${tableName}_update
    AFTER UPDATE
    ON ${tableName}
    FOR EACH ROW
    WHEN NEW.updates = OLD.updates
BEGIN
    UPDATE ${tableName} SET updated_at = CURRENT_TIMESTAMP, updates = updates + 1 WHERE id=OLD.id;
END;
`;

export const createTable = async (
  tableName: string,
  columns: string,
  constraints = "",
) => {
  await db.exec(
    `CREATE TABLE IF NOT EXISTS ${tableName} (id primary key not null, ${columns}, created_at timestamp NOT NULL DEFAULT current_timestamp,
     updated_at timestamp NOT NULL DEFAULT current_timestamp, updates int DEFAULT 0${
       constraints ? `, ${constraints}` : ""
     })`,
  );
  await db.exec(updatedAtTrigger(tableName));
  await db.exec(`SELECT crsql_as_crr('${tableName}')`);
};

const cascadeDelete = (
  table: string,
  col: string,
  refTable: string,
  refCol: string,
  cascadeDelete = true,
) => `CONSTRAINT fk_${table}_${col}
FOREIGN KEY (${col})
REFERENCES ${refTable}(${refCol})
${cascadeDelete ? "ON DELETE CASCADE" : ""}`;

const migrations = [
  async function createTables() {
    await createTable("workout", "title");
    await createTable(
      "exercise",
      `title, time, auto_done, workout, ordering`,
      // cascadeDelete("exercise", "workout", "workout", "id"),
    );
    await createTable(
      "log",
      `workout, data, time`,
      // cascadeDelete("log", "workout", "workout", "id"),
    );

    await db.exec(
      "SELECT crsql_fract_as_ordered('exercise', 'ordering', 'workout')",
    );
  },
];

const runMigrations = async () => {
  let [{ user_version } = { user_version: 0 }] = await db.execO(
    "PRAGMA user_version",
  );
  user_version ||= 0;
  while (user_version < migrations.length) {
    await migrations[0]?.();
    user_version++;
    await db.exec(`PRAGMA user_version = ${user_version}`);
  }
};

export const init = async () => {
  sqlite = await initWasm(() => wasmUrl);
  db = await sqlite.open("my-database.db");
  await db.exec("PRAGMA recursive_triggers = 1");
  //   await db.exec("PRAGMA user_version = 0"); // TODO: remove after testing
  //   await db.exec(`
  // PRAGMA writable_schema = 1;
  // delete from sqlite_master where type in ('table', 'index', 'trigger');
  // PRAGMA writable_schema = 0;
  //     `);
  await runMigrations();
  resolves.forEach((res) => res(db));
};

export const getDB = () => {
  if (db) return db;
  return new Promise((res) => resolves.push(res));
};

export const getWorkouts = async () => {
  const db = await getDB();
  return await db.execO("SELECT * FROM workout");
};

export const createNewWorkout = async () => {
  const db = await getDB();
  const id = nanoid();
  await db.exec(`INSERT INTO workout (id, title) VALUES (?, ?)`, [
    id,
    "New Workout",
  ]);
  await addExercise(id);
  return id;
};

export const updateWorkoutTitle = async (id: string, title: string) => {
  const db = await getDB();
  await db.exec(`UPDATE workout SET title = ? WHERE id = ?`, [title, id]);
};

export const getWorkout = async (id: string) => {
  const db = await getDB();
  const workout = await db.execO(
    `SELECT 
        w.*, 
        json_group_array(json_object(
            'id', e.id, 
            'title', e.title, 
            'time', e.time, 
            'autoDone', e.auto_done, 
            'workout', e.workout, 
            'ordering', e.ordering
        )) as exercises 
     FROM workout w
     LEFT JOIN (
         SELECT * FROM exercise WHERE workout = ? ORDER BY ordering
     ) e ON w.id = e.workout
     WHERE w.id = ?
     GROUP BY w.id`,
    [id, id],
  );
  if (workout.length > 0) {
    workout[0].exercises = JSON.parse(workout[0].exercises);
    workout[0].exercises.forEach((e: any) => (e.autoDone = !!e.autoDone));
  }
  return workout.length > 0 ? workout[0] : null;
};

export const deleteWorkoutByID = async (id: string) => {
  const db = getDB();
  await db.exec("DELETE FROM workout WHERE id = ?", [id]);
};

export const addExercise = async (workout: string) => {
  const newExercise = {
    id: nanoid(),
    title: "",
    time: "",
    autoDone: false,
    workout,
  };
  await db.exec(
    `INSERT INTO exercise (id, title, time, auto_done, workout, ordering) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      newExercise.id,
      newExercise.title,
      newExercise.time,
      newExercise.autoDone,
      newExercise.workout,
      1, // 1 is for append
    ],
  );
  return newExercise;
};

export const moveExercise = async (exercise: string, after: string) => {
  await db.exec(
    `UPDATE exercise_fractindex SET after_id = ${
      after ? "?" : "NULL"
    } WHERE id = ?`,
    [...(after ? [after] : []), exercise],
  );
};

export const deleteExercise = async (id: string) => {
  await db.exec("DELETE FROM exercise WHERE id = ?", [id]);
};

export const updateExercise = async (
  id: string,
  title: string,
  time: string,
  autoDone = false,
) => {
  const db = await getDB();
  await db.exec(
    `UPDATE exercise SET title = ?, time = ?, auto_done = ? WHERE id = ?`,
    [title, time, autoDone, id],
  );
};

export const addLog = async (workout: string, data: any, time: number) => {
  const newLog = {
    id: nanoid(),
    workout,
    data: JSON.stringify(data),
    time,
  };
  const db = await getDB();
  await db.exec(
    `INSERT INTO log (id, workout, data, time) VALUES (?, ?, ?, ?)`,
    [newLog.id, newLog.workout, newLog.data, newLog.time],
  );
  return newLog.id;
};

export const getLogs = async (workout: string) => {
  const db = await getDB();
  const logs = await db.execO("SELECT * FROM log WHERE workout = ?", [workout]);
  for (const log of logs) {
    try {
      if (log.data) log.data = JSON.parse(log.data);
    } catch {}
  }
  return logs;
};
