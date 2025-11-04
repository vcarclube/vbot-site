const express = require('express');
const router = express.Router();
const db = require('../database');
const { validateToken } = require('../middlewares/AuthMiddleware');
const { v4: uuidv4 } = require('uuid');

// Obter todas as campanhas

router.get('/', validateToken, async (req, res) => {
    try {
        const query = `
        SELECT 
          c.*,
          m.Id as MessageId,
          m.IdCampaign as MessageIdCampaign,
          m.message
        FROM Campaigns c
        LEFT JOIN CampaignMessageTemplate m ON c.Id = m.IdCampaign
        WHERE c.idUser = @idUser
        ORDER BY c.CreatedAt DESC
      `;

        const result = await db.query(query, { idUser: req.user.id });
        const rows = result.recordsets[0];

        // Agrupa os resultados por campanha
        const campanhasMap = new Map();

        rows.forEach(row => {
            const campaignId = row.Id;

            if (!campanhasMap.has(campaignId)) {
                // Cria a campanha com suas propriedades básicas
                const { MessageId, MessageIdCampaign, message, ...campaignData } = row;

                campanhasMap.set(campaignId, {
                    ...campaignData,
                    Messages: []
                });
            }

            // Adiciona a mensagem se existir
            if (row.MessageId) {
                campanhasMap.get(campaignId).Messages.push({
                    Id: row.MessageId,
                    IdCampaign: row.MessageIdCampaign,
                    message: row.message
                });
            }
        });

        // Converte o Map para array
        const campanhas = Array.from(campanhasMap.values());

        return res.status(200).json(campanhas);
    } catch (error) {
        console.error('Erro ao buscar campanhas:', error);
        res.status(500).json({ message: 'Erro ao buscar campanhas', error: error.message });
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

        // Validação básica (tornar Groups, Messages e EndDate opcionais)
        if (!Name || !StartDate || !Status) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes: Name, StartDate e Status' });
        }

        // Validar datas
        const inicio = new Date(StartDate);
        const fim = EndDate ? new Date(EndDate) : null;

        if (fim && inicio >= fim) {
            return res.status(400).json({ message: 'A data de início deve ser anterior à data de fim' });
        }

        const campaignId = uuidv4();
        const now = new Date();

        // INSERT da nova campanha
        const insertQuery = `
            INSERT INTO Campaigns (
                id, name, templateMessage, startDate, endDate,
                status, createdAt, Groups, idUser
            ) VALUES (
                @id, @name, @templateMessage, @startDate, @endDate,
                @status, @createdAt, @Groups, @idUser
            )
        `;

        const insertParams = {
            id: campaignId,
            name: Name,
            templateMessage: "",
            startDate: inicio,
            endDate: fim,
            status: Status,
            createdAt: now,
            Groups: (Array.isArray(Groups) && Groups.length > 0) ? Groups.join("|") : null,
            idUser: req.user.id
        };

        await db.query(insertQuery, insertParams);

        // BULK INSERT das mensagens
        if (Messages && Messages.length > 0) {
            const messageValues = Messages.map((message) =>
                `('${uuidv4()}', '${campaignId}', '${message.replace(/'/g, "''")}')`
            ).join(', ');

            const bulkInsertQuery = `
                INSERT INTO CampaignMessageTemplate (Id, IdCampaign, message) 
                VALUES ${messageValues}
            `;

            await db.query(bulkInsertQuery);
        }

        // Inserção de leads baseada em grupos (opcional)
        if (Array.isArray(Groups) && Groups.length > 0) {
            const includeNoGroup = Groups.includes('sem-grupo');
            const actualGroups = Groups.filter(g => g !== 'sem-grupo');

            let importedLeadsQuery = `SELECT Nome, Celular FROM ImportedLeads WHERE idUser = @idUser`;
            const importedLeadsParams = { idUser: req.user.id };

            if (actualGroups.length > 0) {
                const placeholders = actualGroups.map((_, idx) => `@group${idx}`).join(', ');
                importedLeadsQuery += ` AND NomeGrupo IN (${placeholders})`;
                actualGroups.forEach((group, idx) => {
                    importedLeadsParams[`group${idx}`] = group;
                });
            }
            if (includeNoGroup) {
                importedLeadsQuery += ` ${actualGroups.length > 0 ? 'OR' : 'AND'} (NomeGrupo IS NULL OR NomeGrupo = '')`;
            }

            const importedLeadsResult = await db.query(importedLeadsQuery, importedLeadsParams);
            const importedLeads = importedLeadsResult.recordset;

            if (importedLeads.length > 0) {
                const leadValues = importedLeads.map(lead =>
                    `('${uuidv4()}', '${campaignId}', '${lead.Nome.replace(/'/g, "''")}', '${lead.Celular?.replace("(","")?.replace(")", "")?.replace("-", "")?.replace(" ", "")}', 'Pendente', null)`
                ).join(', ');

                const insertLeadsQuery = `
                    INSERT INTO Leads (Id, CampaignId, Name, PhoneNumber, Status, SentDate) 
                    VALUES ${leadValues}
                `;

                await db.query(insertLeadsQuery);
            }

            // Atualiza ImportedLeads para prospecção nos grupos selecionados
            let updateImportedLeadsQuery = `UPDATE ImportedLeads SET EtapaFunil = @EtapaFunil WHERE idUser = @idUser`;
            const paramsLeads = { EtapaFunil: 'Prospecção', idUser: req.user.id };

            if (actualGroups.length > 0) {
                const placeholders = actualGroups.map((_, idx) => `@group${idx}`).join(', ');
                updateImportedLeadsQuery += ` AND NomeGrupo IN (${placeholders})`;
                actualGroups.forEach((group, idx) => {
                    paramsLeads[`group${idx}`] = group;
                });
            }
            if (includeNoGroup) {
                updateImportedLeadsQuery += ` ${actualGroups.length > 0 ? 'OR' : 'AND'} (NomeGrupo IS NULL OR NomeGrupo = '')`;
            }

            await db.query(updateImportedLeadsQuery, paramsLeads);
        }

        return res.status(201).json({
            success: true,
            id: campaignId,
            message: 'Campanha criada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao criar campanha:', error);
        res.status(500).json({
            message: 'Erro ao criar campanha',
            error: error.message
        });
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

        // Validação básica (tornar Groups, Messages e EndDate opcionais)
        if (!Name || !StartDate || !Status) {
            return res.status(400).json({ message: 'Campos obrigatórios ausentes: Name, StartDate e Status' });
        }

        // Validar datas
        const inicio = new Date(StartDate);
        const fim = EndDate ? new Date(EndDate) : null;

        if (fim && inicio >= fim) {
            return res.status(400).json({ message: 'A data de início deve ser anterior à data de fim' });
        }

        const campaignId = req.params.id;

        // Verificar se a campanha existe e pertence ao usuário
        const checkQuery = `
            SELECT id FROM Campaigns 
            WHERE id = @id AND idUser = @idUser
        `;

        const checkResult = await db.query(checkQuery, {
            id: campaignId,
            idUser: req.user.id
        });

        if (!checkResult.recordsets[0] || checkResult.recordsets[0].length === 0) {
            return res.status(404).json({ message: 'Campanha não encontrada' });
        }

        // Atualizar a campanha
        const updateQuery = `
            UPDATE Campaigns SET
                name = @name,
                startDate = @startDate,
                endDate = @endDate,
                status = @status,
                Groups = @Groups
            WHERE id = @id AND idUser = @idUser
        `;

        const updateParams = {
            id: campaignId,
            name: Name,
            startDate: inicio,
            endDate: fim,
            status: Status,
            Groups: (Array.isArray(Groups) && Groups.length > 0) ? Groups.join("|") : null,
            idUser: req.user.id
        };

        await db.query(updateQuery, updateParams);

        // Excluir todas as mensagens anteriores da campanha
        const deleteMessagesQuery = `DELETE FROM CampaignMessageTemplate WHERE IdCampaign = @IdCampaign`;
        await db.query(deleteMessagesQuery, { IdCampaign: campaignId });

        // BULK INSERT das novas mensagens
        if (Messages && Messages.length > 0) {
            const messageValues = Messages.map((message) => 
                `('${uuidv4()}', '${campaignId}', '${message.replace(/'/g, "''")}')`
            ).join(', ');

            const bulkInsertQuery = `
                INSERT INTO CampaignMessageTemplate (Id, IdCampaign, message) 
                VALUES ${messageValues}
            `;

            await db.query(bulkInsertQuery);
        }

        // Excluir todos os leads da campanha
        const deleteLeadsQuery = `DELETE FROM Leads WHERE CampaignId = @CampaignId`;
        await db.query(deleteLeadsQuery, { CampaignId: campaignId });

        // Inserir novamente leads conforme grupos (se fornecidos)
        if (Array.isArray(Groups) && Groups.length > 0) {
            const includeNoGroup = Groups.includes('sem-grupo');
            const actualGroups = Groups.filter(g => g !== 'sem-grupo');

            let importedLeadsQuery = `SELECT Nome, Celular FROM ImportedLeads WHERE idUser = @idUser`;
            const importedLeadsParams = { idUser: req.user.id };

            if (actualGroups.length > 0) {
                const placeholders = actualGroups.map((_, idx) => `@group${idx}`).join(', ');
                importedLeadsQuery += ` AND NomeGrupo IN (${placeholders})`;
                actualGroups.forEach((group, idx) => {
                    importedLeadsParams[`group${idx}`] = group;
                });
            }
            if (includeNoGroup) {
                importedLeadsQuery += ` ${actualGroups.length > 0 ? 'OR' : 'AND'} (NomeGrupo IS NULL OR NomeGrupo = '')`;
            }

            const importedLeadsResult = await db.query(importedLeadsQuery, importedLeadsParams);
            const importedLeads = importedLeadsResult.recordset;

            if (importedLeads.length > 0) {
                const leadValues = importedLeads.map(lead =>
                    `('${uuidv4()}', '${campaignId}', '${lead.Nome.replace(/'/g, "''")}', '${lead.Celular}', 'Pendente', null)`
                ).join(', ');

                const insertLeadsQuery = `
                    INSERT INTO Leads (Id, CampaignId, Name, PhoneNumber, Status, SentDate) 
                    VALUES ${leadValues}
                `;

                await db.query(insertLeadsQuery);
            }
        }

        // Resposta final
        res.status(200).json({
            success: true,
            message: 'Campanha atualizada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar campanha:', error);
        return res.status(500).json({
            message: 'Erro ao atualizar campanha',
            error: error.message
        });
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
            DELETE FROM Leads WHERE CampaignId = @id;

            DELETE FROM Campaigns 
            WHERE id = @id AND idUser = @idUser;
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