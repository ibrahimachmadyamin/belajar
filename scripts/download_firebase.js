const fs = require('fs');
const https = require('https');

const url = 'https://firestore.googleapis.com/v1/projects/aplikasi-belajar-ai/databases/(default)/documents/questions?pageSize=1000';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const questions = json.documents ? json.documents.map(doc => {
        const fields = doc.fields;
        
        // Handle potentially missing fields safely
        if (!fields) return null;
        
        return {
          id: doc.name.split('/').pop(),
          question: fields.question?.stringValue || "",
          correctAnswerIndex: parseInt(fields.correctAnswerIndex?.integerValue || "0"),
          explanation: fields.explanation?.stringValue || "",
          options: fields.options?.arrayValue?.values?.map(v => v.stringValue) || []
        };
      }).filter(Boolean) : [];
      
      fs.writeFileSync('soal_lama_dari_firebase.json', JSON.stringify(questions, null, 2));
      console.log(`Berhasil mengunduh ${questions.length} soal lama dari Firebase! File disimpan sebagai soal_lama_dari_firebase.json`);
    } catch (e) {
      console.error("Gagal mem-parsing data Firebase:", e);
    }
  });
}).on('error', (err) => {
  console.error("Error jaringan saat menghubungi Firebase: " + err.message);
});
