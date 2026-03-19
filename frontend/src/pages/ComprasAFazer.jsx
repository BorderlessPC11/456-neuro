import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaSearch, FaCartPlus, FaClipboardList, FaSave, FaBan } from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "./ComprasAFazer.css";

const prioridades = [
  { value: "alta", label: "Alta" },
  { value: "média", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

const statusCompra = [
  { value: "pendente", label: "Pendente" },
  { value: "comprado", label: "Comprado" },
  { value: "cancelado", label: "Cancelado" },
];

const ComprasAFazer = () => {
  const [compras, setCompras] = useState([]);
  const [form, setForm] = useState({
    produto: "",
    quantidade: "",
    valor: "",
    prioridade: "média",
    observacao: "",
    data: "",
  });
  const [editId, setEditId] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("pendente");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    buscarCompras();
  }, []);

  const buscarCompras = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "comprasAFazer"), orderBy("criadoEm", "desc"));
      const snap = await getDocs(q);
      setCompras(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      alert("Erro ao buscar compras: " + err.message);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.produto || !form.quantidade) {
      alert("Preencha produto e quantidade.");
      return;
    }
    try {
      if (editId) {
        await updateDoc(doc(db, "comprasAFazer", editId), { ...form });
        setModalMessage("Item atualizado com sucesso!");
        setEditId(null);
      } else {
        await addDoc(collection(db, "comprasAFazer"), {
          ...form,
          status: "pendente",
          criadoEm: new Date().toISOString(),
        });
        setModalMessage("Item adicionado com sucesso!");
      }
      setForm({ produto: "", quantidade: "", valor: "", prioridade: "média", observacao: "", data: "" });
      buscarCompras();
      setIsModalOpen(true);
    } catch (err) {
      alert("Erro ao salvar: " + err.message);
    }
  };

  const excluirCompra = async (id) => {
    if (!window.confirm("Excluir este item?")) return;
    try {
      await deleteDoc(doc(db, "comprasAFazer", id));
      buscarCompras();
      setModalMessage("Item excluído com sucesso!");
      setIsModalOpen(true);
    } catch (err) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  const editarCompra = (compra) => {
    setForm({
      produto: compra.produto,
      quantidade: compra.quantidade,
      valor: compra.valor || "",
      prioridade: compra.prioridade,
      observacao: compra.observacao || "",
      data: compra.data || "",
    });
    setEditId(compra.id);
  };

  const atualizarStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, "comprasAFazer", id), { status });
      buscarCompras();
      setModalMessage(`Status atualizado para "${statusCompra.find(s => s.value === status).label}"!`);
      setIsModalOpen(true);
    } catch (err) {
      alert("Erro ao atualizar status: " + err.message);
    }
  };

  const limparForm = () => {
    setForm({ produto: "", quantidade: "", valor: "", prioridade: "média", observacao: "", data: "" });
    setEditId(null);
  };

  const comprasFiltradas = compras.filter(
    (c) =>
      (!filtroStatus || c.status === filtroStatus) &&
      (c.produto?.toLowerCase().includes(busca.toLowerCase()) || c.observacao?.toLowerCase().includes(busca.toLowerCase()))
  );

  const totalGeral = comprasFiltradas.reduce((acc, compra) => {
    const qtd = Number(compra.quantidade);
    const valor = Number(compra.valor);
    if (isNaN(qtd) || isNaN(valor)) return acc;
    return acc + qtd * valor;
  }, 0);

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content compras-main">
        <div className="compras-header">
          <h1><FaClipboardList /> Compras a Fazer</h1>
          <p>Organize, adicione, marque como comprada ou exclua suas compras e itens pendentes.</p>
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

        <form className="compra-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="produto"><strong>Produto</strong></label>
            <input
              id="produto"
              type="text"
              placeholder="Digite o produto"
              value={form.produto}
              onChange={(e) => setForm({ ...form, produto: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="quantidade"><strong>Quantidade</strong></label>
            <input
              id="quantidade"
              type="number"
              min="1"
              placeholder="Digite a quantidade"
              value={form.quantidade}
              onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="valor"><strong>Valor unitário (R$)</strong></label>
            <input
              id="valor"
              type="number"
              min="0"
              step="0.01"
              placeholder="Digite o valor"
              value={form.valor}
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
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
            <label htmlFor="data"><strong>Data</strong></label>
            <input
              id="data"
              type="date"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
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

        <div className="compras-filtros">
          <div className="filtro-status">
            {statusCompra.map((s) => (
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
              placeholder="Buscar produto ou observação..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="compras-lista">
          {loading && <div className="loading">Carregando...</div>}
          {!loading && comprasFiltradas.length === 0 && (
            <div className="vazio-state">
              <FaCartPlus className="empty-icon" />
              <p>Nenhum item encontrado.</p>
            </div>
          )}
          {comprasFiltradas.map((compra) => {
            const qtd = Number(compra.quantidade);
            const valor = Number(compra.valor);
            const total = !isNaN(qtd) && !isNaN(valor) ? qtd * valor : "";
            return (
              <div key={compra.id} className={`compra-card ${compra.status}`}>
                <div className="card-header">
                  <div className="card-info">
                    <strong>{compra.produto}</strong>
                    <span className={`prioridade prioridade-${compra.prioridade}`}>{compra.prioridade}</span>
                  </div>
                  <div className="card-actions">
                    {compra.status === "pendente" && (
                      <>
                        <button
                          className="action-btn action-check"
                          title="Marcar como comprado"
                          onClick={() => atualizarStatus(compra.id, "comprado")}
                        >
                          <FaCheck />
                        </button>
                        <button className="action-btn action-edit" title="Editar" onClick={() => editarCompra(compra)}>
                          <FaEdit />
                        </button>
                        <button
                          className="action-btn action-cancel"
                          title="Cancelar"
                          onClick={() => atualizarStatus(compra.id, "cancelado")}
                        >
                          <FaTimes />
                        </button>
                      </>
                    )}
                    <button className="action-btn action-delete" title="Excluir" onClick={() => excluirCompra(compra.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </div>
                <div className="card-details">
                  <span>
                    <strong>Qtd:</strong> {compra.quantidade}
                  </span>
                  {compra.valor && (
                    <span>
                      <strong>R$:</strong>{" "}
                      {Number(compra.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  )}
                  {total && (
                    <span>
                      <strong>Total:</strong>{" "}
                      {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </span>
                  )}
                  {compra.data && (
                    <span>
                      <strong>Data:</strong> {new Date(compra.data).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {compra.observacao && (
                    <span className="obs">
                      <strong>Obs:</strong> {compra.observacao}
                    </span>
                  )}
                </div>
                <div className="card-status">
                  {compra.status === "pendente" && <span className="status status-pendente">PENDENTE</span>}
                  {compra.status === "comprado" && <span className="status status-comprado">COMPRADO</span>}
                  {compra.status === "cancelado" && <span className="status status-cancelado">CANCELADO</span>}
                </div>
              </div>
            );
          })}
        </div>

        {comprasFiltradas.length > 0 && totalGeral > 0 && (
          <div className="total-geral">
            <strong>Total geral:</strong>{" "}
            {totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ComprasAFazer;