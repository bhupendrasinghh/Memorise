'use client';

import React, { useState, useEffect } from 'react';
import { LeaderboardUser } from '@/lib/types';
import { Trophy, Flame, Medal, Award, Crown, Repeat, CheckSquare, Clock, Zap, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundEngine } from '@/lib/audio';

export function LeaderboardView() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
  const [timeframe, setTimeframe] = useState<'all-time' | 'weekly'>('all-time');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.leaderboard || []);
        setCurrentUser(data.currentUser || null);
      })
      .catch((err) => console.error('Failed to load leaderboard:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleCelebrateTop = () => {
    soundEngine.playSuccess();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.5 },
    });
  };

  const top1 = users[0];
  const top2 = users[1];
  const top3 = users[2];

  if (loading) {
    return (
      <div className="p-8 rounded-3xl glass border border-slate-200 dark:border-slate-800 animate-pulse h-96 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-10 h-10 text-indigo-400 mx-auto mb-2 animate-bounce" />
          <p className="text-xs text-slate-500 font-semibold">Loading Global Leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-700 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-300" />
            <span>Global Productivity & Spaced Recall Standings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Scholars Leaderboard 🏆
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1 max-w-xl">
            Compete with students worldwide based on active learning streaks, spaced repetitions completed, and study focus hours.
          </p>
        </div>

        <button
          onClick={handleCelebrateTop}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-white text-indigo-950 font-bold text-xs shadow-lg hover:bg-amber-50 transition-all transform active:scale-95 flex items-center gap-1.5 relative z-10"
        >
          <Sparkles className="w-4 h-4 text-amber-500" /> Celebrate Leaders
        </button>
      </div>

      {/* Your Standing Banner */}
      {currentUser && (
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center shadow-md">
              #{currentUser.rank}
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                Your Current Global Standing
              </p>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {currentUser.name} — Rank #{currentUser.rank} of {users.length} Scholars
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold shrink-0">
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Flame className="w-4 h-4" />
              <span>{currentUser.streakDays}d Streak</span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              <Award className="w-4 h-4" />
              <span>{currentUser.productivityScore}% Score</span>
            </div>
          </div>
        </div>
      )}

      {/* Real Scholars Podium (Adapts to 1, 2, or 3+ users) */}
      {users.length === 1 && top1 && (
        <div className="max-w-xs mx-auto text-center pt-6 pb-4">
          <div className="flex flex-col items-center p-6 rounded-3xl glass border border-amber-400/40 shadow-xl bg-gradient-to-b from-amber-500/10 to-transparent">
            <Crown className="w-9 h-9 text-amber-500 mb-2 animate-bounce" />
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-full border-4 border-amber-400 overflow-hidden shadow-xl mx-auto ring-4 ring-amber-400/20">
                {top1.avatar ? (
                  <img src={top1.avatar} alt={top1.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-2xl">
                    {top1.name[0]}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-2 -right-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-amber-950 text-xs font-black shadow-md">
                1st
              </span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {top1.name} {top1.isCurrentUser && '(You)'}
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1 justify-center mt-1">
              <Flame className="w-4 h-4 fill-current" /> {top1.streakDays}d Streak • {top1.productivityScore}% Score
            </p>
            <div className="w-full h-20 rounded-2xl bg-gradient-to-t from-amber-200 via-amber-100 to-amber-50 dark:from-amber-950/60 dark:via-amber-900/40 dark:to-amber-800/30 mt-4 flex items-center justify-center border-t-2 border-amber-400 shadow-sm">
              <Trophy className="w-8 h-8 text-amber-500" />
            </div>
          </div>
        </div>
      )}

      {users.length === 2 && (
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto items-end pt-6 pb-4 text-center">
          {/* 1st Place */}
          {top1 && (
            <div className="flex flex-col items-center p-4 rounded-2xl glass border border-amber-400/40">
              <Crown className="w-7 h-7 text-amber-500 mb-1 animate-bounce" />
              <div className="w-16 h-16 rounded-full border-4 border-amber-400 overflow-hidden shadow-lg mx-auto mb-2">
                {top1.avatar ? (
                  <img src={top1.avatar} alt={top1.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                    {top1.name[0]}
                  </div>
                )}
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate max-w-[120px]">
                {top1.name}
              </p>
              <p className="text-[10px] text-amber-500 font-bold">{top1.productivityScore}% Score</p>
              <div className="w-full h-24 rounded-t-xl bg-amber-100 dark:bg-amber-950/60 mt-2 flex items-center justify-center border-t-2 border-amber-400">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
            </div>
          )}

          {/* 2nd Place */}
          {top2 && (
            <div className="flex flex-col items-center p-4 rounded-2xl glass border border-slate-300 dark:border-slate-700">
              <div className="w-14 h-14 rounded-full border-3 border-slate-300 dark:border-slate-600 overflow-hidden shadow-md mx-auto mb-2">
                {top2.avatar ? (
                  <img src={top2.avatar} alt={top2.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold">
                    {top2.name[0]}
                  </div>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                {top2.name}
              </p>
              <p className="text-[10px] text-indigo-500 font-semibold">{top2.productivityScore}% Score</p>
              <div className="w-full h-18 rounded-t-xl bg-slate-200 dark:bg-slate-800 mt-2 flex items-center justify-center border-t border-slate-300 dark:border-slate-600">
                <Medal className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          )}
        </div>
      )}

      {users.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end pt-8 pb-4 max-w-2xl mx-auto text-center">
          {/* 2nd Place */}
          {top2 && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-slate-300 dark:border-slate-600 overflow-hidden shadow-md mx-auto">
                  {top2.avatar ? (
                    <img src={top2.avatar} alt={top2.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-300 text-slate-700 flex items-center justify-center font-bold">
                      {top2.name[0]}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-2 -right-1 px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-extrabold border border-slate-300">
                  2nd
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                {top2.name}
              </p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {top2.productivityScore}% Score
              </p>
              <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-t from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700/80 mt-2 flex items-center justify-center border-t border-x border-slate-300 dark:border-slate-600">
                <Medal className="w-6 h-6 text-slate-400" />
              </div>
            </div>
          )}

          {/* 1st Place (Gold Podium) */}
          {top1 && (
            <div className="flex flex-col items-center">
              <Crown className="w-7 h-7 text-amber-500 mb-1 animate-bounce" />
              <div className="relative mb-2">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-amber-400 overflow-hidden shadow-xl mx-auto ring-4 ring-amber-400/20">
                  {top1.avatar ? (
                    <img src={top1.avatar} alt={top1.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                      {top1.name[0]}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-2 -right-1 px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 text-[11px] font-black shadow-md">
                  1st
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[120px]">
                {top1.name}
              </p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-0.5 justify-center">
                <Flame className="w-3.5 h-3.5 fill-current" /> {top1.streakDays}d Streak
              </p>
              <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-t from-amber-200 via-amber-100 to-amber-50 dark:from-amber-950/60 dark:via-amber-900/40 dark:to-amber-800/30 mt-2 flex items-center justify-center border-t-2 border-x-2 border-amber-400 shadow-md">
                <Trophy className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-amber-700/60 overflow-hidden shadow-md mx-auto">
                  {top3.avatar ? (
                    <img src={top3.avatar} alt={top3.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-amber-700 text-white flex items-center justify-center font-bold">
                      {top3.name[0]}
                    </div>
                  )}
                </div>
                <span className="absolute -bottom-2 -right-1 px-1.5 py-0.5 rounded-full bg-amber-700 text-white text-[10px] font-extrabold">
                  3rd
                </span>
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                {top3.name}
              </p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                {top3.productivityScore}% Score
              </p>
              <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-t from-amber-100/70 to-amber-50 dark:from-slate-800 dark:to-slate-800/60 mt-2 flex items-center justify-center border-t border-x border-amber-700/30">
                <Medal className="w-5 h-5 text-amber-700" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete Rankings Table */}
      <div className="p-6 rounded-3xl glass border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <span>All Scholars Standings</span>
            <span className="text-xs font-normal text-slate-500">({users.length} active)</span>
          </h3>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
            <button
              onClick={() => setTimeframe('all-time')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                timeframe === 'all-time'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All-Time
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                timeframe === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              This Week
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 px-3">Rank</th>
                <th className="pb-3 px-3">Scholar</th>
                <th className="pb-3 px-3 text-center">Streak</th>
                <th className="pb-3 px-3 text-center">Score</th>
                <th className="pb-3 px-3 text-center">Revisions</th>
                <th className="pb-3 px-3 text-center">Focus Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {users.map((u) => {
                const isUser = u.isCurrentUser;
                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isUser
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-bold'
                        : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-bold">
                        {u.rank === 1 && <span className="text-amber-500 text-base">🥇</span>}
                        {u.rank === 2 && <span className="text-slate-400 text-base">🥈</span>}
                        {u.rank === 3 && <span className="text-amber-700 text-base">🥉</span>}
                        {u.rank > 3 && (
                          <span className="w-6 text-center text-slate-500 font-mono">#{u.rank}</span>
                        )}
                      </div>
                    </td>

                    {/* Scholar info */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name[0]
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-900 dark:text-white font-bold">{u.name}</span>
                            {isUser && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-600 text-white font-bold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400">{u.badge}</span>
                        </div>
                      </div>
                    </td>

                    {/* Streak */}
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold text-[11px]">
                        <Flame className="w-3 h-3 fill-current text-amber-500" />
                        {u.streakDays}d
                      </span>
                    </td>

                    {/* Productivity Score */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                        {u.productivityScore}%
                      </span>
                    </td>

                    {/* Revisions Done */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        {u.completedRevisions} done
                      </span>
                    </td>

                    {/* Focus Time */}
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono text-slate-500 font-semibold">
                        {Math.round(u.focusMinutes / 60)} hrs
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
