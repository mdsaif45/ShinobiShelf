import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Plus, 
  Send, 
  BookOpen, 
  Loader2, 
  Heart
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '../../providers/AuthProvider';
import { BookClub, ClubPost } from '../../types';
import { 
  subscribeToBookClubs, 
  subscribeToClubPosts, 
  createBookClub, 
  toggleClubMembership, 
  createClubPost, 
  togglePostLike, 
  addPostComment 
} from '../../services/clubService';

export default function BookClubsTab() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<BookClub[]>([]);
  const [posts, setPosts] = useState<ClubPost[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // New Club Modal
  const [isClubModalOpen, setIsClubModalOpen] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubDesc, setClubDesc] = useState('');
  const [clubCurrentBook, setClubCurrentBook] = useState('');
  const [clubMeetupDate, setClubMeetupDate] = useState('');
  const [creatingClub, setCreatingClub] = useState(false);

  // New Post State
  const [postContent, setPostContent] = useState('');
  const [postBookTitle, setPostBookTitle] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  // Comment State
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const unsubscribeClubs = subscribeToBookClubs((data) => setClubs(data));
    const unsubscribePosts = subscribeToClubPosts((data) => {
      setPosts(data);
      setLoading(false);
    });

    return () => {
      unsubscribeClubs();
      unsubscribePosts();
    };
  }, []);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !clubName.trim()) return;

    setCreatingClub(true);
    try {
      await createBookClub({
        name: clubName.trim(),
        description: clubDesc.trim(),
        currentBook: clubCurrentBook.trim() || 'To Be Decided',
        meetupDate: clubMeetupDate || 'TBD',
        members: [user.uid],
        creatorId: user.uid,
        creatorName: user.displayName || user.email?.split('@')[0] || 'Member',
      });

      setClubName('');
      setClubDesc('');
      setClubCurrentBook('');
      setClubMeetupDate('');
      setIsClubModalOpen(false);
    } catch (err) {
      console.error('Error creating club:', err);
    } finally {
      setCreatingClub(false);
    }
  };

  const handleToggleJoinClub = async (club: BookClub) => {
    if (!user) return;
    const isMember = club.members?.includes(user.uid);

    try {
      await toggleClubMembership(club.id, user.uid, !!isMember);
    } catch (err) {
      console.error('Error joining club:', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postContent.trim()) return;

    setCreatingPost(true);
    try {
      await createClubPost({
        content: postContent.trim(),
        bookTitle: postBookTitle.trim() || '',
        clubId: selectedClubId === 'all' ? 'general' : selectedClubId,
        authorId: user.uid,
        authorName: user.displayName || user.email?.split('@')[0] || 'Reader',
        authorAvatar: user.photoURL || '',
        likes: [user.uid],
        comments: [],
      });

      setPostContent('');
      setPostBookTitle('');
    } catch (err) {
      console.error('Error creating post:', err);
    } finally {
      setCreatingPost(false);
    }
  };

  const handleToggleLike = async (post: ClubPost) => {
    if (!user) return;
    const hasLiked = post.likes?.includes(user.uid);

    try {
      await togglePostLike(post.id, user.uid, !!hasLiked);
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user) return;
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const commentObj = {
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0] || 'Reader',
      authorAvatar: user.photoURL || '',
      text,
      createdAt: new Date().toISOString()
    };

    try {
      await addPostComment(postId, commentObj);
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  const filteredPosts = selectedClubId === 'all' 
    ? posts 
    : posts.filter(p => p.clubId === selectedClubId || p.clubId === 'general');

  return (
    <div className="space-y-8 font-sans text-[#2C2C2C]">
      
      {/* Header Banner */}
      <div className="bg-[#F9F7F4] border border-[#E5E0D8] p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#4B5320]/10 text-[#4B5320] rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-[#4B5320]" /> Circle Book Clubs & Salons
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2C2C2C]">
            Read together, discuss deeper.
          </h2>
          <p className="text-xs text-[#8C867E] mt-1 max-w-xl">
            Join local book clubs, coordinate upcoming reading meetups, and share reflections with fellow readers in your neighborhood.
          </p>
        </div>

        <Button 
          onClick={() => setIsClubModalOpen(true)}
          className="bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-2xl px-5 py-6 text-sm font-medium shadow-md shadow-[#4B5320]/10 shrink-0 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Start a Book Club
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Book Clubs Directory */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-serif text-lg font-bold text-[#2C2C2C] flex items-center justify-between">
            <span>Active Clubs ({clubs.length})</span>
            <span className="text-xs text-[#8C867E] font-normal cursor-pointer hover:underline" onClick={() => setSelectedClubId('all')}>Show All</span>
          </h3>

          <div className="space-y-3">
            {clubs.map((club) => {
              const isMember = club.members?.includes(user?.uid);
              const isSelected = selectedClubId === club.id;

              return (
                <Card 
                  key={club.id} 
                  onClick={() => setSelectedClubId(club.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-[#4B5320] bg-white shadow-md ring-1 ring-[#4B5320]' 
                      : 'border-[#E5E0D8] bg-white hover:border-[#4B5320]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-serif font-bold text-sm text-[#2C2C2C]">{club.name}</h4>
                    <Button 
                      size="sm" 
                      variant={isMember ? "outline" : "default"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleJoinClub(club);
                      }}
                      className={`text-[10px] h-6 px-2.5 rounded-lg ${
                        isMember ? 'border-[#E5E0D8] text-[#8C867E]' : 'bg-[#4B5320] text-white hover:bg-[#3D441A]'
                      }`}
                    >
                      {isMember ? 'Joined ✓' : 'Join'}
                    </Button>
                  </div>

                  <p className="text-xs text-[#8C867E] line-clamp-2 mb-3">{club.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-dashed border-[#E5E0D8] text-[11px] text-[#2C2C2C]">
                    <div className="flex items-center gap-1.5 text-[#4B5320] font-medium">
                      <BookOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Reading: <strong>{club.currentBook}</strong></span>
                    </div>
                    {club.meetupDate && (
                      <div className="flex items-center gap-1.5 text-[#8C867E]">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                        <span>Meetup: <strong>{club.meetupDate}</strong></span>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Discussion Feed */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create Post Form */}
          <Card className="bg-white rounded-3xl border border-[#E5E0D8] p-5 shadow-sm">
            <h3 className="font-serif text-base font-bold text-[#2C2C2C] mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#4B5320]" />
              Share a Thought or Book Reflection
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <input
                type="text"
                value={postBookTitle}
                onChange={(e) => setPostBookTitle(e.target.value)}
                placeholder="Mention book title (Optional, e.g. 'Regarding Sapiens Chapter 4')"
                className="w-full px-3.5 py-2 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#4B5320]"
              />

              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What resonated with you? Ask a discussion question for the club..."
                rows={3}
                required
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#4B5320] resize-none"
              />

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={creatingPost || !postContent.trim()} 
                  className="bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs px-5 py-2 shadow-sm"
                >
                  {creatingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post to Discussion'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Posts Stream */}
          <div className="space-y-4">
            {filteredPosts.length === 0 ? (
              <p className="text-xs text-[#8C867E] italic text-center py-8">No discussions started yet. Share the first post above!</p>
            ) : (
              filteredPosts.map((post) => {
                const likesCount = post.likes?.length || 0;
                const hasLiked = post.likes?.includes(user?.uid);
                const comments = post.comments || [];

                return (
                  <Card key={post.id} className="bg-white rounded-3xl border border-[#E5E0D8] p-5 shadow-sm space-y-4">
                    {/* Post Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8 border border-[#E5E0D8]">
                          <AvatarImage src={post.authorAvatar} />
                          <AvatarFallback className="text-xs bg-[#D4A373] text-white font-serif">{post.authorName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-bold text-[#2C2C2C]">{post.authorName}</p>
                          <p className="text-[10px] text-[#8C867E]">Circle Reader</p>
                        </div>
                      </div>

                      {post.bookTitle && (
                        <Badge variant="outline" className="border-[#E5E0D8] bg-[#F9F7F4] text-[#4B5320] text-[10px] font-medium">
                          📖 {post.bookTitle}
                        </Badge>
                      )}
                    </div>

                    {/* Post Body */}
                    <p className="text-xs text-[#2C2C2C] leading-relaxed whitespace-pre-line">{post.content}</p>

                    {/* Like & Comment Bar */}
                    <div className="pt-3 border-t border-[#E5E0D8] flex items-center justify-between gap-2 text-xs">
                      <button 
                        onClick={() => handleToggleLike(post)} 
                        className={`flex items-center gap-1.5 transition-colors ${
                          hasLiked ? 'text-red-600 font-bold' : 'text-[#8C867E] hover:text-[#2C2C2C]'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${hasLiked ? 'fill-red-600 text-red-600' : ''}`} />
                        <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                      </button>

                      <span className="text-[#8C867E] text-[11px]">{comments.length} Comments</span>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-2 pt-2">
                      {comments.map((comm: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-[#F9F7F4] rounded-xl text-xs space-y-1 border border-[#E5E0D8]/60">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#2C2C2C] text-[11px]">{comm.authorName}</span>
                          </div>
                          <p className="text-[#2C2C2C] text-[11px]">{comm.text}</p>
                        </div>
                      ))}

                      {/* Add Comment Input */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                          placeholder="Write a reply..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddComment(post.id);
                          }}
                          className="flex-1 px-3 py-1.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#4B5320]"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => handleAddComment(post.id)} 
                          className="bg-[#4B5320] text-white rounded-xl text-xs px-3"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                  </Card>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* Start Club Modal */}
      <Dialog open={isClubModalOpen} onOpenChange={setIsClubModalOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 font-sans border-[#E5E0D8]">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl text-[#2C2C2C] flex items-center gap-2">
              <Users className="w-6 h-6 text-[#4B5320]" /> Start a Book Club
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateClub} className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                Club Name *
              </label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder="e.g. Weekend Sci-Fi Society, Philosophy Salon..."
                required
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                Description
              </label>
              <textarea
                value={clubDesc}
                onChange={(e) => setClubDesc(e.target.value)}
                placeholder="A cozy gathering for lovers of dystopian fiction and speculative literature..."
                rows={2}
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320] resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                Current Monthly Reading Selection
              </label>
              <input
                type="text"
                value={clubCurrentBook}
                onChange={(e) => setClubCurrentBook(e.target.value)}
                placeholder="e.g. Dune Messiah by Frank Herbert"
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#8C867E] mb-1 block">
                Next Meetup Schedule
              </label>
              <input
                type="text"
                value={clubMeetupDate}
                onChange={(e) => setClubMeetupDate(e.target.value)}
                placeholder="e.g. Last Sunday of the month @ 4 PM"
                className="w-full px-3.5 py-2.5 bg-[#F9F7F4] border border-[#E5E0D8] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#4B5320]"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setIsClubModalOpen(false)} className="w-1/3 rounded-xl border-[#E5E0D8] text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={creatingClub} className="w-2/3 bg-[#4B5320] text-white hover:bg-[#3D441A] rounded-xl text-xs font-medium py-2.5">
                {creatingClub ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Book Club'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
