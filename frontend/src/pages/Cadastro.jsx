// src/pages/Cadastro.jsx
import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import "./Cadastro.css";

const Cadastro = () => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const handleCadastro = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem("");

    try {
      // 1. Cria usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      const uid = user.uid;

      // 2. Cria clinicaId único
      const clinicaId = `clinica-${uuidv4()}`;

      // 3. Verifica se clínica já existe
      const clinicaDoc = doc(db, "clinicas", clinicaId);
      const clinicaSnap = await getDoc(clinicaDoc);
      if (!clinicaSnap.exists()) {
        await setDoc(clinicaDoc, {
          nome: nomeClinica,
          emailPrincipal: email,
          clinicaId,
          criadaEm: new Date()
        });
      }

      // 4. Cria usuário dentro da clínica
      const userClinicaRef = doc(db, `clinicas/${clinicaId}/usuarios`, uid);
      await setDoc(userClinicaRef, {
        nome,
        email,
        role: "admin",
        clinicaId,
        uid,
        criadoEm: new Date()
      });

      // 5. Cria usuário global
      const userGlobalRef = doc(db, "usuarios", uid);
      await setDoc(userGlobalRef, {
        nome,
        email,
        role: "admin",
        clinicaId,
        uid,
        nomeClinica,
        criadoEm: new Date()
      });

      setMensagem("✅ Cadastro realizado com sucesso! Agora você pode fazer login.");
    } catch (error) {
      console.error(error);
      setMensagem("❌ Erro ao cadastrar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-container">
      <h2 className="cadastro-title">Cadastro de Clínica e Usuário</h2>
      <form onSubmit={handleCadastro}>
        <div className="cadastro-group">
          <label>Nome da Clínica</label>
          <input
            type="text"
            value={nomeClinica}
            onChange={(e) => setNomeClinica(e.target.value)}
            required
          />
        </div>

        <div className="cadastro-group">
          <label>Seu Nome</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div className="cadastro-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="cadastro-group">
          <label>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>
      </form>

      {mensagem && (
        <p className="cadastro-msg">{mensagem}</p>
      )}
    </div>
  );
};

export default Cadastro;
