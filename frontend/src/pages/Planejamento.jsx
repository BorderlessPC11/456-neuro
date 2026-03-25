import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./Planejamento.css";

import {
  FaUser,
  FaPlus,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaSave,
  FaHandsHelping,
  FaCalendarAlt,
  FaFileAlt,
  FaFlag,
  FaLightbulb,
  FaClipboardList, // Adicione este
  FaCogs,          // Adicione este
  FaLink,
  FaImages,
  FaFileUpload,
  FaTrash,
  FaEdit,
  FaUserMd,
  FaSearch,
  FaUsers,
} from "react-icons/fa";

/**
 * Estrutura salva em pacientes.[id].planejamentosPDI (array)
 * {
 * terapias: [{id, nome}],
 * titulo, dataInicio, dataFim, objetivoGeral, estrategiasRecursos, avaliacao,
 * objetivosEspecificos: [{descricao, dataAlvo}],
 * habilidades: [{titulo, formaTrabalho, tipo, status?}],
 * midias: [{tipo:"documento"|"foto_video"|"link", nome, url}],
 * status: "Em Curso"|"Concluído"|"Pausado",
 * responsaveisIds: [profId,...],
 * criadoEm: ISOString
 * }
 */

const tiposHabilidade = [
  "Nova Habilidade",
  "Aquisição de Habilidade",
  "Habilidade Generalizada",
  "Manutenção de Habilidade",
];

const Planejamento = () => {
  const { currentUserData, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const clinicaId = currentUserData?.clinicaId || "";
  const temClinica = useMemo(() => !!clinicaId, [clinicaId]);

  // ======= Estados base =======
  const [pacientes, setPacientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [terapiasCatalogo, setTerapiasCatalogo] = useState([]);

  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [pdis, setPdis] = useState([]);

  // ======= Estados para busca de pacientes =======
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // ======= Modal/Wizard =======
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1..3
  const [editIndex, setEditIndex] = useState(null);

  // ======= Formulário PDI - ATUALIZADO COM PERÍODO =======
  const [form, setForm] = useState({
    terapias: [], // [{id, nome}]
    titulo: "",
    dataInicio: "", // Nova campo
    dataFim: "",    // Nova campo
    objetivoGeral: "",
    estrategiasRecursos: "",
    avaliacao: "",
    objetivosEspecificos: [], // [{descricao, dataAlvo}]
    habilidades: [], // [{titulo, formaTrabalho, tipo, status?}]
    midias: [], // [{tipo, nome, url}]
    status: "Em Curso",
    responsaveisIds: [],
  });

  // ======= Filtro de pacientes otimizado =======
  const filteredPacientes = useMemo(() => {
    if (!searchTerm.trim()) {
      // Se não há busca, mostra apenas os primeiros 20 para performance inicial
      return pacientes.slice(0, 20);
    }
    
    const term = searchTerm.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return pacientes.filter(paciente => {
      const nome = (paciente.nome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const cid = (paciente.cid || '').toLowerCase();
      
      return nome.includes(term) || cid.includes(term);
    });
  }, [pacientes, searchTerm]);

  // ======= Handlers para busca =======
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const getDisplayMessage = () => {
    if (pacientes.length === 0) return 'Nenhum paciente cadastrado.';
    if (searchTerm.trim() && filteredPacientes.length === 0) {
      return `Nenhum paciente encontrado para "${searchTerm}".`;
    }
    if (!searchTerm.trim() && pacientes.length > 20) {
      return `Mostrando 20 de ${pacientes.length} pacientes. Use a busca para encontrar pacientes específicos.`;
    }
    if (searchTerm.trim()) {
      return `${filteredPacientes.length} paciente(s) encontrado(s).`;
    }
    return null;
  };

  // ======= Carregamentos =======
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      await Promise.all([carregarPacientes(), carregarProfissionais(), carregarTerapias()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, clinicaId]);

  const carregarPacientes = async () => {
    try {
      if (!temClinica) return;
      const q = query(collection(db, "pacientes"), where("clinicaId", "==", clinicaId));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a?.nome || "").localeCompare(b?.nome || ""));
      setPacientes(data);
    } catch (e) {
      console.error("Erro ao buscar pacientes:", e);
    }
  };

  const carregarProfissionais = async () => {
    try {
      if (!temClinica) return;
      const q = query(collection(db, "profissionais"), where("clinicaId", "==", clinicaId));
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a?.nome || "").localeCompare(b?.nome || ""));
      setProfissionais(data);
    } catch (e) {
      console.error("Erro ao buscar profissionais:", e);
    }
  };

  // ✅ Ajuste: tenta por clinicaId; se vier vazio, busca TODAS e ordena por "nome"
  const carregarTerapias = async () => {
    try {
      let docs = [];
      if (temClinica) {
        const qClin = query(collection(db, "terapias"), where("clinicaId", "==", clinicaId));
        const snapClin = await getDocs(qClin);
        docs = snapClin.docs;
      }
      // fallback quando não há clinicaId no doc ou não retornou nada
      if (!temClinica || docs.length === 0) {
        const snapAll = await getDocs(collection(db, "terapias"));
        docs = snapAll.docs;
      }
      const data = docs.map((d) => ({ id: d.id, ...d.data() }));
      // garante lista pelo campo "nome"
      data.sort((a, b) => (a?.nome || "").localeCompare(b?.nome || ""));
      setTerapiasCatalogo(data);
    } catch (e) {
      console.error("Erro ao buscar terapias:", e);
    }
  };

  // ======= Util =======
  const resetForm = () =>
    setForm({
      terapias: [],
      titulo: "",
      dataInicio: "",
      dataFim: "",
      objetivoGeral: "",
      estrategiasRecursos: "",
      avaliacao: "",
      objetivosEspecificos: [],
      habilidades: [],
      midias: [],
      status: "Em Curso",
      responsaveisIds: [],
    });

  const selecionarPaciente = async (pac) => {
    setSelectedPaciente(pac);
    setEditIndex(null);
    resetForm();
    setStep(1);
    setIsOpen(false);

    // carrega PDIs existentes
    try {
      const ref = doc(db, "pacientes", pac.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setPdis(Array.isArray(data.planejamentosPDI) ? data.planejamentosPDI : []);
      } else {
        setPdis([]);
      }
    } catch (e) {
      console.error("Erro ao buscar PDIs:", e);
      setPdis([]);
    }
  };

  // ======= Handlers do form =======
  const addObjetivo = (obj) => {
    setForm((prev) => ({ ...prev, objetivosEspecificos: [...prev.objetivosEspecificos, obj] }));
  };
  const removeObjetivo = (idx) => {
    setForm((prev) => ({
      ...prev,
      objetivosEspecificos: prev.objetivosEspecificos.filter((_, i) => i !== idx),
    }));
  };

  const addHabilidade = (hab) => {
    setForm((prev) => ({ ...prev, habilidades: [...prev.habilidades, hab] }));
  };
  const removeHabilidade = (idx) => {
    setForm((prev) => ({
      ...prev,
      habilidades: prev.habilidades.filter((_, i) => i !== idx),
    }));
  };

  const addMidia = (m) => {
    setForm((prev) => ({ ...prev, midias: [...prev.midias, m] }));
  };
  const removeMidia = (idx) => {
    setForm((prev) => ({
      ...prev,
      midias: prev.midias.filter((_, i) => i !== idx),
    }));
  };

  const toggleProfResponsavel = (id) => {
    setForm((prev) => {
      const s = new Set(prev.responsaveisIds);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return { ...prev, responsaveisIds: Array.from(s) };
    });
  };

  const toggleTerapia = (terapia) => {
    setForm((prev) => {
      const has = prev.terapias.find((t) => t.id === terapia.id);
      let arr;
      if (has) {
        arr = prev.terapias.filter((t) => t.id !== terapia.id);
      } else {
        // usa exatamente o campo "nome" do documento
        arr = [...prev.terapias, { id: terapia.id, nome: terapia.nome || "Sem nome" }];
      }
      return { ...prev, terapias: arr };
    });
  };

  // ======= Validar e Salvar =======
  const validar = () => {
    if (!selectedPaciente?.id) return "Selecione um paciente.";
    if (form.terapias.length === 0) return "Selecione ao menos uma terapia.";
    if (!form.titulo?.trim()) return "Informe o título do PDI.";
    if (!form.dataInicio) return "Informe a data de início.";
    if (!form.objetivoGeral?.trim()) return "Informe o objetivo geral.";
    return "";
  };

  const salvarPDI = async () => {
    const erro = validar();
    if (erro) {
      alert(erro);
      return;
    }
    try {
      const ref = doc(db, "pacientes", selectedPaciente.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        alert("Paciente não encontrado.");
        return;
      }
      const data = snap.data();
      const arr = Array.isArray(data.planejamentosPDI) ? data.planejamentosPDI : [];

      const novoPDI = {
        ...form,
        criadoEm: new Date().toISOString(),
      };

      let atualizados;
      if (editIndex !== null) {
        atualizados = [...arr];
        const antigo = atualizados[editIndex] || {};
        atualizados[editIndex] = { ...novoPDI, criadoEm: antigo.criadoEm || novoPDI.criadoEm };
      } else {
        atualizados = [...arr, novoPDI];
      }

      // ✅ grava somente a chave correta
      await updateDoc(ref, { planejamentosPDI: atualizados });

      setPdis(atualizados);
      setIsOpen(false);
      resetForm();
      setStep(1);
      setEditIndex(null);
    } catch (e) {
      console.error("Erro ao salvar PDI:", e);
    }
  };

  const editarPDI = (idx) => {
    const p = pdis[idx];
    setForm({
      terapias: Array.isArray(p.terapias) ? p.terapias : [],
      titulo: p.titulo || "",
      dataInicio: p.dataInicio || p.data || "", // compatibilidade com campo antigo
      dataFim: p.dataFim || "",
      objetivoGeral: p.objetivoGeral || "",
      estrategiasRecursos: p.estrategiasRecursos || "",
      avaliacao: p.avaliacao || "",
      objetivosEspecificos: Array.isArray(p.objetivosEspecificos) ? p.objetivosEspecificos : [],
      habilidades: Array.isArray(p.habilidades) ? p.habilidades : [],
      midias: Array.isArray(p.midias) ? p.midias : [],
      status: p.status || "Em Curso",
      responsaveisIds: Array.isArray(p.responsaveisIds) ? p.responsaveisIds : [],
    });
    setEditIndex(idx);
    setStep(1);
    setIsOpen(true);
  };

  const excluirPDI = async (idx) => {
    if (!window.confirm("Excluir este PDI?")) return;
    try {
      const ref = doc(db, "pacientes", selectedPaciente.id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      const arr = Array.isArray(data.planejamentosPDI) ? data.planejamentosPDI : [];
      const atualizados = arr.filter((_, i) => i !== idx);
      await updateDoc(ref, { planejamentosPDI: atualizados });
      setPdis(atualizados);
    } catch (e) {
      console.error("Erro ao excluir PDI:", e);
    }
  };

  // ======= Função para formatar período =======
  const formatarPeriodo = (dataInicio, dataFim) => {
    if (!dataInicio) return "";
    const inicio = new Date(dataInicio).toLocaleDateString('pt-BR');
    if (!dataFim) return `Início: ${inicio}`;
    const fim = new Date(dataFim).toLocaleDateString('pt-BR');
    return `${inicio} até ${fim}`;
  };

  // ======= Componentes auxiliares do wizard =======

  const TerapiasMulti = () => (
    <div className="field">
      <label><FaHandsHelping /> Terapias (selecione uma ou mais)</label>
      <div className="chips">
        {terapiasCatalogo.length === 0 && <span className="muted">Nenhuma terapia cadastrada.</span>}
        {terapiasCatalogo.map((t) => {
          const active = !!form.terapias.find((x) => x.id === t.id);
          return (
            <button
              key={t.id}
              type="button"
              className={`chip ${active ? "chip-active" : ""}`}
              onClick={() => toggleTerapia(t)}
              title={t.descricao || t.nome}
            >
              {t.nome || "Sem nome"}
            </button>
          );
        })}
      </div>
    </div>
  );

  const ResponsaveisMulti = () => (
    <div className="field">
      <label><FaUserMd /> Profissionais responsáveis (opcional)</label>
      <div className="checkbox-grid">
        {profissionais.length === 0 ? (
          <span className="muted">Nenhum profissional cadastrado.</span>
        ) : (
          profissionais.map((p) => (
            <label key={p.id} className="check-item">
              <input
                type="checkbox"
                checked={form.responsaveisIds.includes(p.id)}
                onChange={() => toggleProfResponsavel(p.id)}
              />
              <span>{p.nome}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );

  const ObjetivosUI = () => {
    const [descricao, setDescricao] = useState("");
    const [dataAlvo, setDataAlvo] = useState("");

    return (
      <>
        <div className="field">
          <label><FaFlag /> Objetivos específicos</label>
          <div className="inline-add">
            <input
              type="text"
              placeholder="Descreva o objetivo específico..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
            <input
              type="date"
              value={dataAlvo}
              onChange={(e) => setDataAlvo(e.target.value)}
              title="Data de alcance do objetivo"
            />
            <button
              type="button"
              className="btn-add"
              onClick={() => {
                if (!descricao.trim()) return;
                addObjetivo({ descricao: descricao.trim(), dataAlvo });
                setDescricao("");
                setDataAlvo("");
              }}
            >
              <FaPlus /> Adicionar
            </button>
          </div>
          <ul className="pill-list">
            {form.objetivosEspecificos.map((o, idx) => (
              <li key={idx} className="pill">
                <span className="pill-main">
                  <FaLightbulb /> {o.descricao}
                  {o.dataAlvo ? <em className="pill-sub"> • Alvo: {o.dataAlvo}</em> : null}
                </span>
                <button type="button" className="pill-remove" onClick={() => removeObjetivo(idx)}>
                  <FaTimes />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </>
    );
  };

  const HabilidadesUI = () => {
    const [titulo, setTitulo] = useState("");
    const [formaTrabalho, setFormaTrabalho] = useState("");
    const [tipo, setTipo] = useState(tiposHabilidade[0]);

    return (
      <div className="field">
        <label>Habilidades (opcional)</label>
        <div className="grid-3">
          <input
            type="text"
            placeholder="Habilidade (ex.: calçar o tênis)"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />
          <input
            type="text"
            placeholder="Forma de trabalhar (ex.: treino diário)"
            value={formaTrabalho}
            onChange={(e) => setFormaTrabalho(e.target.value)}
          />
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {tiposHabilidade.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="btn-add"
          onClick={() => {
            if (!titulo.trim()) return;
            addHabilidade({ titulo: titulo.trim(), formaTrabalho, tipo });
            setTitulo("");
            setFormaTrabalho("");
            setTipo(tiposHabilidade[0]);
          }}
        >
          <FaPlus /> Adicionar
        </button>

        <ul className="skills-list">
          {form.habilidades.map((h, idx) => (
            <li key={idx} className="skill-item">
              <div>
                <strong>{h.titulo}</strong>
                {h.formaTrabalho ? <div className="muted">{h.formaTrabalho}</div> : null}
                <div className="skill-tag">{h.tipo}</div>
              </div>
              <button type="button" className="icon-btn danger" onClick={() => removeHabilidade(idx)}>
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const MidiasUI = () => {
    const [nome, setNome] = useState("");
    const [url, setUrl] = useState("");

    return (
      <div className="field">
        <label>Mídias (opcional)</label>
        <div className="midias-toolbar">
          <button
            type="button"
            className="midia-btn"
            onClick={() => {
              if (!nome.trim()) return;
              addMidia({ tipo: "documento", nome: nome.trim(), url: "" });
              setNome("");
              setUrl("");
            }}
            title="(placeholder) Adiciona um documento"
          >
            <FaFileUpload /> Adicionar documento
          </button>
          <button
            type="button"
            className="midia-btn"
            onClick={() => {
              if (!nome.trim()) return;
              addMidia({ tipo: "foto_video", nome: nome.trim(), url: "" });
              setNome("");
              setUrl("");
            }}
            title="(placeholder) Adiciona foto/vídeo"
          >
            <FaImages /> Adicionar fotos / vídeos
          </button>
          <div className="midia-link">
            <input
              type="text"
              placeholder="Nome da mídia/link"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <input
              type="url"
              placeholder="URL externa (opcional)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button
              type="button"
              className="midia-btn"
              onClick={() => {
                if (!nome.trim() && !url.trim()) return;
                addMidia({ tipo: "link", nome: nome.trim() || url, url: url.trim() });
                setNome("");
                setUrl("");
              }}
            >
              <FaLink /> Adicionar link externo
            </button>
          </div>
        </div>

        <ul className="midia-list">
          {form.midias.map((m, idx) => (
            <li key={idx} className="midia-item">
              <span className={`midia-chip ${m.tipo}`}>{m.tipo}</span>
              <span className="midia-name">{m.nome}</span>
              {m.url ? (
                <a href={m.url} className="midia-url" target="_blank" rel="noreferrer">
                  {m.url}
                </a>
              ) : null}
              <button type="button" className="icon-btn danger" onClick={() => removeMidia(idx)}>
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>

        <p className="muted small">
          * Integração com Storage será habilitada depois (UI já preparada). Por enquanto, salvamos apenas os metadados.
        </p>
      </div>
    );
  };

  // ======= Render =======
  if (authLoading) return <div className="loading-container">Carregando…</div>;

  return (
    <div className="planejamento-page">
      <div className="pdi-container">
          <div className="pdi-header">
            <h1>PDI — Plano de Desenvolvimento Individual</h1>
            <p>Crie e acompanhe o PDI dos pacientes.</p>
          </div>

          {/* SEÇÃO DE PACIENTES COM BUSCA */}
          <section className="pacientes-box">
            <div className="pacientes-header">
              <h2>
                <FaUsers /> 
                Pacientes 
                {pacientes.length > 0 && (
                  <span className="pacientes-count">({pacientes.length})</span>
                )}
              </h2>
              
              {/* Campo de busca */}
              <div className={`search-container ${isSearchFocused ? 'focused' : ''}`}>
                <div className="search-input-wrapper">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Buscar paciente por nome ou CID..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                  {searchTerm && (
                    <button 
                      type="button" 
                      className="search-clear"
                      onClick={clearSearch}
                      title="Limpar busca"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mensagem informativa */}
            {getDisplayMessage() && (
              <div className="search-info">
                {getDisplayMessage()}
              </div>
            )}

            {/* Grid de pacientes filtrados */}
            <div className="pacientes-grid">
              {filteredPacientes.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`paciente-tile ${selectedPaciente?.id === p.id ? "active" : ""}`}
                  onClick={() => selecionarPaciente(p)}
                >
                  <div className="paciente-name">{p.nome}</div>
                  {p.cid ? <div className="paciente-sub">CID: {p.cid}</div> : null}
                </button>
              ))}
            </div>

            {/* Estado vazio para busca */}
            {searchTerm.trim() && filteredPacientes.length === 0 && (
              <div className="empty-search-state">
                <FaSearch size={48} />
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente ajustar os termos da sua busca</p>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={clearSearch}
                >
                  Limpar busca
                </button>
              </div>
            )}
          </section>

          {/* ===== PDIS DO PACIENTE - NOVA VERSÃO OBJETIVA ===== */}
          {selectedPaciente && (
            <section className="pdis-list-box">
              <div className="toolbar">
                <h2>PDIs de {selectedPaciente.nome}</h2>
                <button type="button" className="btn-primary" onClick={() => { resetForm(); setEditIndex(null); setStep(1); setIsOpen(true); }}>
                  <FaPlus /> Novo PDI
                </button>
              </div>

              {pdis.length === 0 ? (
                <div className="empty-state">Nenhum PDI cadastrado.</div>
              ) : (
                <div className="pdis-list">
                  {pdis.map((p, idx) => (
                    <div key={idx} className="pdi-card-novo"> {/* NOVA CLASSE CSS */}
                      
                      {/* 1. Header Fixo (Título, Status, Ações) */}
                      <div className="pdi-top">
                        <div className="pdi-main-info">
                          <div className="pdi-title">{p.titulo || "Sem título"}</div>
                          <div className="pdi-meta">
                            <span className="pdi-period">
                              <FaCalendarAlt size={12} />
                              {formatarPeriodo(p.dataInicio || p.data, p.dataFim)}
                            </span>
                            {p.status && (
                              <span className={`pdi-status ${p.status.toLowerCase().replace(' ', '-')}`}>
                                {p.status}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="card-actions">
                          {/* Adicionado stopPropagation para evitar bugs de clique */}
                          <button className="icon-btn" title="Editar" onClick={(e) => { e.stopPropagation(); editarPDI(idx); }}>
                            <FaEdit size={14} />
                          </button>
                          <button className="icon-btn danger" title="Excluir" onClick={(e) => { e.stopPropagation(); excluirPDI(idx); }}>
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>

                      {/* 2. Detalhes Expansíveis (usa a tag <details>) */}
                      <details className="pdi-details">
                        
                        {/* 2a. O Resumo (O que aparece ANTES de abrir) */}
                        <summary className="pdi-details-summary" onClick={(e) => e.preventDefault()}>
                          
                          {/* Terapias */}
                          {Array.isArray(p.terapias) && p.terapias.length > 0 && (
                            <div className="chips-line">
                              {p.terapias.map((t) => (
                                <span key={t.id} className="chip small">{t.nome}</span>
                              ))}
                            </div>
                          )}

                          {/* Resumo Objetivo */}
                          <div className="pdi-summary">
                            {p.objetivoGeral && (
                              <div className="summary-item">
                                <FaLightbulb size={13} />
                                <p className="summary-text">{p.objetivoGeral}</p>
                              </div>
                            )}
                            <div className="summary-stats">
                              {Array.isArray(p.objetivosEspecificos) && p.objetivosEspecificos.length > 0 && (
                                <span className="summary-stat">
                                  <FaFlag size={12} /> {p.objetivosEspecificos.length} Objetivo(s)
                                </span>
                              )}
                              {Array.isArray(p.habilidades) && p.habilidades.length > 0 && (
                                <span className="summary-stat">
                                  <FaLightbulb size={12} /> {p.habilidades.length} Habilidade(s)
                                </span>
                              )}
                              {/* CTA Visual para expandir */}
                              <span className="summary-expand-cta">
                                Ver Detalhes
                              </span>
                            </div>
                          </div>
                        </summary>
                        
                        {/* 2b. O Conteúdo (O que aparece DEPOIS de abrir) */}
                        <div className="pdi-details-content">
                          {/* Estratégias e recursos */}
                          {p.estrategiasRecursos && (
                            <div className="content-section">
                              <div className="section-header">
                                <FaCogs size={14} />
                                <span>Estratégias e Recursos</span>
                              </div>
                              <p className="section-text">{p.estrategiasRecursos}</p>
                            </div>
                          )}

                          {/* Avaliação */}
                          {p.avaliacao && (
                            <div className="content-section">
                              <div className="section-header">
                                <FaClipboardList size={14} />
                                <span>Avaliação</span>
                              </div>
                              <p className="section-text">{p.avaliacao}</p>
                            </div>
                          )}

                          {/* Objetivos Específicos (Lista completa) */}
                          {Array.isArray(p.objetivosEspecificos) && p.objetivosEspecificos.length > 0 && (
                            <div className="content-section">
                              <div className="section-header">
                                <FaFlag size={14} />
                                <span>Objetivos Específicos ({p.objetivosEspecificos.length})</span>
                              </div>
                              <ul className="compact-list">
                                {p.objetivosEspecificos.map((o, i) => ( // Sem slice()
                                  <li key={i} className="compact-item">
                                    <span className="item-text">{o.descricao}</span>
                                    {o.dataAlvo && (
                                      <span className="item-date">
                                        {new Date(o.dataAlvo).toLocaleDateString('pt-BR')}
                                      </span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Habilidades (Lista completa) */}
                          {Array.isArray(p.habilidades) && p.habilidades.length > 0 && (
                            <div className="content-section">
                              <div className="section-header">
                                <FaLightbulb size={14} />
                                <span>Habilidades ({p.habilidades.length})</span>
                              </div>
                              <ul className="compact-list">
                                {p.habilidades.map((h, i) => ( // Sem slice()
                                  <li key={i} className="compact-item">
                                    <span className="item-text">{h.titulo}</span>
                                    {h.tipo && (
                                      <span className="item-tag">{h.tipo}</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Mídias (Lista completa) */}
                          {Array.isArray(p.midias) && p.midias.length > 0 && (
                            <div className="content-section">
                              <div className="section-header">
                                <FaImages size={14} />
                                <span>Mídias ({p.midias.length})</span>
                              </div>
                              <div className="media-compact-list">
                                {p.midias.map((m, i) => ( // Sem slice()
                                  <div key={i} className="media-compact-item">
                                    <span className={`midia-chip ${m.tipo}`}>{m.tipo}</span>
                                    <span className="media-name">{m.nome}</span>
                                    {m.url && (
                                      <a href={m.url} target="_blank" rel="noreferrer" className="media-link-compact">
                                        Link
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
          {/* FIM DA SEÇÃO ATUALIZADA */}

        </div>

      {/* MODAL / WIZARD */}
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-x" onClick={() => setIsOpen(false)}><FaTimes /></button>
            <h2>{editIndex !== null ? `Editar PDI — ${selectedPaciente?.nome || ""}` : `Cadastrar PDI — ${selectedPaciente?.nome || ""}`}</h2>

            <div className="wizard-steps">
              <div className={`step ${step >= 1 ? "active" : ""}`} />
              <div className={`step ${step >= 2 ? "active" : ""}`} />
              <div className={`step ${step >= 3 ? "active" : ""}`} />
            </div>

            {/* STEP 1 — INFORMAÇÕES GERAIS */}
            {step === 1 && (
              <form className="pdi-form">
                <TerapiasMulti />

                <div className="field">
                  <label><FaFileAlt /> Título do PDI</label>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder="Ex.: PDI 2025 — Atenção conjunta"
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  />
                </div>

                {/* CAMPOS DE PERÍODO ATUALIZADOS */}
                <div className="field">
                  <label><FaCalendarAlt /> Período de Tratamento</label>
                  <div className="period-fields">
                    <div className="period-field">
                      <label>Data de Início *</label>
                      <input
                        type="date"
                        value={form.dataInicio}
                        onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                      />
                    </div>
                    <div className="period-field">
                      <label>Data de Fim (Prevista)</label>
                      <input
                        type="date"
                        value={form.dataFim}
                        onChange={(e) => setForm({ ...form, dataFim: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="field">
                  <label>Objetivo geral do PDI</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva o objetivo geral do PDI…"
                    value={form.objetivoGeral}
                    onChange={(e) => setForm({ ...form, objetivoGeral: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Estratégias e recursos</label>
                  <textarea
                    rows={3}
                    placeholder="Descreva as estratégias, materiais e recursos…"
                    value={form.estrategiasRecursos}
                    onChange={(e) => setForm({ ...form, estrategiasRecursos: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Avaliação</label>
                  <textarea
                    rows={3}
                    placeholder="Observações de avaliação (opcional)…"
                    value={form.avaliacao}
                    onChange={(e) => setForm({ ...form, avaliacao: e.target.value })}
                  />
                </div>

                <ResponsaveisMulti />
              </form>
            )}

            {/* STEP 2 — OBJETIVOS & HABILIDADES */}
            {step === 2 && (
              <form className="pdi-form">
                <ObjetivosUI />
                <HabilidadesUI />
              </form>
            )}

            {/* STEP 3 — MÍDIAS */}
            {step === 3 && (
              <form className="pdi-form">
                <MidiasUI />
              </form>
            )}

            {/* AÇÕES DO WIZARD */}
            <div className="wizard-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => (step > 1 ? setStep(step - 1) : setIsOpen(false))}
              >
                <FaChevronLeft /> Voltar
              </button>

              {step < 3 ? (
                <button type="button" className="btn-primary" onClick={() => setStep(step + 1)}>
                  Continuar <FaChevronRight />
                </button>
              ) : (
                <button type="button" className="btn-success" onClick={salvarPDI}>
                  <FaSave /> Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planejamento;