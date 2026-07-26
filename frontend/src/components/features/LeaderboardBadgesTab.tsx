import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Award, 
  ShieldCheck, 
  Star, 
  CheckCircle2, 
  Users,
  Sparkles,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '../../providers/AuthProvider';
import { UserProfile } from '../../types';
import { subscribeToUsers } from '../../services/userService';

export default function LeaderboardBadgesTab() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((data) => {
      // Sort users by honesty score descending
      const sorted = [...data].sort((a, b) => (b.honestyScore || 100) - (a.honestyScore || 100));
      setUsersList(sorted);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // System Badge Definitions
  const systemBadges = [
    {
      id: 'punctual_scholar',
      title: 'Punctual Scholar',
      description: 'Returned 5+ borrowed books on or before due date.',
      icon: '🛡️',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      unlocked: true
    },
    {
      id: 'master_lender',
      title: 'Master Lender',
      description: 'Shared 3 or more books to the circle shelf.',
      icon: '📚',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
      unlocked: true
    },
    {
      id: 'circle_pioneer',
      title: 'Circle Pioneer',
      description: 'Early founding member of the neighborhood library.',
      icon: '🌟',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
      unlocked: true
    },
    {
      id: 'trusted_bibliophile',
      title: 'Trusted Bibliophile',
      description: 'Achieved High Trust Status with 120+ Honesty Points.',
      icon: '💎',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
      unlocked: false
    },
    {
      id: 'community_critic',
      title: 'Community Critic',
      description: 'Published 3+ insightful star reviews for fellow readers.',
      icon: '✍️',
      color: 'bg-rose-50 text-rose-800 border-rose-200',
      unlocked: true
    },
    {
      id: 'marathon_reader',
      title: 'Marathon Reader',
      description: 'Completed 100% reading progress on 5 active loans.',
      icon: '🔥',
      color: 'bg-orange-50 text-orange-800 border-orange-200',
      unlocked: false
    }
  ];

  return (
    <div className="space-y-8 font-sans text-[#2C2C2C]">
      
      {/* Header Banner & Your Score */}
      <div className="bg-gradient-to-r from-[#4B5320] to-[#2D5A27] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Award className="w-64 h-64" />
        </div>

        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider uppercase text-emerald-200">
            <Sparkles className="w-3.5 h-3.5" /> Your Community Trust Level
          </div>
          <h2 className="text-2xl font-serif font-bold tracking-tight">
            Honesty Trust Score: <span className="text-emerald-300">{user?.honestyScore || 100} Pts</span>
          </h2>
          <p className="text-xs text-white/80 max-w-lg">
            Trust, punctuality, and generosity rewarded. Return borrowed books on time to earn points and climb the circle rankings!
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 z-10 shrink-0">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-emerald-200 font-bold">Current Tier</p>
            <p className="font-serif text-lg font-bold">
              {(user?.honestyScore || 100) >= 150 ? 'Master Bibliophile 👑' : (user?.honestyScore || 100) >= 120 ? 'Punctual Scholar 🌟' : 'Trusted Reader 📚'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Community Leaderboard Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-[#2C2C2C]">Honesty & Trust Leaderboard</h3>
                <p className="text-xs text-[#8C867E]">Top readers and generous lenders in your circle</p>
              </div>
              <Badge className="bg-[#4B5320] text-white text-xs font-medium px-3 py-1">
                Neighborhood Rankings
              </Badge>
            </div>

            {/* Leaderboard Ranks */}
            <div className="space-y-3">
              {usersList.length === 0 ? (
                // Fallback Mock Display if Firebase users empty
                [
                  { name: 'Elena Rostova', score: 140, tier: 'High Trust', booksLent: 6, avatar: 'E' },
                  { name: 'Marcus Vance', score: 125, tier: 'High Trust', booksLent: 4, avatar: 'M' },
                  { name: 'Sophia Chen', score: 110, tier: 'Standard', booksLent: 3, avatar: 'S' },
                  { name: 'David Miller', score: 100, tier: 'Standard', booksLent: 2, avatar: 'D' },
                ].map((member, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3.5 bg-[#F9F7F4] rounded-2xl border border-[#E5E0D8] hover:border-[#4B5320] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-serif font-bold text-sm w-6 text-center ${
                        index === 0 ? 'text-amber-500 text-base' : index === 1 ? 'text-slate-400 text-base' : index === 2 ? 'text-amber-700 text-base' : 'text-[#8C867E]'
                      }`}>
                        #{index + 1}
                      </span>

                      <Avatar className="w-9 h-9 border border-[#E5E0D8]">
                        <AvatarFallback className="bg-[#D4A373] text-white font-serif">{member.avatar}</AvatarFallback>
                      </Avatar>

                      <div>
                        <p className="text-xs font-bold text-[#2C2C2C] flex items-center gap-1.5">
                          {member.name}
                          {index === 0 && <span className="text-xs">👑</span>}
                        </p>
                        <p className="text-[10px] text-[#8C867E]">{member.booksLent} books lent to circle</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-[#4B5320]">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#4B5320]" />
                        {member.score} pts
                      </div>
                      <p className="text-[10px] text-[#8C867E]">{member.tier}</p>
                    </div>
                  </div>
                ))
              ) : (
                usersList.map((member, index) => {
                  const score = member.honestyScore || 100;
                  const tier = score >= 120 ? 'High Trust 💎' : score >= 80 ? 'Standard 🛡️' : 'Probation ⚠️';
                  const isCurrent = user?.uid === member.id;

                  return (
                    <div 
                      key={member.id} 
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        isCurrent 
                          ? 'bg-[#F0F7F0] border-[#4B5320] ring-1 ring-[#4B5320]' 
                          : 'bg-[#F9F7F4] border-[#E5E0D8] hover:border-[#4B5320]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-serif font-bold text-sm w-6 text-center ${
                          index === 0 ? 'text-amber-500 text-base' : index === 1 ? 'text-slate-400 text-base' : index === 2 ? 'text-amber-700 text-base' : 'text-[#8C867E]'
                        }`}>
                          #{index + 1}
                        </span>

                        <Avatar className="w-9 h-9 border border-[#E5E0D8]">
                          <AvatarImage src={member.avatar || member.photoURL} />
                          <AvatarFallback className="bg-[#D4A373] text-white font-serif">{member.displayName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="text-xs font-bold text-[#2C2C2C] flex items-center gap-1.5">
                            {member.displayName || member.email?.split('@')[0] || 'Reader'}
                            {isCurrent && <Badge className="bg-[#4B5320] text-white text-[9px] py-0 px-1.5">You</Badge>}
                          </p>
                          <p className="text-[10px] text-[#8C867E]">Circle Reader</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-[#4B5320]">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#4B5320]" />
                          {score} pts
                        </div>
                        <p className="text-[10px] text-[#8C867E]">{tier}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Achievements & Badges Showcase */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm">
            <h3 className="font-serif text-lg font-bold text-[#2C2C2C] mb-1 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#4B5320]" />
              Circle Badges & Milestones
            </h3>
            <p className="text-xs text-[#8C867E] mb-4">
              Earn badges as you participate in borrowing, lending, and community reviews.
            </p>

            <div className="space-y-3">
              {systemBadges.map((badge) => (
                <div 
                  key={badge.id}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                    badge.unlocked ? badge.color : 'bg-neutral-50 text-neutral-400 border-neutral-200 opacity-60'
                  }`}
                >
                  <span className="text-2xl shrink-0 mt-0.5">{badge.icon}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-xs">{badge.title}</h4>
                      {badge.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </div>
                    <p className="text-[11px] leading-tight mt-0.5">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

    </div>
  );
}
