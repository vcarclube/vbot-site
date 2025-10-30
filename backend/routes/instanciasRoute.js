const express = require('express');
const router = express.Router();
const db = require('../database');
const { validateToken } = require('../middlewares/AuthMiddleware');

// Obter todas as instâncias
router.get('/all', validateToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM WhatsAppInstances 
      WHERE idUser = @idUser
      ORDER BY Name
    `;
    
    const result = await db.query(query, { idUser: req.user.id });
    
    return res.status(200).json(result.recordsets[0]);
  } catch (error) {
    console.error('Erro ao buscar instâncias:', error);
    res.status(500).json({ message: 'Erro ao buscar instâncias', error: error.message });
  }
});

// Obter uma instância específica
router.get('/:id', validateToken, async (req, res) => {
  try {
    const query = `
      SELECT * FROM WhatsAppInstances 
      WHERE id = @id AND idUser = @idUser
    `;
    
    const result = await db.query(query, { 
      id: req.params.id,
      idUser: req.user.id
    });
    
    if (!result || result.length === 0) {
      return res.status(404).json({ message: 'Instância não encontrada' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Erro ao buscar instância:', error);
    res.status(500).json({ message: 'Erro ao buscar instância', error: error.message });
  }
});

// Atualizar uma instância (nome e vínculo com automação)
router.put('/:id', validateToken, async (req, res) => {
  try {
    const { name, automacaoId, AutomacaoRefName, AutomacaoRefId } = req.body;

    const newName = (name || AutomacaoRefName || '').trim();
    const newAutomacaoId = automacaoId || AutomacaoRefId;

    if (!newName) {
      return res.status(400).json({ message: 'Nome da instância é obrigatório' });
    }
    if (!newAutomacaoId) {
      return res.status(400).json({ message: 'AutomacaoId é obrigatório' });
    }

    // Verificar se automação existe e pertence ao usuário
    const checkAutoQuery = `
      SELECT id FROM Automacoes
      WHERE id = @automacaoId AND idUser = @idUser
    `;
    const autoResult = await db.query(checkAutoQuery, {
      automacaoId: newAutomacaoId,
      idUser: req.user.id
    });
    if (!autoResult.recordset || autoResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Automação inválida para vínculo' });
    }

    // Verificar se a instância existe e pertence ao usuário
    const checkInstanceQuery = `
      SELECT Id FROM WhatsAppInstances
      WHERE Id = @id AND idUser = @idUser
    `;
    const instanceResult = await db.query(checkInstanceQuery, {
      id: req.params.id,
      idUser: req.user.id
    });
    if (!instanceResult.recordset || instanceResult.recordset.length === 0) {
      return res.status(404).json({ message: 'Instância não encontrada' });
    }

    const updateQuery = `
      UPDATE WhatsAppInstances
      SET Name = @name,
          AutomacaoRefId = @automacaoId,
          AutomacaoRefName = @name
      WHERE Id = @id AND idUser = @idUser
    `;

    await db.query(updateQuery, {
      id: req.params.id,
      idUser: req.user.id,
      name: newName,
      automacaoId: newAutomacaoId
    });

    return res.json({ message: 'Instância atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar instância:', error);
    res.status(500).json({ message: 'Erro ao atualizar instância', error: error.message });
  }
});

module.exports = router;
