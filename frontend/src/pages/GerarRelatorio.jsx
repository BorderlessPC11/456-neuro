// src/pages/GerarRelatorio.jsx
import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { FaFileAlt, FaChartBar, FaFileExport, FaFileInvoice, FaTable, FaChartLine, FaChartPie, FaEye, FaDownload, FaPrint, FaUsers, FaCalendarAlt } from "react-icons/fa";
import "./GerarRelatorio.css";

const GerarRelatorio = () => {
  const { currentUserData, loading: authLoading } = useAuth();

  // Usuário e clínica
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [role, setRole] = useState("");

  // Relatório
  const [tipoRelatorio, setTipoRelatorio] = useState("pacientes");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTerapeuta, setFiltroTerapeuta] = useState("todos");
  const [formatoExportacao, setFormatoExportacao] = useState("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [relatoriosGerados, setRelatoriosGerados] = useState([]);

  // Dados para relatórios
  const [pacientes, setPacientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [terapias, setTerapias] = useState([]);

  const clinicaId = currentUserData?.clinicaId;

  useEffect(() => {
    if (!authLoading && currentUserData) {
      setNomeUsuario(currentUserData.nome || "");
      setRole(currentUserData.role || "");
      setNomeClinica(currentUserData.nomeClinica || "");
      if (currentUserData.role === "admin" || currentUserData.role === "terapeuta") {
        fetchDados();
      }
    }
    // eslint-disable-next-line
  }, [authLoading, currentUserData, clinicaId]);

  const fetchDados = async () => {
    if (!clinicaId) return;
    try {
      // Buscar pacientes
      const pacientesQuery = query(collection(db, "pacientes"), where("clinicaId", "==", clinicaId));
      const pacientesSnap = await getDocs(pacientesQuery);
      setPacientes(pacientesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Buscar profissionais
      const profissionaisQuery = query(collection(db, "profissionais"), where("clinicaId", "==", clinicaId));
      const profissionaisSnap = await getDocs(profissionaisQuery);
      setProfissionais(profissionaisSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Buscar agendamentos
      const agendamentosQuery = query(collection(db, "agendamentos"), where("clinicaId", "==", clinicaId));
      const agendamentosSnap = await getDocs(agendamentosQuery);
      setAgendamentos(agendamentosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Buscar terapias
      const terapiasQuery = query(collection(db, "terapias"), where("clinicaId", "==", clinicaId));
      const terapiasSnap = await getDocs(terapiasQuery);
      setTerapias(terapiasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  const handleGerarRelatorio = async () => {
    setIsGenerating(true);
    try {
      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 2000));
      const novoRelatorio = {
        id: Date.now(),
        tipo: tipoRelatorio,
        periodo: `${periodoInicio} a ${periodoFim}`,
        formato: formatoExportacao,
        geradoEm: new Date().toISOString(),
        geradoPor: currentUserData.nome,
        status: "concluido"
      };
      setRelatoriosGerados([novoRelatorio, ...relatoriosGerados]);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Funções de download/visualizar/imprimir (simuladas)
  const handleDownload = (relatorio) => {
    const dadosRelatorio = gerarDadosRelatorio(relatorio);
    if (relatorio.formato === "pdf") {
      downloadPDF(dadosRelatorio, relatorio);
    } else if (relatorio.formato === "excel") {
      downloadExcel(dadosRelatorio, relatorio);
    } else if (relatorio.formato === "csv") {
      downloadCSV(dadosRelatorio, relatorio);
    }
  };

  const handleVisualizarRelatorio = (relatorio) => {
    const dadosRelatorio = gerarDadosRelatorio(relatorio);
    const novaJanela = window.open("", "_blank");
    novaJanela.document.write(gerarHTMLRelatorio(dadosRelatorio, relatorio));
    novaJanela.document.close();
  };

  const handleImprimirRelatorio = (relatorio) => {
    const dadosRelatorio = gerarDadosRelatorio(relatorio);
    const novaJanela = window.open("", "_blank");
    novaJanela.document.write(gerarHTMLRelatorio(dadosRelatorio, relatorio));
    novaJanela.document.close();
    novaJanela.onload = () => {
      novaJanela.print();
    };
  };

  // Simulação de dados filtrados
  const filtrarDadosPorPeriodo = (periodo) => {
    return {
      pacientes: pacientes.slice(0, 10),
      agendamentos: agendamentos.slice(0, 15),
      terapias: terapias.slice(0, 20),
      financeiro: [
        { data: "2024-01-15", descricao: "Consulta", valor: "R$ 150,00", tipo: "Receita", status: "Pago" },
        { data: "2024-01-16", descricao: "Terapia", valor: "R$ 120,00", tipo: "Receita", status: "Pendente" }
      ],
      estatisticas: [
        { metrica: "Total de Pacientes", valor: pacientes.length, periodo: periodo, variacao: "+5%" },
        { metrica: "Agendamentos", valor: agendamentos.length, periodo: periodo, variacao: "+12%" }
      ]
    };
  };

  // Geração dos dados para exibição/exportação
  const gerarDadosRelatorio = (relatorio) => {
    const dadosFiltrados = filtrarDadosPorPeriodo(relatorio.periodo);
    switch (relatorio.tipo) {
      case "pacientes":
        return {
          titulo: "Relatório de Pacientes",
          dados: dadosFiltrados.pacientes,
          colunas: ["Nome", "Idade", "Telefone", "Status", "Terapeuta"]
        };
      case "agendamentos":
        return {
          titulo: "Relatório de Agendamentos",
          dados: dadosFiltrados.agendamentos,
          colunas: ["Data", "Hora", "Paciente", "Terapeuta", "Status"]
        };
      case "terapias":
        return {
          titulo: "Relatório de Terapias",
          dados: dadosFiltrados.terapias,
          colunas: ["Data", "Paciente", "Tipo", "Duração", "Observações"]
        };
      case "financeiro":
        return {
          titulo: "Relatório Financeiro",
          dados: dadosFiltrados.financeiro,
          colunas: ["Data", "Descrição", "Valor", "Tipo", "Status"]
        };
      case "estatisticas":
        return {
          titulo: "Estatísticas Gerais",
          dados: dadosFiltrados.estatisticas,
          colunas: ["Métrica", "Valor", "Período", "Variação"]
        };
      default:
        return { titulo: "Relatório", dados: [], colunas: [] };
    }
  };

  // Geração do HTML para exibição/print/download
  const gerarHTMLRelatorio = (dados, relatorio) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${dados.titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4A90E2; color: white; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${dados.titulo}</h1>
          <h2>${nomeClinica}</h2>
        </div>
        <div class="info">
          <p><strong>Período:</strong> ${relatorio.periodo}</p>
          <p><strong>Gerado em:</strong> ${new Date(relatorio.geradoEm).toLocaleString("pt-BR")}</p>
          <p><strong>Gerado por:</strong> ${relatorio.geradoPor}</p>
        </div>
        <table>
          <thead>
            <tr>
              ${dados.colunas.map(col => `<th>${col}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${dados.dados.map(item => `
              <tr>
                ${dados.colunas.map(col => `<td>${item[col.toLowerCase()] || "-"}</td>`).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>Relatório gerado automaticamente pelo sistema ${nomeClinica}</p>
        </div>
      </body>
      </html>
    `;
  };

  // Download (simulado)
  const downloadPDF = (dados, relatorio) => {
    const htmlContent = gerarHTMLRelatorio(dados, relatorio);
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dados.titulo.replace(/\s+/g, "_")}_${relatorio.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const downloadExcel = (dados, relatorio) => {
    let csvContent = dados.colunas.join(",") + "\n";
    dados.dados.forEach(item => {
      const row = dados.colunas.map(col => item[col.toLowerCase()] || "-").join(",");
      csvContent += row + "\n";
    });
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dados.titulo.replace(/\s+/g, "_")}_${relatorio.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const downloadCSV = (dados, relatorio) => {
    let csvContent = dados.colunas.join(",") + "\n";
    dados.dados.forEach(item => {
      const row = dados.colunas.map(col => item[col.toLowerCase()] || "-").join(",");
      csvContent += row + "\n";
    });
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dados.titulo.replace(/\s+/g, "_")}_${relatorio.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Tipos de Relatório para exibição
  const tiposRelatorio = [
    { value: "pacientes", label: "Relatório de Pacientes", icon: <FaUsers /> },
    { value: "agendamentos", label: "Relatório de Agendamentos", icon: <FaCalendarAlt /> },
    { value: "terapias", label: "Relatório de Terapias", icon: <FaFileAlt /> },
    { value: "financeiro", label: "Relatório Financeiro", icon: <FaChartLine /> },
    { value: "estatisticas", label: "Estatísticas Gerais", icon: <FaChartPie /> },
  ];

  if (authLoading) {
    return <div className="loading-container">Carregando...</div>;
  }
  if (role !== "admin" && role !== "terapeuta") {
    return (
      <div className="access-denied">
        <h2>Acesso Negado</h2>
        <p>Apenas administradores e terapeutas podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="gerar-relatorio-page">
        <div className="relatorio-container">
          <div className="relatorio-header">
            <h1><FaChartBar /> Gerar Relatórios</h1>
            <p>Crie relatórios detalhados sobre pacientes, agendamentos e terapias da clínica</p>
          </div>
          <div className="relatorio-content">
            {/* Configuração do Relatório */}
            <div className="config-section">
              <h2><FaFileInvoice /> Configuração do Relatório</h2>
              <div className="config-grid">
                <div className="config-field">
                  <label>Tipo de Relatório</label>
                  <div className="tipo-relatorio-grid">
                    {tiposRelatorio.map((tipo) => (
                      <div
                        key={tipo.value}
                        className={`tipo-card ${tipoRelatorio === tipo.value ? "selected" : ""}`}
                        onClick={() => setTipoRelatorio(tipo.value)}
                      >
                        <div className="tipo-icon">{tipo.icon}</div>
                        <span className="tipo-label">{tipo.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="config-row">
                  <div className="config-field">
                    <label>Período - Início</label>
                    <input
                      type="date"
                      value={periodoInicio}
                      onChange={(e) => setPeriodoInicio(e.target.value)}
                    />
                  </div>
                  <div className="config-field">
                    <label>Período - Fim</label>
                    <input
                      type="date"
                      value={periodoFim}
                      onChange={(e) => setPeriodoFim(e.target.value)}
                    />
                  </div>
                </div>
                <div className="config-row">
                  <div className="config-field">
                    <label>Status</label>
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                    >
                      <option value="todos">Todos</option>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </div>
                  <div className="config-field">
                    <label>Terapeuta</label>
                    <select
                      value={filtroTerapeuta}
                      onChange={(e) => setFiltroTerapeuta(e.target.value)}
                    >
                      <option value="todos">Todos</option>
                      {profissionais.map((prof) => (
                        <option key={prof.id} value={prof.id}>{prof.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="config-field">
                  <label>Formato de Exportação</label>
                  <div className="formato-options">
                    <label className="formato-option">
                      <input
                        type="radio"
                        value="pdf"
                        checked={formatoExportacao === "pdf"}
                        onChange={(e) => setFormatoExportacao(e.target.value)}
                      />
                      <FaFileAlt /> PDF
                    </label>
                    <label className="formato-option">
                      <input
                        type="radio"
                        value="excel"
                        checked={formatoExportacao === "excel"}
                        onChange={(e) => setFormatoExportacao(e.target.value)}
                      />
                      <FaTable /> Excel
                    </label>
                    <label className="formato-option">
                      <input
                        type="radio"
                        value="csv"
                        checked={formatoExportacao === "csv"}
                        onChange={(e) => setFormatoExportacao(e.target.value)}
                      />
                      <FaFileExport /> CSV
                    </label>
                  </div>
                </div>
              </div>
              <div className="config-actions">
                <button
                  className="preview-btn"
                  disabled={isGenerating || !periodoInicio || !periodoFim}
                  onClick={() => handleVisualizarRelatorio({
                    tipo: tipoRelatorio,
                    periodo: `${periodoInicio} a ${periodoFim}`,
                    formato: formatoExportacao,
                    geradoEm: new Date().toISOString(),
                    geradoPor: currentUserData.nome,
                    id: "preview"
                  })}
                >
                  <FaEye /> Visualizar
                </button>
                <button
                  className="generate-btn"
                  onClick={handleGerarRelatorio}
                  disabled={isGenerating || !periodoInicio || !periodoFim}
                >
                  {isGenerating ? (
                    <>
                      <div className="spinner"></div> Gerando...
                    </>
                  ) : (
                    <>
                      <FaFileExport /> Gerar Relatório
                    </>
                  )}
                </button>
              </div>
            </div>
            {/* Relatórios Gerados */}
            <div className="historico-section">
              <h2><FaFileInvoice /> Relatórios Gerados</h2>
              {relatoriosGerados.length > 0 ? (
                <div className="relatorios-list">
                  {relatoriosGerados.map((relatorio) => (
                    <div key={relatorio.id} className="relatorio-card">
                      <div className="relatorio-info">
                        <h3>{tiposRelatorio.find(t => t.value === relatorio.tipo)?.label}</h3>
                        <div className="relatorio-meta">
                          <span className="periodo">Período: {relatorio.periodo}</span>
                          <span className="formato">Formato: {relatorio.formato.toUpperCase()}</span>
                          <span className="data">Gerado em: {new Date(relatorio.geradoEm).toLocaleString("pt-BR")}</span>
                          <span className="autor">Por: {relatorio.geradoPor}</span>
                        </div>
                      </div>
                      <div className="relatorio-actions">
                        <button
                          className="action-btn view-btn"
                          onClick={() => handleVisualizarRelatorio(relatorio)}
                          title="Visualizar"
                        >
                          <FaEye />
                        </button>
                        <button
                          className="action-btn download-btn"
                          onClick={() => handleDownload(relatorio)}
                          title="Download"
                        >
                          <FaDownload />
                        </button>
                        <button
                          className="action-btn print-btn"
                          onClick={() => handleImprimirRelatorio(relatorio)}
                          title="Imprimir"
                        >
                          <FaPrint />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FaFileInvoice className="empty-icon" />
                  <h3>Nenhum relatório gerado</h3>
                  <p>Configure os parâmetros acima e gere seu primeiro relatório.</p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
};

export default GerarRelatorio;
