import React, { useEffect, useState, useMemo, useCallback } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";
// Importação do DatePicker para a funcionalidade correta
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import {
  FaUser, FaChartBar, FaPlus, FaTimes, FaChevronLeft, FaChevronRight, FaSave, FaHandsHelping,
  FaCalendarAlt, FaFileAlt, FaFlag, FaLightbulb, FaClipboardList, FaCogs,
  FaLink, FaImages, FaFileUpload, FaTrash, FaEdit, FaUserMd, FaSearch, FaUsers,
  FaArrowLeft, FaCheck, FaLock, FaBuilding, FaClock, FaCommentDots, FaQuestionCircle,
  FaBullseye, FaChild, FaCalendarDay, FaListAlt, FaNotesMedical, FaStickyNote, FaThumbsUp, FaTasks, FaMapMarkerAlt, FaSmile, FaEye
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "./EvolucaoDiaria.css"; 

// Componente auxiliar para botões de seleção de chip
const ChipButton = ({ onClick, children, active = false }) => (
  <button
    type="button"
    className={`chip ${active ? "chip-active" : ""}`}
    onClick={onClick}
  >
    {children}
  </button>
);

// =================================================================================
// COMPONENTE PRINCIPAL: EvolucaoDiaria
// =================================================================================
const EvolucaoDiaria = () => {
  const { currentUserData, loading: authLoading } = useAuth();
  const clinicaId = currentUserData?.clinicaId || "";

  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [pdiPaciente, setPdiPaciente] = useState(null); // PDI (Planejamento)
  const [evolucoes, setEvolucoes] = useState([]);
  
  // Modal de Criação/Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  
  // Modal de Visualização
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // NOVO
  const [selectedViewEvolucao, setSelectedViewEvolucao] = useState(null); // NOVO

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // NOVO FORMULÁRIO COM TODOS OS CAMPOS DO RELATÓRIO DO DENIS
  const [form, setForm] = useState({
    data: new Date(),
    horarioInicio: "",
    localSala: "",
    estadoEmocional: "", // Humor da criança
    fatorImpacto: "", // Fatores de impacto
    habilidadeTrabalhada: "", // Selecionada do PDI
    descricao: "", // Sumário Escrito / Análise Qualitativa
    recomendacoes: "", // Recomendações
    acertos: 0,
    tentativas: 0,
    tipoAjuda: "Independente", // Independente / Parcial / Total
    modalidadeAjuda: "", // Verbal / Gestual / Física / Visual
    intensidadeAjuda: "Leve", // Leve / Moderada / Intensa
    descricaoAjuda: "", // Anotação breve de como a ajuda foi aplicada
    abc_antecedente: "",
    abc_comportamento: "",
    abc_consequencia: "",
    arquivo: null,
    arquivoURL: "",
  });

  // Reset do formulário após salvar ou fechar
  const resetForm = useCallback(() => {
    setForm({
      data: new Date(),
      horarioInicio: "",
      localSala: "",
      estadoEmocional: "",
      fatorImpacto: "",
      habilidadeTrabalhada: "",
      descricao: "",
      recomendacoes: "",
      acertos: 0,
      tentativas: 0,
      tipoAjuda: "Independente",
      modalidadeAjuda: "",
      intensidadeAjuda: "Leve",
      descricaoAjuda: "",
      abc_antecedente: "",
      abc_comportamento: "",
      abc_consequencia: "",
      arquivo: null,
      arquivoURL: "",
    });
    setStep(1);
    setSuccessMessage("");
    setErrorMessage("");
  }, []);

  const fetchPacientes = useCallback(async () => {
    if (!clinicaId) return;
    try {
      const q = query(collection(db, "pacientes"), where("clinicaId", "==", clinicaId));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPacientes(data);
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
    }
  }, [clinicaId]);

  const fetchDadosPaciente = useCallback(async (pacienteId) => {
    try {
      const pacienteRef = doc(db, "pacientes", pacienteId);
      const pacienteSnap = await getDoc(pacienteRef);
      if (pacienteSnap.exists()) {
        const data = pacienteSnap.data();
        setEvolucoes(data.evolucao || []);
        
        // Carrega PDI mais recente
        if (data.planejamentosPDI && data.planejamentosPDI.length > 0) {
            setPdiPaciente(data.planejamentosPDI.slice(-1)[0]);
        } else {
            setPdiPaciente(null);
        }

      } else {
        setEvolucoes([]);
        setPdiPaciente(null);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do paciente:", error);
    }
  }, []);


  useEffect(() => {
    if (!authLoading && clinicaId) {
      fetchPacientes();
    }
  }, [authLoading, clinicaId, fetchPacientes]);

  const handleSelectPaciente = (paciente) => {
    setSelectedPaciente(paciente);
    fetchDadosPaciente(paciente.id);
  };

  const handleOpenModal = () => {
    if (selectedPaciente) {
      resetForm();
      setIsModalOpen(true);
    } else {
      alert("Selecione um paciente para iniciar um novo registro.");
    }
  };
  
  // NOVO: Abre o modal de visualização
  const handleOpenViewModal = (evolucao) => {
      setSelectedViewEvolucao(evolucao);
      setIsViewModalOpen(true);
  }

  // Combina objetivos e habilidades do PDI em uma lista única para o <select>
  const pdiOptions = useMemo(() => {
    if (!pdiPaciente) return [];
    
    const objetivos = (pdiPaciente.objetivosEspecificos || []).map(o => `Objetivo: ${o.descricao}`);
    const habilidades = (pdiPaciente.habilidades || []).map(h => `Habilidade: ${h.titulo}`);
    
    return [...objetivos, ...habilidades];
  }, [pdiPaciente]);


  const handleFileUpload = async (file) => {
    if (!file) return "";
    const storageRef = ref(storage, `evolucoes/${selectedPaciente.id}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    if (form.tentativas < form.acertos) {
      setErrorMessage("O número de acertos não pode ser maior que o número de tentativas.");
      setIsSaving(false);
      return;
    }

    try {
      let url = "";
      if (form.arquivo) {
        url = await handleFileUpload(form.arquivo);
      }

      // NOVO OBJETO DE EVOLUÇÃO COM TODOS OS CAMPOS DO RELATÓRIO
      const novaEvolucao = {
        // Campos de Contexto (Passo 1)
        data: form.data.toISOString().split("T")[0],
        horarioInicio: form.horarioInicio,
        localSala: form.localSala,
        estadoEmocional: form.estadoEmocional,
        fatorImpacto: form.fatorImpacto,
        
        // Campos de Relacionamento e Qualitativos (Passo 2)
        habilidadeTrabalhada: form.habilidadeTrabalhada,
        descricao: form.descricao,
        recomendacoes: form.recomendacoes,
        
        // Campos de Desempenho (Passo 3)
        acertos: Number(form.acertos),
        tentativas: Number(form.tentativas),
        tipoAjuda: form.tipoAjuda,
        modalidadeAjuda: form.modalidadeAjuda,
        intensidadeAjuda: form.intensidadeAjuda,
        descricaoAjuda: form.descricaoAjuda,

        // Inventário ABC (Passo 3)
        abc_antecedente: form.abc_antecedente,
        abc_comportamento: form.abc_comportamento,
        abc_consequencia: form.abc_consequencia,
        
        // Outros
        arquivoURL: url,
        criadoEm: new Date().toISOString(),
        terapeutaId: currentUserData.uid,
        terapeutaNome: currentUserData.nome,
      };

      // Atualiza o array 'evolucao' do paciente no Firestore
      const pacienteRef = doc(db, "pacientes", selectedPaciente.id);
      const pacienteSnap = await getDoc(pacienteRef);
      const evolucoesAtuais = pacienteSnap.data().evolucao || [];
      
      await updateDoc(pacienteRef, {
        evolucao: [...evolucoesAtuais, novaEvolucao],
      });

      // Atualiza o estado local
      setEvolucoes([...evolucoesAtuais, novaEvolucao]);
      
      setSuccessMessage("Registro de evolução salvo com sucesso!");
      setIsModalOpen(false); // Fecha o modal após o sucesso

    } catch (error) {
      console.error("Erro ao salvar evolução:", error);
      setErrorMessage("Erro ao salvar o registro. Tente novamente.");
    } finally {
      setIsSaving(false);
      resetForm();
    }
  };

  const handleDelete = async (indexToDelete) => {
    if (!window.confirm("Tem certeza que deseja deletar este registro de evolução?")) {
      return;
    }

    try {
      const evolucoesFiltradas = evolucoes.filter((_, index) => index !== indexToDelete);
      
      const pacienteRef = doc(db, "pacientes", selectedPaciente.id);
      await updateDoc(pacienteRef, {
        evolucao: evolucoesFiltradas,
      });

      setEvolucoes(evolucoesFiltradas);
      setSuccessMessage("Registro deletado com sucesso.");
    } catch (error) {
      console.error("Erro ao deletar evolução:", error);
      setErrorMessage("Erro ao deletar o registro. Tente novamente.");
    }
  };


  // =================================================================================
  // JSX DOS PASSOS DO WIZARD (MANTENDO O LAYOUT ANEXADO)
  // =================================================================================

  const renderStep1 = () => (
    <>
      <h3><FaCalendarAlt /> Informações Iniciais da Sessão</h3>
      <div className="form-evolucao grid-3">
        
        {/* DATA */}
        <div className="form-field">
          <label><FaCalendarAlt /> Data</label>
          <DatePicker
            selected={form.data}
            onChange={(date) => setForm({ ...form, data: date })}
            dateFormat="dd/MM/yyyy"
            className="custom-datepicker"
          />
        </div>
        
        {/* HORÁRIO DE INÍCIO */}
        <div className="form-field">
          <label><FaClock /> Horário de Início</label>
          <input
            type="time"
            value={form.horarioInicio}
            onChange={(e) => setForm({ ...form, horarioInicio: e.target.value })}
            required
          />
        </div>
        
        {/* LOCAL / SALA */}
        <div className="form-field">
          <label><FaMapMarkerAlt /> Local/Sala</label>
          <input
            type="text"
            value={form.localSala}
            onChange={(e) => setForm({ ...form, localSala: e.target.value })}
            placeholder="Ex: Sala 3 ou Casa do Paciente"
          />
        </div>
      </div>

      <h3><FaSmile /> Estado Emocional e Contexto</h3>
      <div className="form-evolucao grid-2">
        {/* HUMOR / ESTADO EMOCIONAL */}
        <div className="form-field">
          <label><FaSmile /> Humor da Criança</label>
          <div className="chip-group">
            {["Feliz", "Calmo", "Irritado", "Sonolento", "Agitado"].map(h => (
              <ChipButton 
                key={h} 
                active={form.estadoEmocional === h} 
                onClick={() => setForm({ ...form, estadoEmocional: h })}
              >
                {h}
              </ChipButton>
            ))}
          </div>
        </div>

        {/* FATORES DE IMPACTO */}
        <div className="form-field">
          <label><FaQuestionCircle /> Fatores de Impacto</label>
          <input
            type="text"
            value={form.fatorImpacto}
            onChange={(e) => setForm({ ...form, fatorImpacto: e.target.value })}
            placeholder="Ex: Dormiu mal, está com fome, etc."
          />
        </div>
      </div>
    </>
  );

  const renderStep2 = () => (
    <>
      <h3><FaClipboardList /> Planejamento e Análise Qualitativa</h3>
      
      {/* HABILIDADE TRABALHADA (SELEÇÃO DO PDI) */}
      <div className="form-field full-width">
          <label><FaTasks /> Habilidade/Objetivo Trabalhado</label>
          {pdiPaciente ? (
            <select
                value={form.habilidadeTrabalhada}
                onChange={(e) => setForm({ ...form, habilidadeTrabalhada: e.target.value })}
                required
            >
                <option value="">Selecione a Habilidade...</option>
                {pdiOptions.map((option, index) => (
                    <option key={index} value={option}>{option}</option>
                ))}
            </select>
          ) : (
             <p className="alerta-pdi">Nenhum PDI ativo encontrado. Registros não serão vinculados.</p>
          )}
      </div>

      {/* SUMÁRIO ESCRITO / DESCRIÇÃO */}
      <div className="form-field full-width">
        <label><FaFileAlt /> Análise Qualitativa (Sumário Escrito)</label>
        <textarea
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          placeholder="Descreva detalhadamente a sessão, o contexto da interação e a performance geral."
          rows="5"
          required
        />
      </div>

      {/* RECOMENDAÇÕES */}
      <div className="form-field full-width">
        <label><FaThumbsUp /> Recomendações/Próximos Passos</label>
        <textarea
          value={form.recomendacoes}
          onChange={(e) => setForm({ ...form, recomendacoes: e.target.value })}
          placeholder="Ex: Continuar reforço com cartões visuais em casa, reduzir ajuda verbal na próxima sessão."
          rows="3"
        />
      </div>
    </>
  );

  const renderStep3 = () => (
    <>
      <h3><FaChartBar /> Desempenho e Tipo de Ajuda (Dados para Gráficos)</h3>
      <div className="form-evolucao grid-3">
        {/* ACERTOS */}
        <div className="form-field">
          <label><FaCheck /> Acertos</label>
          <input
            type="number"
            min="0"
            value={form.acertos}
            onChange={(e) => setForm({ ...form, acertos: e.target.value })}
            required
          />
        </div>
        
        {/* TENTATIVAS */}
        <div className="form-field">
          <label><FaTasks /> Tentativas Totais</label>
          <input
            type="number"
            min="0"
            value={form.tentativas}
            onChange={(e) => setForm({ ...form, tentativas: e.target.value })}
            required
          />
        </div>
        
        {/* TIPO DE AJUDA */}
        <div className="form-field">
          <label><FaHandsHelping /> Tipo de Ajuda (Geral)</label>
          <select
            value={form.tipoAjuda}
            onChange={(e) => setForm({ ...form, tipoAjuda: e.target.value })}
          >
            <option value="Independente">Independente</option>
            <option value="Parcial">Parcial</option>
            <option value="Total">Total</option>
          </select>
        </div>
      </div>
      
      {/* MODALIDADE E INTENSIDADE DA AJUDA */}
      <div className="form-evolucao grid-2">
         {/* INTENSIDADE DA AJUDA */}
        <div className="form-field">
          <label><FaLightbulb /> Intensidade da Ajuda</label>
          <div className="chip-group">
            {["Leve", "Moderada", "Intensa"].map(i => (
              <ChipButton 
                key={i} 
                active={form.intensidadeAjuda === i} 
                onClick={() => setForm({ ...form, intensidadeAjuda: i })}
              >
                {i}
              </ChipButton>
            ))}
          </div>
        </div>
        
        {/* MODALIDADE DA AJUDA */}
        <div className="form-field">
          <label><FaCogs /> Modalidade da Ajuda</label>
          <div className="chip-group">
            {["Verbal", "Gestual", "Física", "Visual"].map(m => (
              <ChipButton 
                key={m} 
                active={form.modalidadeAjuda === m} 
                onClick={() => setForm({ ...form, modalidadeAjuda: m })}
              >
                {m}
              </ChipButton>
            ))}
          </div>
        </div>
      </div>

      {/* DESCRIÇÃO DA AJUDA */}
       <div className="form-field full-width">
        <label><FaCommentDots /> Anotação Breve sobre a Ajuda Aplicada</label>
        <input
          type="text"
          value={form.descricaoAjuda}
          onChange={(e) => setForm({ ...form, descricaoAjuda: e.target.value })}
          placeholder="Ex: Foi necessário um modelo físico no início e um 'diga' no meio."
        />
      </div>

      {/* INVENTÁRIO ABC */}
      <h3><FaQuestionCircle /> Inventário ABC (Análise Funcional)</h3>
      <div className="form-evolucao grid-3 abc-section">
        <div className="form-field">
          <label>A (Antecedente)</label>
          <input
            type="text"
            value={form.abc_antecedente}
            onChange={(e) => setForm({ ...form, abc_antecedente: e.target.value })}
            placeholder="O que aconteceu antes do comportamento?"
          />
        </div>
        <div className="form-field">
          <label>B (Comportamento)</label>
          <input
            type="text"
            value={form.abc_comportamento}
            onChange={(e) => setForm({ ...form, abc_comportamento: e.target.value })}
            placeholder="O comportamento em si."
          />
        </div>
        <div className="form-field">
          <label>C (Consequência)</label>
          <input
            type="text"
            value={form.abc_consequencia}
            onChange={(e) => setForm({ ...form, abc_consequencia: e.target.value })}
            placeholder="O que aconteceu logo após o comportamento?"
          />
        </div>
      </div>
      
      {/* UPLOAD DE ARQUIVO */}
      <div className="form-field full-width">
          <label><FaFileUpload /> Anexo (Foto/Vídeo)</label>
          <input
              type="file"
              onChange={(e) => setForm({ ...form, arquivo: e.target.files[0] })}
              accept="image/*,video/*"
              className="file-input"
          />
          {form.arquivo && <p className="file-info"><FaFileAlt /> Arquivo selecionado: {form.arquivo.name}</p>}
      </div>

    </>
  );
  
  // Array de renderização dos passos
  const steps = [
      { component: renderStep1(), title: "Contexto da Sessão" },
      { component: renderStep2(), title: "Análise Qualitativa" },
      { component: renderStep3(), title: "Desempenho e Ajuda" },
  ];
  
  const currentStep = steps[step - 1];
  
  const handleNextStep = (e) => {
    e.preventDefault(); // Previne qualquer submit acidental
    
    // Validação básica do passo atual antes de avançar
    if (step === 1 && (!form.horarioInicio || !form.localSala || !form.estadoEmocional)) {
        setErrorMessage("Preencha todos os campos obrigatórios do Passo 1.");
        return;
    }
    if (step === 2 && (!form.habilidadeTrabalhada || !form.descricao)) {
        setErrorMessage("Preencha todos os campos obrigatórios do Passo 2 (Habilidade e Sumário).");
        return;
    }
    
    setErrorMessage("");
    
    // Debug: vamos verificar o step atual
    console.log("Step atual:", step, "Próximo step:", step + 1);
    
    if (step < 3) { // Garantindo que só avança até a etapa 3
        setStep(step + 1);
    }
  };


  // =================================================================================
  // MODAL DE VISUALIZAÇÃO - LAYOUT DASHBOARD/RELATÓRIO HORIZONTAL
  // =================================================================================
  const renderViewModal = () => {
    if (!selectedViewEvolucao) return null;
    const ev = selectedViewEvolucao;

    // Função auxiliar para formatar a porcentagem
    const formatPercent = (acertos, tentativas) => {
      if (tentativas === 0) return "0%";
      return `${((acertos / tentativas) * 100).toFixed(0)}%`;
    }

    // Função para determinar classe do badge
    const getTipoAjudaBadgeClass = (tipo) => {
      switch(tipo) {
        case 'Independente': return 'tipo-independente';
        case 'Parcial': return 'tipo-parcial';
        case 'Total': return 'tipo-total';
        default: return 'tipo-independente';
      }
    }
    
    return (
        <div className="modal-overlay">
            <div className="view-modal-content">
                <div className="modal-header">
                    <h2><FaEye /> Evolução de {new Date(ev.data).toLocaleDateString('pt-BR')}</h2>
                    <button className="close-btn" onClick={() => setIsViewModalOpen(false)}>
                        <FaTimes />
                    </button>
                </div>
                <div className="modal-body">
                    
                    {/* Layout Dashboard */}
                    <div className="dashboard-layout">
                        
                        {/* Área Principal de Dados */}
                        <div className="main-data-area">
                            
                            {/* Contexto da Sessão - Layout Horizontal */}
                            <div className="context-section">
                                <div className="context-header">
                                    <FaCalendarAlt /> Contexto da Sessão
                                </div>
                                <div className="context-grid">
                                    <div className="context-item">
                                        <div className="context-label">
                                            <FaCalendarAlt /> Data
                                        </div>
                                        <div className="context-value">{new Date(ev.data).toLocaleDateString('pt-BR')}</div>
                                    </div>
                                    <div className="context-item">
                                        <div className="context-label">
                                            <FaClock /> Horário
                                        </div>
                                        <div className="context-value">{ev.horarioInicio}</div>
                                    </div>
                                    <div className="context-item">
                                        <div className="context-label">
                                            <FaMapMarkerAlt /> Local
                                        </div>
                                        <div className="context-value">{ev.localSala}</div>
                                    </div>
                                    <div className="context-item">
                                        <div className="context-label">
                                            <FaSmile /> Humor
                                        </div>
                                        <div className="context-value">{ev.estadoEmocional}</div>
                                    </div>
                                </div>
                                {ev.fatorImpacto && (
                                    <div className="text-block" style={{marginTop: '20px'}}>
                                        <div className="text-label">
                                            <FaQuestionCircle /> Fatores de Impacto
                                        </div>
                                        <div className="text-content">{ev.fatorImpacto}</div>
                                    </div>
                                )}
                            </div>

                            {/* Análise Qualitativa */}
                            <div className="qualitative-section">
                                <div className="context-header">
                                    <FaClipboardList /> Análise Qualitativa
                                </div>
                                
                                <div className="text-block">
                                    <div className="text-label">
                                        <FaTasks /> Habilidade/Objetivo Trabalhado
                                    </div>
                                    <div className="text-content">{ev.habilidadeTrabalhada}</div>
                                </div>
                                
                                <div className="text-block">
                                    <div className="text-label">
                                        <FaFileAlt /> Sumário Escrito (Análise Qualitativa)
                                    </div>
                                    <div className="text-content">{ev.descricao}</div>
                                </div>
                                
                                {ev.recomendacoes && (
                                    <div className="text-block">
                                        <div className="text-label">
                                            <FaThumbsUp /> Recomendações/Próximos Passos
                                        </div>
                                        <div className="text-content">{ev.recomendacoes}</div>
                                    </div>
                                )}
                            </div>

                            {/* Inventário ABC - Se houver dados */}
                            {(ev.abc_antecedente || ev.abc_comportamento || ev.abc_consequencia) && (
                                <div className="abc-section">
                                    <div className="context-header">
                                        <FaQuestionCircle /> Inventário ABC (Análise Funcional)
                                    </div>
                                    <div className="abc-grid">
                                        <div className="abc-item">
                                            <div className="abc-label">A - Antecedente</div>
                                            <div className="abc-value">{ev.abc_antecedente || 'Não especificado'}</div>
                                        </div>
                                        <div className="abc-item">
                                            <div className="abc-label">B - Comportamento</div>
                                            <div className="abc-value">{ev.abc_comportamento || 'Não especificado'}</div>
                                        </div>
                                        <div className="abc-item">
                                            <div className="abc-label">C - Consequência</div>
                                            <div className="abc-value">{ev.abc_consequencia || 'Não especificado'}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar com Métricas e Informações */}
                        <div className="info-sidebar">
                            
                            {/* Card de Métricas de Performance */}
                            <div className="metrics-card">
                                <div className="metrics-header">
                                    <FaChartBar /> Desempenho & Resultados
                                </div>
                                
                                <div className="metrics-grid">
                                    <div className="metric-item">
                                        <div className="metric-number">{ev.acertos}</div>
                                        <div className="metric-label">Acertos</div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="metric-number">{ev.tentativas}</div>
                                        <div className="metric-label">Tentativas</div>
                                    </div>
                                    <div className="metric-item">
                                        <div className="metric-number">{formatPercent(ev.acertos, ev.tentativas)}</div>
                                        <div className="metric-label">Taxa</div>
                                    </div>
                                </div>

                                <div className="help-info">
                                    <div className="help-item">
                                        <div style={{marginBottom: '5px', fontSize: '11px', opacity: '0.8'}}>TIPO DE AJUDA</div>
                                        <span className={`category-badge ${getTipoAjudaBadgeClass(ev.tipoAjuda)}`}>
                                            {ev.tipoAjuda}
                                        </span>
                                    </div>
                                    <div className="help-item">
                                        <div style={{marginBottom: '5px', fontSize: '11px', opacity: '0.8'}}>MODALIDADE</div>
                                        <div>{ev.modalidadeAjuda || 'N/A'}</div>
                                    </div>
                                </div>

                                <div className="help-info">
                                    <div className="help-item">
                                        <div style={{marginBottom: '5px', fontSize: '11px', opacity: '0.8'}}>INTENSIDADE</div>
                                        <div>{ev.intensidadeAjuda}</div>
                                    </div>
                                    {ev.descricaoAjuda && (
                                        <div className="help-item">
                                            <div style={{marginBottom: '5px', fontSize: '11px', opacity: '0.8'}}>DETALHES</div>
                                            <div style={{fontSize: '12px', lineHeight: '1.3'}}>{ev.descricaoAjuda}</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card de Informações do Terapeuta */}
                            <div className="therapist-card">
                                <div className="therapist-info">
                                    <div className="therapist-item">
                                        <FaUserMd className="therapist-icon" />
                                        <div>
                                            <strong>Terapeuta:</strong><br />
                                            {ev.terapeutaNome}
                                        </div>
                                    </div>
                                    <div className="therapist-item">
                                        <FaCalendarAlt className="therapist-icon" />
                                        <div>
                                            <strong>Registrado em:</strong><br />
                                            {new Date(ev.criadoEm).toLocaleDateString('pt-BR')}
                                        </div>
                                    </div>
                                    {ev.arquivoURL && (
                                        <div className="therapist-item">
                                            <FaFileAlt className="therapist-icon" />
                                            <div>
                                                <strong>Anexo:</strong><br />
                                                <a href={ev.arquivoURL} target="_blank" rel="noopener noreferrer" style={{color: '#28a745', textDecoration: 'underline'}}>
                                                    Visualizar Arquivo
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }


  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div className="evolucao-diaria-container">
          <div className="evolucao-diaria-header">
            {/* TÍTULO CORRIGIDO AQUI */}
            <h1><FaFileAlt /> Registro de Evolução Diária</h1>
            <p>Selecione um paciente e registre a evolução detalhada de uma sessão, incluindo dados para o relatório.</p>
          </div>

          {/* SELEÇÃO DE PACIENTES */}
          <div className="pacientes-section">
            <h2><FaUsers /> Selecione o Paciente</h2>
            {pacientes.length > 0 ? (
              <div className="pacientes-list">
                {pacientes.map((paciente) => (
                  <div
                    key={paciente.id}
                    className={`paciente-card ${selectedPaciente && selectedPaciente.id === paciente.id ? 'selected' : ''}`}
                    onClick={() => handleSelectPaciente(paciente)}
                  >
                    <p><strong>Nome:</strong> {paciente.nome}</p>
                    <p><strong>Nascimento:</strong> {paciente.dataNascimento}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>Nenhum paciente encontrado.</p>
            )}
          </div>

          {/* BOTÃO DE ADICIONAR NOVA EVOLUÇÃO */}
          {selectedPaciente && (
            <div className="evolucao-actions-container">
              <button className="toggle-form-btn" onClick={handleOpenModal}>
                <FaPlus /> Novo Registro de Evolução para {selectedPaciente.nome}
              </button>
            </div>
          )}
          
          {successMessage && <div className="success-message">{successMessage}</div>}
          {errorMessage && <div className="error-message">{errorMessage}</div>}

          {/* LISTAGEM DE EVOLUÇÕES EXISTENTES */}
          {selectedPaciente && (
            <>
              <h2><FaListAlt /> Histórico de Registros ({evolucoes.length})</h2>
              <div className="historico-evolucoes">
                {evolucoes.length > 0 ? (
                  <div className="evolucao-list">
                    {/* Reverse para mostrar o mais recente primeiro */}
                    {evolucoes.slice().reverse().map((evolucao, index) => (
                      <div key={index} className="evolucao-card">
                        
                        {/* Header do Card */}
                        <div className="evolucao-content">
                          <div className="evolucao-header">
                            <div className="evolucao-date">
                              <FaCalendarDay /> {evolucao.data}
                            </div>
                            <div className="evolucao-performance">
                              <div className="performance-badge">
                                {evolucao.acertos}/{evolucao.tentativas}
                              </div>
                              <div className="performance-text">
                                {evolucao.tentativas > 0 ? `${((evolucao.acertos / evolucao.tentativas) * 100).toFixed(0)}% aproveitamento` : 'Sem tentativas'}
                              </div>
                            </div>
                          </div>

                          {/* Detalhes */}
                          <div className="evolucao-details">
                            <div className="detail-item">
                              <FaTasks className="detail-icon" />
                              <div className="detail-content">
                                <div className="detail-label">Habilidade/Objetivo</div>
                                <div className="detail-value">{evolucao.habilidadeTrabalhada}</div>
                              </div>
                            </div>

                            <div className="detail-item">
                              <FaFileAlt className="detail-icon" />
                              <div className="detail-content">
                                <div className="detail-label">Descrição da Sessão</div>
                                <div className="detail-value truncated">{evolucao.descricao}</div>
                              </div>
                            </div>

                            {evolucao.tipoAjuda && (
                              <div className="detail-item">
                                <FaHandsHelping className="detail-icon" />
                                <div className="detail-content">
                                  <div className="detail-label">Tipo de Ajuda</div>
                                  <div className="detail-value">{evolucao.tipoAjuda}</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Informações do Terapeuta */}
                          <div className="therapist-info">
                            <div className="therapist-avatar">
                              <FaUserMd />
                            </div>
                            <div className="therapist-details">
                              <div className="therapist-name">{evolucao.terapeutaNome}</div>
                              <div className="therapist-role">Terapeuta Responsável</div>
                            </div>
                          </div>
                        </div>

                        {/* Ações do Card */}
                        <div className="card-actions">
                          <button className="view-btn" onClick={() => handleOpenViewModal(evolucao)}>
                            <FaEye /> Visualizar
                          </button>
                          <button className="delete-btn" onClick={() => handleDelete(evolucoes.length - 1 - index)}>
                            <FaTrash /> Deletar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>Nenhuma evolução registrada para este paciente.</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* MODAL DE REGISTRO (CRIAÇÃO/EDIÇÃO) */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Novo Registro de Evolução para {selectedPaciente?.nome}</h2>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                  <FaTimes />
                </button>
              </div>

              {/* PROGRESSO DO WIZARD */}
              <div className="wizard-steps">
                {steps.map((s, index) => (
                    <div 
                        key={index} 
                        className={`step-indicator ${step === index + 1 ? 'active' : ''} ${step > index + 1 ? 'completed' : ''}`}
                        onClick={() => setStep(index + 1)} // Permite voltar
                    >
                        <span className="step-number">{index + 1}</span>
                        <span className="step-title">{s.title}</span>
                    </div>
                ))}
              </div>

              <div className="modal-body">
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                
                <form className="evolucao-form-wizard" onSubmit={handleSave}>
                    <div className="step-content">
                        {currentStep.component}
                    </div>

                    <div className="wizard-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => (step > 1 ? setStep(step - 1) : setIsModalOpen(false))}
                            disabled={isSaving}
                        >
                            <FaChevronLeft /> {step > 1 ? 'Voltar' : 'Cancelar'}
                        </button>

                        {step < 3 ? ( // Mudança aqui: verificação explícita ao invés de steps.length
                            <button 
                                type="button" 
                                className="btn-primary" 
                                onClick={handleNextStep}
                                disabled={isSaving}
                            >
                                Continuar <FaChevronRight />
                            </button>
                        ) : (
                            <button 
                                type="submit" 
                                className="btn-success" 
                                disabled={isSaving}
                            >
                                {isSaving ? (<><div className="spinner"></div> Salvando...</>) : (<><FaSave /> Salvar Registro</>)}
                            </button>
                        )}
                    </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* NOVO: MODAL DE VISUALIZAÇÃO */}
        {isViewModalOpen && renderViewModal()}
        
      </main>
    </div>
  );
};

export default EvolucaoDiaria;