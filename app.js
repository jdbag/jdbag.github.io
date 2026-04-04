// ===== YOUR DICTIONARY - app.js =====
function searchWord(word = null) {
  const query = word || document.getElementById('searchInput').value;
  if (!query) return;
  
  // سيتم ربط API القاموس هنا لاحقاً
  alert("Searching for: " + query);
  
  // حفظ في السجل المحلي
  let recent = JSON.parse(localStorage.getItem('yd_recent') || '[]');
  if(!recent.includes(query)) {
    recent.unshift(query);
    localStorage.setItem('yd_recent', JSON.stringify(recent.slice(0, 5)));
  }
}
