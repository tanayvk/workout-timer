import { Peer, DataConnection } from "peerjs";

type Data = {
  changes: any;
  request: any;
  name: string;
};

let peer: Peer,
  connections: Record<string, DataConnection> = {};
export const peerInit = async () => {
  const siteId = await getSiteId();
  peer = new Peer(siteId);
  peer.on("open", () => {
    startBroadcast();
  });
  peer.on("connection", (conn) => {
    handleConnection(conn);
  });
  peer.on("disconnected", () => {
    peer.reconnect();
  });
  usePeers().value = await getPeers();
};

const broadcast = async () => {
  const peers = await getPeers();
  for (const peer of peers) {
    syncPeer(peer.id);
  }
};

let broadcastTimeout: ReturnType<typeof setTimeout>;
const startBroadcast = async () => {
  clearTimeout(broadcastTimeout);
  await broadcast();
  broadcastTimeout = setTimeout(startBroadcast, 30 * 1000);
};

export async function syncPeer(id: string) {
  const conn = await getConnection(id);
  if (conn) {
    conn.send({
      request: { version: await getVersion(id) },
      name: await getDeviceName(),
    });
  }
}

async function getConnection(id: string): Promise<DataConnection | null> {
  try {
    if (connections[id]) return connections[id];
    const conn = peer.connect(id);
    await handleConnection(conn);
    return conn;
  } catch (err) {
    return null;
  }
}

const handleConnection = (conn: DataConnection): Promise<void> =>
  new Promise((res, rej) => {
    setTimeout(() => {
      rej();
    }, 10 * 1000);
    const id = conn.peer;
    connections[id] = conn;
    conn.on("data", async (d) => {
      const data = d as Data;
      if (data.changes) {
        applyChanges(id, data.changes);
      }
      if (data.request) {
        conn.send({
          changes: await getChanges(data.request.version),
        });
      }
      if (data.name) {
        addOrUpdatePeer(id, { name: data.name });
      }
    });
    conn.on("close", () => {
      delete connections[id];
    });
    conn.on("error", () => {
      rej();
      delete connections[id];
    });
    conn.on("open", () => {
      syncPeer(id);
      res();
    });
  });
