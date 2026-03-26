import React from "react";
import {
  FaHome,
  FaUsers,
  FaCalendarAlt,
  FaComments,
  FaChartBar,
  FaCog,
  FaFileAlt,
  FaFolderOpen,
  FaCalendarCheck,
  FaPlusCircle,
  FaBell,
  FaEnvelope,
  FaListAlt,
  FaBrain,
} from "react-icons/fa";
import { isAdminLike, isGuardianRole, isManagerLike } from "../auth/roles";

export function getNavItemsByRole(role) {
  if (isGuardianRole(role)) {
    return [
      { label: "Início", path: "/guardian", icon: <FaHome /> },
      { label: "Progresso", path: "/guardian/progress", icon: <FaBrain /> },
      { label: "Consultas", path: "/guardian/appointments", icon: <FaCalendarCheck /> },
      { label: "Mensagens", path: "/guardian/messages", icon: <FaEnvelope /> },
    ];
  }

  const base = [
    { label: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { label: "Pacientes", path: "/pacientes", icon: <FaUsers /> },
    { label: "Evolução Diária", path: "/evolucao", icon: <FaFileAlt /> },
    { label: "Anamnese", path: "/anamnese", icon: <FaFileAlt /> },
    { label: "Documentos", path: "/documentos-paciente", icon: <FaFolderOpen /> },
    { label: "Relatórios", path: "/gerar-relatorio-paciente", icon: <FaChartBar /> },
    { label: "PDI", path: "/planejamento", icon: <FaCalendarAlt /> },
    { label: "Terapias", path: "/terapias", icon: <FaFileAlt /> },
    { label: "Testes", path: "/testes", icon: <FaListAlt /> },
    { label: "Agenda", path: "/schedule", icon: <FaCalendarCheck /> },
    { label: "Agenda (lista)", path: "/schedule/list", icon: <FaListAlt /> },
    { label: "Adicionar Agendamento", path: "/adicionar-agendamento", icon: <FaPlusCircle /> },
    { label: "Notificações", path: "/notificacoes", icon: <FaBell /> },
    { label: "Comunicação", path: "/comunicacao", icon: <FaEnvelope /> },
    { label: "Gerar Relatório", path: "/gerar-relatorio", icon: <FaChartBar /> },
  ];

  const managerItems = isManagerLike(role)
    ? [
        { label: "Profissionais", path: "/profissionais", icon: <FaUsers /> },
        { label: "Usuários", path: "/usuarios", icon: <FaUsers /> },
        { label: "Administração", path: "/administracao", icon: <FaCog /> },
      ]
    : [];

  const adminItems = isAdminLike(role)
    ? [
        { label: "Compras a Fazer", path: "/compras", icon: <FaFileAlt /> },
        { label: "Despesas", path: "/despesas", icon: <FaFileAlt /> },
        { label: "Tarefas", path: "/tarefas", icon: <FaComments /> },
      ]
    : [];

  return [...base, ...managerItems, ...adminItems];
}
