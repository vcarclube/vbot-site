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

module.exports = router;