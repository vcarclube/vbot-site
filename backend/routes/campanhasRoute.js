const express = require('express');
const router = express.Router();
const db = require('../database');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { v4: uuidv4 } = require('uuid');

// Obter todas as campanhas
router.get('/', validateToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM Campaigns 
      WHERE idUser = @idUser
      ORDER BY CreatedAt DESC
    `;
    
    const result = await db.query(query, { idUser: req.user.id });

    const campanhas = result.recordsets[0];

    return res.status(200).json(campanhas);
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error);
    res.status(500).json({ message: 'Erro ao buscar campanhas', error: error.message });
  }
});

// Obter uma campanha específica
router.get('/:id', validateToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM Campanhas 
      WHERE id = @id AND idUser = @idUser
    `;
    
    const result = await db.query(query, { 
      id: req.params.id,
      idUser: req.user.id
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Campanha não encontrada' });
    }
    
    // Processar o resultado para converter strings JSON em arrays
    const campanha = {
      ...result[0],
      grupos: JSON.parse(result[0].grupos || '[]'),
      mensagens: JSON.parse(result[0].mensagens || '[]')
    };
    
    res.json(campanha);
  } catch (error) {
    console.error('Erro ao buscar campanha:', error);
    res.status(500).json({ message: 'Erro ao buscar campanha', error: error.message });
  }
});

// Criar uma nova campanha
router.post('/', validateToken, async (req, res) => {
  try {
    const {
      Name,
      Groups,
      Messages,
      StartDate,
      EndDate,
      Status
    } = req.body;

    // Validação básica
    if (!Name || !Groups || !Groups.length || !Messages || !Messages.length || !StartDate || !Status) {
      return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
    }
    
    // Validar datas
    const inicio = new Date(StartDate);
    const fim = new Date(EndDate);
    
    if (inicio >= fim) {
      return res.status(400).json({ message: 'A data de início deve ser anterior à data de fim' });
    }
    
    const id = uuidv4();
    const now = new Date();
    
    const query = `
      INSERT INTO Campaigns (
        id, name, templateMessage, startDate, endDate,
        status, createdAt, Groups, idUser
      ) VALUES (
        @id, @name, @templateMessage, @startDate, @endDate,
        @status, @createdAt, @Groups, @idUser
      );
    `;
    
    const params = {
      id,
      Name,
      TemplateMessage: "",
      StartDate: inicio,
      EndDate: fim,
      Status: Status || 'Pausada',
      createdAt: now,
      Groups: Groups?.join("|"),
      idUser: req.user.id
    };
    
    await db.query(query, params);
    
    res.status(201).json(true);
  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    res.status(500).json({ message: 'Erro ao criar campanha', error: error.message });
  }
});

// Atualizar uma campanha
router.put('/:id', validateToken, async (req, res) => {
  try {
    const {
        Name,
        Groups,
        Messages,
        StartDate,
        EndDate,
        Status
    } = req.body;

    // Validação básica
    if (!Name || !Groups || !Groups.length || !Messages || !Messages.length || !StartDate || !Status) {
    return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos' });
    }

    // Validar datas
    const inicio = new Date(StartDate);
    const fim = new Date(EndDate);
    
    if (inicio >= fim) {
      return res.status(400).json({ message: 'A data de início deve ser anterior à data de fim' });
    }
    
    // Verificar se a campanha existe e pertence ao usuário
    const checkQuery = `
      SELECT * FROM Campaigns 
      WHERE id = @id AND idUser = @idUser
    `;
    
    const checkResult = await db.query(checkQuery, { 
      id: req.params.id,
      idUser: req.user.id
    });
    
    if (!checkResult || checkResult.length === 0) {
      return res.status(404).json({ message: 'Campanha não encontrada' });
    }
    
    const updateQuery = `
      UPDATE Campaigns SET
        Name = @Name,
        StartDate = @StartDate,
        EndDate = @EndDate,
        Status = @Status,
        CreatedAt = @CreatedAt,
        Groups = @Groups
      WHERE id = @id AND idUser = @idUser;
    `;
    
    const params = {
      id: req.params.id,
      Name,
      StartDate,
      EndDate,
      Status,
      CreatedAt: new Date(),
      Groups: Groups?.join("|"),
      idUser: req.user.id
    };
    
    await db.query(updateQuery, params);
    
    return res.status(200).json(true);
  } catch (error) {
    console.error('Erro ao atualizar campanha:', error);
    return res.status(500).json({ message: 'Erro ao atualizar campanha', error: error.message });
  }
});

// Atualizar status de uma campanha
router.put('/:id/status', validateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['Ativo', 'Pausada', 'Agendada', 'Finalizada'].includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }
    
    // Verificar se a campanha existe e pertence ao usuário
    const checkQuery = `
      SELECT * FROM Campaigns 
      WHERE id = @id AND idUser = @idUser
    `;
    
    const checkResult = await db.query(checkQuery, { 
      id: req.params.id,
      idUser: req.user.id
    });
    
    if (!checkResult || checkResult.length === 0) {
      return res.status(404).json({ message: 'Campanha não encontrada' });
    }
    
    const updateQuery = `
      UPDATE Campaigns SET
        Status = @Status 
      WHERE id = @id AND idUser = @idUser;
    `;
    
    const params = {
      Id: req.params.id,
      Status: status,
      idUser: req.user.id
    };
    
    await db.query(updateQuery, params);
    
    return res.status(200).json(true);
  } catch (error) {
    console.error('Erro ao atualizar status da campanha:', error);
    res.status(500).json({ message: 'Erro ao atualizar status da campanha', error: error.message });
  }
});

// Remover uma campanha
router.delete('/:id', validateToken, async (req, res) => {
  try {
    // Verificar se a campanha existe e pertence ao usuário
    const checkQuery = `
      SELECT * FROM Campaigns 
      WHERE id = @id AND idUser = @idUser
    `;
    
    const checkResult = await db.query(checkQuery, { 
      id: req.params.id,
      idUser: req.user.id
    });
    
    if (!checkResult || checkResult.length === 0) {
      return res.status(404).json({ message: 'Campanha não encontrada' });
    }
    
    const deleteQuery = `
      DELETE FROM Campaigns 
      WHERE id = @id AND idUser = @idUser;

      DELETE FROM Leads WHERE CampaignId = @id;
    `;
    
    await db.query(deleteQuery, { 
      id: req.params.id,
      idUser: req.user.id
    });
    
    return res.status(200).json({ message: 'Campanha removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover campanha:', error);
    res.status(500).json({ message: 'Erro ao remover campanha', error: error.message });
  }
});

// Obter grupos de leads
router.get('/leads/grupos', validateToken, async (req, res) => {
  try {

    const query = ` SELECT DISTINCT NomeGrupo FROM ImportedLeads WHERE IdUser=@idUser ORDER BY NomeGrupo`;
    
    const result = await db.query(query, { idUser: req.user.id });
    
    const grupos = result.recordsets[0];
    
    return res.status(200).json(grupos);
  } catch (error) {
    console.error('Erro ao buscar grupos de leads:', error);
    res.status(500).json({ message: 'Erro ao buscar grupos de leads', error: error.message });
  }
});

module.exports = router;