import React, { useState, useEffect, useCallback } from 'react';
import AuthLayout from '../../components/AuthLayout';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';
import Api from '../../Api';
import './style.css';

const Instancias = () => {
  // Estados
  const [instancias, setInstancias] = useState([]);
  const [automacoes, setAutomacoes] = useState([]);
  const [filteredInstancias, setFilteredInstancias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', automacaoId: '', celular: '', ccid: '' });
  const [selectedInstancia, setSelectedInstancia] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', automacaoId: '', celular: '', ccid: '' });
  
  // Constante para o intervalo de atualização (em milissegundos)
  const UPDATE_INTERVAL = 10000; // 10 segundos

  const fetchAutomacoes = useCallback(async () => {
    try {
      const response = await Api.getAutomacoes();
      
      if (response.success) {
        setAutomacoes(response.data);
      } else {
        console.error('Erro ao carregar automações:', response.error);
      }
    } catch (error) {
      console.error('Erro ao buscar automações:', error);
    }
  }, []);
  
  // Função para buscar instâncias
  const fetchInstancias = useCallback(async () => {
    try {
      const response = await Api.getInstancias();
      
      if (response.success) {
        setInstancias(response.data);
      } else {
        console.error('Erro ao carregar instâncias:', response.error);
      }
    } catch (error) {
      console.error('Erro ao buscar instâncias:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Buscar instâncias ao carregar a página
  useEffect(() => {
    fetchInstancias();
    fetchAutomacoes();
    const intervalId = setInterval(() => {
      fetchInstancias();
    }, UPDATE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [fetchInstancias]);
  
  // Filtrar instâncias quando os filtros ou o termo de busca mudam
  useEffect(() => {
    filterInstancias();
  }, [instancias, filters, searchTerm]);
  
  // Filtrar instâncias
  const filterInstancias = () => {
    let result = [...instancias];
    
    // Aplicar filtros
    if (filters.status) {
      result = result.filter(instancia => instancia.Status === filters.status);
    }
    
    // Aplicar termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(instancia => 
        (instancia.AutomacaoRefName && instancia.AutomacaoRefName.toLowerCase().includes(term))
      );
    }
    
    setFilteredInstancias(result);
  };
  
  // Manipular mudança nos filtros
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Limpar todos os filtros
  const clearFilters = () => {
    setFilters({
      status: ''
    });
    setSearchTerm('');
  };
  
  // Renderizar status da instância
  const renderStatus = (status) => {
    switch (status) {
      case 'Conectado':
        return (
          <div className="instance-status connected">
            <i className="fas fa-check-circle"></i>
            <span>Conectado</span>
          </div>
        );
      case 'Disconected':
        return (
          <div className="instance-status disconnected">
            <i className="fas fa-times-circle"></i>
            <span>Desconectado</span>
          </div>
        );
      case 'Aguardando':
        return (
          <div className="instance-status qrcode">
            <i className="fas fa-qrcode"></i>
            <span>Aguardando QR Code</span>
          </div>
        );
      case 'Inicializando':
        return (
          <div className="instance-status qrcode">
            <i className="fas fa-qrcode"></i>
            <span>Aguardando QR Code</span>
          </div>
        );
        break;
      case 'loading':
        return (
          <div className="instance-status loading">
            <i className="fas fa-spinner fa-spin"></i>
            <span>Carregando</span>
          </div>
        );
      default:
        return (
          <div className="instance-status unknown">
            <i className="fas fa-question-circle"></i>
            <span>Desconhecido</span>
          </div>
        );
    }
  };
  
  // Formatar número para exibição
  const formatPhoneNumber = (number) => {
    if (!number) return 'Não disponível';
    const cleaned = ('' + number).replace(/\D/g, '');
    if (cleaned.length < 10) return number;
    const countryCode = cleaned.slice(0, 2);
    const areaCode = cleaned.slice(2, 4);
    const firstPart = cleaned.slice(4, 9);
    const secondPart = cleaned.slice(9);
    return `+${countryCode} (${areaCode}) ${firstPart}-${secondPart}`;
  };

  const openEditModal = (instancia) => {
    setSelectedInstancia(instancia);
    setEditForm({
      name: instancia.AutomacaoRefName || '',
      automacaoId: instancia.AutomacaoRefId || '',
      celular: instancia.Numero || instancia.PhoneNumber || instancia.Celular || instancia.phoneNumber || '',
      ccid: instancia.CCID || instancia.ccid || ''
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => setShowEditModal(false);

  const handleSaveEdit = () => {
    if (!selectedInstancia) return;
    const name = (editForm.name || '').trim();
    const automacaoId = editForm.automacaoId;
    const celularRaw = (editForm.celular || '').trim();
    const ccid = (editForm.ccid || '').trim();
    if (!name) {
      toast.error('Informe um nome para a instância');
      return;
    }
    const auto = automacoes.find(a => String(a.id) === String(automacaoId));
    if (!automacaoId || !auto) {
      toast.error('Selecione uma automação válida');
      return;
    }
    // Sanitização: prioriza o valor digitado, com fallback ao que já existe na instância
    const phoneFromForm = celularRaw.replace(/\D/g, '');
    const fallbackRaw = (
      (selectedInstancia?.PhoneNumber || selectedInstancia?.Numero || selectedInstancia?.Celular || selectedInstancia?.phoneNumber || '')
    ).toString();
    const phoneNumber = phoneFromForm || fallbackRaw.replace(/\D/g, '');

    Api.updateInstancia(selectedInstancia.Id, { name, automacaoId, phoneNumber, ccid })
      .then(async (res) => {
        if (!res.success) {
          toast.error(res.error || 'Erro ao atualizar instância');
          return;
        }
        toast.success('Instância atualizada com sucesso');
        setShowEditModal(false);
        await fetchInstancias();
      })
      .catch(() => {
        toast.error('Erro ao atualizar instância');
      });
  };

  const openCreateModal = () => {
    setCreateForm({ name: '', automacaoId: '', celular: '', ccid: '' });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => setShowCreateModal(false);
  
  const handleRestartInstancia = async (instancia) => {
    const instanceName = (instancia?.Name || '').trim();
    if (!instanceName) {
      toast.error('Nome da instância inválido para reiniciar');
      return;
    }
    const res = await Api.restartInstanciaExternal(instanceName);
    if (!res.success) {
      toast.error(`Erro ao reiniciar instância: ${res.error}`);
      return;
    }
    toast.success('Instância reiniciada');
    await fetchInstancias();
  };
  
  const handleSaveCreate = async () => {
    const name = (createForm.name || '').trim();
    const automacaoId = createForm.automacaoId;
    const celularRaw = (createForm.celular || '').trim();
    const ccid = (createForm.ccid || '').trim();
    if (!name) {
      toast.error('Informe um nome para a instância');
      return;
    }
    const auto = automacoes.find(a => String(a.id) === String(automacaoId));
    if (!automacaoId || !auto) {
      toast.error('Selecione uma automação válida');
      return;
    }
    // Chamada ao endpoint externo para criar instância
    const phoneNumber = celularRaw.replace(/\D/g, '');
    const payload = {
      AutomacaoRefId: automacaoId,
      AutomacaoRefName: name,
      phoneNumber,
      ccid
    };
    const result = await Api.createInstanciaExternal(payload);
    if (!result.success) {
      toast.error(`Erro ao criar instância: ${result.error}`);
      return;
    }
    toast.success('Instância criada');
    setShowCreateModal(false);
    // Atualiza a lista a partir do backend
    await fetchInstancias();
  };

  const handleRestartAll = async () => {
    try {
      const res = await Api.startAllIntaces();
      if (!res.success) {
        toast.error(`Erro ao reiniciar todas as instâncias: ${res.error}`);
        return;
      }
      toast.success('Todas as instâncias foram reiniciadas');
      await fetchInstancias();
    } catch (error) {
      toast.error('Erro ao reiniciar todas as instâncias');
    }
  };

  return (
    <AuthLayout>
      <div className="instancias-container">
        <div className="instancias-header">
          <div className="instancias-title">
            <h1>Instâncias WhatsApp ({instancias.length})</h1>
            <p>Gerencie suas conexões com WhatsApp</p>
          </div>
          <div className="instancias-actions">
            <Button onClick={openCreateModal} className="create-instancia-btn">
              <i className="fas fa-plus"></i>&nbsp;Nova Instância
            </Button>
            <Button variant="secondary" onClick={handleRestartAll} className="restart-all-btn">
              <i className="fas fa-sync"></i>&nbsp;Reiniciar Todas
            </Button>
          </div>
        </div>
        
        <Card className="instancias-filter-card">
          <div className="instancias-filters">
            <div className="filter-row">
              <div className="filter-group">
                <Input
                  type="text"
                  placeholder="Buscar instâncias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon="fas fa-search"
                  className="search-input"
                />
              </div>
              
              <div className="filter-group">
                <Select
                  name="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  placeholder="Status"
                >
                  <option value="">Todos os status</option>
                  <option value="Conectado">Conectado</option>
                  <option value="Desconectado">Desconectado</option>
                  <option value="Aguardando escaneamento do QR Code">Aguardando QR Code</option>
                </Select>
              </div>
              
              <button 
                className="clear-filters-btn"
                onClick={clearFilters}
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </Card>
        
        {isLoading ? (
          <div className="instancias-loading">
            <div className="loading-spinner"></div>
            <p>Carregando instâncias...</p>
          </div>
        ) : filteredInstancias.length === 0 ? (
          <div className="instancias-empty">
            <i className="fab fa-whatsapp instancias-empty-icon"></i>
            <h3>Nenhuma instância encontrada</h3>
            <p>Não há instâncias disponíveis ou que correspondam aos filtros aplicados.</p>
          </div>
        ) : (
          <div className="instancias-grid">
            {filteredInstancias.map(instancia => (
              <Card key={instancia.Id} className="instancia-card">
                <div className="instancia-header">
                  <h3 className="instancia-name">{instancia.AutomacaoRefName || instancia.Name}</h3>
                  {renderStatus(
                    instancia.Status == "Conectado" && instancia.StatusAutomacao == "Conectado" ? "Conectado" :
                    instancia.Status == "Aguardando escaneamento do QR Code" && instancia?.StatusAutomacao == "Inicializando" ? "Aguardando" : "Aguardando"
                  )}
                </div>
                
                <div style={{display: 'flex', alignContent: 'center', justifyContent: 'center'}}>
                  <div>
                    <div style={{color: "gray", marginTop: "15px", fontSize: '10pt', textAlign: 'center'}}>
                      <b>Disparador</b>
                    </div>
                    <div className="instancia-content">
                      {instancia.Status === 'Aguardando escaneamento do QR Code' && instancia.QrCodeBase64 ? (
                        <div className="instancia-qrcode">
                          <img 
                            src={"data:image/png;base64,"+instancia.QrCodeBase64} 
                            alt="QR Code para conexão" 
                            className="qrcode-image" 
                          />
                          <p className="qrcode-instruction">
                            Escaneie o QR Code com seu WhatsApp para conectar
                          </p>
                        </div>
                      ) : instancia.Status === 'Conectado' ? (
                        <div className="instancia-connected">
                          <div className="connected-icon">
                            <i className="fas fa-check-circle"></i>
                          </div>
                          <p className="connected-message">
                            Instância conectada e pronta para uso
                          </p>
                        </div>
                      ) : (
                        <div className="instancia-disconnected">
                          <div className="disconnected-icon">
                            <i className="fas fa-plug"></i>
                          </div>
                          <p className="disconnected-message">
                            Instância desconectada. Aguardando inicialização...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{color: "gray", marginTop: "15px", fontSize: '10pt', textAlign: 'center'}}>
                      <b>Automação</b>
                    </div>
                    <div className="instancia-content">
                      {instancia.StatusAutomacao === 'Inicializando' && instancia.QrCodeBase64Automacao ? (
                        <div className="instancia-qrcode">
                          <img 
                            src={"data:image/png;base64,"+instancia.QrCodeBase64Automacao} 
                            alt="QR Code para conexão" 
                            className="qrcode-image" 
                            style={{padding: '12px'}}
                          />
                          <p className="qrcode-instruction">
                            Escaneie o QR Code com seu WhatsApp para conectar
                          </p>
                        </div>
                      ) : instancia.StatusAutomacao === 'Conectado' ? (
                        <div className="instancia-connected">
                          <div className="connected-icon">
                            <i className="fas fa-check-circle"></i>
                          </div>
                          <p className="connected-message">
                            Instância conectada e pronta para uso
                          </p>
                        </div>
                      ) : (
                        <div className="instancia-disconnected">
                          <div className="disconnected-icon">
                            <i className="fas fa-plug"></i>
                          </div>
                          <p className="disconnected-message">
                            Instância desconectada. Aguardando inicialização...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="instancia-info">
                  <div className="info-item">
                    <span className="info-label">Nome:</span>
                    <span className="info-value">
                      {instancia.Status === 'Conectado' 
                        ? instancia.Name
                        : 'Não conectado'}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Mensagens Enviadas:</span>
                    <span className="info-value">
                      {instancia.mensagensEnviadas?.toLocaleString() || '0'}
                    </span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Última Atualização:</span>
                    <span className="info-value">
                      {instancia.LastConnected 
                        ? new Date(instancia.LastConnected).toLocaleString() 
                        : 'Nunca'}
                    </span>
                  </div>

                  <div className="info-item" style={{ display: 'flex', gap: '8px' }}>
                    <Button onClick={() => openEditModal(instancia)}>
                      <i className="fas fa-edit"></i> Editar
                    </Button>
                    <Button variant="secondary" onClick={() => handleRestartInstancia(instancia)}>
                      <i className="fas fa-sync"></i> Reiniciar
                    </Button>
                  </div>

                </div>
              </Card>
            ))}
          </div>
        )}
        <Modal
          isOpen={showEditModal}
          onClose={closeEditModal}
          title="Editar Instância"
        >
          <div className="form-group">
            <Input
              label="Nome da Instância"
              value={editForm.name}
              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o novo nome"
              required
            />
          </div>
          <div className="form-group">
            <Select
              label="Automação"
              value={editForm.automacaoId}
              onChange={(e) => setEditForm(prev => ({ ...prev, automacaoId: e.target.value }))}
              placeholder="Selecione uma automação"
              required
            >
              <option value="">Selecione uma automação</option>
              {automacoes.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </Select>
          </div>
          <div className="form-group">
            <Input
              label="Número de Celular"
              name="celular"
              value={editForm.celular}
              onChange={(e) => setEditForm(prev => ({ ...prev, celular: e.target.value }))}
              placeholder="(DDD) 9XXXX-XXXX"
            />
          </div>
          <div className="form-group">
            <Input
              label="ICCID"
              name="ccid"
              value={editForm.ccid}
              onChange={(e) => setEditForm(prev => ({ ...prev, ccid: e.target.value }))}
              placeholder="Informe o ICCID"
            />
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={closeEditModal}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </div>
        </Modal>
        <Modal
          isOpen={showCreateModal}
          onClose={closeCreateModal}
          title="Nova Instância"
        >
          <div className="form-group">
            <Input
              label="Nome da Instância"
              value={createForm.name}
              onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome"
              required
            />
          </div>
          <div className="form-group">
            <Select
              label="Automação"
              value={createForm.automacaoId}
              onChange={(e) => setCreateForm(prev => ({ ...prev, automacaoId: e.target.value }))}
              placeholder="Selecione uma automação"
              required
            >
              <option value="">Selecione uma automação</option>
              {automacoes.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </Select>
          </div>
          <div className="form-group">
            <Input
              label="Número de Celular"
              value={createForm.celular}
              onChange={(e) => setCreateForm(prev => ({ ...prev, celular: e.target.value }))}
              placeholder="(DDD) 9XXXX-XXXX"
            />
          </div>
          <div className="form-group">
            <Input
              label="ICCID"
              value={createForm.ccid}
              onChange={(e) => setCreateForm(prev => ({ ...prev, ccid: e.target.value }))}
              placeholder="Informe o ICCID"
            />
          </div>
          <div className="modal-footer">
            <Button variant="secondary" onClick={closeCreateModal}>Cancelar</Button>
            <Button onClick={handleSaveCreate}>Criar</Button>
          </div>
        </Modal>
      </div>
    </AuthLayout>
  );
};

export default Instancias;