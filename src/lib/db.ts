import fs from 'fs';
import path from 'path';
import { User, Topic, Task, StudyAlarm, StudySession } from './types';
import { generateRevisionSchedule } from './spaced-repetition';
import { subDays, format } from 'date-fns';

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

// Initial seed data generator
function getInitialSeedData(): DatabaseSchema {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const day1Ago = format(subDays(today, 1), 'yyyy-MM-dd');
  const day3Ago = format(subDays(today, 3), 'yyyy-MM-dd');
  const day7Ago = format(subDays(today, 7), 'yyyy-MM-dd');
  const day15Ago = format(subDays(today, 15), 'yyyy-MM-dd');
  const day30Ago = format(subDays(today, 30), 'yyyy-MM-dd');
  const day60Ago = format(subDays(today, 60), 'yyyy-MM-dd');

  // Pre-hashed bcrypt for 'password123'
  // $2a$10$wE0vG7Qj4WwB4Wz3qX/UgeL1sZ80e90eYvUe0zDq93wJg2U9h6f4W
  const demoPasswordHash = '$2a$10$3c0767R9mKq7Xg7F9e7z5uG8D6S4Q2W0E8R6T4Y2U0I8O6P4A2S0D'; // fallback

  const demoUserId = 'usr-demo-001';

  const demoUser: User = {
    id: demoUserId,
    email: 'demo@memorise.app',
    name: 'Alex Rivera',
    passwordHash: '$2a$10$WpP901ZlE7J6fT13R4K7xOSZ3f7tK4vY8eD5PqM3o2s8wL4h6u1xK', // pre-hashed demo password
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dailyStudyTargetMinutes: 120,
    streakDays: 14,
    lastActiveDate: todayStr,
    createdAt: format(subDays(today, 90), 'yyyy-MM-dd'),
  };

  // 1. Topic: AVL Trees (studied 7 days ago -> Day 7 is DUE TODAY!)
  const topic1Schedule = generateRevisionSchedule('top-001', day7Ago);
  topic1Schedule[0].status = 'completed'; // Day 1 completed
  topic1Schedule[0].completedAt = format(subDays(today, 6), 'yyyy-MM-dd');
  topic1Schedule[1].status = 'completed'; // Day 3 completed
  topic1Schedule[1].completedAt = format(subDays(today, 4), 'yyyy-MM-dd');
  // Day 7 is due today!
  topic1Schedule[2].scheduledDate = todayStr;

  const topic1: Topic = {
    id: 'top-001',
    userId: demoUserId,
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

  // 2. Topic: Cellular Respiration & Krebs Cycle (studied 3 days ago -> Day 3 is DUE TODAY!)
  const topic2Schedule = generateRevisionSchedule('top-002', day3Ago);
  topic2Schedule[0].status = 'completed';
  topic2Schedule[0].completedAt = format(subDays(today, 2), 'yyyy-MM-dd');
  topic2Schedule[1].scheduledDate = todayStr;

  const topic2: Topic = {
    id: 'top-002',
    userId: demoUserId,
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

  // 3. Topic: Multivariable Calculus (studied 60 days ago -> Day 60 is DUE TODAY / MASTER MILESTONE!)
  const topic3Schedule = generateRevisionSchedule('top-003', day60Ago);
  topic3Schedule[0].status = 'completed';
  topic3Schedule[1].status = 'completed';
  topic3Schedule[2].status = 'completed';
  topic3Schedule[3].status = 'completed';
  topic3Schedule[4].status = 'completed';
  topic3Schedule[5].scheduledDate = todayStr; // Day 60 due today!

  const topic3: Topic = {
    id: 'top-003',
    userId: demoUserId,
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

  // 4. Topic: Microservices & Event-Driven Architecture (studied 1 day ago -> Day 1 due today!)
  const topic4Schedule = generateRevisionSchedule('top-004', day1Ago);
  topic4Schedule[0].scheduledDate = todayStr;

  const topic4: Topic = {
    id: 'top-004',
    userId: demoUserId,
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

  // Tasks
  const tasks: Task[] = [
    {
      id: 'task-001',
      userId: demoUserId,
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
      id: 'task-002',
      userId: demoUserId,
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
      id: 'task-003',
      userId: demoUserId,
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
      id: 'task-004',
      userId: demoUserId,
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
      id: 'task-005',
      userId: demoUserId,
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
      id: 'task-006',
      userId: demoUserId,
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

  // Alarms
  const alarms: StudyAlarm[] = [
    {
      id: 'alm-001',
      userId: demoUserId,
      title: 'Morning Spaced Repetition Kickoff',
      time: '08:30',
      days: [1, 2, 3, 4, 5], // Mon - Fri
      enabled: true,
      sound: 'chime',
      createdAt: format(subDays(today, 10), 'yyyy-MM-dd'),
    },
    {
      id: 'alm-002',
      userId: demoUserId,
      title: 'Afternoon Deep Work Study Block',
      time: '14:30',
      days: [1, 2, 3, 4, 5, 6],
      enabled: true,
      sound: 'bell',
      createdAt: format(subDays(today, 10), 'yyyy-MM-dd'),
    },
    {
      id: 'alm-003',
      userId: demoUserId,
      title: 'Evening Task & Retention Review',
      time: '20:00',
      days: [0, 1, 2, 3, 4, 5, 6], // Daily
      enabled: true,
      sound: 'digital',
      createdAt: format(subDays(today, 10), 'yyyy-MM-dd'),
    },
  ];

  // Past Study Sessions for analytics
  const sessions: StudySession[] = [
    {
      id: 'ses-001',
      userId: demoUserId,
      subject: 'Computer Science',
      topicTitle: 'Self-Balancing AVL Trees',
      durationSeconds: 3000, // 50 mins
      type: 'pomodoro',
      completedAt: format(subDays(today, 1), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      id: 'ses-002',
      userId: demoUserId,
      subject: 'Biochemistry',
      topicTitle: 'Citric Acid Cycle',
      durationSeconds: 1500, // 25 mins
      type: 'pomodoro',
      completedAt: format(subDays(today, 1), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      id: 'ses-003',
      userId: demoUserId,
      subject: 'System Design',
      topicTitle: 'Distributed Systems',
      durationSeconds: 3600, // 60 mins
      type: 'stopwatch',
      completedAt: format(subDays(today, 1), 'yyyy-MM-dd 22:30:00'),
    },
    {
      id: 'ses-004',
      userId: demoUserId,
      subject: 'Mathematics',
      topicTitle: 'Vector Calculus',
      durationSeconds: 2700, // 45 mins
      type: 'countdown',
      completedAt: format(subDays(today, 2), 'yyyy-MM-dd HH:mm:ss'),
    },
    {
      id: 'ses-005',
      userId: demoUserId,
      subject: 'Computer Science',
      topicTitle: 'Graph Theory',
      durationSeconds: 3600, // 60 mins
      type: 'pomodoro',
      completedAt: format(subDays(today, 3), 'yyyy-MM-dd HH:mm:ss'),
    },
  ];

  return {
    users: [demoUser],
    topics: [topic1, topic2, topic3, topic4],
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
    return {
      users: Array.isArray(data.users) ? data.users : [],
      topics: Array.isArray(data.topics) ? data.topics : [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      alarms: Array.isArray(data.alarms) ? data.alarms : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : [],
    };
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
}

// User Helpers
export function findUserByEmail(email: string): User | undefined {
  const db = readDatabase();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
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
  return db.topics.filter((t) => t.userId === userId);
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
