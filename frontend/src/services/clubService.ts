import { BookClub, ClubPost, PostComment } from '../types';

let memoryClubs: BookClub[] = [];
let memoryPosts: ClubPost[] = [];

export const subscribeToBookClubs = (callback: (clubs: BookClub[]) => void) => {
  callback(memoryClubs);
  return () => {};
};

export const createBookClub = async (clubData: Partial<BookClub>) => {
  const newClub: BookClub = {
    id: 'club_' + Math.random().toString(36).substring(2, 9),
    name: clubData.name || 'New Book Club',
    description: clubData.description || '',
    currentBook: clubData.currentBook || 'General Discussion',
    creatorId: clubData.creatorId || 'user',
    creatorName: clubData.creatorName || 'Reader',
    members: clubData.members || [],
    createdAt: new Date().toISOString(),
    ...clubData,
  };
  memoryClubs.unshift(newClub);
  return newClub;
};

export const toggleClubMembership = async (clubId: string, userId: string, isMember: boolean) => {
  const club = memoryClubs.find((c) => c.id === clubId);
  if (club) {
    if (isMember) {
      club.members = (club.members || []).filter((id) => id !== userId);
    } else {
      club.members = [...(club.members || []), userId];
    }
  }
};

export const subscribeToClubPosts = (callback: (posts: ClubPost[]) => void) => {
  callback(memoryPosts);
  return () => {};
};

export const createClubPost = async (postData: Partial<ClubPost>) => {
  const newPost: ClubPost = {
    id: 'post_' + Math.random().toString(36).substring(2, 9),
    clubId: postData.clubId || '',
    authorId: postData.authorId || '',
    authorName: postData.authorName || 'Reader',
    content: postData.content || '',
    likes: postData.likes || [],
    comments: postData.comments || [],
    createdAt: new Date().toISOString(),
    ...postData,
  };
  memoryPosts.unshift(newPost);
  return newPost;
};

export const togglePostLike = async (postId: string, userId: string, hasLiked: boolean) => {
  const post = memoryPosts.find((p) => p.id === postId);
  if (post) {
    if (hasLiked) {
      post.likes = (post.likes || []).filter((id) => id !== userId);
    } else {
      post.likes = [...(post.likes || []), userId];
    }
  }
};

export const addPostComment = async (postId: string, comment: PostComment) => {
  const post = memoryPosts.find((p) => p.id === postId);
  if (post) {
    post.comments = [...(post.comments || []), comment];
  }
};
