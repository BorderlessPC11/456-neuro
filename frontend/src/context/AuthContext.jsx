import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { isGuardianRole, isStaffRole, normalizeRole } from "../auth/roles";

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
            const role = normalizeRole(userData?.role);
            setCurrentUserData({ ...userData, role });
            localStorage.setItem("uid", user.uid);
            localStorage.setItem("clinicaId", userData?.clinicaId || "");
            localStorage.setItem("nomeUsuario", userData?.nome || "");
            localStorage.setItem("role", role || "");
          } else {
            setCurrentUserData(null);
            localStorage.removeItem("uid");
            localStorage.removeItem("clinicaId");
            localStorage.removeItem("nomeUsuario");
            localStorage.removeItem("role");
          }
        } catch (err) {
          console.error("Erro ao buscar dados do usuário no Firestore:", err);
          setCurrentUserData(null);
          localStorage.removeItem("uid");
          localStorage.removeItem("clinicaId");
          localStorage.removeItem("nomeUsuario");
          localStorage.removeItem("role");
        }
      } else {
        setCurrentUserData(null);
        localStorage.removeItem("uid");
        localStorage.removeItem("clinicaId");
        localStorage.removeItem("nomeUsuario");
        localStorage.removeItem("role");
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
    uid: user?.uid || "",
    clinicaId: currentUserData?.clinicaId || "",
    role: normalizeRole(currentUserData?.role || ""),
    isGuardian: isGuardianRole(currentUserData?.role || ""),
    isStaff: isStaffRole(currentUserData?.role || ""),
    hasRole: (...roles) => roles.includes(normalizeRole(currentUserData?.role || "")),
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
