import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();

  const handleGoogleAuth = async () => {
    setError('');
    try {
      await loginWithGoogle();
      navigate('/library');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        await loginWithEmail(email, password);
        navigate('/library');
      } else {
        await registerWithEmail(email, password);
        // New accounts complete their profile first.
        navigate('/onboarding');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#2C2C2C] font-sans selection:bg-[#E5E0D8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <span className="text-4xl font-serif font-semibold tracking-tight italic text-[#4B5320]">Circle.</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-serif tracking-tight text-gray-900">
          {isLogin ? 'Sign in to your account' : 'Join the reading circle'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 opacity-70">
          Share your library, discover new books.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white py-8 px-4 shadow-sm border border-[#E5E0D8] sm:rounded-3xl sm:px-10"
        >
          <form className="space-y-6" onSubmit={handleEmailAuth}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear the previous failure as soon as the user edits,
                    // so a stale message never sits under a fresh attempt.
                    if (error) setError('');
                  }}
                  className="appearance-none block w-full px-3 py-2 border border-[#E5E0D8] rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4B5320] focus:border-[#4B5320] sm:text-sm bg-[#F9F7F4]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="appearance-none block w-full px-3 py-2 border border-[#E5E0D8] rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4B5320] focus:border-[#4B5320] sm:text-sm bg-[#F9F7F4]"
                />
              </div>
            </div>

            {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#4B5320] hover:bg-[#3D441A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4B5320] transition-colors"
              >
                {isLogin ? 'Sign in' : 'Register'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E5E0D8]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full flex justify-center py-2.5 px-4 border border-[#E5E0D8] rounded-xl shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
            </div>
          </div>
          
          <div className="mt-6 text-center">
             <button
               type="button"
               onClick={() => {
                 setError('');
                 setIsLogin(!isLogin);
               }}
               className="text-sm font-medium text-[#4B5320] hover:underline"
             >
               {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
             </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
