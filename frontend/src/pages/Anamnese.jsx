import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaPlus, FaTimes, FaFileImage, FaFile, FaSave, FaNotesMedical, FaCalendarDay, FaUpload,
  FaUser, FaHeartbeat, FaUsers, FaSchool
} from "react-icons/fa";
import "./Anamnese.css";

const Anamnese = () => {
  const { currentUserData, loading } = useAuth();
  const role = currentUserData?.role || "";
  const clinicaId = currentUserData?.clinicaId || "";

  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [anamneses, setAnamneses] = useState([]);
  const [form, setForm] = useState({
    data: new Date(),
    historicoGestacional: "",
    desenvolvimentoMotor: "",
    desenvolvimentoLinguagem: "",
    comportamentoSocial: "",
    historicoMedico: "",
    historicoFamiliar: "",
    escolaridade: "",
    observacoes: "",
    arquivo: null,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchPacientes = async () => {
    try {
      const q = query(collection(db, "pacientes"), where("clinicaId", "==", clinicaId));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPacientes(data);
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
    }
  };

  const fetchAnamneses = async (pacienteId) => {
    try {
      const pacienteRef = doc(db, "pacientes", pacienteId);
      const pacienteSnap = await getDoc(pacienteRef);
      if (pacienteSnap.exists()) {
        const data = pacienteSnap.data();
        setAnamneses(data.anamnese || []);
      } else {
        setAnamneses([]);
      }
    } catch (error) {
      console.error("Erro ao buscar anamneses:", error);
      setAnamneses([]);
    }
  };

  useEffect(() => {
    if (!loading && currentUserData) {
      fetchPacientes();
    }
  }, [loading, currentUserData]);

  const handleSelectPaciente = (paciente) => {
    setSelectedPaciente(paciente);
    fetchAnamneses(paciente.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const pacienteRef = doc(db, "pacientes", selectedPaciente.id);
      const pacienteSnap = await getDoc(pacienteRef);
      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const anamneseAtual = pacienteData.anamnese || [];

        let arquivoURL = "";
        if (form.arquivo) {
          const arquivoRef = ref(storage, `anamneses/${selectedPaciente.id}/${form.arquivo.name}-${Date.now()}`);
          const snapshot = await uploadBytes(arquivoRef, form.arquivo);
          arquivoURL = await getDownloadURL(snapshot.ref);
        }

        const novaAnamnese = {
          data: form.data.toISOString().split('T')[0],
          historicoGestacional: form.historicoGestacional,
          desenvolvimentoMotor: form.desenvolvimentoMotor,
          desenvolvimentoLinguagem: form.desenvolvimentoLinguagem,
          comportamentoSocial: form.comportamentoSocial,
          historicoMedico: form.historicoMedico,
          historicoFamiliar: form.historicoFamiliar,
          escolaridade: form.escolaridade,
          observacoes: form.observacoes,
          criadoEm: new Date().toISOString(),
          arquivoURL: arquivoURL || null,
        };

        const updatedAnamnese = [...anamneseAtual, novaAnamnese];

        await updateDoc(pacienteRef, { anamnese: updatedAnamnese });

        setAnamneses(updatedAnamnese);
        setForm({
          data: new Date(),
          historicoGestacional: "",
          desenvolvimentoMotor: "",
          desenvolvimentoLinguagem: "",
          comportamentoSocial: "",
          historicoMedico: "",
          historicoFamiliar: "",
          escolaridade: "",
          observacoes: "",
          arquivo: null,
        });
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao adicionar anamnese:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setForm({ ...form, arquivo: e.target.files[0] });
    }
  };

  const handleDateChange = (date) => {
    setForm({ ...form, data: date });
  };

  const handleCancel = () => {
    setForm({
      data: new Date(),
      historicoGestacional: "",
      desenvolvimentoMotor: "",
      desenvolvimentoLinguagem: "",
      comportamentoSocial: "",
      historicoMedico: "",
      historicoFamiliar: "",
      escolaridade: "",
      observacoes: "",
      arquivo: null,
    });
    setIsModalOpen(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  return (
    <div className="anamnese-page">
      <div className="anamnese-container">
        <div className="anamnese-header">
          <h1>Anamnese</h1>
          <p>Registre e visualize as anamneses dos pacientes da clínica.</p>
        </div>

        {/* Listagem de Pacientes */}
        <div className="pacientes-section">
          <h2>Lista de Pacientes</h2>
          {pacientes.length > 0 ? (
            <div className="pacientes-list">
              {pacientes.map((paciente) => (
                <div
                  key={paciente.id}
                  className={`paciente-card ${selectedPaciente?.id === paciente.id ? "selected" : ""}`}
                  onClick={() => handleSelectPaciente(paciente)}
                >
                  <div className="paciente-info">
                    <p><strong>Nome:</strong> {paciente.nome}</p>
                    <p><strong>Idade:</strong> {paciente.idade || "Não informado"}</p>
                    <p><strong>CID:</strong> {paciente.cid || "Não informado"}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Nenhum paciente encontrado.</p>
          )}
        </div>

        {/* Listagem de Anamneses e Botão para Abrir o Modal */}
        {selectedPaciente && (
          <>
            <div className="anamnese-section">
              <div className="form-toggle">
                <button onClick={openModal} className="toggle-form-btn">
                  <FaPlus /> Adicionar Nova Anamnese
                </button>
              </div>

              {/* Modal Customizado */}
              {isModalOpen && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <button className="modal-close-btn" onClick={handleCancel}>
                      <FaTimes />
                    </button>
                    <h2>Adicionar Nova Anamnese para {selectedPaciente.nome}</h2>
                    <form className="form-anamnese" onSubmit={handleSubmit}>
                      <div className="form-field">
                        <label><FaCalendarDay /> Data:</label>
                        <DatePicker
                          selected={form.data}
                          onChange={handleDateChange}
                          dateFormat="dd/MM/yyyy"
                          className="custom-datepicker"
                          placeholderText="Selecione a data"
                          required
                        />
                      </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Histórico Gestacional:</label>
                          <textarea
                            name="historicoGestacional"
                            value={form.historicoGestacional}
                            onChange={handleChange}
                            placeholder="Ex.: Complicações na gravidez, uso de medicamentos, prematuridade..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Desenvolvimento Motor:</label>
                          <textarea
                            name="desenvolvimentoMotor"
                            value={form.desenvolvimentoMotor}
                            onChange={handleChange}
                            placeholder="Ex.: Quando engatinhou, andou, dificuldades motoras..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Desenvolvimento da Linguagem:</label>
                          <textarea
                            name="desenvolvimentoLinguagem"
                            value={form.desenvolvimentoLinguagem}
                            onChange={handleChange}
                            placeholder="Ex.: Primeiras palavras, atrasos na fala, dificuldades de comunicação..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Comportamento Social:</label>
                          <textarea
                            name="comportamentoSocial"
                            value={form.comportamentoSocial}
                            onChange={handleChange}
                            placeholder="Ex.: Interação com outras crianças, comportamentos repetitivos, sensibilidade sensorial..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaHeartbeat /> Histórico Médico:</label>
                          <textarea
                            name="historicoMedico"
                            value={form.historicoMedico}
                            onChange={handleChange}
                            placeholder="Ex.: Diagnósticos prévios, medicações, internações..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaUsers /> Histórico Familiar:</label>
                          <textarea
                            name="historicoFamiliar"
                            value={form.historicoFamiliar}
                            onChange={handleChange}
                            placeholder="Ex.: Condições neurodivergentes na família, histórico de doenças genéticas..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaSchool /> Escolaridade:</label>
                          <textarea
                            name="escolaridade"
                            value={form.escolaridade}
                            onChange={handleChange}
                            placeholder="Ex.: Dificuldades de aprendizado, adaptações na escola, comportamento em sala..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Observações Gerais:</label>
                          <textarea
                            name="observacoes"
                            value={form.observacoes}
                            onChange={handleChange}
                            placeholder="Outras informações relevantes..."
                            rows="3"
                          />
                        </div>
                        <div className="form-field">
                          <label><FaUpload /> Anexar Arquivo (opcional):</label>
                          <div className="file-upload">
                            <input
                              type="file"
                              id="file-upload"
                              onChange={handleFileChange}
                              accept="image/*,.pdf"
                            />
                            <label htmlFor="file-upload" className="file-upload-label">
                              {form.arquivo ? (
                                <>
                                  {form.arquivo.type.startsWith("image/") ? <FaFileImage /> : <FaFile />}
                                  {form.arquivo.name}
                                </>
                              ) : (
                                <>
                                  <FaUpload /> Escolher arquivo
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                        <div className="form-actions">
                          <button type="submit" className="save-btn">
                            <FaSave /> Adicionar Anamnese
                          </button>
                          <button type="button" className="cancel-btn" onClick={handleCancel}>
                            <FaTimes /> Desistir
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>

            {/* Listagem de Anamneses do Paciente Selecionado */}
            <div className="anamneses-section">
              <h2>Anamneses de {selectedPaciente.nome}</h2>
              {anamneses.length > 0 ? (
                <div className="anamneses-list">
                  {anamneses
                    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
                    .map((anamnese, index) => (
                      <div key={index} className="anamnese-card">
                        <div className="anamnese-content">
                          <div className="anamnese-row">
                            <p className="data-field"><FaCalendarDay /> <strong>Data:</strong> {anamnese.data}</p>
                            <p className="field-item"><FaNotesMedical /> <strong>Histórico Gestacional:</strong> {anamnese.historicoGestacional}</p>
                          </div>
                          <div className="anamnese-row">
                            <p className="field-item"><FaNotesMedical /> <strong>Desenvolvimento Motor:</strong> {anamnese.desenvolvimentoMotor}</p>
                            <p className="field-item"><FaNotesMedical /> <strong>Desenvolvimento da Linguagem:</strong> {anamnese.desenvolvimentoLinguagem}</p>
                          </div>
                          <div className="anamnese-row">
                            <p className="field-item"><FaNotesMedical /> <strong>Comportamento Social:</strong> {anamnese.comportamentoSocial}</p>
                            <p className="field-item"><FaHeartbeat /> <strong>Histórico Médico:</strong> {anamnese.historicoMedico}</p>
                          </div>
                          <div className="anamnese-row">
                            <p className="field-item"><FaUsers /> <strong>Histórico Familiar:</strong> {anamnese.historicoFamiliar}</p>
                            <p className="field-item"><FaSchool /> <strong>Escolaridade:</strong> {anamnese.escolaridade}</p>
                          </div>
                          <div className="anamnese-row">
                            <p className="field-item"><FaNotesMedical /> <strong>Observações:</strong> {anamnese.observacoes || "Nenhuma observação"}</p>
                          </div>
                          <p className="created-field"><FaCalendarDay /> <strong>Criado em:</strong> {new Date(anamnese.criadoEm).toLocaleString("pt-BR")}</p>
                        </div>
                        {anamnese.arquivoURL && (
                          <div className="anexo-field">
                            <a href={anamnese.arquivoURL} target="_blank" rel="noopener noreferrer">
                              <FaFileImage /> Visualizar Anexo
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <p>Nenhuma anamnese registrada para este paciente.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Anamnese;