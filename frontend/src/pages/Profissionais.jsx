// src/pages/Profissionais.jsx
import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  FaWhatsapp,
  FaArrowUp,
  FaUser,
  FaClinicMedical,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "./Dashboard.css";
import "./Profissionais.css";
import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";

const Profissionais = () => {
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [role, setRole] = useState("");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [registro, setRegistro] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [publico, setPublico] = useState("Pediatria");
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState("");

  const navigate = useNavigate();

  // Agora PUXA DO CONTEXTO global!
  const { currentUserData, loading } = useAuth();
  const clinicaId = currentUserData?.clinicaId || "";

  const especialidades = [
    "Psicólogo(a)",
    "Neuropsicólogo(a)",
    "Terapia Cognitivo-Comportamental",
    "Psicomotricista",
    "Neurologista",
    "Psicanalista",
    "Fonoaudióloga(o)",
  ];

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.clear();
    navigate("/");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !email || !registro || !clinicaId) return;

    let uidProfissional = "";

    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);

      if (signInMethods.length === 0) {
        const senha = "neuroverse123";
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          senha
        );
        uidProfissional = userCredential.user.uid;
        alert(`Profissional criado com sucesso. Senha padrão: ${senha}`);
      } else {
        alert("Email já existe no sistema.");
      }

      await addDoc(collection(db, "profissionais"), {
        clinicaId,
        nome,
        email,
        celular,
        registro,
        especialidade,
        publico,
        ativo: true,
        uid: uidProfissional || null,
        role: "profissional",
        criadoEm: Timestamp.now(),
      });

      setNome("");
      setEmail("");
      setCelular("");
      setRegistro("");
      setEspecialidade("");
      setPublico("Pediatria");

      buscarProfissionais();
    } catch (error) {
      alert("Erro ao cadastrar profissional: " + error.message);
    }
  };

  // BUSCA PROFISSIONAIS DA CLÍNICA CORRETA!
  const buscarProfissionais = async () => {
    if (!clinicaId) return;
    const q = query(
      collection(db, "profissionais"),
      where("clinicaId", "==", clinicaId)
    );
    const snap = await getDocs(q);
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setLista(data);
  };

  const toggleAtivo = async (id, atual) => {
    const ref = doc(db, "profissionais", id);
    await updateDoc(ref, { ativo: !atual });
    buscarProfissionais();
    alert(`Profissional ${atual ? "desativado" : "ativado"} com sucesso!`);
  };

  const deletarProfissional = async (id) => {
    if (window.confirm("Tem certeza que deseja remover este profissional?")) {
      await deleteDoc(doc(db, "profissionais", id));
      buscarProfissionais();
      alert("Profissional removido com sucesso!");
    }
  };

  // Pegando nome do usuário e nome da clínica
  useEffect(() => {
    if (currentUserData) {
      setNomeUsuario(currentUserData?.nome || "");
      setRole(currentUserData?.role || "");
      // Nome da clínica pelo clinicaId
      const fetchClinica = async () => {
        if (clinicaId) {
          const clinicaRef = doc(db, "clinicas", clinicaId);
          const clinicaSnap = await getDoc(clinicaRef);
          if (clinicaSnap.exists()) {
            setNomeClinica(clinicaSnap.data().nome || "");
          }
        }
      };
      fetchClinica();
    }
  }, [currentUserData, clinicaId]);

  // Buscar profissionais sempre que clinicaId mudar
  useEffect(() => {
    if (clinicaId) buscarProfissionais();
    // eslint-disable-next-line
  }, [clinicaId]);

  const listaFiltrada = lista.filter(
    (prof) =>
      prof.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      prof.email?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <Sidebar />

      {/* Conteúdo */}
      <main className="main-content">
        <h1>Profissionais da Clínica</h1>

        <form className="form-profissional" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="text"
            placeholder="WhatsApp"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
          />
          <input
            type="text"
            placeholder="CRM / Registro"
            value={registro}
            onChange={(e) => setRegistro(e.target.value)}
            required
          />
          <select
            value={especialidade}
            onChange={(e) => setEspecialidade(e.target.value)}
          >
            <option value="">Selecione a especialidade</option>
            {especialidades.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>
          <select value={publico} onChange={(e) => setPublico(e.target.value)}>
            <option value="Pediatria">Pediatria</option>
            <option value="Adulto">Adulto</option>
            <option value="Ambos">Ambos</option>
          </select>
          <button type="submit">Cadastrar Profissional</button>
        </form>

        <div className="busca-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="tabela-container">
          <table className="tabela-profissionais">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Especialidade</th>
                <th>Registro</th>
                <th>Email</th>
                <th>WhatsApp</th>
                <th>Público</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((prof) => (
                <tr key={prof.id}>
                  <td>{prof.nome}</td>
                  <td>{prof.especialidade}</td>
                  <td>{prof.registro}</td>
                  <td>{prof.email}</td>
                  <td>{prof.celular}</td>
                  <td>{prof.publico}</td>
                  <td style={{ fontWeight: "bold", color: prof.ativo ? "#28a745" : "#dc3545" }}>
                    {prof.ativo ? "Ativo" : "Inativo"}
                  </td>
                  <td style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {prof.celular && (
                      <a
                        href={`https://wa.me/55${prof.celular.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-whats"
                      >
                        <FaWhatsapp />
                      </a>
                    )}
                    <button
                      className={`btn-toggle ${prof.ativo ? "ativo" : "inativo"}`}
                      onClick={() => toggleAtivo(prof.id, prof.ativo)}
                    >
                      {prof.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      className="btn-toggle inativo"
                      title="Excluir profissional"
                      onClick={() => deletarProfissional(prof.id)}
                    >
                      <FaTimes />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <FaArrowUp />
        </button>
      </main>
    </div>
  );
};

export default Profissionais;
