import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaSearch, FaClipboardList, FaSave, FaBan } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "./Tarefas.css";

const prioridades = [
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

const statusTarefa = [
  { value: "pendente", label: "Pendente" },
  { value: "concluida", label: "Concluída" },
];

const Tarefas = () => {
  const [tarefas, setTarefas] = useState([]);
  const [form, setForm] = useState({
    descricao: "",
    dataVencimento: "",
    prioridade: "media",
    observacao: "",
  });
  const [editId, setEditId] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("pendente");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    buscarTarefas();
  }, [filtroStatus]);

  const buscarTarefas = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "tarefas"), orderBy("dataVencimento", "desc"));
      const snap = await getDocs(q);
      const tarefasFiltradas = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((t) => !filtroStatus || t.status === filtroStatus);
      setTarefas(tarefasFiltradas);
    } catch (err) {
      alert("Erro ao buscar tarefas: " + err.message);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descricao || !form.dataVencimento) {
      alert("Preencha descrição e data de vencimento.");
      return;
    }
    try {
      if (editId) {
        await updateDoc(doc(db, "tarefas", editId), { ...form });
        setModalMessage("Tarefa atualizada com sucesso!");
        setEditId(null);
      } else {
        await addDoc(collection(db, "tarefas"), {
          ...form,
          status: "pendente",
          criadoEm: new Date().toISOString(),
        });
        setModalMessage("Tarefa adicionada com sucesso!");
      }
      setForm({ descricao: "", dataVencimento: "", prioridade: "media", observacao: "" });
      buscarTarefas();
      setIsModalOpen(true);
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const excluirTarefa = async (id) => {
    if (!window.confirm("Excluir esta tarefa?")) return;
    try {
      await deleteDoc(doc(db, "tarefas", id));
      buscarTarefas();
      setModalMessage("Tarefa excluída com sucesso!");
      setIsModalOpen(true);
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const editarTarefa = (tarefa) => {
    setForm({
      descricao: tarefa.descricao,
      dataVencimento: tarefa.dataVencimento || "",
      prioridade: tarefa.prioridade || "media",
      observacao: tarefa.observacao || "",
    });
    setEditId(tarefa.id);
  };

  const atualizarStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "tarefas", id), { status });
      buscarTarefas();
      setModalMessage(`Status atualizado para "${statusTarefa.find(s => s.value === status).label}"!`);
      setIsModalOpen(true);
    } catch (err) {
      alert("Erro ao atualizar status: " + err.message);
    }
  };

  const limparForm = () => {
    setForm({ descricao: "", dataVencimento: "", prioridade: "media", observacao: "" });
    setEditId(null);
  };

  const tarefasFiltradas = tarefas.filter(
    (t) =>
      t.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      t.observacao?.toLowerCase().includes(busca.toLowerCase())
  );

  const totalPendentes = tarefasFiltradas.filter((t) => t.status === "pendente").length;
  const totalConcluidas = tarefasFiltradas.filter((t) => t.status === "concluida").length;

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content tarefas-main">
        <div className="tarefas-header">
          <h1><FaClipboardList /> Tarefas</h1>
          <p>Gerencie as tarefas pendentes e concluídas da clínica.</p>
        </div>

        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <FaTimes />
              </button>
              <h2><FaCheck /> Sucesso!</h2>
              <p>{modalMessage}</p>
              <div className="modal-actions">
                <button className="modal-ok-btn" onClick={() => setIsModalOpen(false)}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        <form className="tarefa-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="descricao"><strong>Descrição</strong></label>
            <input
              id="descricao"
              type="text"
              placeholder="Digite a descrição"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="dataVencimento"><strong>Data de Vencimento</strong></label>
            <input
              id="dataVencimento"
              type="date"
              value={form.dataVencimento}
              onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="prioridade"><strong>Prioridade</strong></label>
            <select
              id="prioridade"
              value={form.prioridade}
              onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
            >
              {prioridades.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="observacao"><strong>Observação</strong></label>
            <input
              id="observacao"
              type="text"
              placeholder="Digite uma observação"
              value={form.observacao}
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            />
          </div>
          <div className="form-actions">
            <button className="add-btn" type="submit">
              {editId ? (
                <>
                  <FaSave /> Salvar
                </>
              ) : (
                <>
                  <FaPlus /> Adicionar
                </>
              )}
            </button>
            {editId && (
              <button className="cancel-btn" type="button" onClick={limparForm}>
                <FaBan /> Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="tarefas-filtros">
          <div className="filtro-status">
            {statusTarefa.map((s) => (
              <button
                key={s.value}
                className={`status-btn ${filtroStatus === s.value ? "active" : ""}`}
                onClick={() => setFiltroStatus(s.value)}
                type="button"
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="busca-box">
            <FaSearch className="icon-search" />
            <input
              type="text"
              placeholder="Buscar descrição ou observação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="tarefas-lista">
          {loading && <div className="loading">Carregando...</div>}
          {!loading && tarefasFiltradas.length === 0 && (
            <div className="vazio-state">
              <FaClipboardList className="empty-icon" />
              <p>Nenhuma tarefa encontrada.</p>
            </div>
          )}
          {tarefasFiltradas.map((tarefa) => (
            <div key={tarefa.id} className={`tarefa-card ${tarefa.status}`}>
              <div className="card-header">
                <div className="card-info">
                  <strong>{tarefa.descricao}</strong>
                  <span className={`prioridade prioridade-${tarefa.prioridade}`}>{tarefa.prioridade}</span>
                </div>
                <div className="card-actions">
                  <button
                    className="action-btn action-check"
                    title={tarefa.status === "pendente" ? "Marcar como concluída" : "Reabrir"}
                    onClick={() => atualizarStatus(tarefa.id, tarefa.status === "pendente" ? "concluida" : "pendente")}
                  >
                    <FaCheck />
                  </button>
                  <button className="action-btn action-edit" title="Editar" onClick={() => editarTarefa(tarefa)}>
                    <FaEdit />
                  </button>
                  <button className="action-btn action-delete" title="Excluir" onClick={() => excluirTarefa(tarefa.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="card-details">
                <span>
                  <strong>Vencimento:</strong> {new Date(tarefa.dataVencimento).toLocaleDateString("pt-BR")}
                </span>
                {tarefa.observacao && (
                  <span className="obs">
                    <strong>Obs:</strong> {tarefa.observacao}
                  </span>
                )}
              </div>
              <div className="card-status">
                {tarefa.status === "pendente" && <span className="status status-pendente">PENDENTE</span>}
                {tarefa.status === "concluida" && <span className="status status-concluida">CONCLUÍDA</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="tarefas-totais">
          <span><strong>Pendentes:</strong> {totalPendentes}</span>
          <span><strong>Concluídas:</strong> {totalConcluidas}</span>
        </div>
      </main>
    </div>
  );
};

export default Tarefas;