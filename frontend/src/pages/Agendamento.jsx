import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, query, where, getDocs, Timestamp, doc, deleteDoc } from "firebase/firestore";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "./Agendamento.css";

const Agendamento = () => {
  const [pacientes, setPacientes] = useState([]);
  const [profissionais, setProfissionais] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [form, setForm] = useState({
    pacienteId: "",
    profissionalId: "",
    data: "",
    hora: "",
    duracao: "60",
    tipo: "Consulta",
    observacao: "",
  });
  const [role, setRole] = useState("");
  const clinicaId = localStorage.getItem("clinicaId");
  const userUid = localStorage.getItem("uid");

  const fetchUserData = async () => {
    if (userUid) {
      const userRef = doc(db, "usuarios", userUid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setRole(userSnap.data().role || "");
      }
    }
  };

  const fetchPacientes = async () => {
    const q = query(collection(db, "pacientes"), where("clinicaId", "==", clinicaId));
    const snap = await getDocs(q);
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setPacientes(data);
  };

  const fetchProfissionais = async () => {
    const q = query(collection(db, "profissionais"), where("clinicaId", "==", clinicaId), where("ativo", "==", true));
    const snap = await getDocs(q);
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setProfissionais(data);
  };

  const fetchAgendamentos = async () => {
    const q = query(collection(db, "agendamentos"), where("clinicaId", "==", clinicaId));
    const snap = await getDocs(q);
    const data = snap.docs.map((doc) => {
      const { data, hora, duracao, pacienteId, profissionalId } = doc.data();
      const paciente = pacientes.find((p) => p.id === pacienteId);
      const profissional = profissionais.find((p) => p.id === profissionalId);
      const start = new Date(`${data}T${hora}`);
      const end = new Date(start.getTime() + parseInt(duracao) * 60000);
      return {
        id: doc.id,
        title: `${paciente?.nome} - ${profissional?.nome}`,
        start,
        end,
        extendedProps: { pacienteId, profissionalId },
      };
    });
    setEventos(data);
  };

  useEffect(() => {
    fetchUserData();
    fetchPacientes();
    fetchProfissionais();
  }, []);

  useEffect(() => {
    if (pacientes.length && profissionais.length) {
      fetchAgendamentos();
    }
  }, [pacientes, profissionais]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "agendamentos"), {
        ...form,
        clinicaId,
        criadoEm: Timestamp.now(),
      });
      setForm({
        pacienteId: "",
        profissionalId: "",
        data: "",
        hora: "",
        duracao: "60",
        tipo: "Consulta",
        observacao: "",
      });
      fetchAgendamentos();
      alert("Agendamento criado com sucesso!"); // Substituído toast por alert
    } catch (error) {
      alert("Erro ao criar agendamento: " + error.message); // Substituído toast por alert
    }
  };

  const handleEventClick = async (info) => {
    if (window.confirm("Deseja excluir este agendamento?")) {
      await deleteDoc(doc(db, "agendaments", info.event.id));
      fetchAgendamentos();
      alert("Agendamento excluído com sucesso!"); // Substituído toast por alert
    }
  };

  return (
    <>
      <h1>Minha Agenda</h1>
      <form className="form-agendamento" onSubmit={handleSubmit}>
        <select
          name="pacienteId"
          value={form.pacienteId}
          onChange={(e) => setForm({ ...form, pacienteId: e.target.value })}
          required
        >
          <option value="">Selecione o Paciente</option>
          {pacientes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        {role === "admin" && (
          <select
            name="profissionalId"
            value={form.profissionalId}
            onChange={(e) => setForm({ ...form, profissionalId: e.target.value })}
            required
          >
            <option value="">Selecione o Profissional</option>
            {profissionais.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.especialidade})
              </option>
            ))}
          </select>
        )}
        <input
          type="date"
          name="data"
          value={form.data}
          onChange={(e) => setForm({ ...form, data: e.target.value })}
          required
        />
        <input
          type="time"
          name="hora"
          value={form.hora}
          onChange={(e) => setForm({ ...form, hora: e.target.value })}
          required
        />
        <select
          name="duracao"
          value={form.duracao}
          onChange={(e) => setForm({ ...form, duracao: e.target.value })}
        >
          <option value="30">30 minutos</option>
          <option value="60">60 minutos</option>
          <option value="90">90 minutos</option>
        </select>
        <select
          name="tipo"
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value })}
        >
          <option value="Consulta">Consulta</option>
          <option value="Terapia">Terapia</option>
          <option value="Avaliação">Avaliação</option>
        </select>
        <textarea
          name="observacao"
          value={form.observacao}
          onChange={(e) => setForm({ ...form, observacao: e.target.value })}
          placeholder="Observações"
        />
        <button type="submit">Agendar</button>
      </form>

      <div className="calendario-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          events={eventos}
          eventClick={handleEventClick}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          height="auto"
          locale="pt-br"
        />
      </div>
    </>
  );
};

export default Agendamento;