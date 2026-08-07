const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ARQUIVO_ACESSOS = path.join(__dirname, 'acessos.json');

// Configuração para permitir acesso do front-end (CORS) e processar JSON
app.use(cors());
app.use(express.json());

// Rota para receber os dados de geolocalização
app.post('/api/localizacao', async (req, res) => {
    // Pegando IP do front-end (ipify) ou caindo para o IP da conexão
    const clientIp = req.body.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { latitude, longitude, accuracy, timestamp } = req.body;

    // Se os dados essenciais estiverem ausentes
    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Dados de localização incompletos.' });
    }

    const dataHora = timestamp ? new Date(timestamp).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR');
    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    // Montando o objeto de registro
    const novoRegistro = {
        dataHora,
        ip: clientIp,
        latitude,
        longitude,
        precisao: accuracy ? `${accuracy.toFixed(2)} metros` : 'Desconhecida',
        googleMapsLink
    };

    // Registrando no console conforme as instruções
    console.log('\n=============================================');
    console.log('📍 NOVA LOCALIZAÇÃO REGISTRADA');
    console.log('=============================================');
    console.log(`🕒 Data/Hora : ${novoRegistro.dataHora}`);
    console.log(`🌐 IP        : ${novoRegistro.ip}`);
    console.log(`📏 Precisão  : ${novoRegistro.precisao}`);
    console.log(`📍 Latitude  : ${novoRegistro.latitude}`);
    console.log(`📍 Longitude : ${novoRegistro.longitude}`);
    console.log(`🔗 Maps Link : ${novoRegistro.googleMapsLink}`);
    
    try {
        // Lógica para adicionar no arquivo JSON
        let acessos = [];
        try {
            // Tenta ler o arquivo existente
            const fileData = await fs.readFile(ARQUIVO_ACESSOS, 'utf8');
            acessos = JSON.parse(fileData);
        } catch (error) {
            // Se o arquivo não existir (ou erro ao ler), continua com array vazio
            if (error.code !== 'ENOENT') {
                console.error('Erro ao ler acessos.json:', error);
                return res.status(500).json({ error: 'Erro interno ao processar o banco de acessos.' });
            }
        }

        // Adiciona o novo registro ao array
        acessos.push(novoRegistro);

        // Salva o array atualizado no arquivo
        await fs.writeFile(ARQUIVO_ACESSOS, JSON.stringify(acessos, null, 2), 'utf8');
        console.log('✅ Dados salvos com sucesso no arquivo acessos.json');
        console.log('=============================================\n');

        // Responder com sucesso
        return res.status(200).json({ success: true, message: 'Localização registrada com sucesso.' });

    } catch (fsError) {
        console.error('❌ Erro de escrita no arquivo acessos.json:', fsError);
        console.log('=============================================\n');
        return res.status(500).json({ error: 'Erro ao gravar os dados de localização no servidor.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`Aguardando conexões em http://localhost:${PORT}/api/localizacao...`);
});
