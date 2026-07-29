import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Award, BookOpen, Clock, TrendingUp, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import { subscribeToBooks } from '../../services/bookService';
import { subscribeToBorrowRequests } from '../../services/loanService';
import { Book, BorrowRequest } from '../../types';
import { FEATURES } from '@/config/features';

export default function AnalyticsReportTab() {
  const { user } = useAuth();
  const [honestyPoints, setHonestyPoints] = useState<number>(user?.honestyScore || 100);
  const [loans, setLoans] = useState<any[]>([]);
  const [myBooksCount, setMyBooksCount] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    setHonestyPoints(user.honestyScore || 100);

    const unsubBooks = subscribeToBooks((allBooks: Book[]) => {
      const myBooks = allBooks.filter(b => b.ownerId === user.id || b.owner?.uid === user.id || b.owner?.id === user.id);
      setMyBooksCount(myBooks.length);
    });

    const unsubLoans = subscribeToBorrowRequests((allLoans: BorrowRequest[]) => {
      const myLoans = allLoans.filter(l => l.borrowerId === user.id);
      setLoans(myLoans);
    });

    return () => {
      unsubBooks();
      unsubLoans();
    };
  }, [user]);

  // Derived Statistics
  const totalBorrowed = loans.length;
  const returnedLoans = loans.filter(l => l.status === 'RETURNED');
  const onTimeCount = returnedLoans.filter(l => l.returnedOnTime !== false).length;
  const onTimeRate = returnedLoans.length > 0 ? Math.round((onTimeCount / returnedLoans.length) * 100) : 100;

  // These two datasets were invented: fixed Feb-Jun activity and fixed genre
  // percentages, shown identically to every account including same-day
  // registrations with no loans at all. Presenting fabricated history as a
  // personal reading record is worse than showing nothing, so the widgets are
  // gated behind FEATURES.analyticsCharts until they are derived from real data.
  const monthlyData = [
    { month: 'Jul', borrowed: totalBorrowed, returned: returnedLoans.length },
  ];

  const genreData: Array<{ name: string; value: number }> = [];
  const COLORS = ['#4B5320', '#2D5A27', '#D4A373', '#BC8F8F'];

  return (
    <div className="space-y-8 font-sans text-[#2C2C2C]">
      
      {/* Title & Overview Header */}
      <div>
        <h2 className="text-3xl font-serif tracking-tight text-[#2C2C2C] mb-1">Circle Reading & Trust Report</h2>
        <p className="text-xs text-[#8C867E]">Personal analytics, honesty rating, and borrowing patterns.</p>
      </div>

      {/* Honesty Rating Banner */}
      <div className="bg-gradient-to-r from-[#4B5320] to-[#2D5A27] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Award className="w-64 h-64" />
        </div>

        <div className="space-y-2 text-center md:text-left z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider uppercase text-emerald-200">
            <Sparkles className="w-3.5 h-3.5" /> Circle Honesty System
          </div>
          <h2 className="text-2xl font-serif font-bold tracking-tight">
            Honesty Trust Score: <span className="text-emerald-300">{honestyPoints} Pts</span>
          </h2>
          <p className="text-xs text-white/80 max-w-lg">
            Return borrowed books on or before their due date to earn <strong>+10 Honesty Points</strong>. On-time returns unlock community privileges and badges!
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 z-10 shrink-0">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-emerald-200 font-bold">Current Tier</p>
            <p className="font-serif text-lg font-bold">
              {honestyPoints >= 150 ? 'Master Bibliophile 👑' : honestyPoints >= 120 ? 'Punctual Scholar 🌟' : 'Trusted Reader 📚'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-[#8C867E]">Honesty Score</span>
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-[#2D5A27]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-serif text-3xl font-bold text-[#4B5320]">{honestyPoints} <span className="text-xs font-normal text-[#8C867E]">Pts</span></h3>
            <p className="text-xs text-[#2D5A27] font-medium mt-1">
              {honestyPoints >= 150 ? 'Master Bibliophile' : honestyPoints >= 120 ? 'Punctual Scholar' : 'Trusted Reader'}
            </p>
          </div>
        </Card>

        <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-[#8C867E]">On-Time Return Rate</span>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-serif text-3xl font-bold text-[#2C2C2C]">{onTimeRate}%</h3>
            <p className="text-xs text-blue-700 font-medium mt-1">{onTimeCount} of {returnedLoans.length} returned on schedule</p>
          </div>
        </Card>

        <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-[#8C867E]">Books Borrowed</span>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-serif text-3xl font-bold text-[#2C2C2C]">{totalBorrowed}</h3>
            <p className="text-xs text-purple-700 font-medium mt-1">Circle loans requested</p>
          </div>
        </Card>

        <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-[#8C867E]">Shared Library</span>
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="font-serif text-3xl font-bold text-[#2C2C2C]">{myBooksCount}</h3>
            <p className="text-xs text-amber-700 font-medium mt-1">Books offered to friends</p>
          </div>
        </Card>

      </div>

      {/* Visual Charts. Gated: see FEATURES.analyticsCharts. */}
      {FEATURES.analyticsCharts && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Monthly Activity Bar Chart */}
        <Card className="lg:col-span-2 bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#4B5320]" />
            Borrowing & Return History
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#8C867E" fontSize={12} tickLine={false} />
                <YAxis stroke="#8C867E" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #E5E0D8', fontSize: '12px' }} 
                />
                <Bar dataKey="borrowed" fill="#4B5320" name="Borrowed" radius={[6, 6, 0, 0]} />
                <Bar dataKey="returned" fill="#D4A373" name="Returned" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Genre Breakdown Pie Chart */}
        <Card className="lg:col-span-1 bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm flex flex-col justify-between">
          <h3 className="font-serif text-lg font-semibold text-[#2C2C2C] mb-2">
            Reading Genre Breakdown
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={genreData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={40} 
                  outerRadius={70} 
                  paddingAngle={4} 
                  dataKey="value"
                >
                  {genreData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E0D8]">
            {genreData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-[#8C867E]">{item.name} ({item.value}%)</span>
              </div>
            ))}
          </div>
        </Card>

      </div>
      )}

      {/* Honesty Timeline & Achievements */}
      {FEATURES.analyticsCharts && (
      <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm">
        <h3 className="font-serif text-lg font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#4B5320]" />
          Honesty Point Log & Achievements
        </h3>
        <div className="space-y-3">
          <div className="p-3 bg-[#F9F7F4] border border-[#E5E0D8] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#2D5A27] flex items-center justify-center font-bold text-xs">
                +10
              </div>
              <div>
                <p className="font-semibold text-xs text-[#2C2C2C]">On-Time Return Bonus</p>
                <p className="text-[10px] text-[#8C867E]">Returned 'Vita, Essenza e Libertà' on schedule</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#8C867E]">Recent</span>
          </div>

          <div className="p-3 bg-[#F9F7F4] border border-[#E5E0D8] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                +100
              </div>
              <div>
                <p className="font-semibold text-xs text-[#2C2C2C]">Welcome to Circle Community</p>
                <p className="text-[10px] text-[#8C867E]">Initial trust baseline credited upon registration</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#8C867E]">Welcome Bonus</span>
          </div>
        </div>
      </Card>
      )}

      {/* The welcome credit is real for every account, so it stays visible even
          while the fabricated log entries above are gated off. */}
      {!FEATURES.analyticsCharts && (
        <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-6 shadow-sm">
          <h3 className="font-serif text-lg font-semibold text-[#2C2C2C] mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#4B5320]" />
            Honesty Point Log
          </h3>
          <div className="p-3 bg-[#F9F7F4] border border-[#E5E0D8] rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                +100
              </div>
              <div>
                <p className="font-semibold text-xs text-[#2C2C2C]">Welcome to Circle</p>
                <p className="text-[10px] text-[#8C867E]">Initial trust baseline credited upon registration</p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#8C867E]">Welcome Bonus</span>
          </div>
          <p className="mt-3 text-[11px] text-[#8C867E] italic">
            Detailed borrowing history and genre insights arrive once more of your activity is tracked.
          </p>
        </Card>
      )}

    </div>
  );
}
