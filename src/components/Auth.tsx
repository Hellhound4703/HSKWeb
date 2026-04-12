import React from 'react';
import { signInWithPopup, signOut, type User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthProps {
  user: User | null;
}

const Auth: React.FC<AuthProps> = ({ user }) => {
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      alert("Failed to sign in. Please check your Firebase configuration.");
    }
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="flex items-center gap-4">
      {user ? (
        <>
          <div className="flex items-center gap-2">
            <img 
              src={user.photoURL || ''} 
              alt={user.displayName || 'User'} 
              className="w-8 h-8 rounded-full border border-blue-200"
            />
            <span className="text-sm font-medium text-gray-700 hidden sm:inline">
              {user.displayName}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors"
          >
            Sign Out
          </button>
        </>
      ) : (
        <button
          onClick={handleSignIn}
          className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/layout/google.svg" alt="Google" className="w-4 h-4" />
          Sign in with Google
        </button>
      )}
    </div>
  );
};

export default Auth;
