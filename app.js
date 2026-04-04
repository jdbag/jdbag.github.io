// ===== YOUR DICTIONARY - app.js (Translation & Search) =====

// دالة البحث في القاموس
async function searchWord(word = null) {
    const query = word || document.getElementById('searchInput').value;
    if (!query) return;
    const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    
    try {
        const response = await fetch(`${API_BASE}${query}`);
        const data = await response.json();
        if (data.title) {
            alert("Word not found in dictionary.");
        } else {
            alert("Meaning: " + data[0].meanings[0].definitions[0].definition);
        }
    } catch (e) { console.error(e); }
}

// دالة الترجمة (تستخدم محرك MyMemory المجاني)
async function startTranslate() {
    const text = document.getElementById('transInput').value;
    const resultDiv = document.getElementById('transResult');
    
    if (!text) return;
    
    resultDiv.innerText = "Translating... / جاري الترجمة...";
    
    try {
        // نستخدم API مجاني للترجمة من الإنجليزية للعربية أو العكس
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ar`);
        const data = await response.json();
        
        if (data.responseData) {
            resultDiv.innerText = data.responseData.translatedText;
        } else {
            resultDiv.innerText = "Error in translation. Try again.";
        }
    } catch (error) {
        resultDiv.innerText = "Connection error.";
        console.error(error);
    }
}
