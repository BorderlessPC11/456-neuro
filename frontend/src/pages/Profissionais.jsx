import React, { useState, useEffect, useCallback } from "react";
import { FaWhatsapp, FaArrowUp, FaSearch, FaTimes } from "react-icons/fa";
import "./Profissionais.css";
import { useAuth } from "../context/AuthContext";
import {
  createTherapistProfile,
  listTherapistsByClinic,
  removeTherapist,
  updateTherapistStatus,
} from "../features/therapists/therapistsApi";
import { canManageTherapists } from "../auth/roles";

const Profissionais = () => {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    celular: "",
    registro: "",
    especialidade: "",
    publico: "Pediatria",
    createAuthUser: false,
    tempPassword: "",
  });
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState("");
  const [saving, setSaving] = useState(false);
  const { currentUserData, role } = useAuth();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.registro || !clinicaId) return;
    if (form.createAuthUser && (form.tempPassword || "").length < 6) {
      alert("Defina uma senha temporária com pelo menos 6 caracteres.");
      return;
    }

    try {
      setSaving(true);
      await createTherapistProfile({
        clinicaId,
        ...form,
      });
      setForm({
        nome: "",
        email: "",
        celular: "",
        registro: "",
        especialidade: "",
        publico: "Pediatria",
        createAuthUser: false,
        tempPassword: "",
      });
      buscarProfissionais();
    } catch (error) {
      alert("Erro ao cadastrar profissional: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const buscarProfissionais = useCallback(async () => {
    if (!clinicaId) return;
    const data = await listTherapistsByClinic(clinicaId);
    setLista(data.sort((a, b) => (a.nome || "").localeCompare(b.nome || "")));
  }, [clinicaId]);

  const toggleAtivo = async (id, atual) => {
    await updateTherapistStatus(id, !atual);
    buscarProfissionais();
  };

  const deletarProfissional = async (id) => {
    if (window.confirm("Tem certeza que deseja remover este profissional?")) {
      await removeTherapist(id);
      buscarProfissionais();
    }
  };

  useEffect(() => {
    if (clinicaId) buscarProfissionais();
  }, [clinicaId, buscarProfissionais]);

  const listaFiltrada = lista.filter(
    (prof) =>
      prof.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      prof.email?.toLowerCase().includes(busca.toLowerCase())
  );

  if (!canManageTherapists(role)) {
    return (
      <div className="profissionais-page">
        <h1>Profissionais da Clínica</h1>
        <p>Apenas gerentes e administradores podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="profissionais-page">
        <h1>Profissionais da Clínica</h1>

        <form className="form-profissional" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nome completo"
            value={form.nome}
            onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            type="text"
            placeholder="WhatsApp"
            value={form.celular}
            onChange={(e) => setForm((p) => ({ ...p, celular: e.target.value }))}
          />
          <input
            type="text"
            placeholder="CRM / Registro"
            value={form.registro}
            onChange={(e) => setForm((p) => ({ ...p, registro: e.target.value }))}
            required
          />
          <select
            value={form.especialidade}
            onChange={(e) => setForm((p) => ({ ...p, especialidade: e.target.value }))}
          >
            <option value="">Selecione a especialidade</option>
            {especialidades.map((esp) => (
              <option key={esp} value={esp}>
                {esp}
              </option>
            ))}
          </select>
          <select value={form.publico} onChange={(e) => setForm((p) => ({ ...p, publico: e.target.value }))}>
            <option value="Pediatria">Pediatria</option>
            <option value="Adulto">Adulto</option>
            <option value="Ambos">Ambos</option>
          </select>
          <label style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={form.createAuthUser}
              onChange={(e) => setForm((p) => ({ ...p, createAuthUser: e.target.checked }))}
            />
            Criar conta de login agora (opcional)
          </label>
          {form.createAuthUser && (
            <input
              type="password"
              placeholder="Senha temporária (mín. 6)"
              value={form.tempPassword}
              onChange={(e) => setForm((p) => ({ ...p, tempPassword: e.target.value }))}
              minLength={6}
              required
            />
          )}
          <button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Cadastrar Profissional"}
          </button>
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
    </div>
  );
};

export default Profissionais;
