firebase.initializeApp(window.firebaseConfig);
const db = firebase.firestore();
const messagesEl = document.getElementById('messages');
const typingIndicator = document.getElementById('typing-indicator');
const composer = document.getElementById('composer');
const inputName = document.getElementById('input-name');
const inputText = document.getElementById('input-text');
const sendBtn = document.getElementById('send-btn');

let convId = null;
function makeConvId(name){
  // простая генерация: имя + время
  return `${name.replace(/\s+/g,'_')}_${Date.now()}`;
}

composer.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const name = inputName.value.trim();
  const text = inputText.value.trim();
  if(!name || !text) return alert('Введите имя и сообщение');
  if(!convId) convId = makeConvId(name);

  const docRef = db.collection('conversations').doc(convId);
  await docRef.set({createdAt: firebase.firestore.FieldValue.serverTimestamp(), name});
  const msgCol = docRef.collection('messages');
  await msgCol.add({
    from: 'user',
    name,
    text,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    status: 'sent'
  });

  inputText.value = '';
  renderLocalMessage('user', name, text);
  listenForResponses(docRef);
});

function renderLocalMessage(from, name, text){
  const el = document.createElement('div');
  el.className = 'message ' + (from==='user' ? 'msg-user' : 'msg-ai');
  el.innerText = (from==='user' ? `${name}: ` : 'ИИ: ') + text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

let unsubscribe = null;
function listenForResponses(docRef){
  if(unsubscribe) unsubscribe();
  unsubscribe = docRef.collection('messages').orderBy('createdAt').onSnapshot(snapshot=>{
    snapshot.docChanges().forEach(change=>{
      const data = change.doc.data();
      if(change.type === 'added'){
        if(data.from === 'ai'){
          // показать индикатор пока не помечено delivered
          typingIndicator.classList.add('hidden');
          renderLocalMessage('ai','ИИ',data.text);
        } else if(data.from === 'typing'){
          // показать индикатор
          typingIndicator.classList.remove('hidden');
        }
      }
    });
  });
}

firebase.initializeApp(window.firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


