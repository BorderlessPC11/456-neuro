import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userRef = doc(db, 'usuarios', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setCurrentUserData(userData);
            localStorage.setItem("uid", user.uid);
            localStorage.setItem("clinicaId", userData?.clinicaId || "");
            localStorage.setItem("nomeUsuario", userData?.nome || "");
          } else {
            setCurrentUserData(null);
            localStorage.removeItem("uid");
            localStorage.removeItem("clinicaId");
            localStorage.removeItem("nomeUsuario");
          }
        } catch (err) {
          console.error("Erro ao buscar dados do usuário no Firestore:", err);
          setCurrentUserData(null);
          localStorage.removeItem("uid");
          localStorage.removeItem("clinicaId");
          localStorage.removeItem("nomeUsuario");
        }
      } else {
        setCurrentUserData(null);
        localStorage.removeItem("uid");
        localStorage.removeItem("clinicaId");
        localStorage.removeItem("nomeUsuario");
      }
      setIsAuthLoading(false);
    };

    if (!loading) {
      fetchUserData();
    }
  }, [user, loading]);

  const value = {
    user,
    currentUserData,
    loading: loading || isAuthLoading,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
