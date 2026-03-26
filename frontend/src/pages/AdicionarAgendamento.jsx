// AdicionarAgendamento — base: paciente, profissional, terapia, recorrência.
// Extensão scheduling: duração, programa ABA opcional, semanas/data fim, validação de sobreposição, fila de notificação para responsáveis.

import React, { useEffect, useMemo, useState } from "react";
import { addDoc, collection, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { findTherapistConflicts } from "../schedule/appointmentTime";
import { queueGuardianAppointmentNotification } from "../schedule/scheduleNotifications";
import { listProgramsByPatient } from "../aba/abaApi";
import { useAuth } from "../context/AuthContext";
import "./AdicionarAgendamento.css";

import { FaUser, FaUsers, FaFileAlt, FaCalendar, FaClock, FaCalendarAlt, FaCalendarCheck, FaCheckCircle, FaTimes, FaSearch } from "react-icons/fa";

// Modal de sucesso (mantido igual)
const SuccessModal = ({ isOpen, onClose, agendamentoData, totalAgendamentos }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <FaCheckCircle className="modal-icon" />
        <h2 className="modal-title">
          {totalAgendamentos > 1
            ? `${totalAgendamentos} Agendamentos Criados!`
            : "Agendamento Criado!"}
        </h2>
        <div className="modal-message">
          <p>
            {totalAgendamentos > 1
              ? `Foram criados ${totalAgendamentos} agendamentos recorrentes com sucesso.`
              : "Seu agendamento foi registrado com sucesso."}
          </p>
          {agendamentoData && (
            <div style={{ marginTop: "1rem", textAlign: "left", background: "#f8fafc", padding: "1rem", borderRadius: "8px" }}>
              <p>
                <strong>Data de Início:</strong>{" "}
                {new Date(agendamentoData.data).toLocaleDateString("pt-BR")}
              </p>
              <p>
                <strong>Hora:</strong> {agendamentoData.hora}
              </p>
              {agendamentoData.isRecorrente && (
                <>
                  <p>
                    <strong>Recorrência:</strong> {agendamentoData.frequenciaSemanal}x por semana
                  </p>
                  <p>
                    <strong>Período:</strong> 12 semanas (3 meses)
                  </p>
                </>
              )}
            </div>
          )}
        </div>
        <button className="modal-button" onClick={onClose}>
          Entendi
        </button>
      </div>
    </div>
  );
};

const AdicionarAgendamento = () => {
  const { user, currentUserData, loading: authLoading } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [terapias, setTerapias] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [selectedProfissional, setSelectedProfissional] = useState("");
  const [selectedTerapia, setSelectedTerapia] = useState("");
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [horaAgendamento, setHoraAgendamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [diasSemana, setDiasSemana] = useState([]);
  const [frequenciaSemanal, setFrequenciaSemanal] = useState(1);
  const [duracaoMinutos, setDuracaoMinutos] = useState(50);
  const [abaProgramId, setAbaProgramId] = useState("");
  const [abaPrograms, setAbaPrograms] = useState([]);
  const [recurrenceWeeks, setRecurrenceWeeks] = useState(12);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastAgendamento, setLastAgendamento] = useState(null);
  const [totalAgendamentosCriados, setTotalAgendamentosCriados] = useState(0);
  const clinicaId = currentUserData?.clinicaId || "";

  // Fetch data
  useEffect(() => {
    let active = true;

    const fetchOptions = async () => {
      if (authLoading) {
        if (active) setLoadingOptions(true);
        return;
      }

      if (!clinicaId) {
        if (!active) return;
        setError("Dados da clínica não disponíveis. Faça login novamente.");
        setPacientes([]);
        setProfissionais([]);
        setTerapias([]);
        setLoadingOptions(false);
        return;
      }

      setLoadingOptions(true);
      setError("");

      try {
        const [pacientesSnapshot, profissionaisSnapshot, terapiasSnapshot] = await Promise.all([
          getDocs(query(collection(db, "pacientes"), where("clinicaId", "==", clinicaId))),
          getDocs(query(collection(db, "profissionais"), where("clinicaId", "==", clinicaId))),
          getDocs(query(collection(db, "terapias"), where("clinicaId", "==", clinicaId)))
        ]);
        if (!active) return;

        const pacientesList = pacientesSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        const profissionaisList = profissionaisSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
        const terapiasList = terapiasSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }));

        pacientesList.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        profissionaisList.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));
        terapiasList.sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

        setPacientes(pacientesList);
        setProfissionais(profissionaisList);
        setTerapias(terapiasList);
      } catch (error) {
        console.error("Erro ao carregar opções:", error);
        if (!active) return;
        setError("Erro ao carregar opções. Tente novamente.");
      } finally {
        if (!active) return;
        setLoadingOptions(false);
      }
    };

    fetchOptions();

    return () => {
      active = false;
    };
  }, [authLoading, clinicaId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedPaciente || !clinicaId) {
        setAbaPrograms([]);
        return;
      }
      try {
        const list = await listProgramsByPatient(selectedPaciente, clinicaId);
        if (!cancelled) setAbaPrograms(list);
      } catch {
        if (!cancelled) setAbaPrograms([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPaciente, clinicaId]);

  const pacientesFiltrados = useMemo(() => {
    if (!patientSearch.trim()) return pacientes;
    const termo = patientSearch.toLowerCase();
    return pacientes.filter((paciente) => {
      const nome = (paciente.nome || paciente.nomeCompleto || "").toLowerCase();
      const responsavel = (paciente.responsavel || paciente.responsavelNome || paciente.nomeResponsavel || "").toLowerCase();
      return nome.includes(termo) || responsavel.includes(termo);
    });
  }, [pacientes, patientSearch]);

  const selectedPacienteObj = useMemo(
    () => pacientes.find((p) => p.id === selectedPaciente) || null,
    [pacientes, selectedPaciente]
  );

  // Recorrência
  const handleDiaSemanaChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setDiasSemana([...diasSemana, value]);
    } else {
      setDiasSemana(diasSemana.filter(day => day !== value));
    }
  };
  const gerarDatasRecorrencia = (dataInicio, diasSemana, numSemanas = 12, maxDateIso = null) => {
    const datas = [];
    const dataInicioObj = new Date(dataInicio + "T12:00:00");
    const diasMap = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
    const diasNumeros = diasSemana.map((dia) => diasMap[dia]);
    const maxSemanas = Math.min(Math.max(1, numSemanas), 104);
    for (let semana = 0; semana < maxSemanas; semana++) {
      for (const diaNum of diasNumeros) {
        const data = new Date(dataInicioObj);
        const diasParaAdicionar = (diaNum - dataInicioObj.getDay() + 7) % 7 + semana * 7;
        data.setDate(dataInicioObj.getDate() + diasParaAdicionar);
        if (data < dataInicioObj) continue;
        const iso = data.toISOString().split("T")[0];
        if (maxDateIso && iso > maxDateIso) continue;
        datas.push(iso);
      }
    }
    return [...new Set(datas)].sort();
  };

  // Submissão
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clinicaId) {
      setError("Dados da clínica não disponíveis. Por favor, faça login novamente.");
      return;
    }

    const pacienteValido = pacientes.some((paciente) => paciente.id === selectedPaciente);
    const profissionalValido = profissionais.some((profissional) => profissional.id === selectedProfissional);
    const terapiaValida = terapias.some((terapia) => terapia.id === selectedTerapia);
    if (!pacienteValido || !profissionalValido || !terapiaValida) {
      setError("Seleção inválida. Atualize a página e selecione paciente, profissional e terapia da sua clínica.");
      return;
    }

    if (isRecorrente && diasSemana.length === 0) {
      setError("Por favor, selecione pelo menos um dia da semana para agendamentos recorrentes.");
      return;
    }
    if (isRecorrente && diasSemana.length !== frequenciaSemanal) {
      setError(`Para ${frequenciaSemanal}x por semana, selecione exatamente ${frequenciaSemanal} dias da semana.`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const maxIso = recurrenceEndDate && isRecorrente ? recurrenceEndDate : null;
      if (maxIso && maxIso < dataAgendamento) {
        setError("Data final da recorrência deve ser após a data de início.");
        setLoading(false);
        return;
      }

      const existSnap = await getDocs(
        query(collection(db, "agendamentos"), where("clinicaId", "==", clinicaId))
      );
      const existingRows = existSnap.docs
        .map((d) => {
          const x = d.data();
          const pid = x.professionalId || x.profissionalId || "";
          return {
            id: d.id,
            date: x.date || x.data || "",
            time: x.time || x.hora || "",
            professionalId: pid,
            durationMinutes: Number(x.durationMinutes) || 50,
          };
        })
        .filter((row) => row.professionalId === selectedProfissional);

      const agendamentoBase = {
        clinicaId,
        patientId: selectedPaciente,
        pacienteId: selectedPaciente,
        professionalId: selectedProfissional,
        profissionalId: selectedProfissional,
        therapyId: selectedTerapia,
        terapiaId: selectedTerapia,
        time: horaAgendamento,
        hora: horaAgendamento,
        durationMinutes: Number(duracaoMinutos) || 50,
        abaProgramId: abaProgramId || "",
        notes: observacoes,
        observacoes,
        isRecorrente: isRecorrente,
        status: "scheduled",
        patientName: selectedPacienteObj?.nome || "",
        patientResponsible:
          selectedPacienteObj?.responsavel ||
          selectedPacienteObj?.responsavelNome ||
          selectedPacienteObj?.nomeResponsavel ||
          "",
        patientInsurance:
          selectedPacienteObj?.convenio ||
          selectedPacienteObj?.planoSaude ||
          selectedPacienteObj?.plano ||
          "Particular",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const assertNoConflict = (dateIso, virtualRows) => {
        const hits = findTherapistConflicts([...existingRows, ...virtualRows], {
          date: dateIso,
          time: horaAgendamento,
          durationMinutes: Number(duracaoMinutos) || 50,
          professionalId: selectedProfissional,
        });
        if (hits.length) {
          setError(
            "Conflito de agenda: o profissional já possui outro atendimento sobreposto nesse horário."
          );
          return false;
        }
        return true;
      };

      if (isRecorrente) {
        const grupoRecorrenciaId = `grupo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const datasRecorrencia = gerarDatasRecorrencia(
          dataAgendamento,
          diasSemana,
          recurrenceWeeks,
          maxIso || null
        );
        if (datasRecorrencia.length === 0) {
          setError("Nenhuma data gerada para a recorrência. Ajuste semanas ou data final.");
          setLoading(false);
          return;
        }
        const virtual = [];
        for (const data of datasRecorrencia) {
          if (!assertNoConflict(data, virtual)) {
            setLoading(false);
            return;
          }
          virtual.push({
            id: `v_${virtual.length}`,
            date: data,
            time: horaAgendamento,
            durationMinutes: Number(duracaoMinutos) || 50,
            professionalId: selectedProfissional,
          });
        }
        const batch = writeBatch(db);
        datasRecorrencia.forEach((data, index) => {
          const agendamentoRef = doc(collection(db, "agendamentos"));
          const historyRef = doc(collection(db, "appointment_history"));
          const agendamentoData = {
            ...agendamentoBase,
            date: data,
            data,
            grupoRecorrenciaId: grupoRecorrenciaId,
            sequenciaRecorrencia: index + 1,
            totalRecorrencia: datasRecorrencia.length,
            diasSemanaOriginais: diasSemana,
            frequenciaSemanalOriginal: frequenciaSemanal,
            dataInicioOriginal: dataAgendamento,
            recurrenceEndDate: maxIso || null,
          };
          batch.set(agendamentoRef, agendamentoData);
          batch.set(historyRef, {
            appointmentId: agendamentoRef.id,
            clinicaId,
            patientId: selectedPaciente,
            professionalId: selectedProfissional,
            changedByUid: user?.uid || null,
            changedByEmail: user?.email || null,
            action: "created",
            fromStatus: null,
            toStatus: "scheduled",
            changedAt: new Date(),
            fromDate: null,
            toDate: data,
          });
        });
        await batch.commit();
        await queueGuardianAppointmentNotification({
          clinicaId,
          patientId: selectedPaciente,
          eventType: "appointment_created",
          appointmentId: null,
          summary: `${datasRecorrencia.length} consulta(s) agendada(s) a partir de ${dataAgendamento}`,
        });
        setTotalAgendamentosCriados(datasRecorrencia.length);
        setLastAgendamento({
          ...agendamentoBase,
          data: dataAgendamento,
          isRecorrente: true,
          frequenciaSemanal: frequenciaSemanal,
        });
      } else {
        if (!assertNoConflict(dataAgendamento, [])) {
          setLoading(false);
          return;
        }
        const agendamentoData = {
          ...agendamentoBase,
          date: dataAgendamento,
          data: dataAgendamento,
          isRecorrente: false,
        };
        const appointmentRef = await addDoc(collection(db, "agendamentos"), agendamentoData);
        await addDoc(collection(db, "appointment_history"), {
          appointmentId: appointmentRef.id,
          clinicaId,
          patientId: selectedPaciente,
          professionalId: selectedProfissional,
          changedByUid: user?.uid || null,
          changedByEmail: user?.email || null,
          action: "created",
          fromStatus: null,
          toStatus: "scheduled",
          changedAt: new Date(),
          fromDate: null,
          toDate: dataAgendamento,
        });
        await queueGuardianAppointmentNotification({
          clinicaId,
          patientId: selectedPaciente,
          eventType: "appointment_created",
          appointmentId: appointmentRef.id,
          summary: `Consulta em ${dataAgendamento} ${horaAgendamento}`,
        });
        setTotalAgendamentosCriados(1);
        setLastAgendamento(agendamentoData);
      }
      setSelectedPaciente("");
      setSelectedProfissional("");
      setSelectedTerapia("");
      setPatientSearch("");
      setDataAgendamento("");
      setHoraAgendamento("");
      setObservacoes("");
      setIsRecorrente(false);
      setDiasSemana([]);
      setFrequenciaSemanal(1);
      setDuracaoMinutos(50);
      setAbaProgramId("");
      setRecurrenceWeeks(12);
      setRecurrenceEndDate("");
      setShowSuccessModal(true);
    } catch (error) {
      setError("Erro ao adicionar agendamento. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setLastAgendamento(null);
    setTotalAgendamentosCriados(0);
  };
  const openPicker = (e) => {
    if (e.target.showPicker) e.target.showPicker();
  };

  const diasSemanaLabels = {
    domingo: "Dom", segunda: "Seg", terca: "Ter", quarta: "Qua",
    quinta: "Qui", sexta: "Sex", sabado: "Sáb"
  };

  return (
    <div className="adicionar-agendamento-page">
        <div className="adicionar-agendamento-container">
          <h1>Adicionar Novo Agendamento</h1>
          {error && (
            <div className="alert alert-error">
              <FaTimes style={{ marginRight: "0.5rem" }} />
              {error}
            </div>
          )}
          {loadingOptions && (
            <div className="alert alert-info">Carregando pacientes, profissionais e terapias...</div>
          )}
          <form onSubmit={handleSubmit} className="agendamento-form">
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="patientSearch">
                  <FaSearch /> Buscar paciente
                </label>
                <div className="patient-search-autocomplete">
                  <input
                    id="patientSearch"
                    type="text"
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      setSelectedPaciente("");
                      setShowPatientSuggestions(true);
                    }}
                    onFocus={() => setShowPatientSuggestions(Boolean(patientSearch.trim()))}
                    placeholder="Digite nome do paciente ou responsável"
                    disabled={authLoading || loading || loadingOptions}
                    autoComplete="off"
                  />
                  {patientSearch.trim() && showPatientSuggestions && !loadingOptions && (
                    <div className="patient-suggestions" role="listbox">
                      {pacientesFiltrados.length === 0 ? (
                        <div className="patient-suggestion-empty">Nenhum paciente encontrado</div>
                      ) : (
                        pacientesFiltrados.slice(0, 20).map((p) => {
                          const label = p.nome || p.nomeCompleto || "Paciente";
                          const responsavel =
                            p.responsavel || p.responsavelNome || p.nomeResponsavel || "";
                          return (
                            <button
                              key={p.id}
                              type="button"
                              className="patient-suggestion-item"
                              onMouseDown={(evt) => {
                                evt.preventDefault(); // evita o blur antes do clique
                                setSelectedPaciente(p.id);
                                setPatientSearch(label);
                                setShowPatientSuggestions(false);
                              }}
                            >
                              <div className="patient-suggestion-title">{label}</div>
                              {responsavel && <div className="patient-suggestion-sub">Resp.: {responsavel}</div>}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="paciente">
                  <FaUser /> Paciente <span className="required">*</span>
                </label>
                <div className="patient-selected-readonly">
                  {selectedPacienteObj ? (
                    <>
                      <div className="patient-selected-name">
                        {selectedPacienteObj.nome || selectedPacienteObj.nomeCompleto || "Paciente"}
                      </div>
                      <div className="patient-selected-meta">
                        {selectedPacienteObj.responsavel ||
                          selectedPacienteObj.responsavelNome ||
                          selectedPacienteObj.nomeResponsavel ||
                          "Resp.: Não informado"}
                      </div>
                    </>
                  ) : (
                    <div className="patient-selected-placeholder">Selecione um paciente usando o campo de busca acima</div>
                  )}
                </div>
                {selectedPacienteObj && (
                  <div className="selected-patient-card">
                    <div><strong>Nome:</strong> {selectedPacienteObj.nome || "Não informado"}</div>
                    <div>
                      <strong>Responsável:</strong>{" "}
                      {selectedPacienteObj.responsavel ||
                        selectedPacienteObj.responsavelNome ||
                        selectedPacienteObj.nomeResponsavel ||
                        "Não informado"}
                    </div>
                    <div>
                      <strong>Convênio:</strong>{" "}
                      {selectedPacienteObj.convenio ||
                        selectedPacienteObj.planoSaude ||
                        selectedPacienteObj.plano ||
                        "Particular"}
                    </div>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="profissional">
                  <FaUsers /> Profissional <span className="required">*</span>
                </label>
                <select
                  id="profissional"
                  value={selectedProfissional}
                  onChange={e => setSelectedProfissional(e.target.value)}
                  required
                  disabled={authLoading || loading || loadingOptions}
                >
                  <option value="">Selecione um profissional</option>
                  {profissionais.map(profissional => (
                    <option key={profissional.id} value={profissional.id}>
                      {profissional.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="terapia">
                  <FaFileAlt /> Terapia <span className="required">*</span>
                </label>
                <select
                  id="terapia"
                  value={selectedTerapia}
                  onChange={e => setSelectedTerapia(e.target.value)}
                  required
                  disabled={authLoading || loading || loadingOptions}
                >
                  <option value="">Selecione uma terapia</option>
                  {terapias.map(terapia => (
                    <option key={terapia.id} value={terapia.id}>
                      {terapia.nome || "Terapia sem nome"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group input-with-icon">
                <label htmlFor="data">
                  <FaCalendar /> Data de Início <span className="required">*</span>
                </label>
                <div className="input-icon-wrapper">
                  <FaCalendar className="input-icon" />
                  <input
                    type="date"
                    id="data"
                    value={dataAgendamento}
                    onChange={e => setDataAgendamento(e.target.value)}
                    onClick={openPicker}
                    required
                    disabled={authLoading || loading || loadingOptions}
                  />
                </div>
              </div>
              <div className="form-group input-with-icon">
                <label htmlFor="hora">
                  <FaClock /> Hora <span className="required">*</span>
                </label>
                <div className="input-icon-wrapper">
                  <FaClock className="input-icon" />
                  <input
                    type="time"
                    id="hora"
                    value={horaAgendamento}
                    onChange={e => setHoraAgendamento(e.target.value)}
                    onClick={openPicker}
                    required
                    disabled={authLoading || loading || loadingOptions}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="duracao">Duração (minutos)</label>
                <input
                  id="duracao"
                  type="number"
                  min={15}
                  step={5}
                  value={duracaoMinutos}
                  onChange={(e) => setDuracaoMinutos(Number(e.target.value) || 50)}
                  disabled={authLoading || loading || loadingOptions}
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="abaProgram">Programa ABA (opcional)</label>
                <select
                  id="abaProgram"
                  value={abaProgramId}
                  onChange={(e) => setAbaProgramId(e.target.value)}
                  disabled={authLoading || loading || loadingOptions || !selectedPaciente}
                >
                  <option value="">Nenhum</option>
                  {abaPrograms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome || p.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group full-width">
                <label htmlFor="observacoes">
                  <FaFileAlt /> Observações
                </label>
                <textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows="3"
                  disabled={authLoading || loading || loadingOptions}
                  placeholder="Adicione observações relevantes para o agendamento..."
                ></textarea>
              </div>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="isRecorrente"
                  checked={isRecorrente}
                  onChange={e => setIsRecorrente(e.target.checked)}
                  disabled={authLoading || loading || loadingOptions}
                />
                <label htmlFor="isRecorrente">
                  <FaCalendarAlt style={{ marginRight: "0.5rem" }} />
                  Agendamento recorrente
                </label>
              </div>
              {isRecorrente && (
                <div className="recorrencia-options">
                  <div className="recorrencia-grid">
                    <div className="form-group">
                      <label>
                        <FaCalendarCheck /> Frequência Semanal
                      </label>
                      <select
                        value={frequenciaSemanal}
                        onChange={e => setFrequenciaSemanal(parseInt(e.target.value))}
                        disabled={authLoading || loading || loadingOptions}
                      >
                        <option value="1">1x por semana</option>
                        <option value="2">2x por semana</option>
                        <option value="3">3x por semana</option>
                        <option value="4">4x por semana</option>
                        <option value="5">5x por semana</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Número de semanas</label>
                      <input
                        type="number"
                        min={1}
                        max={104}
                        value={recurrenceWeeks}
                        onChange={(e) => setRecurrenceWeeks(Number(e.target.value) || 12)}
                        disabled={authLoading || loading || loadingOptions}
                      />
                    </div>
                    <div className="form-group">
                      <label>Data final opcional</label>
                      <input
                        type="date"
                        value={recurrenceEndDate}
                        onChange={(e) => setRecurrenceEndDate(e.target.value)}
                        disabled={authLoading || loading || loadingOptions}
                      />
                    </div>
                  </div>
                  <div className="dias-semana-section">
                    <div className="form-group">
                      <label>
                        <FaCalendarAlt /> Dias da Semana (selecione {frequenciaSemanal} dia{frequenciaSemanal > 1 ? "s" : ""})
                      </label>
                      <div className="dias-semana-checkboxes">
                        {Object.entries(diasSemanaLabels).map(([dia, label]) => (
                          <label key={dia}>
                            <input
                              type="checkbox"
                              value={dia}
                              checked={diasSemana.includes(dia)}
                              onChange={handleDiaSemanaChange}
                              disabled={authLoading || loading || loadingOptions}
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                      {diasSemana.length > 0 && (
                        <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#64748b" }}>
                          Selecionados: {diasSemana.length} de {frequenciaSemanal} dias
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <button
                type="submit"
                className="submit-button"
                disabled={authLoading || loading || loadingOptions}
              >
                {loading
                  ? "Criando..."
                  : isRecorrente
                    ? "✨ Criar Agendamentos Recorrentes"
                    : "✨ Criar Agendamento"}
              </button>
            </div>
          </form>
        </div>
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={closeSuccessModal}
          agendamentoData={lastAgendamento}
          totalAgendamentos={totalAgendamentosCriados}
        />
    </div>
  );
};

export default AdicionarAgendamento;
