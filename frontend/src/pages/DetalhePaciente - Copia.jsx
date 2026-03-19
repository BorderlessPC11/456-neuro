import React, { useEffect, useState } from "react";
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";
import { useParams, useNavigate, Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaUser,
  FaNotesMedical,
  FaChartLine,
  FaHandsHelping,
  FaFileAlt,
  FaSave,
  FaArrowLeft,
  FaClinicMedical,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronUp,
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaComments,
  FaChartBar,
  FaCog,
  FaListAlt,
  FaFileMedical,
  FaFolderOpen,
  FaCalendarCheck,
  FaUserClock,
  FaPlusCircle,
  FaEnvelope,
  FaFileInvoice,
  FaTools,
  FaSchool,
  FaEnvelopeOpenText,
  FaUserShield,
  FaCalendar,
  FaTransgender,
  FaExclamationTriangle,
  FaPlus,
  FaTimes,
  FaTrash,
  FaCalendarDay,
  FaStickyNote,
  FaUpload,
  FaFileImage,
  FaFile,
  FaComment,
  FaEdit,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import "./DetalhePaciente.css";

const DetalhePaciente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [editData, setEditData] = useState({
    anamnese: [],
    evolucao: [],
    testes: [],
    documentos: [],
    planejamentoTerapias: [],
  });
  const [isEditing, setIsEditing] = useState({
    anamnese: false,
    evolucao: false,
    testes: false,
    documentos: false,
    terapias: false,
  });
  const [newEvolucao, setNewEvolucao] = useState({
    data: new Date(),
    descricao: "",
    arquivo: null,
  });
  const [newAnamnese, setNewAnamnese] = useState({
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
  const [newTeste, setNewTeste] = useState({
    nomeTeste: "",
    data: new Date(),
    descricao: "",
    resultados: "",
    arquivo: null,
  });
  const [newDocumento, setNewDocumento] = useState({
    nomeDocumento: "",
    arquivo: null,
  });
  const [newPlanejamento, setNewPlanejamento] = useState({
    terapiaId: "",
    frequencia: "",
    planejamento: "",
    projetoTratamento: "",
  });
  const [editPlanejamentoIndex, setEditPlanejamentoIndex] = useState(null);
  const [editTesteIndex, setEditTesteIndex] = useState(null);
  const [terapiasDisponiveis, setTerapiasDisponiveis] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [selectedAnamneseIndex, setSelectedAnamneseIndex] = useState(null);
  const [activeSection, setActiveSection] = useState("ficha");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [nomeClinica, setNomeClinica] = useState("");
  const [role, setRole] = useState("");
  const [openSection, setOpenSection] = useState(null);

  const clinicaId = localStorage.getItem("clinicaId");

  const fetchUserData = async () => {
    const nome = localStorage.getItem("nomeUsuario");
    if (nome) setNomeUsuario(nome);

    const uid = localStorage.getItem("uid");

    if (uid) {
      const userRef = doc(db, "usuarios", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setRole(data.role || "");
      }
    }

    if (clinicaId) {
      const clinicaRef = doc(db, "clinicas", clinicaId);
      const clinicaSnap = await getDoc(clinicaRef);
      if (clinicaSnap.exists()) {
        setNomeClinica(clinicaSnap.data().nome);
      }
    }
  };

  const fetchTerapiasDisponiveis = async () => {
    try {
      const terapiasRef = collection(db, "terapias");
      const snap = await getDocs(terapiasRef);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTerapiasDisponiveis(data);
    } catch (error) {
      console.error("Erro ao buscar terapias disponíveis:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchTerapiasDisponiveis();

    const fetchPaciente = async () => {
      try {
        const pacienteRef = doc(db, "pacientes", id);
        const pacienteSnap = await getDoc(pacienteRef);
        if (pacienteSnap.exists()) {
          const data = pacienteSnap.data();
          setPaciente({ id: pacienteSnap.id, ...data });
          setEditData({
            anamnese: data.anamnese || [],
            evolucao: data.evolucao || [],
            testes: data.testes || [],
            documentos: data.documentos || [],
            planejamentoTerapias: data.planejamentoTerapias || [],
          });
        } else {
          console.error("Paciente não encontrado");
          navigate("/pacientes");
        }
      } catch (error) {
        console.error("Erro ao buscar paciente:", error);
        navigate("/pacientes");
      }
    };
    fetchPaciente();
  }, [id, navigate, role]);

  const handleEditToggle = (section) => {
    setIsEditing((prev) => ({ ...prev, [section]: !prev[section] }));
    if (section === "evolucao" && !isEditing.evolucao) {
      setNewEvolucao({ data: new Date(), descricao: "", arquivo: null });
    }
    if (section === "anamnese" && !isEditing.anamnese) {
      setNewAnamnese({
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
    }
    if (section === "testes" && !isEditing.testes) {
      setNewTeste({
        nomeTeste: "",
        data: new Date(),
        descricao: "",
        resultados: "",
        arquivo: null,
      });
      setEditTesteIndex(null);
    }
    if (section === "documentos" && !isEditing.documentos) {
      setNewDocumento({ nomeDocumento: "", arquivo: null });
    }
    if (section === "terapias" && !isEditing.terapias) {
      setNewPlanejamento({
        terapiaId: "",
        frequencia: "",
        planejamento: "",
        projetoTratamento: "",
      });
    }
  };

  const handleChange = (e, section, index = null) => {
    const { name, value } = e.target;
    if (index !== null) {
      setEditData((prev) => {
        const updatedSection = [...prev[section]];
        updatedSection[index] = { ...updatedSection[index], [name]: value };
        return { ...prev, [section]: updatedSection };
      });
    } else {
      setEditData((prev) => ({ ...prev, [section]: value }));
    }
  };

  const handleNewEvolucaoChange = (e) => {
    const { name, value } = e.target;
    setNewEvolucao((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewEvolucaoFileChange = (e) => {
    if (e.target.files[0]) {
      setNewEvolucao((prev) => ({ ...prev, arquivo: e.target.files[0] }));
    }
  };

  const handleNewEvolucaoDateChange = (date) => {
    setNewEvolucao((prev) => ({ ...prev, data: date }));
  };

  const handleAddNewEvolucao = async (e) => {
    e.preventDefault();
    try {
      const pacienteRef = doc(db, "pacientes", id);
      const pacienteSnap = await getDoc(pacienteRef);

      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const evolucaoAtual = pacienteData.evolucao || [];

        let arquivoURL = "";
        if (newEvolucao.arquivo) {
          const arquivoRef = ref(storage, `evolucoes/${id}/${newEvolucao.arquivo.name}-${Date.now()}`);
          const snapshot = await uploadBytes(arquivoRef, newEvolucao.arquivo);
          arquivoURL = await getDownloadURL(snapshot.ref);
        }

        const novaEvolucao = {
          data: newEvolucao.data.toISOString().split('T')[0],
          descricao: newEvolucao.descricao,
          criadoEm: new Date().toISOString(),
          arquivoURL: arquivoURL || null,
        };

        const updatedEvolucao = [...evolucaoAtual, novaEvolucao];

        await updateDoc(pacienteRef, {
          evolucao: updatedEvolucao,
        });

        setEditData((prev) => ({ ...prev, evolucao: updatedEvolucao }));
        setNewEvolucao({ data: new Date(), descricao: "", arquivo: null });
        setIsEditing((prev) => ({ ...prev, evolucao: false }));
      } else {
        console.error("Paciente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao adicionar evolução:", error);
    }
  };

  const handleNewAnamneseChange = (e) => {
    const { name, value } = e.target;
    setNewAnamnese((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewAnamneseFileChange = (e) => {
    if (e.target.files[0]) {
      setNewAnamnese((prev) => ({ ...prev, arquivo: e.target.files[0] }));
    }
  };

  const handleNewAnamneseDateChange = (date) => {
    setNewAnamnese((prev) => ({ ...prev, data: date }));
  };

  const handleAddNewAnamnese = async (e) => {
    e.preventDefault();
    try {
      const pacienteRef = doc(db, "pacientes", id);
      const pacienteSnap = await getDoc(pacienteRef);

      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const anamneseAtual = pacienteData.anamnese || [];

        let arquivoURL = "";
        if (newAnamnese.arquivo) {
          const arquivoRef = ref(storage, `anamneses/${id}/${newAnamnese.arquivo.name}-${Date.now()}`);
          const snapshot = await uploadBytes(arquivoRef, newAnamnese.arquivo);
          arquivoURL = await getDownloadURL(snapshot.ref);
        }

        const novaAnamnese = {
          data: newAnamnese.data.toISOString().split('T')[0],
          historicoGestacional: newAnamnese.historicoGestacional,
          desenvolvimentoMotor: newAnamnese.desenvolvimentoMotor,
          desenvolvimentoLinguagem: newAnamnese.desenvolvimentoLinguagem,
          comportamentoSocial: newAnamnese.comportamentoSocial,
          historicoMedico: newAnamnese.historicoMedico,
          historicoFamiliar: newAnamnese.historicoFamiliar,
          escolaridade: newAnamnese.escolaridade,
          observacoes: newAnamnese.observacoes,
          criadoEm: new Date().toISOString(),
          arquivoURL: arquivoURL || null,
          comentarios: [],
        };

        const updatedAnamnese = [...anamneseAtual, novaAnamnese];

        await updateDoc(pacienteRef, {
          anamnese: updatedAnamnese,
        });

        setEditData((prev) => ({ ...prev, anamnese: updatedAnamnese }));
        setNewAnamnese({
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
        setIsEditing((prev) => ({ ...prev, anamnese: false }));
      } else {
        console.error("Paciente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao adicionar anamnese:", error);
    }
  };

  const handleNewTesteChange = (e) => {
    const { name, value } = e.target;
    setNewTeste((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewTesteFileChange = (e) => {
    if (e.target.files[0]) {
      setNewTeste((prev) => ({ ...prev, arquivo: e.target.files[0] }));
    }
  };

  const handleNewTesteDateChange = (date) => {
    setNewTeste((prev) => ({ ...prev, data: date }));
  };

  const handleAddNewTeste = async (e) => {
    e.preventDefault();
    try {
      const pacienteRef = doc(db, "pacientes", id);
      const pacienteSnap = await getDoc(pacienteRef);

      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const testesAtuais = pacienteData.testes || [];

        let arquivoURL = "";
        if (newTeste.arquivo) {
          const arquivoRef = ref(storage, `testes/${id}/${newTeste.arquivo.name}-${Date.now()}`);
          const snapshot = await uploadBytes(arquivoRef, newTeste.arquivo);
          arquivoURL = await getDownloadURL(snapshot.ref);
        }

        const novoTeste = {
          nomeTeste: newTeste.nomeTeste,
          data: newTeste.data.toISOString().split('T')[0],
          descricao: newTeste.descricao,
          resultados: newTeste.resultados,
          arquivoURL: arquivoURL || null,
          criadoEm: new Date().toISOString(),
        };

        let updatedTestes;
        if (editTesteIndex !== null) {
          updatedTestes = [...testesAtuais];
          updatedTestes[editTesteIndex] = novoTeste;
        } else {
          updatedTestes = [...testesAtuais, novoTeste];
        }

        await updateDoc(pacienteRef, {
          testes: updatedTestes,
        });

        setEditData((prev) => ({ ...prev, testes: updatedTestes }));
        setNewTeste({
          nomeTeste: "",
          data: new Date(),
          descricao: "",
          resultados: "",
          arquivo: null,
        });
        setEditTesteIndex(null);
        setIsEditing((prev) => ({ ...prev, testes: false }));
      } else {
        console.error("Paciente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao adicionar teste:", error);
    }
  };

  const handleEditTeste = (index) => {
    const teste = editData.testes[index];
    setNewTeste({
      nomeTeste: teste.nomeTeste,
      data: new Date(teste.data),
      descricao: teste.descricao,
      resultados: teste.resultados,
      arquivo: null,
    });
    setEditTesteIndex(index);
    setIsEditing((prev) => ({ ...prev, testes: true }));
  };

  const handleDeleteTeste = async (index) => {
    try {
      const pacienteRef = doc(db, "pacientes", id);
      const pacienteSnap = await getDoc(pacienteRef);

      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const testesAtuais = pacienteData.testes || [];

        const updatedTestes = testesAtuais.filter((_, i) => i !== index);

        await updateDoc(pacienteRef, {
          testes: updatedTestes,
        });

        setEditData((prev) => ({ ...prev, testes: updatedTestes }));
      } else {
        console.error("Paciente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao excluir teste:", error);
    }
  };

  const handleCancelTeste = () => {
    setNewTeste({
      nomeTeste: "",
      data: new Date(),
      descricao: "",
      resultados: "",
      arquivo: null,
    });
    setEditTesteIndex(null);
    setIsEditing((prev) => ({ ...prev, testes: false }));
  };

  const handleNewDocumentoChange = (e) => {
    const { name, value } = e.target;
    setNewDocumento((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewDocumentoFileChange = (e) => {
    if (e.target.files[0]) {
      setNewDocumento((prev) => ({ ...prev, arquivo: e.target.files[0] }));
    }
  };

  const handleAddNewDocumento = async (e) => {
    e.preventDefault();
    try {
      const pacienteRef = doc(db, "pacientes", id);
      const pacienteSnap = await getDoc(pacienteRef);

      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const documentosAtuais = pacienteData.documentos || [];

        let arquivoURL = "";
        if (newDocumento.arquivo) {
          const arquivoRef = ref(storage, `documentos/${id}/${newDocumento.arquivo.name}-${Date.now()}`);
          const snapshot = await uploadBytes(arquivoRef, newDocumento.arquivo);
          arquivoURL = await getDownloadURL(snapshot.ref);
        }

        const novoDocumento = {
          nomeDocumento: newDocumento.nomeDocumento,
          arquivoURL: arquivoURL || null,
          criadoEm: new Date().toISOString(),
        };

        const updatedDocumentos = [...documentosAtuais, novoDocumento];

        await updateDoc(pacienteRef, {
          documentos: updatedDocumentos,
        });

        setEditData((prev) => ({ ...prev, documentos: updatedDocumentos }));
        setNewDocumento({ nomeDocumento: "", arquivo: null });
        setIsEditing((prev) => ({ ...prev, documentos: false }));
      } else {
        console.error("Paciente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao adicionar documento:", error);
    }
  };

  const handleNewPlanejamentoChange = (e) => {
    const { name, value } = e.target;
    setNewPlanejamento((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNewPlanejamento = async (e) => {
    e.preventDefault();
    try {
      const pacienteRef = doc(db, "pacientes", id);
      const pacienteSnap = await getDoc(pacienteRef);

      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const planosAtuais = pacienteData.planejamentoTerapias || [];

        const terapiaSelecionada = terapiasDisponiveis.find(
          (terapia) => terapia.id === newPlanejamento.terapiaId
        );

        const novoPlano = {
          terapiaId: newPlanejamento.terapiaId,
          nomeTerapia: terapiaSelecionada?.nome || "Desconhecida",
          frequencia: newPlanejamento.frequencia,
          planejamento: newPlanejamento.planejamento,
          projetoTratamento: newPlanejamento.projetoTratamento,
          criadoEm: new Date().toISOString(),
        };

        let updatedPlanos;
        if (editPlanejamentoIndex !== null) {
          updatedPlanos = [...planosAtuais];
          updatedPlanos[editPlanejamentoIndex] = novoPlano;
        } else {
          updatedPlanos = [...planosAtuais, novoPlano];
        }

        await updateDoc(pacienteRef, {
          planejamentoTerapias: updatedPlanos,
        });

        setEditData((prev) => ({ ...prev, planejamentoTerapias: updatedPlanos }));
        setNewPlanejamento({
          terapiaId: "",
          frequencia: "",
          planejamento: "",
          projetoTratamento: "",
        });
        setEditPlanejamentoIndex(null);
        setIsEditing((prev) => ({ ...prev, terapias: false }));
      } else {
        console.error("Paciente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao adicionar planejamento de terapia:", error);
    }
  };

  const handleEditPlanejamento = (index) => {
    const plano = editData.planejamentoTerapias[index];
    setNewPlanejamento({
      terapiaId: plano.terapiaId,
      frequencia: plano.frequencia,
      planejamento: plano.planejamento,
      projetoTratamento: plano.projetoTratamento,
    });
    setEditPlanejamentoIndex(index);
    setIsEditing((prev) => ({ ...prev, terapias: true }));
  };

  const handleDeletePlanejamento = async (index) => {
    try {
      const pacienteRef = doc(db, "pacientes", id);
      const pacienteSnap = await getDoc(pacienteRef);

      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const planosAtuais = pacienteData.planejamentoTerapias || [];

        const updatedPlanos = planosAtuais.filter((_, i) => i !== index);

        await updateDoc(pacienteRef, {
          planejamentoTerapias: updatedPlanos,
        });

        setEditData((prev) => ({ ...prev, planejamentoTerapias: updatedPlanos }));
      } else {
        console.error("Paciente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao excluir planejamento de terapia:", error);
    }
  };

  const handleCancelPlanejamento = () => {
    setNewPlanejamento({
      terapiaId: "",
      frequencia: "",
      planejamento: "",
      projetoTratamento: "",
    });
    setEditPlanejamentoIndex(null);
    setIsEditing((prev) => ({ ...prev, terapias: false }));
  };

  const handleDeleteDocumento = async (indexToDelete) => {
    try {
      const pacienteRef = doc(db, "pacientes", id);
      const pacienteSnap = await getDoc(pacienteRef);

      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const documentosAtuais = pacienteData.documentos || [];

        const updatedDocumentos = documentosAtuais.filter((_, index) => index !== indexToDelete);

        await updateDoc(pacienteRef, {
          documentos: updatedDocumentos,
        });

        setEditData((prev) => ({ ...prev, documentos: updatedDocumentos }));
      } else {
        console.error("Paciente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
    }
  };

  const handleCancelDocumento = () => {
    setNewDocumento({ nomeDocumento: "", arquivo: null });
    setIsEditing((prev) => ({ ...prev, documentos: false }));
  };

  const handleAddComment = async (anamneseIndex) => {
    try {
      const pacienteRef = doc(db, "pacientes", id);
      const pacienteSnap = await getDoc(pacienteRef);

      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const anamneseAtual = pacienteData.anamnese || [];

        const novaListaComentarios = anamneseAtual[anamneseIndex].comentarios
          ? [...anamneseAtual[anamneseIndex].comentarios]
          : [];
        novaListaComentarios.push({
          texto: newComment,
          criadoEm: new Date().toISOString(),
        });

        anamneseAtual[anamneseIndex] = {
          ...anamneseAtual[anamneseIndex],
          comentarios: novaListaComentarios,
        };

        await updateDoc(pacienteRef, {
          anamnese: anamneseAtual,
        });

        setEditData((prev) => ({ ...prev, anamnese: anamneseAtual }));
        setNewComment("");
        setCommentModalOpen(false);
        setSelectedAnamneseIndex(null);
      } else {
        console.error("Paciente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
    }
  };

  const handleOpenCommentModal = (index) => {
    setSelectedAnamneseIndex(index);
    setNewComment("");
    setCommentModalOpen(true);
  };

  const handleDeleteEvolucao = async (indexToDelete) => {
    try {
      const pacienteRef = doc(db, "pacientes", id);
      const pacienteSnap = await getDoc(pacienteRef);

      if (pacienteSnap.exists()) {
        const pacienteData = pacienteSnap.data();
        const evolucaoAtual = pacienteData.evolucao || [];

        const updatedEvolucao = evolucaoAtual.filter((_, index) => index !== indexToDelete);

        await updateDoc(pacienteRef, {
          evolucao: updatedEvolucao,
        });

        setEditData((prev) => ({ ...prev, evolucao: updatedEvolucao }));
      } else {
        console.error("Paciente não encontrado");
      }
    } catch (error) {
      console.error("Erro ao excluir evolução:", error);
    }
  };

  const handleCancelEvolucao = () => {
    setNewEvolucao({ data: new Date(), descricao: "", arquivo: null });
    setIsEditing((prev) => ({ ...prev, evolucao: false }));
  };

  const handleCancelAnamnese = () => {
    setNewAnamnese({
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
    setIsEditing((prev) => ({ ...prev, anamnese: false }));
  };

  const handleAddEntry = (section) => {
    setEditData((prev) => ({
      ...prev,
      [section]: [...prev[section], section === "evolucao" ? { data: "", descricao: "" } : { data: "", detalhes: "" }],
    }));
  };

  const handleSave = async (section) => {
    try {
      const pacienteRef = doc(db, "pacientes", id);
      await updateDoc(pacienteRef, { [section]: editData[section] });
      setPaciente((prev) => ({ ...prev, [section]: editData[section] }));
      handleEditToggle(section);
    } catch (error) {
      console.error(`Erro ao salvar ${section}:`, error);
    }
  };

  const handleBack = () => {
    navigate("/pacientes");
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.clear();
    navigate("/");
  };

  const toggleSection = (index) => {
    setOpenSection(openSection === index ? null : index);
  };

  const menuSections = [
    {
      title: "Dashboard",
      icon: <FaHome />,
      items: [{ label: "Início", path: "/dashboard", icon: <FaHome /> }],
    },
    {
      title: "Pacientes",
      icon: <FaUsers />,
      items: [
        { label: "Lista de Pacientes", path: "/pacientes", icon: <FaListAlt /> },
        { label: "Evolução Diária", path: "/evolucao", icon: <FaFileMedical /> },
        { label: "Anamnese", path: "/anamnese", icon: <FaFileAlt /> },
        { label: "Documentos", path: "/documentos-paciente", icon: <FaFolderOpen /> },
      ],
    },
    {
      title: "Terapias",
      icon: <FaFileAlt />,
      items: [
        { label: "Planejamento", path: "/planejamento", icon: <FaCalendarAlt /> },
        { label: "Registro de Terapias", path: "/terapias", icon: <FaFileAlt /> },
        { label: "Testes", path: "/testes", icon: <FaFileMedical /> },
      ],
    },
    {
      title: "Agenda",
      icon: <FaCalendarAlt />,
      items: [
        { label: "Agenda Geral", path: "/agenda-geral", icon: <FaCalendarCheck /> },
        { label: "Agenda por Profissional", path: "/agenda-profissional", icon: <FaUserClock /> },
        { label: "Adicionar Agendamento", path: "/adicionar-agendamento", icon: <FaPlusCircle /> },
      ],
    },
    {
      title: "Comunicação",
      icon: <FaComments />,
      items: [
        { label: "Notificações", path: "/notificacoes", icon: <FaEnvelope /> },
        { label: "Comunicação", path: "/comunicacao", icon: <FaComments /> },
      ],
    },
    {
      title: "Relatórios",
      icon: <FaChartBar />,
      items: [
        { label: "Gerar Relatório", path: "/gerar-relatorio", icon: <FaChartBar /> },
        { label: "Testes", path: "/testes", icon: <FaFileMedical /> },
        { label: "Recursos", path: "/recursos", icon: <FaFileInvoice /> },
      ],
    },
    ...(role === "admin"
      ? [
          {
            title: "Administração",
            icon: <FaCog />,
            items: [
              { label: "Profissionais", path: "/profissionais", icon: <FaUsers /> },
              { label: "Configurações", path: "/administracao", icon: <FaTools /> },
            ],
          },
        ]
      : []),
  ];

  if (!paciente) return <div>Carregando...</div>;

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="logo-container">
          <img src={logo} alt="Logo Neuroverse" className="logo" />
        </div>
        <div className="user-clinica-box">
          <div className="info-titulo">Bem-vindo(a)</div>
          <div className="info-nome">
            <FaUser className="icon" />
            <span>{nomeUsuario}</span>
          </div>
          <div className="info-clinica">
            <FaClinicMedical className="icon" />
            <span>{nomeClinica}</span>
          </div>
        </div>
        <nav className="menu">
          {menuSections.map((section, index) => (
            <div className="menu-section" key={index}>
              <div
                className={`section-header ${openSection === index ? "active" : ""}`}
                onClick={() => toggleSection(index)}
              >
                <span className="section-title">
                  {section.icon}
                  {section.title}
                </span>
                <span className="arrow">
                  {openSection === index ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              </div>
              {openSection === index && (
                <ul className="section-items">
                  {section.items.map((item, idx) => (
                    <li
                      key={idx}
                      className="menu-item"
                      onClick={() => navigate(item.path)}
                    >
                      {item.icon}
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
        <div className="logout-box" onClick={handleLogout}>
          <FaSignOutAlt className="logout-icon" />
          <span>Sair</span>
        </div>
      </aside>

      <main className="main-content">
        <div className="detalhe-paciente-container">
          <div className="detalhe-paciente-header">
            <button className="back-btn" onClick={handleBack}>
              <FaArrowLeft /> Voltar
            </button>
            <h1>Detalhes do Paciente: {paciente.nome}</h1>
          </div>

          <div className="detalhe-paciente-submenu">
            <button
              className={`submenu-btn ${activeSection === "ficha" ? "active" : ""}`}
              onClick={() => setActiveSection("ficha")}
            >
              <FaUser /> Ficha Completa
            </button>
            <button
              className={`submenu-btn ${activeSection === "anamnese" ? "active" : ""}`}
              onClick={() => setActiveSection("anamnese")}
            >
              <FaNotesMedical /> Anamnese
            </button>
            <button
              className={`submenu-btn ${activeSection === "evolucao" ? "active" : ""}`}
              onClick={() => setActiveSection("evolucao")}
            >
              <FaChartLine /> Evolução
            </button>
            <button
              className={`submenu-btn ${activeSection === "terapias" ? "active" : ""}`}
              onClick={() => setActiveSection("terapias")}
            >
              <FaHandsHelping /> Terapias
            </button>
            <button
              className={`submenu-btn ${activeSection === "testes" ? "active" : ""}`}
              onClick={() => setActiveSection("testes")}
            >
              <FaFileAlt /> Testes
            </button>
            <button
              className={`submenu-btn ${activeSection === "documentos" ? "active" : ""}`}
              onClick={() => setActiveSection("documentos")}
            >
              <FaFolderOpen /> Documentos
            </button>
          </div>

          <div className="detalhe-paciente-sections">
            {/* Ficha Completa */}
            {activeSection === "ficha" && (
              <div className="detalhe-section">
                <h2><FaUser /> Ficha Completa</h2>
                <div className="detalhe-info-grid">
                  <div className="detalhe-info-item">
                    <FaUser className="info-icon" />
                    <div>
                      <strong>Nome:</strong> {paciente.nome || "Não informado"}
                    </div>
                  </div>
                  <div className="detalhe-info-item">
                    <FaChartLine className="info-icon" />
                    <div>
                      <strong>Idade:</strong> {paciente.idade || "Não informado"}
                    </div>
                  </div>
                  <div className="detalhe-info-item">
                    <FaTransgender className="info-icon" />
                    <div>
                      <strong>Sexo:</strong> {paciente.sexo || "Não informado"}
                    </div>
                  </div>
                  <div className="detalhe-info-item">
                    <FaExclamationTriangle className="info-icon" />
                    <div>
                      <strong>CID:</strong> {paciente.cid || "Não informado"}
                    </div>
                  </div>
                  <div className="detalhe-info-item">
                    <FaNotesMedical className="info-icon" />
                    <div>
                      <strong>Queixa:</strong> {paciente.queixa || "Não informado"}
                    </div>
                  </div>
                  <div className="detalhe-info-item">
                    <FaNotesMedical className="info-icon" />
                    <div>
                      <strong>Observações:</strong> {paciente.observacao || "Não informado"}
                    </div>
                  </div>
                  <div className="detalhe-info-item">
                    <FaSchool className="info-icon" />
                    <div>
                      <strong>Escola:</strong> {paciente.escola || "Não informado"}
                    </div>
                  </div>
                  <div className="detalhe-info-item">
                    <FaEnvelopeOpenText className="info-icon" />
                    <div>
                      <strong>Email:</strong> {paciente.email || "Não informado"}
                    </div>
                  </div>
                  <div className="detalhe-info-item">
                    <FaUserShield className="info-icon" />
                    <div>
                      <strong>Responsável:</strong> {paciente.responsavel || "Não informado"}
                    </div>
                  </div>
                  <div className="detalhe-info-item">
                    <FaUserShield className="info-icon" />
                    <div>
                      <strong>Documento do Responsável:</strong> {paciente.docResponsavel || "Não informado"}
                    </div>
                  </div>
                  <div className="detalhe-info-item">
                    <FaCalendar className="info-icon" />
                    <div>
                      <strong>Data de Cadastro:</strong> {paciente.criadoEm?.toDate().toLocaleDateString("pt-BR") || "Não informado"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Anamnese */}
            {activeSection === "anamnese" && (
              <div className="detalhe-section">
                <h2><FaNotesMedical /> Anamnese</h2>
                {isEditing.anamnese ? (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <button className="modal-close-btn" onClick={handleCancelAnamnese}>
                        <FaTimes />
                      </button>
                      <h2>Adicionar Nova Anamnese para {paciente.nome}</h2>
                      <form className="form-anamnese" onSubmit={handleAddNewAnamnese}>
                        <div className="form-field">
                          <label><FaCalendarDay /> Data:</label>
                          <DatePicker
                            selected={newAnamnese.data}
                            onChange={handleNewAnamneseDateChange}
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
                            value={newAnamnese.historicoGestacional}
                            onChange={handleNewAnamneseChange}
                            placeholder="Ex.: Complicações na gravidez, uso de medicamentos, prematuridade..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Desenvolvimento Motor:</label>
                          <textarea
                            name="desenvolvimentoMotor"
                            value={newAnamnese.desenvolvimentoMotor}
                            onChange={handleNewAnamneseChange}
                            placeholder="Ex.: Quando engatinhou, andou, dificuldades motoras..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Desenvolvimento da Linguagem:</label>
                          <textarea
                            name="desenvolvimentoLinguagem"
                            value={newAnamnese.desenvolvimentoLinguagem}
                            onChange={handleNewAnamneseChange}
                            placeholder="Ex.: Primeiras palavras, atrasos na fala, dificuldades de comunicação..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Comportamento Social:</label>
                          <textarea
                            name="comportamentoSocial"
                            value={newAnamnese.comportamentoSocial}
                            onChange={handleNewAnamneseChange}
                            placeholder="Ex.: Interação com outras crianças, comportamentos repetitivos, sensibilidade sensorial..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Histórico Médico:</label>
                          <textarea
                            name="historicoMedico"
                            value={newAnamnese.historicoMedico}
                            onChange={handleNewAnamneseChange}
                            placeholder="Ex.: Diagnósticos prévios, medicações, internações..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Histórico Familiar:</label>
                          <textarea
                            name="historicoFamiliar"
                            value={newAnamnese.historicoFamiliar}
                            onChange={handleNewAnamneseChange}
                            placeholder="Ex.: Condições neurodivergentes na família, histórico de doenças genéticas..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Escolaridade:</label>
                          <textarea
                            name="escolaridade"
                            value={newAnamnese.escolaridade}
                            onChange={handleNewAnamneseChange}
                            placeholder="Ex.: Dificuldades de aprendizado, adaptações na escola, comportamento em sala..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaNotesMedical /> Observações Gerais:</label>
                          <textarea
                            name="observacoes"
                            value={newAnamnese.observacoes}
                            onChange={handleNewAnamneseChange}
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
                              onChange={handleNewAnamneseFileChange}
                              accept="image/*,.pdf"
                            />
                            <label htmlFor="file-upload" className="file-upload-label">
                              {newAnamnese.arquivo ? (
                                <>
                                  {newAnamnese.arquivo.type.startsWith("image/") ? <FaFileImage /> : <FaFile />}
                                  {newAnamnese.arquivo.name}
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
                          <button type="button" className="cancel-btn" onClick={handleCancelAnamnese}>
                            <FaTimes /> Desistir
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="view-section">
                    {editData.anamnese.length > 0 ? (
                      editData.anamnese
                        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
                        .map((entry, index) => (
                          <div key={index} className="entry-view">
                            <div className="entry-content">
                              <div className="entry-item">
                                <FaCalendarDay className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Data:</strong> {entry.data}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaNotesMedical className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Histórico Gestacional:</strong> {entry.historicoGestacional}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaNotesMedical className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Desenvolvimento Motor:</strong> {entry.desenvolvimentoMotor}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaNotesMedical className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Desenvolvimento da Linguagem:</strong> {entry.desenvolvimentoLinguagem}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaNotesMedical className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Comportamento Social:</strong> {entry.comportamentoSocial}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaNotesMedical className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Histórico Médico:</strong> {entry.historicoMedico}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaNotesMedical className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Histórico Familiar:</strong> {entry.historicoFamiliar}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaNotesMedical className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Escolaridade:</strong> {entry.escolaridade}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaNotesMedical className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Observações:</strong> {entry.observacoes || "Nenhuma observação"}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaCalendarCheck className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Criado em:</strong> {new Date(entry.criadoEm).toLocaleString("pt-BR")}
                                </div>
                              </div>
                              {entry.arquivoURL && (
                                <div className="entry-item">
                                  <FaFile className="entry-icon" />
                                  <div className="entry-text">
                                    <strong>Anexo:</strong>{" "}
                                    <a href={entry.arquivoURL} target="_blank" rel="noopener noreferrer">
                                      Visualizar
                                    </a>
                                  </div>
                                </div>
                              )}
                              {entry.comentarios && entry.comentarios.length > 0 && (
                                <div className="comments-section">
                                  <p><strong>Comentários:</strong></p>
                                  {entry.comentarios.map((comment, commentIndex) => (
                                    <div key={commentIndex} className="comment">
                                      <p>{comment.texto}</p>
                                      <p className="comment-date">
                                        Adicionado em: {new Date(comment.criadoEm).toLocaleString("pt-BR")}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              className="comment-btn"
                              onClick={() => handleOpenCommentModal(index)}
                              title="Adicionar comentário"
                            >
                              <FaComment /> Adicionar Comentário
                            </button>
                          </div>
                        ))
                    ) : (
                      <p>Nenhuma anamnese registrada.</p>
                    )}
                    <button className="edit-btn" onClick={() => handleEditToggle("anamnese")}>
                      <FaPlus /> Adicionar Nova Anamnese
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Modal para Adicionar Comentário */}
            {commentModalOpen && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <button className="modal-close-btn" onClick={() => setCommentModalOpen(false)}>
                    <FaTimes />
                  </button>
                  <h2>Adicionar Comentário à Anamnese</h2>
                  <form onSubmit={(e) => { e.preventDefault(); handleAddComment(selectedAnamneseIndex); }}>
                    <div className="form-field">
                      <label><FaComment /> Comentário:</label>
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Digite seu comentário aqui..."
                        rows="3"
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="save-btn">
                        <FaSave /> Salvar Comentário
                      </button>
                      <button type="button" className="cancel-btn" onClick={() => setCommentModalOpen(false)}>
                        <FaTimes /> Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Evolução */}
            {activeSection === "evolucao" && (
              <div className="detalhe-section">
                <h2><FaChartLine /> Evolução</h2>
                {isEditing.evolucao ? (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <button className="modal-close-btn" onClick={handleCancelEvolucao}>
                        <FaTimes />
                      </button>
                      <h2>Adicionar Nova Evolução para {paciente.nome}</h2>
                      <form className="form-evolucao" onSubmit={handleAddNewEvolucao}>
                        <div className="form-field">
                          <label><FaCalendarDay /> Data:</label>
                          <DatePicker
                            selected={newEvolucao.data}
                            onChange={handleNewEvolucaoDateChange}
                            dateFormat="dd/MM/yyyy"
                            className="custom-datepicker"
                            placeholderText="Selecione a data"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaStickyNote /> Descrição:</label>
                          <textarea
                            name="descricao"
                            value={newEvolucao.descricao}
                            onChange={handleNewEvolucaoChange}
                            placeholder="Descrição da evolução..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaUpload /> Anexar Arquivo (opcional):</label>
                          <div className="file-upload">
                            <input
                              type="file"
                              id="file-upload"
                              onChange={handleNewEvolucaoFileChange}
                              accept="image/*,.pdf"
                            />
                            <label htmlFor="file-upload" className="file-upload-label">
                              {newEvolucao.arquivo ? (
                                <>
                                  {newEvolucao.arquivo.type.startsWith("image/") ? <FaFileImage /> : <FaFile />}
                                  {newEvolucao.arquivo.name}
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
                            <FaSave /> Adicionar Evolução
                          </button>
                          <button type="button" className="cancel-btn" onClick={handleCancelEvolucao}>
                            <FaTimes /> Desistir
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="view-section">
                    {editData.evolucao.length > 0 ? (
                      editData.evolucao
                        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
                        .map((entry, index) => (
                          <div key={index} className="entry-view">
                            <div className="entry-content">
                              <div className="entry-item">
                                <FaCalendarDay className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Data:</strong> {entry.data}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaStickyNote className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Descrição:</strong> {entry.descricao}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaCalendarCheck className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Criado em:</strong> {new Date(entry.criadoEm).toLocaleString("pt-BR")}
                                </div>
                              </div>
                              {entry.arquivoURL && (
                                <div className="entry-item">
                                  <FaFile className="entry-icon" />
                                  <div className="entry-text">
                                    <strong>Anexo:</strong>{" "}
                                    <a href={entry.arquivoURL} target="_blank" rel="noopener noreferrer">
                                      Visualizar
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteEvolucao(index)}
                              title="Excluir evolução"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))
                    ) : (
                      <p>Nenhuma evolução registrada.</p>
                    )}
                    <button className="edit-btn" onClick={() => handleEditToggle("evolucao")}>
                      <FaPlus /> Adicionar Nova Evolução
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Terapias */}
            {activeSection === "terapias" && (
              <div className="detalhe-section">
                <h2><FaHandsHelping /> Terapias</h2>
                {isEditing.terapias ? (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <button className="modal-close-btn" onClick={handleCancelPlanejamento}>
                        <FaTimes />
                      </button>
                      <h2>{editPlanejamentoIndex !== null ? "Editar Planejamento" : "Adicionar Novo Planejamento"}</h2>
                      <form className="form-anamnese" onSubmit={handleAddNewPlanejamento}>
                        <div className="form-field">
                          <label><FaHandsHelping /> Terapia:</label>
                          <select
                            name="terapiaId"
                            value={newPlanejamento.terapiaId}
                            onChange={handleNewPlanejamentoChange}
                            required
                          >
                            <option value="">Selecione uma terapia</option>
                            {terapiasDisponiveis.map((terapia) => (
                              <option key={terapia.id} value={terapia.id}>
                                {terapia.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-field">
                          <label><FaCalendarAlt /> Frequência:</label>
                          <input
                            type="text"
                            name="frequencia"
                            value={newPlanejamento.frequencia}
                            onChange={handleNewPlanejamentoChange}
                            placeholder="Ex.: Semanal, Diária..."
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaFileAlt /> Planejamento:</label>
                          <textarea
                            name="planejamento"
                            value={newPlanejamento.planejamento}
                            onChange={handleNewPlanejamentoChange}
                            placeholder="Detalhes específicos do planejamento..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaFileAlt /> Projeto de Tratamento:</label>
                          <textarea
                            name="projetoTratamento"
                            value={newPlanejamento.projetoTratamento}
                            onChange={handleNewPlanejamentoChange}
                            placeholder="Plano geral de tratamento para o paciente..."
                            rows="5"
                            required
                          />
                        </div>
                        <div className="form-actions">
                          <button type="submit" className="save-btn">
                            <FaSave /> {editPlanejamentoIndex !== null ? "Salvar Alterações" : "Adicionar Planejamento"}
                          </button>
                          <button type="button" className="cancel-btn" onClick={handleCancelPlanejamento}>
                            <FaTimes /> Desistir
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="view-section">
                    {editData.planejamentoTerapias.length > 0 ? (
                      editData.planejamentoTerapias
                        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
                        .map((plano, index) => (
                          <div key={index} className="entry-view">
                            <div className="entry-content">
                              <div className="plano-item">
                                <FaHandsHelping className="plano-icon" />
                                <div className="plano-text">
                                  <strong>Terapia:</strong> {plano.nomeTerapia}
                                </div>
                              </div>
                              <div className="plano-item">
                                <FaCalendarAlt className="plano-icon" />
                                <div className="plano-text">
                                  <strong>Frequência:</strong> {plano.frequencia}
                                </div>
                              </div>
                              <div className="plano-item">
                                <FaFileAlt className="plano-icon" />
                                <div className="plano-text">
                                  <strong>Planejamento:</strong> {plano.planejamento}
                                </div>
                              </div>
                              <div className="plano-item">
                                <FaFileAlt className="plano-icon" />
                                <div className="plano-text">
                                  <strong>Projeto de Tratamento:</strong> {plano.projetoTratamento}
                                </div>
                              </div>
                              <div className="plano-item">
                                <FaCalendarCheck className="plano-icon" />
                                <div className="plano-text">
                                  <strong>Criado em:</strong> {new Date(plano.criadoEm).toLocaleString("pt-BR")}
                                </div>
                              </div>
                            </div>
                            <div className="plano-actions">
                              <button
                                className="edit-btn"
                                onClick={() => handleEditPlanejamento(index)}
                                title="Editar planejamento"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => handleDeletePlanejamento(index)}
                                title="Excluir planejamento"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p>Nenhum planejamento de terapia registrado.</p>
                    )}
                    <button className="edit-btn" onClick={() => handleEditToggle("terapias")}>
                      <FaPlus /> Adicionar Novo Planejamento
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Testes */}
            {activeSection === "testes" && (
              <div className="detalhe-section">
                <h2><FaFileAlt /> Testes</h2>
                {isEditing.testes ? (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <button className="modal-close-btn" onClick={handleCancelTeste}>
                        <FaTimes />
                      </button>
                      <h2>{editTesteIndex !== null ? "Editar Teste" : "Adicionar Novo Teste"}</h2>
                      <form className="form-teste" onSubmit={handleAddNewTeste}>
                        <div className="form-field">
                          <label><FaFileMedical /> Nome do Teste:</label>
                          <input
                            type="text"
                            name="nomeTeste"
                            value={newTeste.nomeTeste}
                            onChange={handleNewTesteChange}
                            placeholder="Ex.: Teste de QI, Avaliação Cognitiva..."
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaCalendarDay /> Data:</label>
                          <DatePicker
                            selected={newTeste.data}
                            onChange={handleNewTesteDateChange}
                            dateFormat="dd/MM/yyyy"
                            className="custom-datepicker"
                            placeholderText="Selecione a data"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaStickyNote /> Descrição:</label>
                          <textarea
                            name="descricao"
                            value={newTeste.descricao}
                            onChange={handleNewTesteChange}
                            placeholder="Descrição do teste..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaChartBar /> Resultados:</label>
                          <textarea
                            name="resultados"
                            value={newTeste.resultados}
                            onChange={handleNewTesteChange}
                            placeholder="Resultados do teste..."
                            rows="3"
                            required
                          />
                        </div>
                        <div className="form-field">
                          <label><FaUpload /> Anexar Arquivo (opcional):</label>
                          <div className="file-upload">
                            <input
                              type="file"
                              id="file-upload"
                              onChange={handleNewTesteFileChange}
                              accept="image/*,.pdf"
                            />
                            <label htmlFor="file-upload" className="file-upload-label">
                              {newTeste.arquivo ? (
                                <>
                                  {newTeste.arquivo.type.startsWith("image/") ? <FaFileImage /> : <FaFile />}
                                  {newTeste.arquivo.name}
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
                            <FaSave /> {editTesteIndex !== null ? "Salvar Alterações" : "Adicionar Teste"}
                          </button>
                          <button type="button" className="cancel-btn" onClick={handleCancelTeste}>
                            <FaTimes /> Desistir
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="view-section">
                    {editData.testes.length > 0 ? (
                      editData.testes
                        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
                        .map((teste, index) => (
                          <div key={index} className="entry-view">
                            <div className="entry-content">
                              <div className="entry-item">
                                <FaFileMedical className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Nome do Teste:</strong> {teste.nomeTeste}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaCalendarDay className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Data:</strong> {teste.data}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaStickyNote className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Descrição:</strong> {teste.descricao}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaChartBar className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Resultados:</strong> {teste.resultados}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaCalendarCheck className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Criado em:</strong> {new Date(teste.criadoEm).toLocaleString("pt-BR")}
                                </div>
                              </div>
                              {teste.arquivoURL && (
                                <div className="entry-item">
                                  <FaFile className="entry-icon" />
                                  <div className="entry-text">
                                    <strong>Anexo:</strong>{" "}
                                    <a href={teste.arquivoURL} target="_blank" rel="noopener noreferrer">
                                      Visualizar
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="entry-actions">
                              <button
                                className="edit-btn"
                                onClick={() => handleEditTeste(index)}
                                title="Editar teste"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteTeste(index)}
                                title="Excluir teste"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p>Nenhum teste registrado.</p>
                    )}
                    <button className="edit-btn" onClick={() => handleEditToggle("testes")}>
                      <FaPlus /> Adicionar Novo Teste
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Documentos */}
            {activeSection === "documentos" && (
              <div className="detalhe-section">
                <h2><FaFolderOpen /> Documentos</h2>
                {isEditing.documentos ? (
                  <div className="modal-overlay">
                    <div className="modal-content">
                      <button className="modal-close-btn" onClick={handleCancelDocumento}>
                        <FaTimes />
                      </button>
                      <h2>Adicionar Novo Documento para {paciente.nome}</h2>
                      <form className="form-documento" onSubmit={handleAddNewDocumento}>
                        <div className="form-field">
                          <label><FaFile /> Nome do Documento:</label>
                          <input
                            type="text"
                            name="nomeDocumento"
                            value={newDocumento.nomeDocumento}
                            onChange={handleNewDocumentoChange}
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
                              onChange={handleNewDocumentoFileChange}
                              accept="image/*,.pdf,.doc,.docx"
                              required
                            />
                            <label htmlFor="file-upload" className="file-upload-label">
                              {newDocumento.arquivo ? (
                                <>
                                  {newDocumento.arquivo.type.startsWith("image/") ? <FaFileImage /> : <FaFile />}
                                  {newDocumento.arquivo.name}
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
                          <button type="button" className="cancel-btn" onClick={handleCancelDocumento}>
                            <FaTimes /> Desistir
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="view-section">
                    {editData.documentos.length > 0 ? (
                      editData.documentos
                        .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
                        .map((doc, index) => (
                          <div key={index} className="entry-view">
                            <div className="entry-content">
                              <div className="entry-item">
                                <FaFile className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Nome:</strong> {doc.nomeDocumento}
                                </div>
                              </div>
                              <div className="entry-item">
                                <FaCalendarCheck className="entry-icon" />
                                <div className="entry-text">
                                  <strong>Criado em:</strong> {new Date(doc.criadoEm).toLocaleString("pt-BR")}
                                </div>
                              </div>
                              {doc.arquivoURL && (
                                <div className="entry-item">
                                  <FaFile className="entry-icon" />
                                  <div className="entry-text">
                                    <strong>Arquivo:</strong>{" "}
                                    <a href={doc.arquivoURL} target="_blank" rel="noopener noreferrer">
                                      Visualizar
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteDocumento(index)}
                              title="Excluir documento"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        ))
                    ) : (
                      <p>Nenhum documento registrado.</p>
                    )}
                    <button className="edit-btn" onClick={() => handleEditToggle("documentos")}>
                      <FaPlus /> Adicionar Novo Documento
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DetalhePaciente;