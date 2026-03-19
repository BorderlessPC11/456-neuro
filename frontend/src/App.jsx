import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Importação das páginas
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import EvolucaoDiaria from "./pages/EvolucaoDiaria";
import Anamnese from "./pages/Anamnese";
import DocumentosPaciente from "./pages/DocumentosPaciente";
import GerarRelatorioPaciente from "./pages/GerarRelatorioPaciente";
import Terapias from "./pages/Terapias";
import Planejamento from "./pages/Planejamento";
import Testes from "./pages/Testes";
import AgendaGeral from "./pages/AgendaGeral";
import AdicionarAgendamento from "./pages/AdicionarAgendamento";
import Notificacoes from "./pages/Notificacoes";
import Comunicacao from "./pages/Comunicacao";
import GerarRelatorio from "./pages/GerarRelatorio";
import Profissionais from "./pages/Profissionais";
import Administracao from "./pages/Administracao";
import ComprasAFazer from "./pages/ComprasAFazer";
import Despesas from "./pages/Despesas";
import Tarefas from "./pages/Tarefas";
import Usuarios from "./pages/Usuarios"; // Novo import
import Cadastro from "./pages/Cadastro";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pacientes" element={<Pacientes />} />
        <Route path="/evolucao" element={<EvolucaoDiaria />} />
        <Route path="/anamnese" element={<Anamnese />} />
        <Route path="/documentos-paciente" element={<DocumentosPaciente />} />
        <Route path="/gerar-relatorio-paciente" element={<GerarRelatorioPaciente />} />
        <Route path="/terapias" element={<Terapias />} />
        <Route path="/planejamento" element={<Planejamento />} />
        <Route path="/testes" element={<Testes />} />
        <Route path="/agenda-geral" element={<AgendaGeral />} />
        <Route path="/adicionar-agendamento" element={<AdicionarAgendamento />} />
        <Route path="/notificacoes" element={<Notificacoes />} />
        <Route path="/comunicacao" element={<Comunicacao />} />
        <Route path="/gerar-relatorio" element={<GerarRelatorio />} />
        <Route path="/profissionais" element={<Profissionais />} />
        <Route path="/administracao" element={<Administracao />} />
        {/* Rotas para Compras a Fazer */}
        <Route path="/compras-a-fazer" element={<ComprasAFazer />} />
        <Route path="/compras" element={<ComprasAFazer />} />
        {/* Rota para Despesas */}
        <Route path="/despesas" element={<Despesas />} />
        {/* Rota para Tarefas */}
        <Route path="/tarefas" element={<Tarefas />} />
        {/* Nova rota para Usuários */}
        <Route path="/usuarios" element={<Usuarios />} />
      </Routes>
    </Router>
  );
}

export default App;

