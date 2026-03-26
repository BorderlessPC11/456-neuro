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
import DetalhePaciente from "./pages/DetalhePaciente";
import AbaResponsavel from "./pages/AbaResponsavel";
import AppShellLayout from "./layout/AppShell.jsx";
import GuardianShell from "./layout/GuardianShell.jsx";
import GuardianRegister from "./pages/GuardianRegister";
import GuardianDashboard from "./pages/guardian/GuardianDashboard";
import GuardianProgressHub from "./pages/guardian/GuardianProgressHub";
import GuardianProgramProgress from "./pages/guardian/GuardianProgramProgress";
import GuardianAppointments from "./pages/guardian/GuardianAppointments";
import GuardianMessages from "./pages/guardian/GuardianMessages";
import InviteRegister from "./pages/InviteRegister";
import MigrationTools from "./pages/MigrationTools";
import RoleRoute from "./auth/RoleRoute";
import { isAdminLike, isManagerLike } from "./auth/roles";

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/guardian/register/:inviteId" element={<GuardianRegister />} />
        <Route path="/invite/register/:inviteId" element={<InviteRegister />} />
        <Route element={<GuardianShell />}>
          <Route path="/guardian" element={<GuardianDashboard />} />
          <Route path="/guardian/progress" element={<GuardianProgressHub />} />
          <Route path="/guardian/programs/:programId" element={<GuardianProgramProgress />} />
          <Route path="/guardian/appointments" element={<GuardianAppointments />} />
          <Route path="/guardian/messages" element={<GuardianMessages />} />
        </Route>
        <Route element={<AppShellLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/detalhe-paciente/:id" element={<DetalhePaciente />} />
          <Route path="/aba-responsavel" element={<AbaResponsavel />} />
          <Route path="/evolucao" element={<EvolucaoDiaria />} />
          <Route path="/anamnese" element={<Anamnese />} />
          <Route path="/documentos-paciente" element={<DocumentosPaciente />} />
          <Route path="/gerar-relatorio-paciente" element={<GerarRelatorioPaciente />} />
          <Route path="/terapias" element={<Terapias />} />
          <Route path="/planejamento" element={<Planejamento />} />
          <Route path="/testes" element={<Testes />} />
          <Route path="/schedule" element={<AgendaGeral />} />
          <Route path="/schedule/list" element={<AgendaGeral variant="listPage" />} />
          <Route path="/agenda-geral" element={<AgendaGeral />} />
          <Route path="/adicionar-agendamento" element={<AdicionarAgendamento />} />
          <Route path="/notificacoes" element={<Notificacoes />} />
          <Route path="/comunicacao" element={<Comunicacao />} />
          <Route path="/gerar-relatorio" element={<GerarRelatorio />} />
          <Route
            path="/profissionais"
            element={
              <RoleRoute allowWhen={(role) => isManagerLike(role)}>
                <Profissionais />
              </RoleRoute>
            }
          />
          <Route
            path="/administracao"
            element={
              <RoleRoute allowWhen={(role) => isManagerLike(role)}>
                <Administracao />
              </RoleRoute>
            }
          />
          {/* Rotas para Compras a Fazer */}
          <Route
            path="/compras-a-fazer"
            element={
              <RoleRoute allowWhen={(role) => isAdminLike(role)}>
                <ComprasAFazer />
              </RoleRoute>
            }
          />
          <Route
            path="/compras"
            element={
              <RoleRoute allowWhen={(role) => isAdminLike(role)}>
                <ComprasAFazer />
              </RoleRoute>
            }
          />
          {/* Rota para Despesas */}
          <Route
            path="/despesas"
            element={
              <RoleRoute allowWhen={(role) => isAdminLike(role)}>
                <Despesas />
              </RoleRoute>
            }
          />
          {/* Rota para Tarefas */}
          <Route
            path="/tarefas"
            element={
              <RoleRoute allowWhen={(role) => isAdminLike(role)}>
                <Tarefas />
              </RoleRoute>
            }
          />
          {/* Nova rota para Usuários */}
          <Route
            path="/usuarios"
            element={
              <RoleRoute allowWhen={(role) => isManagerLike(role)}>
                <Usuarios />
              </RoleRoute>
            }
          />
          <Route
            path="/migration-tools"
            element={
              <RoleRoute allowWhen={(role) => isAdminLike(role)}>
                <MigrationTools />
              </RoleRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

