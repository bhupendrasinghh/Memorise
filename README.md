# Memorise — Personal Productivity & Smart Revision Website

A complete, modern, responsive full-stack platform built with **Next.js (App Router), TypeScript, Tailwind CSS, Web Audio API, and PWA Web Workers**.

![Memorise Preview](https://images.unsplash.com/photo-1507842229451-7f01be8510ab?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Key Features

### 1. Smart Spaced Repetition (Day 1, 3, 7, 15, 30, 60)
- **Automatic Scheduling**: Automatically schedules intervals for **Day 1, Day 3, Day 7, Day 15, Day 30, and Day 60** upon saving any topic.
- **Active Recall Interface**: Built-in toggle to hide notes during review to test unassisted memory before revealing solutions.
- **SM-2 Difficulty Evaluation**: Rate your retention (*Again, Hard, Good, Easy*). Rating *Again* resets the interval and schedules an immediate follow-up review for tomorrow.
- **Mastery Badges**: Permanently marks topics that complete their 60-day interval as *Mastered*.
- **Categorized Queues**: Revisions grouped into *Due Today*, *Overdue* (with pulsing alerts), *Upcoming*, and *Completed*.

### 2. Task Management
- **Timeframes**: Organize tasks under **Daily Tasks**, **Weekly Goals**, and **Monthly Milestones**.
- **Interactive Checklists**: Multi-level subtasks with live progress bar tracking (e.g. `2/3 subtasks done`).
- **Priority & Categorization**: *Low, Medium, High*, and *Urgent* tags, along with categories (*Study, Revision, Project, Personal, Work*).
- **Celebration Feedback**: Confetti burst effects and audio chimes upon completion.

### 3. Automatic Performance Dashboard & Analytics
- **Dynamic Productivity Percentage**: Automatically calculated using a weighted composite formula:
  $$\text{Productivity Score} = 0.4 \times \text{RevisionRate} + 0.4 \times \text{TaskRate} + 0.2 \times \text{FocusGoalRate}$$
- **Interactive 7-Day Trend Chart**: SVG bar chart with score tooltips, daily focus time, completed tasks, and revision counts.
- **Study Streak Tracker**: Flame badge tracking active daily streaks.
- **Subject Mastery Breakdown**: Progress bars and distribution of topics/revisions by field of study (*Computer Science, Biochemistry, Mathematics, Physics, etc.*).
- **Session History Log**: Tabular record of all completed focus sessions with duration and timestamps.

### 4. Stopwatch, Pomodoro Focus Timer & Audio Alarms
- **Precision Stopwatch**: Millisecond resolution with Start, Pause, Resume, Reset, and a Lap table that automatically flags the fastest (⚡) and slowest (🐢) laps.
- **Countdown Pomodoro Focus Timer**: Presets for 25m Pomodoro, 50m Deep Work, 15m Sprint, 5m Break, and Custom minutes. Automatically logs study time to the database on completion.
- **Study Alarm Clock**: Schedule alarms with specific times (`HH:mm`), days of the week, and sound presets (*chime, bell, digital beep, gong*).
- **Pure Web Audio Synthesizer**: 100% self-contained audio synthesis with zero external MP3 dependencies.

### 5. Authentication & Database Persistence
- **Zero-Setup Atomic Database**: File-backed storage in `data/db.json` with atomic writes.
- **Demo Mode**: One-click instant login via demo account (`demo@memorise.app` / `password123`) or fresh registration.
- **Per-User Isolation**: Every topic, task, revision, and alarm is indexed by `userId`.
- **Supabase Ready**: Direct PostgreSQL schema with Row-Level Security (RLS) policies provided in `supabase/schema.sql`.

### 6. Notifications & Mobile Responsiveness
- **Cross-Platform Notifications**: Web Notification API support with service worker dispatch.
- **Platform Limitations Guide**: Clear explanations of notification behavior on macOS Safari, Android PWA, and iOS Add-to-Home-Screen requirements.
- **Dark & Light Mode**: Smooth theme toggle with `localStorage` memory and tailored CSS color tokens.
- **Mobile Bottom Navigation**: Ergonomic thumb navigation for mobile screens.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node.js 26)
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/bhupendrasinghh/Tracker.git
cd Tracker

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Instant Demo Credentials
- **Email**: `demo@memorise.app`
- **Password**: `password123`
*(Or click "Demo Account" directly on the navbar for 1-click access)*

---

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **Icons & Effects**: Lucide React, Canvas Confetti
- **Audio**: Web Audio API (zero external assets required)
- **Database**: Atomic JSON Database engine (`data/db.json`) + Supabase SQL schema (`supabase/schema.sql`)
- **PWA**: Web App Manifest & Service Worker (`public/sw.js`)

---

## 📄 License
MIT License. Built for deep focus and structured learning.
