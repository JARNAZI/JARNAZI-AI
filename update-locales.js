const fs = require('fs');
const files = fs.readdirSync('src/i18n/dictionaries').filter(f => f.endsWith('.ts'));

const translations = {
    'es.ts': `
    fullDebate: "Debate Completo",
    consensusOnly: "Solo Consenso",
    agreementTitle: "Acuerdo",
    imageGenSuccess: "Imagen generada correctamente. Se eliminará después de 3 días.",
    imageGenStarted: "Generación de imagen iniciada.",
    videoGenSuccess: "Video generado correctamente. Se eliminará después de 3 días.",
    longVideoGenSuccess: "Video largo generado. Se reproducirá de forma continua y se eliminará después de 3 días.",
    videoGenStarted: "Generación de video iniciada. Su video aparecerá aquí cuando esté listo.",
    deletedAfter3DaysInfo: "Todos los debates y medios se mantienen durante 3 días antes de eliminarse automáticamente para proteger la privacidad."
  `,
    'it.ts': `
    fullDebate: "Dibattito Completo",
    consensusOnly: "Solo Consenso",
    agreementTitle: "Accordo",
    imageGenSuccess: "Immagine generata con successo. Verrà eliminata dopo 3 giorni.",
    imageGenStarted: "Generazione immagine avviata.",
    videoGenSuccess: "Video generato con successo. Verrà eliminato dopo 3 giorni.",
    longVideoGenSuccess: "Video lungo generato. Verrà riprodotto in continuo e sarà eliminato dopo 3 giorni.",
    videoGenStarted: "Generazione video avviata. Il tuo video apparirà qui quando pronto.",
    deletedAfter3DaysInfo: "Tutti i dibattiti e i media vengono conservati per 3 giorni prima dell'eliminazione automatica per proteggere la privacy."
  `,
    'ja.ts': `
    fullDebate: "全討論",
    consensusOnly: "合意のみ",
    agreementTitle: "合意",
    imageGenSuccess: "画像が正常に生成されました。3日後に削除されます。",
    imageGenStarted: "画像の生成が開始されました。",
    videoGenSuccess: "ビデオが正常に生成されました。3日後に削除されます。",
    longVideoGenSuccess: "長いビデオが生成されました。継続的に再生され、3日後に削除されます。",
    videoGenStarted: "ビデオの生成が開始されました。準備ができるとここに表示されます。",
    deletedAfter3DaysInfo: "すべての討論とメディアはプライバシーを保護するため3日間保持された後、自動的に削除されます。"
  `,
    'pt.ts': `
    fullDebate: "Debate Completo",
    consensusOnly: "Apenas Consenso",
    agreementTitle: "Acordo",
    imageGenSuccess: "Imagem gerada com sucesso. Será excluída após 3 dias.",
    imageGenStarted: "Geração de imagem iniciada.",
    videoGenSuccess: "Vídeo gerado com sucesso. Será excluído após 3 dias.",
    longVideoGenSuccess: "Vídeo longo gerado. Será reproduzido continuamente e será excluído após 3 dias.",
    videoGenStarted: "Geração de vídeo iniciada. Seu vídeo aparecerá aqui quando estiver pronto.",
    deletedAfter3DaysInfo: "Todos os debates e mídias são guardados por 3 dias antes da exclusão automática para proteger a privacidade."
  `,
    'sv.ts': `
    fullDebate: "Hela debatten",
    consensusOnly: "Endast konsensus",
    agreementTitle: "Överenskommelse",
    imageGenSuccess: "Bilden genererades. Den kommer att raderas efter 3 dagar.",
    imageGenStarted: "Bildgenerering startad.",
    videoGenSuccess: "Video genererad. Den kommer att raderas efter 3 dagar.",
    longVideoGenSuccess: "Lång video genererad. Den spelas upp kontinuerligt och raderas efter 3 dagar.",
    videoGenStarted: "Videogenerering startad. Din video visas här när den är klar.",
    deletedAfter3DaysInfo: "Alla debatter och media sparas i 3 dagar före automatisk radering för att skydda integriteten."
  `
};

files.forEach(f => {
    if (translations[f]) {
        let content = fs.readFileSync('src/i18n/dictionaries/' + f, 'utf-8');

        if (!content.includes('deletedAfter3DaysInfo')) {
            // Replace 'deleteAccount: "..."\n  },' with 'deleteAccount: "...",' + translations + '\n  },'
            content = content.replace(/(deleteAccount:\s*".*?"?)(\r?\n\s*\})/, (match, p1, p2) => {
                return p1 + ',' + translations[f] + p2;
            });

            fs.writeFileSync('src/i18n/dictionaries/' + f, content);
            console.log('Fixed ' + f);
        }
    }
});
