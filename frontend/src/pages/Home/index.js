import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import { useMainContext } from '../../helpers/MainContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import './style.css';

// Componentes de gráficos
import CampaignPerformanceChart from '../../components/CampaignPerformanceChart';
import LeadsGrowthChart from '../../components/LeadsGrowthChart';
import ConversionRateChart from '../../components/ConversionRateChart';
import EngagementChart from '../../components/EngagementChart';

const Home = () => {
  const { user } = useMainContext();
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');
  const [stats, setStats] = useState({
    activeCampaigns: 0,
    totalLeads: 0,
    conversionRate: 0,
    engagementRate: 0
  });

  // Simulação de carregamento de dados
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Simulando uma chamada de API
      setTimeout(() => {
        // Dados simulados
        setStats({
          activeCampaigns: 8,
          totalLeads: 2547,
          conversionRate: 24.8,
          engagementRate: 68.3
        });
        
        setIsLoading(false);
      }, 1000);
    };
    
    loadDashboardData();
  }, [timeframe]);

  // Dados recentes de campanhas
  const recentCampaigns = [
    {
      id: 1,
      name: "Black Friday 2023",
      status: "active",
      leads: 856,
      conversion: 32.5,
      lastUpdated: "2023-11-20"
    },
    {
      id: 2,
      name: "Lançamento Produto X",
      status: "active",
      leads: 621,
      conversion: 28.7,
      lastUpdated: "2023-11-18"
    },
    {
      id: 3,
      name: "Newsletter Mensal",
      status: "scheduled",
      leads: 0,
      conversion: 0,
      lastUpdated: "2023-11-15"
    },
    {
      id: 4,
      name: "Webinar Tecnologia",
      status: "completed",
      leads: 423,
      conversion: 21.2,
      lastUpdated: "2023-11-10"
    }
  ];

  // Alertas e notificações
  const notifications = [
    {
      id: 1,
      type: "success",
      message: "Campanha 'Black Friday 2023' atingiu 500 leads",
      time: "2h atrás"
    },
    {
      id: 2,
      type: "warning",
      message: "Taxa de abertura abaixo do esperado na campanha 'Lançamento Produto X'",
      time: "5h atrás"
    },
    {
      id: 3,
      type: "info",
      message: "IA sugeriu melhorias para o assunto dos emails",
      time: "1d atrás"
    }
  ];

  // Sugestões da IA
  const aiSuggestions = [
    "Aumente a taxa de conversão da campanha 'Black Friday 2023' com uma oferta de tempo limitado",
    "Segmente seus leads inativos para uma campanha de reengajamento",
    "Otimize o horário de envio baseado nos dados de abertura recentes"
  ];

  return (
    <AuthLayout>
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Dashboard</h1>
            <p>Bem-vindo, {user?.name || 'Usuário'}! Aqui está o desempenho das suas campanhas.</p>
          </div>
          
          {/*<div className="dashboard-actions">
            <div className="dashboard-timeframe">
              <button 
                className={`timeframe-btn ${timeframe === 'week' ? 'active' : ''}`}
                onClick={() => setTimeframe('week')}
              >
                Semana
              </button>
              <button 
                className={`timeframe-btn ${timeframe === 'month' ? 'active' : ''}`}
                onClick={() => setTimeframe('month')}
              >
                Mês
              </button>
              <button 
                className={`timeframe-btn ${timeframe === 'quarter' ? 'active' : ''}`}
                onClick={() => setTimeframe('quarter')}
              >
                Trimestre
              </button>
            </div>
          </div>*/}

        </div>
        
        {isLoading ? (
          <div className="dashboard-loading">
            <div className="dashboard-loading-spinner"></div>
            <p>Carregando dados...</p>
          </div>
        ) : (
          <>
            {/* Cards de estatísticas */}
            <div className="dashboard-stats">
              <Card className="stat-card">
                <div className="stat-icon campaigns">
                  <i className="fas fa-bullhorn"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.activeCampaigns}</h3>
                  <p>Campanhas Ativas</p>
                </div>
                <div className="stat-trend positive">
                  <i className="fas fa-arrow-up"></i> 12%
                </div>
              </Card>
              
              <Card className="stat-card">
                <div className="stat-icon leads">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.totalLeads.toLocaleString()}</h3>
                  <p>Total de Leads</p>
                </div>
                <div className="stat-trend positive">
                  <i className="fas fa-arrow-up"></i> 8.5%
                </div>
              </Card>
              
              <Card className="stat-card">
                <div className="stat-icon conversion">
                  <i className="fas fa-exchange-alt"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.conversionRate}%</h3>
                  <p>Taxa de Conversão</p>
                </div>
                <div className="stat-trend positive">
                  <i className="fas fa-arrow-up"></i> 3.2%
                </div>
              </Card>
              
              <Card className="stat-card">
                <div className="stat-icon engagement">
                  <i className="fas fa-chart-line"></i>
                </div>
                <div className="stat-content">
                  <h3>{stats.engagementRate}%</h3>
                  <p>Taxa de Engajamento</p>
                </div>
                <div className="stat-trend negative">
                  <i className="fas fa-arrow-down"></i> 1.8%
                </div>
              </Card>
            </div>
            
            {/* Seção de gráficos */}
            <div className="dashboard-charts">
              <div className="chart-row">
                <Card className="chart-card large">
                  <div className="chart-header">
                    <h3>Desempenho de Campanhas</h3>
                    <div className="chart-actions">
                      <button className="chart-action-btn">
                        <i className="fas fa-download"></i>
                      </button>
                      <button className="chart-action-btn">
                        <i className="fas fa-expand"></i>
                      </button>
                    </div>
                  </div>
                  <div className="chart-container">
                    <CampaignPerformanceChart timeframe={timeframe} />
                  </div>
                </Card>
              </div>
              
              <div className="chart-row">
                <Card className="chart-card">
                  <div className="chart-header">
                    <h3>Crescimento de Leads</h3>
                    <div className="chart-actions">
                      <button className="chart-action-btn">
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                  </div>
                  <div className="chart-container">
                    <LeadsGrowthChart timeframe={timeframe} />
                  </div>
                </Card>
                
                <Card className="chart-card">
                  <div className="chart-header">
                    <h3>Taxa de Conversão</h3>
                    <div className="chart-actions">
                      <button className="chart-action-btn">
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                  </div>
                  <div className="chart-container">
                    <ConversionRateChart timeframe={timeframe} />
                  </div>
                </Card>
              </div>
              
              <div className="chart-row">
                <Card className="chart-card">
                  <div className="chart-header">
                    <h3>Engajamento por Canal</h3>
                    <div className="chart-actions">
                      <button className="chart-action-btn">
                        <i className="fas fa-download"></i>
                      </button>
                    </div>
                  </div>
                  <div className="chart-container">
                    <EngagementChart />
                  </div>
                </Card>
                
                <Card className="chart-card">
                  <div className="chart-header">
                    <h3>Sugestões da IA</h3>
                    <span className="ai-badge">
                      <i className="fas fa-robot"></i> IA
                    </span>
                  </div>
                  <div className="ai-suggestions">
                    {aiSuggestions.map((suggestion, index) => (
                      <div key={index} className="ai-suggestion-item">
                        <i className="fas fa-lightbulb"></i>
                        <p>{suggestion}</p>
                      </div>
                    ))}
                    <Button 
                      variant="secondary" 
                      size="small"
                      className="ai-more-btn"
                    >
                      Ver mais sugestões
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
            
            {/* Seção inferior */}
            <div className="dashboard-bottom">
              <Card className="recent-campaigns">
                <div className="section-header">
                  <h3>Campanhas Recentes</h3>
                  <Link to="/campaigns" className="view-all">
                    Ver todas <i className="fas fa-chevron-right"></i>
                  </Link>
                </div>
                
                <div className="campaigns-table-container">
                  <table className="campaigns-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Status</th>
                        <th>Leads</th>
                        <th>Conversão</th>
                        <th>Atualização</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCampaigns.map(campaign => (
                        <tr key={campaign.id}>
                          <td className="campaign-name">{campaign.name}</td>
                          <td>
                            <span className={`status-badge ${campaign.status}`}>
                              {campaign.status === 'active' && 'Ativa'}
                              {campaign.status === 'scheduled' && 'Agendada'}
                              {campaign.status === 'completed' && 'Concluída'}
                            </span>
                          </td>
                          <td>{campaign.leads.toLocaleString()}</td>
                          <td>{campaign.conversion > 0 ? `${campaign.conversion}%` : '-'}</td>
                          <td>{new Date(campaign.lastUpdated).toLocaleDateString('pt-BR')}</td>
                          <td>
                            <button className="table-action-btn">
                              <i className="fas fa-ellipsis-v"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
              
              <Card className="notifications-card">
                <div className="section-header">
                  <h3>Notificações</h3>
                  <button className="mark-all-read">
                    Marcar todas como lidas
                  </button>
                </div>
                
                <div className="notifications-list">
                  {notifications.map(notification => (
                    <div key={notification.id} className={`notification-item ${notification.type}`}>
                      <div className="notification-icon">
                        {notification.type === 'success' && <i className="fas fa-check-circle"></i>}
                        {notification.type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                        {notification.type === 'info' && <i className="fas fa-info-circle"></i>}
                      </div>
                      <div className="notification-content">
                        <p>{notification.message}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                      <button className="notification-action">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="notifications-footer">
                  <Link to="/notifications" className="view-all-notifications">
                    Ver todas as notificações
                  </Link>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default Home;