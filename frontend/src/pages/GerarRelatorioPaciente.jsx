import React, { useState, useEffect, useCallback, useMemo } from "react";
import { collection, getDocs, query, where, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaFileInvoice, FaPlus, FaTimes, FaEye, FaDownload, FaPrint, FaChartBar,
  FaUsers, FaClipboardList, FaUserMd, FaCalendar, FaStethoscope, FaChartLine,
  FaFileAlt, FaBrain, FaChartArea, FaUser, FaMapMarkerAlt, FaClock, FaSmile,
  FaQuestionCircle, FaThumbsUp, FaTasks, FaHandsHelping, FaLightbulb, FaCogs
} from "react-icons/fa";
import { Line, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import "./GerarRelatorioPaciente.css";

// Função de utilidade para processar dados de evolução para gráficos
const processEvolutionsForCharts = (evolucoes) => {
    const dataByHabilidade = {};
    const chartColors = [
        '#4A90E2', '#069A6B', '#FFC300', '#FF5733', '#C70039', 
        '#900C3F', '#581845', '#1B4F72', '#148F77', '#F39C12'
    ];
    let colorIndex = 0;

    evolucoes.forEach(evolucao => {
        const habilidade = evolucao.habilidadeTrabalhada || 'Habilidade Não Especificada';

        if (!dataByHabilidade[habilidade]) {
            dataByHabilidade[habilidade] = {
                color: chartColors[colorIndex++ % chartColors.length],
                dates: [],
                acertos: [],
                tentativas: [],
                performance: [],
                ajudaCounts: { Independente: 0, Parcial: 0, Total: 0 },
                modalidadeCounts: { Verbal: 0, Gestual: 0, Física: 0, Visual: 0 },
                intensidadeCounts: { Leve: 0, Moderada: 0, Intensa: 0 },
                totalSessions: 0,
            };
        }

        const data = dataByHabilidade[habilidade];
        
        // 1. Dados de Performance ao longo do tempo
        data.dates.push(evolucao.data);
        data.acertos.push(evolucao.acertos || 0);
        data.tentativas.push(evolucao.tentativas || 0);
        const ratio = (evolucao.tentativas || 0) > 0 ? ((evolucao.acertos || 0) / (evolucao.tentativas || 0)) * 100 : 0;
        data.performance.push(ratio);
        data.totalSessions++;

        // 2. Contagem de Tipos de Ajuda
        if (evolucao.tipoAjuda && data.ajudaCounts[evolucao.tipoAjuda] !== undefined) {
            data.ajudaCounts[evolucao.tipoAjuda]++;
        }
        if (evolucao.modalidadeAjuda && data.modalidadeCounts[evolucao.modalidadeAjuda] !== undefined) {
            data.modalidadeCounts[evolucao.modalidadeAjuda]++;
        }
        if (evolucao.intensidadeAjuda && data.intensidadeCounts[evolucao.intensidadeAjuda] !== undefined) {
            data.intensidadeCounts[evolucao.intensidadeAjuda]++;
        }
    });

    return dataByHabilidade;
};

// Componente do Gráfico de Performance
const PerformanceChart = ({ data, color, label }) => {
    const chartData = {
        labels: data.dates.map(d => new Date(d).toLocaleDateString('pt-BR')),
        datasets: [
            {
                label: 'Performance (%)',
                data: data.performance,
                borderColor: color,
                backgroundColor: `${color}40`,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                display: true,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            },
            title: { 
                display: true, 
                text: `Evolução de Performance - ${label}`,
                font: { size: 16, weight: 'bold' },
                padding: 20
            },
        },
        scales: {
            y: {
                min: 0,
                max: 100,
                title: { 
                    display: true, 
                    text: 'Percentual de Acertos (%)',
                    font: { weight: 'bold' }
                },
                grid: {
                    color: '#f0f0f0'
                }
            },
            x: {
                title: { 
                    display: true, 
                    text: 'Data das Sessões',
                    font: { weight: 'bold' }
                },
                grid: {
                    color: '#f0f0f0'
                }
            }
        },
    };

    return (
        <div style={{ height: '400px' }}>
            <Line data={chartData} options={options} />
        </div>
    );
};

// Componente do Gráfico de Tipos de Ajuda
const AjudaChart = ({ data, label, typeKey, title }) => {
    const keys = Object.keys(data[typeKey]);
    const values = Object.values(data[typeKey]);
    
    const ajudaColors = {
        // Tipo de Ajuda
        Independente: '#069A6B', Parcial: '#FFC300', Total: '#C70039',
        // Modalidade
        Verbal: '#4A90E2', Gestual: '#34AADC', Física: '#FF9900', Visual: '#9B59B6',
        // Intensidade
        Leve: '#88D498', Moderada: '#FFC300', Intensa: '#C70039',
    };
    
    const colors = keys.map(key => ajudaColors[key] || '#CED4DA');

    const chartData = {
        labels: keys,
        datasets: [
            {
                label: 'Frequência',
                data: values,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { 
                display: true, 
                text: `${title} - ${label}`,
                font: { size: 16, weight: 'bold' },
                padding: 20
            },
        },
        scales: {
            y: { 
                beginAtZero: true, 
                title: { 
                    display: true, 
                    text: 'Nº de Ocorrências',
                    font: { weight: 'bold' }
                },
                grid: {
                    color: '#f0f0f0'
                }
            },
            x: {
                grid: {
                    color: '#f0f0f0'
                }
            }
        },
    };

    return (
        <div style={{ height: '350px' }}>
            <Bar data={chartData} options={options} />
        </div>
    );
};

const GerarRelatorioPaciente = () => {
  const { currentUserData, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [evolucoesPaciente, setEvolucoesPaciente] = useState([]);
  const [pdiPaciente, setPdiPaciente] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedHabilidade, setSelectedHabilidade] = useState("consolidado");

  const clinicaId = currentUserData?.clinicaId;

  // Processa as evoluções para os gráficos
  const processedData = useMemo(() => {
    return processEvolutionsForCharts(evolucoesPaciente);
  }, [evolucoesPaciente]);

  // Lista de habilidades únicas
  const habilidadesUnicas = useMemo(() => {
    return ["consolidado", ...Object.keys(processedData)];
  }, [processedData]);

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
        
        // Carrega Evoluções ordenadas pela data
        const evolucoesOrdenadas = (data.evolucao || []).sort((a, b) => new Date(a.data) - new Date(b.data));
        setEvolucoesPaciente(evolucoesOrdenadas);

        // Carrega PDI mais recente
        if (data.planejamentosPDI && data.planejamentosPDI.length > 0) {
            setPdiPaciente(data.planejamentosPDI.slice(-1)[0]);
        } else {
            setPdiPaciente(null);
        }
      } else {
        setEvolucoesPaciente([]);
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
    setSelectedHabilidade("consolidado");
  };
  
  const handleGerarPDF = async () => {
    setIsGenerating(true);
    // Simulação de geração de PDF
    setTimeout(() => {
        alert("Relatório PDF gerado com sucesso! Em uma aplicação real, o download seria iniciado automaticamente.");
        setIsGenerating(false);
    }, 2000); 
  };
  
  // Filtra evoluções para o sumário (últimas 10 para análise mais detalhada)
  const evolucoesParaSumario = useMemo(() => {
    return evolucoesPaciente.slice(-10).reverse();
  }, [evolucoesPaciente]);

  // Função para gerar dados consolidados de performance
  const getConsolidatedPerformanceData = () => {
    const allDates = evolucoesPaciente.map(e => e.data);
    const uniqueDates = [...new Set(allDates)].sort((a, b) => new Date(a) - new Date(b));

    const consolidatedData = {
        dates: uniqueDates,
        performance: uniqueDates.map(date => {
            const sessionsOnDate = evolucoesPaciente.filter(e => e.data === date);
            const totalAcertos = sessionsOnDate.reduce((sum, e) => sum + (e.acertos || 0), 0);
            const totalTentativas = sessionsOnDate.reduce((sum, e) => sum + (e.tentativas || 0), 0);
            return totalTentativas > 0 ? (totalAcertos / totalTentativas) * 100 : 0;
        }),
    };
    return consolidatedData;
  };
  
  // Função para gerar dados consolidados de ajuda
  const getConsolidatedAjudaData = (typeKey) => {
    const consolidatedCounts = evolucoesPaciente.reduce((acc, evolucao) => {
        const key = evolucao[typeKey];
        if (key) {
            acc[key] = (acc[key] || 0) + 1;
        }
        return acc;
    }, {});
    
    const allKeys = typeKey === 'tipoAjuda' ? 
        ['Independente', 'Parcial', 'Total'] : typeKey === 'modalidadeAjuda' ? 
        ['Verbal', 'Gestual', 'Física', 'Visual'] : 
        ['Leve', 'Moderada', 'Intensa'];

    const finalData = {};
    allKeys.forEach(key => {
        finalData[key] = consolidatedCounts[key] || 0;
    });

    return { [typeKey]: finalData };
  };

  const renderGraficos = () => {
    if (evolucoesPaciente.length === 0) {
        return (
            <div className="empty-chart-state">
                <FaChartBar size={48} />
                <p>Nenhum dado de evolução disponível para gerar gráficos.</p>
                <p>Registre algumas sessões na tela "Evolução Diária" para visualizar os relatórios.</p>
            </div>
        );
    }

    // Relatório Consolidado
    if (selectedHabilidade === "consolidado") {
        const consolidatedPerfData = getConsolidatedPerformanceData();
        const consolidatedAjudaData = getConsolidatedAjudaData('tipoAjuda');
        const consolidatedIntensidadeData = getConsolidatedAjudaData('intensidadeAjuda');
        const consolidatedModalidadeData = getConsolidatedAjudaData('modalidadeAjuda');

        return (
            <div className="graficos-grid">
                <div className="chart-box full-width">
                    <PerformanceChart 
                        data={consolidatedPerfData} 
                        color="#4A90E2" 
                        label="Todas as Habilidades"
                    />
                </div>
                <div className="chart-box">
                    <AjudaChart 
                        data={consolidatedAjudaData} 
                        label="Consolidado"
                        typeKey="tipoAjuda"
                        title="Distribuição: Tipo de Ajuda"
                    />
                </div>
                <div className="chart-box">
                    <AjudaChart 
                        data={consolidatedIntensidadeData} 
                        label="Consolidado"
                        typeKey="intensidadeAjuda"
                        title="Distribuição: Intensidade da Ajuda"
                    />
                </div>
                 <div className="chart-box full-width">
                    <AjudaChart 
                        data={consolidatedModalidadeData} 
                        label="Consolidado"
                        typeKey="modalidadeAjuda"
                        title="Distribuição: Modalidade da Ajuda"
                    />
                </div>
            </div>
        );
    }

    // Relatório por habilidade específica
    const dataHabilidade = processedData[selectedHabilidade];
    if (dataHabilidade) {
        return (
            <div className="graficos-grid">
                <div className="chart-box full-width">
                    <PerformanceChart 
                        data={dataHabilidade} 
                        color={dataHabilidade.color} 
                        label={selectedHabilidade.replace('Habilidade: ', '').replace('Objetivo: ', '')}
                    />
                </div>
                <div className="chart-box">
                    <AjudaChart 
                        data={dataHabilidade} 
                        label={selectedHabilidade.replace('Habilidade: ', '').replace('Objetivo: ', '')}
                        typeKey="ajudaCounts"
                        title="Distribuição: Tipo de Ajuda"
                    />
                </div>
                <div className="chart-box">
                    <AjudaChart 
                        data={dataHabilidade} 
                        label={selectedHabilidade.replace('Habilidade: ', '').replace('Objetivo: ', '')}
                        typeKey="intensidadeCounts"
                        title="Distribuição: Intensidade da Ajuda"
                    />
                </div>
                <div className="chart-box full-width">
                    <AjudaChart 
                        data={dataHabilidade} 
                        label={selectedHabilidade.replace('Habilidade: ', '').replace('Objetivo: ', '')}
                        typeKey="modalidadeCounts"
                        title="Distribuição: Modalidade da Ajuda"
                    />
                </div>
            </div>
        );
    }

    return <div className="empty-chart-state">Selecione uma habilidade para visualizar os gráficos.</div>;
  };

  // Calcular estatísticas completas baseadas nos dados reais
  const calcularEstatisticas = () => {
    if (evolucoesPaciente.length === 0) return null;

    const totalSessoes = evolucoesPaciente.length;
    const totalAcertos = evolucoesPaciente.reduce((sum, e) => sum + (e.acertos || 0), 0);
    const totalTentativas = evolucoesPaciente.reduce((sum, e) => sum + (e.tentativas || 0), 0);
    const mediaPerformance = totalTentativas > 0 ? ((totalAcertos / totalTentativas) * 100).toFixed(1) : 0;
    
    const habilidadesUnicas = [...new Set(evolucoesPaciente.map(e => e.habilidadeTrabalhada).filter(Boolean))].length;
    
    // Sessões por mês (últimos 6 meses)
    const sessoesUltimosMeses = evolucoesPaciente.filter(e => {
        const dataEvolucao = new Date(e.data);
        const seisMesesAtras = new Date();
        seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
        return dataEvolucao >= seisMesesAtras;
    }).length;

    // Tipo de ajuda mais usado
    const tiposAjuda = evolucoesPaciente.filter(e => e.tipoAjuda).map(e => e.tipoAjuda);
    const tipoMaisUsado = tiposAjuda.length > 0 ? 
        tiposAjuda.reduce((a, b, i, arr) => 
            arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
        ) : 'N/A';

    return {
        totalSessoes,
        totalAcertos,
        totalTentativas,
        mediaPerformance,
        habilidadesUnicas,
        sessoesUltimosMeses,
        tipoMaisUsado
    };
  };

  const estatisticas = calcularEstatisticas();
  
  return (
    <div className="gerar-relatorio-paciente-page">
        <div className="relatorio-paciente-container">
          {/* HEADER */}
          <div className="relatorio-header">
            <h1>
              <FaChartArea /> 
              Relatórios Detalhados de Evolução
            </h1>
            <p>
              Análise completa do progresso dos pacientes com gráficos de performance, 
              distribuição de tipos de ajuda e sumários qualitativos das sessões registradas.
            </p>
          </div>

          {/* SELEÇÃO DE PACIENTES */}
          <div className="pacientes-section">
            <h2>
              <FaUsers /> 
              Selecionar Paciente para Análise
            </h2>
            {pacientes.length > 0 ? (
              <div className="pacientes-list">
                {pacientes.map((paciente) => (
                  <div
                    key={paciente.id}
                    className={`paciente-card ${selectedPaciente && selectedPaciente.id === paciente.id ? 'selected' : ''}`}
                    onClick={() => handleSelectPaciente(paciente)}
                  >
                    <p><strong>Nome:</strong> {paciente.nome}</p>
                    <p><strong>Data de Nascimento:</strong> {paciente.dataNascimento}</p>
                    <p><strong>Responsável:</strong> {paciente.responsavel || 'Não informado'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-chart-state">
                <FaUser size={48} />
                <p>Nenhum paciente encontrado na clínica.</p>
              </div>
            )}
          </div>
          
          {/* VISUALIZAÇÃO DO RELATÓRIO */}
          {selectedPaciente && (
            <div className="relatorio-visualizacao-section" id="relatorio-content">
                <div className="relatorio-actions-header">
                    <h2>
                        <FaUser /> 
                        Relatório Completo: {selectedPaciente.nome}
                    </h2>
                    <div className="action-buttons">
                         {evolucoesPaciente.length > 0 && (
                            <button 
                                className="action-btn download-btn" 
                                onClick={handleGerarPDF}
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="spinner"></div> 
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <FaDownload /> 
                                        Exportar PDF
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* ESTATÍSTICAS RESUMO */}
                {estatisticas && (
                    <div className="relatorio-section">
                        <h3><FaChartBar /> Resumo Estatístico Geral</h3>
                        <div className="data-row">
                            <div className="data-box">
                                <strong>Total de Sessões Registradas</strong>
                                {estatisticas.totalSessoes}
                            </div>
                            <div className="data-box">
                                <strong>Performance Média Global</strong>
                                {estatisticas.mediaPerformance}% de acerto
                            </div>
                            <div className="data-box">
                                <strong>Habilidades Diferentes Trabalhadas</strong>
                                {estatisticas.habilidadesUnicas}
                            </div>
                            <div className="data-box">
                                <strong>Total Acertos/Tentativas</strong>
                                {estatisticas.totalAcertos}/{estatisticas.totalTentativas}
                            </div>
                            <div className="data-box">
                                <strong>Sessões (Últimos 6 Meses)</strong>
                                {estatisticas.sessoesUltimosMeses}
                            </div>
                            <div className="data-box">
                                <strong>Tipo de Ajuda Mais Usado</strong>
                                {estatisticas.tipoMaisUsado}
                            </div>
                        </div>
                    </div>
                )}

                {/* PDI RELACIONADO */}
                <div className="relatorio-section">
                    <h3><FaClipboardList /> Planejamento de Desenvolvimento Individual (PDI)</h3>
                    {pdiPaciente ? (
                        <div className="pdi-summary">
                            <p><strong>Título do Planejamento:</strong> {pdiPaciente.titulo}</p>
                            <p><strong>Período de Execução:</strong> {pdiPaciente.dataInicio} até {pdiPaciente.dataFim}</p>
                            <p><strong>Objetivo Geral:</strong> {pdiPaciente.objetivoGeral}</p>
                            
                            <div className="habilidades-list">
                                <strong>Habilidades e Objetivos Específicos Programados:</strong>
                                <ul>
                                    {(pdiPaciente.objetivosEspecificos || []).map((obj, i) => (
                                        <li key={`obj-${i}`}>
                                            <strong>Objetivo:</strong> {obj.descricao}
                                        </li>
                                    ))}
                                    {(pdiPaciente.habilidades || []).map((hab, i) => (
                                        <li key={`hab-${i}`}>
                                            <strong>Habilidade:</strong> {hab.titulo} - {hab.descricao}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div className="alerta">
                            <FaFileAlt size={24} />
                            <p>Nenhum PDI ativo encontrado para este paciente. É recomendado criar um planejamento antes de iniciar as sessões.</p>
                        </div>
                    )}
                </div>

                {/* GRÁFICOS DE EVOLUÇÃO */}
                <div className="relatorio-section">
                    <h3><FaChartLine /> Análise Gráfica de Evolução</h3>
                    
                    <div className="filter-container">
                        <label htmlFor="habilidade-select">
                            <FaBrain /> Filtrar por Habilidade:
                        </label>
                        <select 
                            id="habilidade-select"
                            value={selectedHabilidade} 
                            onChange={(e) => setSelectedHabilidade(e.target.value)}
                            className="select-habilidade"
                        >
                            {habilidadesUnicas.map((hab, index) => (
                                <option key={index} value={hab}>
                                    {hab === "consolidado" ? 
                                        "Relatório Consolidado (Todas as Habilidades)" : 
                                        `${hab.replace('Objetivo: ', '').replace('Habilidade: ', '')}`
                                    }
                                </option>
                            ))}
                        </select>
                        <p className="chart-description">
                            Os gráficos são gerados automaticamente a partir dos registros de evolução diária. 
                            O relatório consolidado apresenta a performance geral, enquanto os filtros específicos 
                            mostram o progresso detalhado por habilidade trabalhada.
                        </p>
                    </div>

                    {renderGraficos()}
                </div>
                
                {/* SUMÁRIO QUALITATIVO DETALHADO */}
                <div className="relatorio-section">
                    <h3><FaFileAlt /> Análise Qualitativa Detalhada e Registros Recentes</h3>
                    {evolucoesParaSumario.length > 0 ? (
                        <div className="sumario-list">
                            {evolucoesParaSumario.map((evolucao, index) => (
                                <div key={index} className="evolucao-detail-card">
                                    <div className="evolucao-header-info">
                                        <h4>
                                            <FaCalendar /> Sessão de {new Date(evolucao.data).toLocaleDateString('pt-BR')} 
                                        </h4>
                                        <span>
                                            <strong>Habilidade:</strong> {evolucao.habilidadeTrabalhada || 'Não especificada'} | 
                                            <strong> Local:</strong> {evolucao.localSala || 'Não informado'} | 
                                            <strong> Início:</strong> {evolucao.horarioInicio || 'N/A'} | 
                                            <strong> Estado Emocional:</strong> {evolucao.estadoEmocional || 'Não registrado'}
                                        </span>
                                    </div>
                                    
                                    {evolucao.fatorImpacto && (
                                        <>
                                            <p><strong>Fatores de Impacto:</strong></p>
                                            <p>{evolucao.fatorImpacto}</p>
                                        </>
                                    )}
                                    
                                    <p><strong>Descrição Qualitativa da Sessão:</strong></p>
                                    <p>{evolucao.descricao || 'Descrição não registrada.'}</p>
                                    
                                    {evolucao.recomendacoes && (
                                        <>
                                            <p><strong>Recomendações para Próximas Sessões:</strong></p>
                                            <p>{evolucao.recomendacoes}</p>
                                        </>
                                    )}
                                    
                                    <div className="data-row">
                                        <div className="data-box">
                                            <strong>Performance da Sessão</strong>
                                            {evolucao.acertos || 0}/{evolucao.tentativas || 0} acertos 
                                            ({(evolucao.tentativas || 0) > 0 ? (((evolucao.acertos || 0) / (evolucao.tentativas || 0)) * 100).toFixed(1) : 0}%)
                                        </div>
                                        <div className="data-box">
                                            <strong>Suporte Oferecido</strong>
                                            {evolucao.tipoAjuda || 'N/A'} - {evolucao.intensidadeAjuda || 'N/A'} ({evolucao.modalidadeAjuda || 'N/A'})
                                        </div>
                                        <div className="data-box">
                                            <strong>Detalhes do Suporte</strong>
                                            {evolucao.descricaoAjuda || 'Não especificado'}
                                        </div>
                                    </div>
                                    
                                    {(evolucao.abc_antecedente || evolucao.abc_comportamento || evolucao.abc_consequencia) && (
                                        <div className="abc-box">
                                            <strong>Análise Comportamental (ABC):</strong>
                                            <p>
                                                <strong>Antecedente:</strong> {evolucao.abc_antecedente || 'N/A'} | 
                                                <strong> Comportamento:</strong> {evolucao.abc_comportamento || 'N/A'} | 
                                                <strong> Consequência:</strong> {evolucao.abc_consequencia || 'N/A'}
                                            </p>
                                        </div>
                                    )}

                                    {evolucao.arquivoURL && (
                                        <div className="anexo-link">
                                            <FaDownload />
                                            <a href={evolucao.arquivoURL} target="_blank" rel="noopener noreferrer">
                                                Visualizar anexo da sessão (foto/vídeo)
                                            </a>
                                        </div>
                                    )}
                                    
                                    <div className="data-row" style={{marginTop: '15px', borderTop: '1px solid #e9ecef', paddingTop: '15px'}}>
                                        <div className="data-box" style={{fontSize: '12px', background: '#f8f9fa'}}>
                                            <strong>Terapeuta Responsável</strong>
                                            {evolucao.terapeutaNome || 'Não informado'}
                                        </div>
                                        <div className="data-box" style={{fontSize: '12px', background: '#f8f9fa'}}>
                                            <strong>Registrado em</strong>
                                            {evolucao.criadoEm ? new Date(evolucao.criadoEm).toLocaleDateString('pt-BR') : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="alerta">
                            <FaFileAlt size={24} />
                            <p>Nenhuma evolução foi registrada ainda. Inicie registrando as primeiras sessões na tela "Evolução Diária" para gerar análises qualitativas.</p>
                        </div>
                    )}
                </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default GerarRelatorioPaciente;