firebase.initializeApp(window.firebaseConfig);
const db = firebase.firestore();

const listEl = document.getElementById('conversations-list');
const adminMessages = document.getElementById('admin-messages');
const replyForm = document.getElementById('reply-form');
const replyText = document.getElementById('reply-text');
const adminTyping = document.getElementById('admin-typing');

let currentConvRef = null;
let messagesUnsub = null;

// Загрузить список разговоров
async function loadConversations(){
  const snap = await db.collection('conversations').orderBy('createdAt','desc').limit(50).get();
  listEl.innerHTML = '';
  snap.forEach(doc=>{
    const data = doc.data();
    const item = document.createElement('div');
    item.className='convo-item';
    item.textContent = `${data.name} — ${doc.id.split('_')[1] || ''}`;
    item.onclick = ()=>openConversation(doc.id);
    listEl.appendChild(item);
  });
}
loadConversations();

// Открыть разговор
async function openConversation(convId){
  if(messagesUnsub) messagesUnsub();
  adminMessages.innerHTML = '';
  currentConvRef = db.collection('conversations').doc(convId);
  messagesUnsub = currentConvRef.collection('messages').orderBy('createdAt').onSnapshot(snap=>{
    adminMessages.innerHTML = '';
    snap.forEach(d=>{
      const m = d.data();
      const el = document.createElement('div');
      el.className = 'message ' + (m.from === 'user' ? 'msg-user' : 'msg-ai');
      el.textContent = (m.from==='user' ? `${m.name}: ` : 'ИИ: ') + m.text;
      adminMessages.appendChild(el);
    });
    adminMessages.scrollTop = adminMessages.scrollHeight;
  });
}

// Ответить как ИИ
replyForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(!currentConvRef) return alert('Откройте разговор слева');
  const text = replyText.value.trim();
  if(!text) return;
  // ставим индикатор typing в коллекции
  await currentConvRef.collection('messages').add({
    from: 'typing',
    text: '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  // показываем в админ-панели индикатор печати
  adminTyping.classList.remove('hidden');

  // эмуляция набора: можно не ждать
  // удаляем typing и добавляем реальное сообщение
  await currentConvRef.collection('messages').add({
    from: 'ai',
    text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });

  // удаляем typing-статус (реализацию: можно оставить, clients должны слушать)
  // (в реальной системе ставим флаг delivered)
  adminTyping.classList.add('hidden');
  replyText.value = '';
});
