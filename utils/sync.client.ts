import Peer from "peerjs";
import type { DataConnection } from "peerjs";

type Data = {
  changes: any;
  peers: any[];
  name: string;
};

let peer: Peer,
  connections: Record<string, DataConnection> = {},
  siteId: string,
  peers: any[],
  peersSet = new Set();
export const peerInit = async () => {
  siteId = await getSiteId();
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
  peers = await getPeers();
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
  if (!peers) peers = await getPeers();
  const conn = await getConnection(id);
  if (conn) {
    conn.send({
      peers,
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
        applyChanges(data.changes);
      }
      if (data.peers) {
        for (const peer of data.peers) {
          if (peer.id !== siteId && !peersSet.has(peer.id)) {
            peersSet.add(peer.id);
            addOrUpdatePeer(peer.id, { name: peer.name });
            syncPeer(peer.id);
          }
        }
        conn.send({
          changes: await getChanges(data.peers),
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
