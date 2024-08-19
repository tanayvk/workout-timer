import { nanoid } from "nanoid";
import initWasm from "@vlcn.io/crsqlite-wasm";
import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";

let sqlite, db: any;
let resolves: Function[] = [];

export const updatedAtTrigger = (tableName: string) => `
CREATE TRIGGER IF NOT EXISTS ${tableName}_update
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
  crr = true,
  constraints = "",
) => {
  await db.exec(
    `CREATE TABLE IF NOT EXISTS ${tableName} (id primary key not null, ${columns}, created_at timestamp NOT NULL DEFAULT current_timestamp,
     updated_at timestamp NOT NULL DEFAULT current_timestamp, updates int DEFAULT 0${
       constraints ? `, ${constraints}` : ""
     })`,
  );
  await db.exec(updatedAtTrigger(tableName));
  if (crr) await db.exec(`SELECT crsql_as_crr('${tableName}')`);
};

export const createIndex = async (
  tableName: string,
  indexName: string,
  fields: string,
) => {
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_${tableName}_${indexName}
                 ON ${tableName} (${fields})`);
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
  async function first() {
    await db.exec("PRAGMA recursive_triggers = 1");
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
  async function second() {
    await createTable("peer", "name, version", false);
    await createTable("device", "name", false);
    await db.exec("INSERT INTO device (id, name) VALUES (1, 'Device Name')");
    await createIndex("exercise", "by_workout", "workout, ordering");
    await createIndex("log", "by_workout", "workout, created_at");
  },
];

const runMigrations = async () => {
  let [{ user_version } = { user_version: 0 }] = await db.execO(
    "PRAGMA user_version",
  );
  while (user_version < migrations.length) {
    await migrations[user_version]?.();
    user_version++;
    await db.exec(`PRAGMA user_version = ${user_version}`);
  }
};

export const clean = async () => {
  const databases = await indexedDB.databases();
  for (const database of databases) {
    indexedDB.deleteDatabase(database.name as string);
  }
};

export const dbInit = async () => {
  sqlite = await initWasm(() => wasmUrl);
  db = await sqlite.open("my-database.db");
  // await clean();
  await runMigrations();
  resolves.forEach((res) => res(db));
};

export const getDB = () => {
  if (db) return db;
  return new Promise((res) => resolves.push(res));
};

export const getWorkouts = async () => {
  const db = await getDB();
  return await db.execO("SELECT * FROM workout ORDER BY created_at");
};

export const createNewWorkout = async () => {
  const db = await getDB();
  const id = nanoid();
  await db.exec(`INSERT INTO workout (id, title) VALUES (?, ?)`, [
    id,
    "New Workout",
  ]);
  await addExercise(id);
  updateWorkouts();
  return id;
};

export const updateWorkoutTitle = async (id: string, title: string) => {
  const db = await getDB();
  await db.exec(`UPDATE workout SET title = ? WHERE id = ?`, [title, id]);
  updateWorkouts();
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
  updateWorkouts();
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
  const logs = await db.execO(
    "SELECT * FROM log WHERE workout = ? ORDER BY created_at",
    [workout],
  );
  for (const log of logs) {
    try {
      if (log.data) log.data = JSON.parse(log.data);
    } catch {}
  }
  return logs;
};

export const getSiteId = async () => {
  const db = await getDB();
  const [{ site_id }] = await db.execO(
    "SELECT hex(crsql_site_id()) AS site_id",
  );
  return site_id;
};

export const getPeers = async () => {
  const db = await getDB();
  const peers = await db.execO("SELECT id, name, version FROM peer");
  return peers;
};

export const getChanges = async (peers: any[]) => {
  const db = await getDB();
  const changes = [];
  for (const peer of peers) {
    changes.push(
      await db.execA(
        "SELECT * FROM crsql_changes WHERE db_version > ? AND hex(site_id) = ?",
        [peer.version || 0, peer.id],
      ),
    );
  }
  return changes.flat();
};

export const applyChanges = async (changes: any[]) => {
  if (changes.length === 0) return;
  const db = await getDB();
  const siteId = await getSiteId();
  const maxVersions: Record<string, number> = {};
  await db.tx(async (tx: any) => {
    for (const change of changes) {
      const changeSite = [...new Uint8Array(change[6])]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
      if (siteId === changeSite) {
        continue;
      }
      maxVersions[changeSite] = Math.max(
        maxVersions[changeSite] || 0,
        change[5],
      );
      await tx.exec(
        "INSERT INTO crsql_changes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        change.map((c: any) => {
          if (typeof c === "object") return new Uint8Array(c);
          return c;
        }),
      );
    }
    for (const [peer, version] of Object.entries(maxVersions)) {
      await tx.exec(
        `INSERT INTO peer (id, version) VALUES (?, ?)
         ON CONFLICT DO UPDATE SET version = MAX(IFNULL(version, 0), excluded.version)`,
        [peer, version],
      );
    }
  });
  updateWorkouts();
};

export const getVersion = async (id: string) => {
  const db = await getDB();
  const [{ version } = { version: null }] = await db.execO(
    "SELECT version FROM peer WHERE id = ?",
    [id],
  );
  return version || 0;
};

export const addOrUpdatePeer = async (id: string, update: any) => {
  const db = await getDB();
  const keys = Object.keys(update);
  const values = Object.values(update);
  await db.exec(
    `INSERT INTO peer (id${
      keys.length ? "," + keys.join(",") : ""
    }) VALUES (${Array.from(new Array(1 + keys.length))
      .map((_) => "?")
      .join(",")})
      ${keys.length ? "ON CONFLICT DO UPDATE SET" : ""} ${keys
        .map((k) => `${k} = excluded.${k}`)
        .join(",")}`,
    [id, ...values],
  );
  usePeers().value = await getPeers();
};

export const getDeviceName = async () => {
  const db = await getDB();
  const [{ name }] = await db.execO("SELECT name FROM device");
  return name;
};

export const updateDeviceName = async (name: string) => {
  const db = await getDB();
  await db.exec("UPDATE device SET name = ?", [name]);
};
