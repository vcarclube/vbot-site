const express = require('express');
const router = express.Router();
const db = require('../database');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { v4: uuidv4 } = require('uuid');

// Obter todos os leads
router.get('/all', validateToken, async (req, res) => {
    try {
      const { property_id, search } = req.query;
      
      let query = 'SELECT * FROM ImportedLeads WHERE 1=1';
      const params = {};
      
      if (property_id) {
        query += ' AND nomeGrupo = @property_id';
        params.property_id = property_id;
      }
      
      if (search) {
        query += ' AND (nome LIKE @search OR email LIKE @search OR celular LIKE @search OR cpf LIKE @search)';
        params.search = `%${search}%`;
      }
      
      query += ' ORDER BY dataCadastro DESC';
      
      const result = await db.query(query, params);
      
      return res.status(200).json(result?.recordsets[0]);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
      res.status(500).json({ message: 'Erro ao buscar leads', error: error.message });
    } 
  });
  
  // Obter um lead específico
  router.get('/:id', validateToken, async (req, res) => {
    try {
      const result = await db.query('SELECT * FROM ImportedLeads WHERE id = @id', { id: req.params.id });
      
      if (!result || result.length === 0) {
        return res.status(404).json({ message: 'Lead não encontrado' });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error('Erro ao buscar lead:', error);
      res.status(500).json({ message: 'Erro ao buscar lead', error: error.message });
    }
  });
  
  // Criar um novo lead
  router.post('/save', validateToken, async (req, res) => {
    try {
      const {
        nome,
        email,
        celular,
        cpf,
        nascimento,
        genero,
        idade,
        estado,
        cidade,
        bairro,
        nomeGrupo,
        etapaFunil,
        tags
      } = req.body;
      
      // Validação básica
      if (!nome || !celular) {
        return res.status(400).json({ message: 'Nome e celular são obrigatórios' });
      }
      
      const now = new Date();
      const idUser = req.user.id; // Assumindo que o middleware de autenticação adiciona o usuário ao request

      let id = uuidv4();
      
      const query = `
        INSERT INTO ImportedLeads (
          id, nome, email, celular, cpf, nascimento, genero, idade,
          estado, cidade, bairro, nomeGrupo, etapaFunil, tags, dataCadastro, idUser
        ) VALUES (
          @id, @nome, @email, @celular, @cpf, @nascimento, @genero, @idade,
          @estado, @cidade, @bairro, @nomeGrupo, @etapaFunil, @tags, @dataCadastro, @idUser
        );
        SELECT SCOPE_IDENTITY() AS id;
      `;
      
      const params = {
        id,
        nome,
        email,
        celular,
        cpf,
        nascimento,
        genero,
        idade: idade || null,
        estado,
        cidade,
        bairro,
        nomeGrupo,
        etapaFunil,
        tags,
        dataCadastro: now,
        idUser: idUser || null
      };
      
      await db.query(query, params);
      
      return res.status(201).json(id);
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      res.status(500).json({ message: 'Erro ao criar lead', error: error.message });
    }
  });
  
  // Atualizar um lead
  router.put('/:id', validateToken, async (req, res) => {
    try {
      const {
        nome,
        email,
        celular,
        cpf,
        nascimento,
        genero,
        idade,
        estado,
        cidade,
        bairro,
        nomeGrupo,
        etapaFunil,
        tags
      } = req.body;
      
      // Validação básica
      if (!nome || !celular) {
        return res.status(400).json({ message: 'Nome e celular são obrigatórios' });
      }
      
      // Verificar se o lead existe
      const checkResult = await db.query('SELECT * FROM ImportedLeads WHERE id = @id', { id: req.params.id });
      
      if (!checkResult || checkResult.length === 0) {
        return res.status(404).json({ message: 'Lead não encontrado' });
      }
      
      const query = `
        UPDATE ImportedLeads SET
          nome = @nome, 
          email = @email, 
          celular = @celular, 
          cpf = @cpf, 
          nascimento = @nascimento, 
          genero = @genero, 
          idade = @idade,
          estado = @estado, 
          cidade = @cidade, 
          bairro = @bairro, 
          nomeGrupo = @nomeGrupo, 
          etapaFunil = @etapaFunil, 
          tags = @tags
        WHERE id = @id
      `;
      
      const params = {
        nome,
        email,
        celular,
        cpf,
        nascimento,
        genero,
        idade: idade || null,
        estado,
        cidade,
        bairro,
        nomeGrupo,
        etapaFunil,
        tags,
        id: req.params.id
      };
      
      await db.query(query, params);
      
      // Buscar o lead atualizado
      const updatedLead = await db.query('SELECT * FROM ImportedLeads WHERE id = @id', { id: req.params.id });
      
      res.json(updatedLead[0]);
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      res.status(500).json({ message: 'Erro ao atualizar lead', error: error.message });
    }
  });
  
  // Remover um lead
  router.delete('/delete/:id', validateToken, async (req, res) => {
    try {
      // Verificar se o lead existe
      const checkResult = await db.query('SELECT * FROM ImportedLeads WHERE id = @id', { id: req.params.id });
      
      if (!checkResult || checkResult.length === 0) {
        return res.status(404).json({ message: 'Lead não encontrado' });
      }
      
      await db.query('DELETE FROM ImportedLeads WHERE id = @id', { id: req.params.id });
      
      res.json({ message: 'Lead removido com sucesso' });
    } catch (error) {
      console.error('Erro ao remover lead:', error);
      res.status(500).json({ message: 'Erro ao remover lead', error: error.message });
    }
  });

  // Importar leads em massa
  router.post('/import', validateToken, async (req, res) => {
    try {
      const { leads, grupoNome } = req.body;
  
      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ message: 'Nenhum lead válido para importação' });
      }
  
      const validLeads = leads.filter(lead => lead.nome && lead.celular);
  
      if (validLeads.length === 0) {
        return res.status(400).json({ message: 'Nenhum lead válido para importação' });
      }
  
      const now = new Date();
      const idUser = req.user.id;
  
      const queryBase = `
        INSERT INTO ImportedLeads (
          Id, Nome, Email, Celular, Cpf, Nascimento, Genero, Idade,
          Estado, Cidade, Bairro, NomeGrupo, EtapaFunil, Tags, DataCadastro, IdUser
        ) VALUES 
      `;
  
      const valuesClause = [];
      const params = {};
  
      validLeads.forEach((lead, index) => {
        // Gerar um ID numérico único para bigint
        const id = uuidv4();
  
        const paramPrefix = `lead${index}`;
  
        valuesClause.push(`(
          @${paramPrefix}_id, @${paramPrefix}_nome, @${paramPrefix}_email, @${paramPrefix}_celular, 
          @${paramPrefix}_cpf, @${paramPrefix}_nascimento, @${paramPrefix}_genero, @${paramPrefix}_idade,
          @${paramPrefix}_estado, @${paramPrefix}_cidade, @${paramPrefix}_bairro, 
          @${paramPrefix}_nomeGrupo, @${paramPrefix}_etapaFunil, @${paramPrefix}_tags, 
          @${paramPrefix}_dataCadastro, @${paramPrefix}_idUser
        )`);
  
        // Garantir que o ID seja um número (bigint)
        params[`${paramPrefix}_id`] = id;
        params[`${paramPrefix}_nome`] = lead.nome || '';
        params[`${paramPrefix}_email`] = lead.email || '';
        params[`${paramPrefix}_celular`] = (""+lead.celular) || '';
        params[`${paramPrefix}_cpf`] = lead.cpf || '';
        
        // Tratar data de nascimento
        params[`${paramPrefix}_nascimento`] = lead.nascimento ? new Date(lead.nascimento) : null;
        
        params[`${paramPrefix}_genero`] = lead.genero || '';
        
        // Garantir que idade seja um número ou null
        params[`${paramPrefix}_idade`] = lead.idade ? parseInt(lead.idade, 10) : null;
        
        params[`${paramPrefix}_estado`] = lead.estado || '';
        params[`${paramPrefix}_cidade`] = lead.cidade || '';
        params[`${paramPrefix}_bairro`] = lead.bairro || '';
        params[`${paramPrefix}_nomeGrupo`] = grupoNome || '';
        params[`${paramPrefix}_etapaFunil`] = lead.etapaFunil || '';
        params[`${paramPrefix}_tags`] = lead.tags || '';
        params[`${paramPrefix}_dataCadastro`] = now;
        
        params[`${paramPrefix}_idUser`] = idUser;
      });
  
      const fullQuery = queryBase + valuesClause.join(", ");
  
      await db.query(fullQuery, params);
  
      res.status(201).json({ 
        message: 'Leads importados com sucesso', 
        imported: validLeads.length
      });
  
    } catch (error) {
      console.error('Erro ao importar leads:', error);
      res.status(500).json({ message: 'Erro ao importar leads', error: error.message });
    }
  });
module.exports = router;