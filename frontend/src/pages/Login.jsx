import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext"; 
import logo from "../assets/logo.png"; // 🛑 Assegure-se que este caminho está correto!
import './Login.css'; 

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUserData, loading: authLoading } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      let errorMessage = "Erro ao fazer login. Verifique suas credenciais.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = "Email ou senha incorretos.";
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && currentUserData) {
    navigate("/dashboard");
    return null; 
  }

  if (authLoading) {
      return (
        <div className="loading-screen">
            <img src={logo} alt="Carregando..." className="loading-logo" />
            <p>Verificando sessão...</p>
        </div>
      )
  }

  return (
    <div className="login-full-screen-container"> 
      
      {/* 🛑 NOVO: Logo fora do card, posicionado no topo para aparecer sobre o fundo azul */}
      <img src={logo} alt="Logo da Aplicação" className="login-logo-top" />
      
      {/* Container Centralizado - Caixa de login mais 'enxuta' */}
      <div className="login-card">
        
        <h2 className="login-title-card">Acesso à Plataforma</h2> 

        <form onSubmit={handleLogin} className="login-form-slim">
          <div className="form-group-slim">
            <label>Email</label>
            <input
              type="email"
              placeholder="Digite seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group-slim">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`submit-button ${loading ? 'loading-btn' : 'btn-success'}`}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="register-link">
          Não tem conta? <a href="/cadastro">Cadastre-se aqui</a>
        </p>
      </div>
    </div>
  );
}

export default Login;

