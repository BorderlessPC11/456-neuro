import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../firebase";
import {
  FaHandsHelping,
  FaFileAlt,
  FaSave,
  FaEdit,
  FaTrash,
  FaPlus,
  FaTimes,
  FaHeartbeat,
  FaCalendarCheck,
  FaClipboardList,
  FaBrain,
} from "react-icons/fa";
import "./Terapias.css";
import { useAuth } from "../context/AuthContext";
import { canManageTherapists } from "../auth/roles";

const Terapias = () => {
  const { currentUserData, role } = useAuth();
  const [terapias, setTerapias] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
  });
  const [editId, setEditId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const clinicaId = currentUserData?.clinicaId || "";

  const fetchTerapias = useCallback(async () => {
    try {
      if (!clinicaId) {
        setTerapias([]);
        return;
      }
      const snap = await getDocs(query(collection(db, "terapias"), where("clinicaId", "==", clinicaId)));
      const data = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
      setTerapias(data);
    } catch (error) {
      console.error("Erro ao buscar terapias:", error);
    }
  }, [clinicaId]);

  useEffect(() => {
    fetchTerapias();
  }, [fetchTerapias]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        // Editar terapia existente
        const terapiaRef = doc(db, "terapias", editId);
        await updateDoc(terapiaRef, {
          nome: form.nome,
          descricao: form.descricao,
          clinicaId,
          ativo: true,
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Adicionar nova terapia
        const createdAt = new Date().toISOString();
        await addDoc(collection(db, "terapias"), {
          nome: form.nome,
          descricao: form.descricao,
          clinicaId,
          ativo: true,
          createdAt,
          criadoEm: createdAt,
        });
      }

      setForm({ nome: "", descricao: "" });
      setEditId(null);
      setIsModalOpen(false);
      fetchTerapias();
    } catch (error) {
      console.error("Erro ao salvar terapia:", error);
    }
  };

  const handleEdit = (terapia) => {
    setForm({
      nome: terapia.nome,
      descricao: terapia.descricao,
    });
    setEditId(terapia.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (terapiaId) => {
    try {
      await deleteDoc(doc(db, "terapias", terapiaId));
      fetchTerapias();
    } catch (error) {
      console.error("Erro ao excluir terapia:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleCancel = () => {
    setForm({ nome: "", descricao: "" });
    setEditId(null);
    setIsModalOpen(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  // Função para pegar ícone ilustrativo conforme nome
  const getIcon = (nome) => {
    const n = nome.toLowerCase();
    if (n.includes("aba")) return <FaClipboardList style={{ color: "#4A90E2" }} />;
    if (n.includes("ocupacional")) return <FaHandsHelping style={{ color: "#6ABF7A" }} />;
    if (n.includes("fono")) return <FaBrain style={{ color: "#FCB900" }} />;
    if (n.includes("física")) return <FaHeartbeat style={{ color: "#FF6F61" }} />;
    if (n.includes("psic")) return <FaFileAlt style={{ color: "#D72660" }} />;
    return <FaCalendarCheck style={{ color: "#2C3E50" }} />;
  };

  return (
    <div className="terapias-page">
        {!canManageTherapists(role) && (
          <div className="terapias-container">
            <div className="terapias-header">
              <h1>Registro de Terapias</h1>
              <p>Apenas gerentes e administradores podem gerenciar terapias.</p>
            </div>
          </div>
        )}
        {canManageTherapists(role) && (
        <div className="terapias-container">
          <div className="terapias-header">
            <h1>Registro de Terapias</h1>
            <p>Gerencie as terapias disponíveis no sistema.</p>
          </div>

          {/* Listagem de Terapias */}
          <div className="terapias-section">
            <div className="form-toggle">
              <button onClick={openModal} className="toggle-form-btn">
                <FaPlus /> Adicionar Nova Terapia
              </button>
            </div>

            {/* Modal para Adicionar/Editar Terapia */}
            {isModalOpen && (
              <div className="modal-overlay" onClick={handleCancel}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <button className="modal-close-btn" onClick={handleCancel}>
                    <FaTimes />
                  </button>
                  <h2>{editId ? "Editar Terapia" : "Adicionar Nova Terapia"}</h2>
                  <form className="form-terapia" onSubmit={handleSubmit}>
                    <div className="form-field">
                      <label><FaHandsHelping /> Nome da Terapia:</label>
                      <input
                        type="text"
                        name="nome"
                        value={form.nome}
                        onChange={handleChange}
                        placeholder="Ex.: Terapia ABA, Fonoaudiologia"
                        required
                      />
                    </div>
                    <div className="form-field">
                      <label><FaFileAlt /> Descrição:</label>
                      <textarea
                        name="descricao"
                        value={form.descricao}
                        onChange={handleChange}
                        placeholder="Descreva a terapia..."
                        rows="3"
                        required
                        style={{ textAlign: "justify" }}
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="save-btn">
                        <FaSave /> {editId ? "Salvar Alterações" : "Adicionar Terapia"}
                      </button>
                      <button type="button" className="cancel-btn" onClick={handleCancel}>
                        <FaTimes /> Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Listagem de Terapias Cadastradas */}
          <div className="terapias-list-section">
            <h2>
              <FaHandsHelping style={{ color: "#4A90E2" }} /> Terapias Cadastradas
            </h2>
            {terapias.length > 0 ? (
              <div className="terapias-list">
                {terapias.map((terapia) => (
                  <div key={terapia.id} className="terapia-card" style={{ alignItems: "flex-start" }}>
                    {/* Ícone da terapia */}
                    <div style={{
                      minWidth: 54, minHeight: 54, borderRadius: 12,
                      background: "linear-gradient(135deg,#F4F6F8,#E8F7FA)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginRight: 18, marginTop: 6, fontSize: 32,
                    }}>
                      {getIcon(terapia.nome)}
                    </div>
                    {/* Conteúdo textual */}
                    <div className="terapia-content" style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 18, color: "#2C3E50" }}>
                        {terapia.nome}
                      </p>
                      <p style={{
                        margin: "8px 0 6px 0",
                        fontSize: 15,
                        color: "#445",
                        textAlign: "justify"
                      }}>
                        {terapia.descricao}
                      </p>
                      <div style={{
                        fontSize: 12,
                        color: "#aaa",
                        marginTop: 10
                      }}>
                        <FaCalendarCheck style={{ marginRight: 4, color: "#B0BEC5" }} />
                        Criado em:{" "}
                        {terapia.criadoEm
                          ? new Date(terapia.criadoEm).toLocaleDateString("pt-BR")
                          : "--"}
                      </div>
                    </div>
                    {/* Botões de ação */}
                    <div className="terapia-actions" style={{ flexDirection: "column", gap: 8, marginLeft: 18 }}>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(terapia)}
                        title="Editar terapia"
                        style={{ marginBottom: 5 }}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(terapia.id)}
                        title="Excluir terapia"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#888", marginTop: 16 }}>Nenhuma terapia cadastrada.</p>
            )}
          </div>
        </div>
        )}
    </div>
  );
};

export default Terapias;
