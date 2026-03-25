import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaSearch, FaClipboardList, FaSave, FaBan } from "react-icons/fa";
import "./Despesas.css";

const categorias = [
  { value: "aluguel", label: "Aluguel" },
  { value: "salarios", label: "Salários" },
  { value: "materiais", label: "Materiais" },
  { value: "servicos", label: "Serviços" },
  { value: "outros", label: "Outros" },
];

const statusDespesa = [
  { value: "aberto", label: "Aberto" },
  { value: "pago", label: "Pago" },
  { value: "vencida", label: "Vencida" },
];

const Despesas = () => {
  const [despesas, setDespesas] = useState([]);
  const [form, setForm] = useState({
    descricao: "",
    valor: "",
    categoria: "outros",
    dataVencimento: "",
    observacao: "",
  });
  const [editId, setEditId] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("mes");
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear());
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    buscarDespesas();
  }, [filtroPeriodo, filtroAno, filtroMes]);

  const buscarDespesas = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "despesas"), orderBy("dataVencimento", "desc"));
      const snap = await getDocs(q);
      const dataAtual = new Date();
      const despesasFiltradas = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((d) => {
          const dataVenc = new Date(d.dataVencimento);
          if (filtroPeriodo === "semana") {
            const inicioSemana = new Date(dataAtual);
            inicioSemana.setDate(dataAtual.getDate() - dataAtual.getDay());
            const fimSemana = new Date(inicioSemana);
            fimSemana.setDate(inicioSemana.getDate() + 6);
            return dataVenc >= inicioSemana && dataVenc <= fimSemana;
          } else if (filtroPeriodo === "mes") {
            return (
              dataVenc.getFullYear() === filtroAno &&
              dataVenc.getMonth() + 1 === filtroMes
            );
          } else if (filtroPeriodo === "ano") {
            return dataVenc.getFullYear() === filtroAno;
          }
          return true;
        });
      setDespesas(despesasFiltradas);
    } catch (err) {
      alert("Erro ao buscar despesas: " + err.message);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descricao || !form.valor || !form.dataVencimento) {
      alert("Preencha descrição, valor e data de vencimento.");
      return;
    }
    try {
      if (editId) {
        await updateDoc(doc(db, "despesas", editId), { ...form });
        setModalMessage("Despesa atualizada com sucesso!");
        setEditId(null);
      } else {
        await addDoc(collection(db, "despesas"), {
          ...form,
          status: "aberto",
          criadoEm: new Date().toISOString(),
        });
        setModalMessage("Despesa adicionada com sucesso!");
      }
      setForm({ descricao: "", valor: "", categoria: "outros", dataVencimento: "", observacao: "" });
      buscarDespesas();
      setIsModalOpen(true);
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const excluirDespesa = async (id) => {
    if (!window.confirm("Excluir esta despesa?")) return;
    try {
      await deleteDoc(doc(db, "despesas", id));
      buscarDespesas();
      setModalMessage("Despesa excluída com sucesso!");
      setIsModalOpen(true);
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const editarDespesa = (despesa) => {
    setForm({
      descricao: despesa.descricao,
      valor: despesa.valor || "",
      categoria: despesa.categoria || "outros",
      dataVencimento: despesa.dataVencimento || "",
      observacao: despesa.observacao || "",
    });
    setEditId(despesa.id);
  };

  const atualizarStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "despesas", id), { status });
      buscarDespesas();
      setModalMessage(`Status atualizado para "${statusDespesa.find(s => s.value === status).label}"!`);
      setIsModalOpen(true);
    } catch (err) {
      alert("Erro ao atualizar status: " + err.message);
    }
  };

  const limparForm = () => {
    setForm({ descricao: "", valor: "", categoria: "outros", dataVencimento: "", observacao: "" });
    setEditId(null);
  };

  const despesasFiltradas = despesas.filter(
    (d) =>
      d.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      d.observacao?.toLowerCase().includes(busca.toLowerCase())
  );

  const totalGeral = despesasFiltradas.reduce((acc, despesa) => {
    const valor = Number(despesa.valor);
    return isNaN(valor) ? acc : acc + valor;
  }, 0);

  return (
    <div className="despesas-page">
        <div className="despesas-header">
          <h1><FaClipboardList /> Despesas</h1>
          <p>Gerencie contas a pagar e despesas gerais da clínica.</p>
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

        <form className="despesa-form" onSubmit={handleSubmit}>
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
            <label htmlFor="valor"><strong>Valor (R$)</strong></label>
            <input
              id="valor"
              type="number"
              min="0"
              step="0.01"
              placeholder="Digite o valor"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="categoria"><strong>Categoria</strong></label>
            <select
              id="categoria"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            >
              {categorias.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
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

        <div className="despesas-filtros">
          <div className="filtro-periodo">
            <label><strong>Período:</strong></label>
            <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)}>
              <option value="semana">Semana</option>
              <option value="mes">Mês</option>
              <option value="ano">Ano</option>
            </select>
          </div>
          <div className="filtro-mes">
            <label><strong>Mês:</strong></label>
            <select value={filtroMes} onChange={(e) => setFiltroMes(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2025, i, 1).toLocaleString("pt-BR", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          <div className="filtro-ano">
            <label><strong>Ano:</strong></label>
            <select value={filtroAno} onChange={(e) => setFiltroAno(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => (
                <option key={2023 + i} value={2023 + i}>
                  {2023 + i}
                </option>
              ))}
            </select>
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

        <div className="despesas-lista">
          {loading && <div className="loading">Carregando...</div>}
          {!loading && despesasFiltradas.length === 0 && (
            <div className="vazio-state">
              <FaClipboardList className="empty-icon" />
              <p>Nenhuma despesa encontrada.</p>
            </div>
          )}
          {despesasFiltradas.map((despesa) => (
            <div key={despesa.id} className={`despesa-card ${despesa.status}`}>
              <div className="card-header">
                <div className="card-info">
                  <strong>{despesa.descricao}</strong>
                  <span className={`categoria categoria-${despesa.categoria}`}>{despesa.categoria}</span>
                </div>
                <div className="card-actions">
                  {despesa.status === "aberto" && (
                    <>
                      <button
                        className="action-btn action-check"
                        title="Marcar como pago"
                        onClick={() => atualizarStatus(despesa.id, "pago")}
                      >
                        <FaCheck />
                      </button>
                      <button className="action-btn action-edit" title="Editar" onClick={() => editarDespesa(despesa)}>
                        <FaEdit />
                      </button>
                    </>
                  )}
                  {(despesa.status === "aberto" || despesa.status === "pago") && (
                    <button
                      className="action-btn action-mark-vencida"
                      title="Marcar como vencida"
                      onClick={() => atualizarStatus(despesa.id, "vencida")}
                    >
                      <FaTimes />
                    </button>
                  )}
                  <button className="action-btn action-delete" title="Excluir" onClick={() => excluirDespesa(despesa.id)}>
                    <FaTrash />
                  </button>
                </div>
              </div>
              <div className="card-details">
                <span>
                  <strong>Valor:</strong>{" "}
                  {Number(despesa.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <span>
                  <strong>Vencimento:</strong> {new Date(despesa.dataVencimento).toLocaleDateString("pt-BR")}
                </span>
                {despesa.observacao && (
                  <span className="obs">
                    <strong>Obs:</strong> {despesa.observacao}
                  </span>
                )}
              </div>
              <div className="card-status">
                {despesa.status === "aberto" && <span className="status status-aberto">ABERTO</span>}
                {despesa.status === "pago" && <span className="status status-pago">PAGO</span>}
                {despesa.status === "vencida" && <span className="status status-vencida">VENCIDA</span>}
              </div>
            </div>
          ))}
        </div>

        {despesasFiltradas.length > 0 && totalGeral > 0 && (
          <div className="total-geral">
            <strong>Total geral:</strong>{" "}
            {totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        )}
    </div>
  );
};

export default Despesas;