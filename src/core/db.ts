// IndexedDB database management for project persistence

const DB_NAME = 'SwimlaneDB';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';

export interface ProjectData {
    name: string;
    lastModified: number;
    data: {
        pools: any[];
        shapes: any;
        connections: any[];
    };
}

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve(db);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;

            // Create projects store
            if (!database.objectStoreNames.contains(PROJECTS_STORE)) {
                const projectStore = database.createObjectStore(PROJECTS_STORE, { keyPath: 'name' });
                projectStore.createIndex('lastModified', 'lastModified', { unique: false });
            }
        };
    });
};

export const saveProject = async (name: string, data: ProjectData['data']): Promise<void> => {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([PROJECTS_STORE], 'readwrite');
        const store = transaction.objectStore(PROJECTS_STORE);

        const projectData: ProjectData = {
            name,
            lastModified: Date.now(),
            data
        };

        const request = store.put(projectData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const loadProject = async (name: string): Promise<ProjectData | null> => {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([PROJECTS_STORE], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE);
        const request = store.get(name);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
};

export const listProjects = async (): Promise<ProjectData[]> => {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([PROJECTS_STORE], 'readonly');
        const store = transaction.objectStore(PROJECTS_STORE);
        const request = store.getAll();

        request.onsuccess = () => {
            const projects = request.result as ProjectData[];
            // Sort by last modified (newest first)
            projects.sort((a, b) => b.lastModified - a.lastModified);
            resolve(projects);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteProject = async (name: string): Promise<void> => {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([PROJECTS_STORE], 'readwrite');
        const store = transaction.objectStore(PROJECTS_STORE);
        const request = store.delete(name);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteAllProjects = async (): Promise<void> => {
    const database = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([PROJECTS_STORE], 'readwrite');
        const store = transaction.objectStore(PROJECTS_STORE);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
