import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const GENRES = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Fantasy', 'Mystery', 
  'Biography', 'History', 'Philosophy', 'Romance', 'Thriller'
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  // Step 1
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  
  // Step 2
  const [favoriteBook, setFavoriteBook] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const handleNext = () => {
    if (step === 1 && name) {
      setStep(2);
    } else if (step === 2) {
      // Complete onboarding, save to DB in a real app, then navigate
      navigate('/library');
    }
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      if (selectedGenres.length < 3) {
        setSelectedGenres([...selectedGenres, genre]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#2C2C2C] font-sans selection:bg-[#E5E0D8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center mb-8">
          <span className="text-3xl font-serif font-semibold tracking-tight italic text-[#4B5320]">Welcome to Circle.</span>
        </div>

        <div className="bg-white py-10 px-8 shadow-sm border border-[#E5E0D8] rounded-3xl relative overflow-hidden">
          
          {/* Progress bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#F0EEEB]">
             <motion.div 
               className="h-full bg-[#4B5320]"
               initial={{ width: '50%' }}
               animate={{ width: step === 1 ? '50%' : '100%' }}
               transition={{ duration: 0.5 }}
             />
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-serif tracking-tight text-gray-900">Tell us about yourself</h2>
                  <p className="mt-2 text-sm text-gray-500 opacity-80">Let the circle know who you are.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Name (what friends call you) *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Julian"
                    className="mt-2 appearance-none block w-full px-4 py-3 border border-[#E5E0D8] rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4B5320] focus:border-[#4B5320] sm:text-sm bg-[#F9F7F4]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth (Landed on Earth) <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="mt-2 appearance-none block w-full px-4 py-3 border border-[#E5E0D8] rounded-xl shadow-sm focus:outline-none focus:ring-[#4B5320] focus:border-[#4B5320] sm:text-sm bg-[#F9F7F4] text-gray-700"
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-serif tracking-tight text-gray-900">Your Reading DNA</h2>
                  <p className="mt-2 text-sm text-gray-500 opacity-80">What kind of books make you tick?</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">All-time favorite book</label>
                  <input
                    type="text"
                    value={favoriteBook}
                    onChange={(e) => setFavoriteBook(e.target.value)}
                    placeholder="e.g. The Overstory"
                    className="mt-2 appearance-none block w-full px-4 py-3 border border-[#E5E0D8] rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#4B5320] focus:border-[#4B5320] sm:text-sm bg-[#F9F7F4]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Favorite Genres (Select up to 3)</label>
                  <div className="flex flex-wrap gap-2">
                    {GENRES.map(genre => {
                      const isSelected = selectedGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          onClick={() => toggleGenre(genre)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            isSelected 
                              ? 'bg-[#4B5320] text-white shadow-md' 
                              : 'bg-[#F0EEEB] text-gray-600 hover:bg-[#E5E0D8]'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-10 flex justify-between items-center pt-6 border-t border-[#E5E0D8]">
            {step === 2 ? (
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-[#F0EEEB] transition-colors"
              >
                Back
              </button>
            ) : <div></div>}
            
            <button
              onClick={handleNext}
              disabled={step === 1 && !name}
              className="px-8 py-2.5 rounded-xl shadow-sm text-sm font-medium text-white bg-[#4B5320] hover:bg-[#3D441A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4B5320] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 1 ? 'Continue' : 'Enter the Library'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
