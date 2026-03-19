import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import "./AdicionarAgendamento.css";

const AdicionarAgendamento = () => {
  const { currentUserData } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [terapias, setTerapias] = useState([]);

  const [selectedPaciente, setSelectedPaciente] = useState("");
  const [selectedProfissional, setSelectedProfissional] = useState("");
  const [selectedTerapia, setSelectedTerapia] = useState("");
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [horaAgendamento, setHoraAgendamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [diasSemana, setDiasSemana] = useState([]);
  const [numSemanas, setNumSemanas] = useState(1);

  useEffect(() => {
    const fetchOptions = async () => {
      if (!currentUserData || !currentUserData.clinicaId) return;

      // Fetch Pacientes
      const pacientesSnapshot = await getDocs(collection(db, "pacientes"));
      setPacientes(pacientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Profissionais
      const profissionaisSnapshot = await getDocs(collection(db, "profissionais"));
      setProfissionais(profissionaisSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Terapias
      const terapiasSnapshot = await getDocs(collection(db, "terapias"));
      setTerapias(terapiasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchOptions();
  }, [currentUserData]);

  const handleDiaSemanaChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setDiasSemana([...diasSemana, value]);
    } else {
      setDiasSemana(diasSemana.filter(day => day !== value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUserData || !currentUserData.clinicaId) {
      alert("Dados da clínica não disponíveis. Por favor, faça login novamente.");
      return;
    }

    const agendamentoData = {
      clinicaId: currentUserData.clinicaId,
      pacienteId: selectedPaciente,
      profissionalId: selectedProfissional,
      terapiaId: selectedTerapia,
      data: dataAgendamento,
      hora: horaAgendamento,
      observacoes: observacoes,
      isRecorrente: isRecorrente,
      diasSemana: isRecorrente ? diasSemana : [],
      numSemanas: isRecorrente ? numSemanas : 0,
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, "agendamentos"), agendamentoData);
      alert("Agendamento adicionado com sucesso!");
      // Limpar formulário
      setSelectedPaciente("");
      setSelectedProfissional("");
      setSelectedTerapia("");
      setDataAgendamento("");
      setHoraAgendamento("");
      setObservacoes("");
      setIsRecorrente(false);
      setDiasSemana([]);
      setNumSemanas(1);
    } catch (error) {
      console.error("Erro ao adicionar agendamento:", error);
      alert("Erro ao adicionar agendamento.");
    }
  };

  return (
    <div className="adicionar-agendamento-container">
      <h1>Adicionar Novo Agendamento</h1>
      <form onSubmit={handleSubmit} className="agendamento-form">
        <div className="form-group">
          <label htmlFor="paciente">Paciente:</label>
          <select
            id="paciente"
            value={selectedPaciente}
            onChange={(e) => setSelectedPaciente(e.target.value)}
            required
          >
            <option value="">Selecione um paciente</option>
            {pacientes.map((paciente) => (
              <option key={paciente.id} value={paciente.id}>
                {paciente.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="profissional">Profissional:</label>
          <select
            id="profissional"
            value={selectedProfissional}
            onChange={(e) => setSelectedProfissional(e.target.value)}
            required
          >
            <option value="">Selecione um profissional</option>
            {profissionais.map((profissional) => (
              <option key={profissional.id} value={profissional.id}>
                {profissional.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="terapia">Terapia:</label>
          <select
            id="terapia"
            value={selectedTerapia}
            onChange={(e) => setSelectedTerapia(e.target.value)}
            required
          >
            <option value="">Selecione uma terapia</option>
            {terapias.map((terapia) => (
              <option key={terapia.id} value={terapia.id}>
                {terapia.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="data">Data:</label>
          <input
            type="date"
            id="data"
            value={dataAgendamento}
            onChange={(e) => setDataAgendamento(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="hora">Hora:</label>
          <input
            type="time"
            id="hora"
            value={horaAgendamento}
            onChange={(e) => setHoraAgendamento(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="observacoes">Observações:</label>
          <textarea
            id="observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows="3"
          ></textarea>
        </div>

        <div className="form-group checkbox-group">
          <input
            type="checkbox"
            id="isRecorrente"
            checked={isRecorrente}
            onChange={(e) => setIsRecorrente(e.target.checked)}
          />
          <label htmlFor="isRecorrente">Agendamento Recorrente</label>
        </div>

        {isRecorrente && (
          <div className="recorrencia-options">
            <div className="form-group">
              <label>Dias da Semana:</label>
              <div className="dias-semana-checkboxes">
                <label><input type="checkbox" value="domingo" onChange={handleDiaSemanaChange} checked={diasSemana.includes("domingo")} /> Dom</label>
                <label><input type="checkbox" value="segunda" onChange={handleDiaSemanaChange} checked={diasSemana.includes("segunda")} /> Seg</label>
                <label><input type="checkbox" value="terca" onChange={handleDiaSemanaChange} checked={diasSemana.includes("terca")} /> Ter</label>
                <label><input type="checkbox" value="quarta" onChange={handleDiaSemanaChange} checked={diasSemana.includes("quarta")} /> Qua</label>
                <label><input type="checkbox" value="quinta" onChange={handleDiaSemanaChange} checked={diasSemana.includes("quinta")} /> Qui</label>
                <label><input type="checkbox" value="sexta" onChange={handleDiaSemanaChange} checked={diasSemana.includes("sexta")} /> Sex</label>
                <label><input type="checkbox" value="sabado" onChange={handleDiaSemanaChange} checked={diasSemana.includes("sabado")} /> Sáb</label>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="numSemanas">Número de Semanas (para recorrência):</label>
              <input
                type="number"
                id="numSemanas"
                value={numSemanas}
                onChange={(e) => setNumSemanas(parseInt(e.target.value))}
                min="1"
              />
            </div>
          </div>
        )}

        <button type="submit" className="submit-button">Adicionar Agendamento</button>
      </form>
    </div>
  );
};

export default AdicionarAgendamento;

