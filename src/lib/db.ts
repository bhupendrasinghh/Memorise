import fs from 'fs';
import path from 'path';
import { User, Topic, Task, StudyAlarm, StudySession } from './types';
import { generateRevisionSchedule } from './spaced-repetition';
import { subDays, format } from 'date-fns';
import { isSupabaseConfigured, persistRemoteState } from './supabase';

export interface DatabaseSchema {
  users: User[];
  topics: Topic[];
  tasks: Task[];
  alarms: StudyAlarm[];
  sessions: StudySession[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export const BHUPENDRA_USER_ID = 'usr-1792436246351-8ejk3';
export const DEMO_USER_ID = 'usr-demo-001';

// Starter content generator for any user ID
export function generateStarterTopics(userId: string): Topic[] {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const day1Ago = format(subDays(today, 1), 'yyyy-MM-dd');
  const day3Ago = format(subDays(today, 3), 'yyyy-MM-dd');
  const day7Ago = format(subDays(today, 7), 'yyyy-MM-dd');
  const day60Ago = format(subDays(today, 60), 'yyyy-MM-dd');

  const prefix = userId === BHUPENDRA_USER_ID ? 'top-bhu' : userId === DEMO_USER_ID ? 'top' : `top-${userId.substring(0, 8)}`;

  // 1. AVL Trees
  const topic1Schedule = generateRevisionSchedule(`${prefix}-001`, day7Ago);
  topic1Schedule[2].scheduledDate = todayStr;

  const topic1: Topic = {
    id: `${prefix}-001`,
    userId,
    title: 'Self-Balancing AVL Trees & Rotations',
    subject: 'Computer Science',
    content: `# AVL Tree Properties & Invariants
- **Height-balancing condition**: For every node, $|height(left) - height(right)| \\le 1$.
- **Rotations**:
  - LL: Single Right Rotation
  - RR: Single Left Rotation
  - LR: Left-Right Double Rotation
  - RL: Right-Left Double Rotation
- **Time Complexity**: Search, Insert, and Delete are guaranteed $O(\\log n)$.
- **Rebalancing logic**: Check balance factor during bottom-up unwinding of insertion.`,
    tags: ['Data Structures', 'Algorithms', 'Trees'],
    initialStudyDate: day7Ago,
    createdAt: day7Ago,
    updatedAt: day7Ago,
    difficulty: 'medium',
    revisions: topic1Schedule,
  };

  // 2. Cellular Respiration & Krebs Cycle
  const topic2Schedule = generateRevisionSchedule(`${prefix}-002`, day3Ago);
  topic2Schedule[1].scheduledDate = todayStr;

  const topic2: Topic = {
    id: `${prefix}-002`,
    userId,
    title: 'Cellular Respiration: Citric Acid Cycle & Oxidative Phosphorylation',
    subject: 'Biochemistry',
    content: `# The Citric Acid (Krebs) Cycle
- **Location**: Mitochondrial matrix.
- **Starting substrate**: Acetyl-CoA (2 carbons) binds Oxaloacetate (4 carbons) to yield Citrate (6 carbons) via Citrate Synthase.
- **Yield per Acetyl-CoA**:
  - 3 NADH (yielding ~7.5 ATP)
  - 1 FADH2 (yielding ~1.5 ATP)
  - 1 GTP / ATP
  - 2 CO2 released
- **Key Regulators**: Isocitrate dehydrogenase (inhibited by high ATP/NADH; stimulated by ADP/NAD+).`,
    tags: ['Biology', 'Metabolism', 'Mitochondria'],
    initialStudyDate: day3Ago,
    createdAt: day3Ago,
    updatedAt: day3Ago,
    difficulty: 'hard',
    revisions: topic2Schedule,
  };

  // 3. Vector Calculus
  const topic3Schedule = generateRevisionSchedule(`${prefix}-003`, day60Ago);
  topic3Schedule[5].scheduledDate = todayStr;

  const topic3: Topic = {
    id: `${prefix}-003`,
    userId,
    title: 'Vector Calculus: Divergence, Curl & Green’s Theorem',
    subject: 'Mathematics',
    content: `# Fundamental Theorems of Vector Calculus
- **Green's Theorem**: Relates line integral around closed curve $C$ to double integral over region $D$:
  $$\\oint_C (L dx + M dy) = \\iint_D \\left( \\frac{\\partial M}{\\partial x} - \\frac{\\partial L}{\\partial y} \\right) dA$$
- **Divergence**: Measure of vector field's outward flux per unit volume: $\\nabla \\cdot \\mathbf{F}$.
- **Curl**: Measure of infinitesimal rotation: $\\nabla \\times \\mathbf{F}$.`,
    tags: ['Calculus', 'Vector Analysis', 'Physics'],
    initialStudyDate: day60Ago,
    createdAt: day60Ago,
    updatedAt: day60Ago,
    difficulty: 'hard',
    revisions: topic3Schedule,
  };

  // 4. Distributed Systems
  const topic4Schedule = generateRevisionSchedule(`${prefix}-004`, day1Ago);
  topic4Schedule[0].scheduledDate = todayStr;

  const topic4: Topic = {
    id: `${prefix}-004`,
    userId,
    title: 'Distributed Systems: Outbox Pattern & Idempotency',
    subject: 'System Design',
    content: `# Transactional Outbox Pattern
- **Problem**: Dual-write problem when updating SQL database and publishing message to Kafka / RabbitMQ.
- **Solution**: Save message payload inside an \`outbox\` table in the same DB transaction.
- **Debezium / CDC**: Polling publisher or Change Data Capture reads from the outbox and delivers to the event bus.
- **Idempotency keys**: Cache request keys in Redis with TTL to prevent duplicate processing.`,
    tags: ['Architecture', 'Distributed Systems', 'Kafka'],
    initialStudyDate: day1Ago,
    createdAt: day1Ago,
    updatedAt: day1Ago,
    difficulty: 'medium',
    revisions: topic4Schedule,
  };

  return [topic1, topic2, topic3, topic4];
}

export function generateStarterTasks(userId: string): Task[] {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const prefix = userId === BHUPENDRA_USER_ID ? 'task-bhu' : userId === DEMO_USER_ID ? 'task' : `task-${userId.substring(0, 8)}`;

  const baseTasks: Task[] = [
    {
      id: `${prefix}-001`,
      userId,
      title: 'Complete Day 7 AVL Tree Rotations practice set',
      description: 'Implement LR and RL double rotations in TypeScript and test edge cases with single node heights.',
      type: 'daily',
      priority: 'urgent',
      category: 'Revision',
      deadline: todayStr,
      status: 'pending',
      subtasks: [
        { id: 'sub-1', title: 'Write node height calculator function', completed: true },
        { id: 'sub-2', title: 'Implement rotateRight & rotateLeft', completed: true },
        { id: 'sub-3', title: 'Verify rebalancing on 10 random insertions', completed: false },
      ],
      createdAt: format(subDays(today, 1), 'yyyy-MM-dd'),
    },
    {
      id: `${prefix}-002`,
      userId,
      title: 'Review Krebs cycle rate-limiting enzymes flashcards',
      description: 'Memorize regulation factors for Isocitrate dehydrogenase and Alpha-ketoglutarate dehydrogenase.',
      type: 'daily',
      priority: 'high',
      category: 'Study',
      deadline: todayStr,
      status: 'in_progress',
      subtasks: [
        { id: 'sub-4', title: 'Active recall pass 1 (unassisted)', completed: true },
        { id: 'sub-5', title: 'Draw full cycle from memory', completed: false },
      ],
      createdAt: todayStr,
    },
    {
      id: `${prefix}-003`,
      userId,
      title: 'Finish 2 Pomodoro focus sessions on Distributed Systems',
      description: 'Focus deeply for 50 minutes without checking social media or email.',
      type: 'daily',
      priority: 'medium',
      category: 'Study',
      deadline: todayStr,
      status: 'pending',
      subtasks: [],
      createdAt: todayStr,
    },
    {
      id: `${prefix}-004`,
      userId,
      title: 'Solve 15 Hard LeetCode Tree & Graph problems',
      description: 'Focus on Topological Sort, Dijkstra, and Tarjan’s strongly connected components.',
      type: 'weekly',
      priority: 'high',
      category: 'Project',
      deadline: format(subDays(today, -3), 'yyyy-MM-dd'),
      status: 'in_progress',
      subtasks: [
        { id: 'sub-6', title: 'Solve 5 Tree traversal problems', completed: true },
        { id: 'sub-7', title: 'Solve 5 Graph DFS/BFS questions', completed: true },
        { id: 'sub-8', title: 'Solve 5 Shortest-path Dijkstra questions', completed: false },
      ],
      createdAt: format(subDays(today, 4), 'yyyy-MM-dd'),
    },
    {
      id: `${prefix}-005`,
      userId,
      title: 'Submit Chapter 3 Vector Calculus assignment',
      description: 'Check divergence theorem problem sets with peer group.',
      type: 'weekly',
      priority: 'medium',
      category: 'Study',
      deadline: format(subDays(today, -2), 'yyyy-MM-dd'),
      status: 'pending',
      subtasks: [],
      createdAt: format(subDays(today, 2), 'yyyy-MM-dd'),
    },
    {
      id: `${prefix}-006`,
      userId,
      title: 'Complete 30-day Spaced Repetition mastery milestone for all 5 topics',
      description: 'Maintain 90%+ retention score across all active subjects.',
      type: 'monthly',
      priority: 'urgent',
      category: 'Revision',
      deadline: format(subDays(today, -15), 'yyyy-MM-dd'),
      status: 'in_progress',
      subtasks: [
        { id: 'sub-9', title: 'AVL Trees Day 15 review', completed: true },
        { id: 'sub-10', title: 'Krebs Cycle Day 15 review', completed: false },
        { id: 'sub-11', title: 'Calculus Day 30 review', completed: true },
      ],
      createdAt: format(subDays(today, 15), 'yyyy-MM-dd'),
    },
  ];

  if (userId === BHUPENDRA_USER_ID) {
    baseTasks.push(
      {
        id: 'task-1792436501605-nwad',
        userId,
        title: '8-10 hrs',
        description: 'min 8 hrs study',
        type: 'daily',
        priority: 'high',
        category: 'Study',
        deadline: todayStr,
        status: 'pending',
        subtasks: [],
        createdAt: todayStr,
      },
      {
        id: 'task-1792436548790-8akl',
        userId,
        title: '3-4 bottle water',
        description: '',
        type: 'daily',
        priority: 'high',
        category: 'Personal',
        deadline: todayStr,
        status: 'pending',
        subtasks: [],
        createdAt: todayStr,
      }
    );
  }

  return baseTasks;
}

export function generateStarterAlarms(userId: string): StudyAlarm[] {
  const today = new Date();
  const prefix = userId === BHUPENDRA_USER_ID ? 'alm-bhu' : userId === DEMO_USER_ID ? 'alm' : `alm-${userId.substring(0, 8)}`;

  return [
    {
      id: `${prefix}-001`,
      userId,
      title: 'Morning Spaced Repetition Kickoff',
      time: '08:30',
      days: [1, 2, 3, 4, 5],
      enabled: true,
      sound: 'chime',
      createdAt: format(subDays(today, 10), 'yyyy-MM-dd'),
    },
    {
      id: `${prefix}-002`,
      userId,
      title: 'Afternoon Deep Work Study Block',
      time: '14:30',
      days: [1, 2, 3, 4, 5, 6],
      enabled: true,
      sound: 'bell',
      createdAt: format(subDays(today, 10), 'yyyy-MM-dd'),
    },
    {
      id: `${prefix}-003`,
      userId,
      title: 'Evening Task & Retention Review',
      time: '20:00',
      days: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      sound: 'digital',
      createdAt: format(subDays(today, 10), 'yyyy-MM-dd'),
    },
  ];
}

// Seed starter topics, tasks, and alarms for a new user if missing
export function seedUserStarterContent(userId: string): void {
  const db = readDatabase();
  let changed = false;

  const existingTopics = db.topics.filter((t) => t.userId === userId);
  if (existingTopics.length === 0) {
    const newTopics = generateStarterTopics(userId);
    db.topics.push(...newTopics);
    changed = true;
  }

  const existingTasks = db.tasks.filter((t) => t.userId === userId);
  if (existingTasks.length === 0) {
    const newTasks = generateStarterTasks(userId);
    db.tasks.push(...newTasks);
    changed = true;
  }

  const existingAlarms = db.alarms.filter((a) => a.userId === userId);
  if (existingAlarms.length === 0) {
    const newAlarms = generateStarterAlarms(userId);
    db.alarms.push(...newAlarms);
    changed = true;
  }

  if (changed) {
    writeDatabase(db);
  }
}

// Initial seed data generator
function getInitialSeedData(): DatabaseSchema {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // Bhupendra Singh (Primary user)
  const bhupendraUser: User = {
    id: BHUPENDRA_USER_ID,
    name: 'Bhupendra Singh',
    email: 'bhupendrasingh952891@gmail.com',
    passwordHash: '$2b$10$.Wmd7rXm1gGXTfU4zCtoveOerzJKWeZAweasEdd6kbIzYOnmrCEyC', // password123
    dailyStudyTargetMinutes: 120,
    streakDays: 1,
    lastActiveDate: todayStr,
    createdAt: '2026-10-20',
  };

  // Demo user
  const demoUser: User = {
    id: DEMO_USER_ID,
    email: 'demo@memorise.app',
    name: 'Alex Rivera',
    passwordHash: '$2a$10$WpP901ZlE7J6fT13R4K7xOSZ3f7tK4vY8eD5PqM3o2s8wL4h6u1xK', // password123
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dailyStudyTargetMinutes: 120,
    streakDays: 1,
    lastActiveDate: todayStr,
    createdAt: format(subDays(today, 90), 'yyyy-MM-dd'),
  };

  const topics: Topic[] = [
    ...generateStarterTopics(BHUPENDRA_USER_ID),
    ...generateStarterTopics(DEMO_USER_ID),
  ];

  const tasks: Task[] = [
    ...generateStarterTasks(BHUPENDRA_USER_ID),
    ...generateStarterTasks(DEMO_USER_ID),
  ];

  const alarms: StudyAlarm[] = [
    ...generateStarterAlarms(BHUPENDRA_USER_ID),
    ...generateStarterAlarms(DEMO_USER_ID),
  ];

  const sessions: StudySession[] = [];

  return {
    users: [bhupendraUser, demoUser],
    topics,
    tasks,
    alarms,
    sessions,
  };
}

export function readDatabase(): DatabaseSchema {
  ensureDataDir();
  if (!fs.existsSync(DB_FILE)) {
    const seed = getInitialSeedData();
    writeDatabase(seed);
    return seed;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    const db: DatabaseSchema = {
      users: Array.isArray(data.users) ? data.users : [],
      topics: Array.isArray(data.topics) ? data.topics : [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      alarms: Array.isArray(data.alarms) ? data.alarms : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
    };

    // Ensure Bhupendra user always exists
    const hasBhupendra = db.users.some(u => u.email.toLowerCase() === 'bhupendrasingh952891@gmail.com');
    if (!hasBhupendra) {
      const seed = getInitialSeedData();
      const bhu = seed.users.find(u => u.email.toLowerCase() === 'bhupendrasingh952891@gmail.com');
      if (bhu) {
        db.users.push(bhu);
        writeDatabase(db);
      }
    }

    return db;
  } catch (err) {
    console.error('Error reading DB, re-seeding:', err);
    const seed = getInitialSeedData();
    writeDatabase(seed);
    return seed;
  }
}

export function writeDatabase(data: DatabaseSchema): void {
  ensureDataDir();
  const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);

  // Background Cloud Sync if Supabase is connected
  if (isSupabaseConfigured) {
    persistRemoteState(data).catch((err) => {
      console.warn('Background Supabase persistence failed:', err);
    });
  }
}

// User Helpers
export function findUserByEmail(email: string): User | undefined {
  if (!email) return undefined;
  const clean = email.trim().toLowerCase();
  const db = readDatabase();
  return db.users.find((u) => u.email.trim().toLowerCase() === clean);
}

export function findUserById(id: string): User | undefined {
  const db = readDatabase();
  return db.users.find((u) => u.id === id);
}

export function createUser(user: User): User {
  const db = readDatabase();
  db.users.push(user);
  writeDatabase(db);
  return user;
}

export function updateUser(id: string, updates: Partial<User>): User | null {
  const db = readDatabase();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...updates };
  writeDatabase(db);
  return db.users[idx];
}

// Topics Helpers
export function getUserTopics(userId: string): Topic[] {
  const db = readDatabase();
  let userTopics = db.topics.filter((t) => t.userId === userId);
  if (userTopics.length === 0) {
    seedUserStarterContent(userId);
    const updatedDb = readDatabase();
    userTopics = updatedDb.topics.filter((t) => t.userId === userId);
  }
  return userTopics;
}

export function createTopic(topic: Topic): Topic {
  const db = readDatabase();
  db.topics.push(topic);
  writeDatabase(db);
  return topic;
}

export function updateTopic(id: string, userId: string, updates: Partial<Topic>): Topic | null {
  const db = readDatabase();
  const idx = db.topics.findIndex((t) => t.id === id && t.userId === userId);
  if (idx === -1) return null;
  db.topics[idx] = { ...db.topics[idx], ...updates, updatedAt: new Date().toISOString() };
  writeDatabase(db);
  return db.topics[idx];
}

export function deleteTopic(id: string, userId: string): boolean {
  const db = readDatabase();
  const initialLen = db.topics.length;
  db.topics = db.topics.filter((t) => !(t.id === id && t.userId === userId));
  if (db.topics.length !== initialLen) {
    writeDatabase(db);
    return true;
  }
  return false;
}

// Task Helpers
export function getUserTasks(userId: string): Task[] {
  const db = readDatabase();
  return db.tasks.filter((t) => t.userId === userId);
}

export function createTask(task: Task): Task {
  const db = readDatabase();
  db.tasks.push(task);
  writeDatabase(db);
  return task;
}

export function updateTask(id: string, userId: string, updates: Partial<Task>): Task | null {
  const db = readDatabase();
  const idx = db.tasks.findIndex((t) => t.id === id && t.userId === userId);
  if (idx === -1) return null;
  db.tasks[idx] = { ...db.tasks[idx], ...updates };
  writeDatabase(db);
  return db.tasks[idx];
}

export function deleteTask(id: string, userId: string): boolean {
  const db = readDatabase();
  const initialLen = db.tasks.length;
  db.tasks = db.tasks.filter((t) => !(t.id === id && t.userId === userId));
  if (db.tasks.length !== initialLen) {
    writeDatabase(db);
    return true;
  }
  return false;
}

// Alarm Helpers
export function getUserAlarms(userId: string): StudyAlarm[] {
  const db = readDatabase();
  return db.alarms.filter((a) => a.userId === userId);
}

export function createAlarm(alarm: StudyAlarm): StudyAlarm {
  const db = readDatabase();
  db.alarms.push(alarm);
  writeDatabase(db);
  return alarm;
}

export function updateAlarm(id: string, userId: string, updates: Partial<StudyAlarm>): StudyAlarm | null {
  const db = readDatabase();
  const idx = db.alarms.findIndex((a) => a.id === id && a.userId === userId);
  if (idx === -1) return null;
  db.alarms[idx] = { ...db.alarms[idx], ...updates };
  writeDatabase(db);
  return db.alarms[idx];
}

export function deleteAlarm(id: string, userId: string): boolean {
  const db = readDatabase();
  const initialLen = db.alarms.length;
  db.alarms = db.alarms.filter((a) => !(a.id === id && a.userId === userId));
  if (db.alarms.length !== initialLen) {
    writeDatabase(db);
    return true;
  }
  return false;
}

// Sessions Helpers
export function getUserSessions(userId: string): StudySession[] {
  const db = readDatabase();
  return db.sessions.filter((s) => s.userId === userId);
}

export function createSession(session: StudySession): StudySession {
  const db = readDatabase();
  db.sessions.push(session);
  writeDatabase(db);
  return session;
}
