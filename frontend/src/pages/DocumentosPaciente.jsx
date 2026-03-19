import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaPlus, FaTimes, FaFileImage, FaFile, FaUpload, FaSave, FaUsers, FaFolderOpen
} from "react-icons/fa";
import Sidebar from "../components/Sidebar";
import "./DocumentosPaciente.css";

const DocumentosPaciente = () => {
  const { currentUserData, user, loading } = useAuth();
  const nomeUsuario = currentUserData?.nome || "";
  const nomeClinica = currentUserData?.nomeClinica || "";
  const role = currentUserData?.role || "";
  const clinicaId = currentUserData?.clinicaId || "";

  const [pacientes, setPacientes] = useState([]);
  const [selectedPaciente, setSelectedPaciente] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [form, setForm] = useState({ nomeDocumento: "", arquivo: null });
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

  const fetchDocumentos = async (pacienteId) => {
    try {
      const pacienteRef = doc(db, "pacientes", pacienteId);
      const pacienteSnap = await getDoc(pacienteRef);
      if (pacienteSnap.exists()) {
        const data = pacienteSnap.data();
        setDocumentos(data.documentos || []);
      } else {
        setDocumentos([]);
      }
    } catch (error) {
      console.error("Erro ao buscar documentos:", error);
      setDocumentos([]);
    }
  };

  useEffect(() => {
    if (!loading && currentUserData) {
      fetchPacientes();
    }
  }, [loading, currentUserData]);

  const handleSelectPaciente = (paciente) => {
    setSelectedPaciente(paciente);
    fetchDocumentos(paciente.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const pacienteRef = doc(db, "pacientes", selectedPaciente.id);
      const pacienteSnap = await getDoc(pacienteRef);
      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const documentosAtuais = pacienteData.documentos || [];

        let arquivoURL = "";
        if (form.arquivo) {
          const arquivoRef = ref(storage, `documentos/${selectedPaciente.id}/${form.arquivo.name}-${Date.now()}`);
          const snapshot = await uploadBytes(arquivoRef, form.arquivo);
          arquivoURL = await getDownloadURL(snapshot.ref);
        }

        const novoDocumento = {
          nomeDocumento: form.nomeDocumento,
          arquivoURL: arquivoURL || null,
          criadoEm: new Date().toISOString(),
        };

        const updatedDocumentos = [...documentosAtuais, novoDocumento];

        await updateDoc(pacienteRef, {
          documentos: updatedDocumentos,
        });

        setDocumentos(updatedDocumentos);
        setForm({ nomeDocumento: "", arquivo: null });
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Erro ao adicionar documento:", error);
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

  const handleCancel = () => {
    setForm({ nomeDocumento: "", arquivo: null });
    setIsModalOpen(false);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  if (loading) {
    return <div className="loading-container">Carregando...</div>;
  }

  return (
    <div className="dashboard-container">
      <Sidebar />

      <main className="main-content">
        <div className="documentos-paciente-container">
          <div className="documentos-paciente-header">
            <h1><FaFolderOpen /> Documentos dos Pacientes</h1>
            <p>Gerencie e visualize os documentos dos pacientes da clínica.</p>
          </div>

          {/* Listagem de Pacientes */}
          <div className="pacientes-section">
            <h2><FaUsers /> Lista de Pacientes</h2>
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

          {/* Listagem de Documentos e Botão para Abrir o Modal */}
          {selectedPaciente && (
            <>
              <div className="documentos-section">
                <div className="form-toggle">
                  <button onClick={openModal} className="toggle-form-btn">
                    <FaPlus /> Adicionar Novo Documento
                  </button>
                </div>

                {/* Modal Customizado */}
                {isModalOpen && (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <button className="modal-close-btn" onClick={handleCancel}>
                        <FaTimes />
                      </button>
                      <h2><FaPlus /> Adicionar Novo Documento para {selectedPaciente.nome}</h2>
                      <form className="form-documento" onSubmit={handleSubmit}>
                        <div className="form-field">
                          <label><FaFile /> Nome do Documento:</label>
                          <input
                            type="text"
                            name="nomeDocumento"
                            value={form.nomeDocumento}
                            onChange={handleChange}
                            placeholder="Ex.: Laudo Médico, Relatório Escolar..."
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaUpload /> Anexar Arquivo:</label>
                          <div className="file-upload">
                            <input
                              type="file"
                              id="file-upload"
                              onChange={handleFileChange}
                              accept="image/*,.pdf,.doc,.docx"
                              required
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
                            <FaSave /> Adicionar Documento
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

              {/* Listagem de Documentos do Paciente Selecionado */}
              <div className="documentos-list-section">
                <h2><FaFolderOpen /> Documentos de {selectedPaciente.nome}</h2>
                {documentos.length > 0 ? (
                  <div className="documentos-list">
                    {documentos
                      .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
                      .map((doc, index) => (
                        <div key={index} className="documento-card">
                          <p><strong>Nome:</strong> {doc.nomeDocumento}</p>
                          <p><strong>Criado em:</strong> {new Date(doc.criadoEm).toLocaleString("pt-BR")}</p>
                          {doc.arquivoURL && (
                            <p>
                              <strong>Arquivo:</strong>{" "}
                              <a href={doc.arquivoURL} target="_blank" rel="noopener noreferrer">
                                Visualizar
                              </a>
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p>Nenhum documento registrado para este paciente.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DocumentosPaciente;