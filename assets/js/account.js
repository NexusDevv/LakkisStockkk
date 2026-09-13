/* Existing Firebase account and ticket integration, loaded only when needed.
   Collections and fields remain compatible with admin.html. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const ui = window.StoreUI;
  if (!ui) return;
  let auth, db, loadPromise, currentUser = null;
  let tickets = [], ticketUnsubscribe = null, threadUnsubscribe = null, activeTicketId = null;
  let supportView = 'new';
  const base = 'https://www.gstatic.com/firebasejs/10.13.0/';
  function status(id, message, type = '') {
    const el = $(id);el.textContent=message;el.className=`notice ${type}`;el.hidden=!message;
  }
  const errorText = error => ({
    'auth/invalid-credential':'The email or password is incorrect. Please try again.',
    'auth/wrong-password':'The email or password is incorrect. Please try again.',
    'auth/user-not-found':'The email or password is incorrect. Please try again.',
    'auth/email-already-in-use':'An account already uses this email. Sign in or reset your password.',
    'auth/invalid-email':'Please enter a valid email address.',
    'auth/weak-password':'Please use a password with at least 6 characters.',
    'auth/too-many-requests':'Too many attempts. Please wait a while before trying again.',
    'auth/popup-blocked':'Your browser blocked the sign-in window. Allow the popup or sign in with email.',
    'auth/unauthorized-domain':'Sign-in is not available on this address. Please use the live store or WhatsApp.',
    'auth/network-request-failed':'Couldn’t connect. Check your connection and try again.',
    'permission-denied':'This request could not be completed. Please contact us on WhatsApp.',
    'unavailable':'Couldn’t reach account services. Try again, or contact us on WhatsApp.'
  }[error?.code] || 'Something went wrong. Please try again, or contact us on WhatsApp.');
  function loadScript(name) {
    return new Promise((resolve,reject) => {
      const script = document.createElement('script');
      script.src = `${base}${name}`;script.async=true;
      const timer = setTimeout(() => {script.remove();reject({code:'unavailable'});},12000);
      script.onload = () => {clearTimeout(timer);resolve();};
      script.onerror = () => {clearTimeout(timer);script.remove();reject({code:'unavailable'});};
      document.head.appendChild(script);
    });
  }
  async function ensureServices() {
    if (loadPromise) return loadPromise;
    if (auth && db) return;
    loadPromise = (async () => {
      if (!window.firebase) await loadScript('firebase-app-compat.js');
      if (!window.firebase.auth) await loadScript('firebase-auth-compat.js');
      if (!window.firebase.firestore) await loadScript('firebase-firestore-compat.js');
      if (!window.firebase.apps.length) window.firebase.initializeApp(window.LAKKIS_FIREBASE_CONFIG);
      auth = window.firebase.auth();db = window.firebase.firestore();
      await new Promise(resolve => {
        let initial = true;
        auth.onAuthStateChanged(user => {
          currentUser = user;renderAccount();
          if (!user) {stopTickets();stopThread();tickets=[];$('#tickets-list').replaceChildren();$('#thread-messages').replaceChildren();$('#thread-subject').textContent='';}
          if ($('#support-dialog').open) {renderSupportAccess();if(user) listenTickets();}
          if(initial){initial=false;resolve();}
        });
      });
    })().catch(error => {loadPromise=null;throw error;});
    return loadPromise;
  }
  function renderAccount() {
    $('#signed-out-pane').hidden = !!currentUser;
    $('#signed-in-pane').hidden = !currentUser;
    $('#account-title').textContent = currentUser ? 'Your account.' : 'Welcome back.';
    if(currentUser){$('#account-name').textContent=currentUser.displayName || 'Welcome back';$('#account-email').textContent=currentUser.email || '';}
    document.querySelectorAll('[data-open-account]').forEach(button => button.setAttribute('aria-haspopup','dialog'));
  }
  function authTab(signup) {
    $('#signin-form').hidden=signup;$('#signup-form').hidden=!signup;
    $('#signin-tab').classList.toggle('active',!signup);$('#signup-tab').classList.toggle('active',signup);
    $('#signin-tab').setAttribute('aria-pressed',String(!signup));$('#signup-tab').setAttribute('aria-pressed',String(signup));
    status('#auth-status','');
  }
  async function openAccount() {
    status('#auth-status','Connecting to your account…');ui.openDialog($('#account-dialog'));
    try{await ensureServices();status('#auth-status','');renderAccount();}
    catch(error){status('#auth-status',errorText(error),'error');}
  }
  function renderSupportAccess() {
    $('#support-signin-prompt').hidden=!!currentUser;
    $('#support-workspace').hidden=!currentUser;
  }
  async function openSupport() {
    supportView='new';setSupportView('new');renderSupportAccess();
    status('#support-status','Connecting to support…');ui.openDialog($('#support-dialog'));
    try{await ensureServices();status('#support-status','');renderSupportAccess();if(currentUser && $('#support-dialog').open) listenTickets();}
    catch(error){status('#support-status',errorText(error),'error');}
  }
  async function runAction(button, label, statusId, action) {
    const original=button.textContent;button.disabled=true;button.textContent=label;status(statusId,'');
    try{await ensureServices();await action();}
    catch(error){if(error?.code !== 'auth/popup-closed-by-user')status(statusId,errorText(error),'error');}
    finally{button.disabled=false;button.textContent=original;}
  }
  async function saveUser(user) {
    try {
      await db.collection('users').doc(user.uid).set({name:user.displayName || '',email:user.email,updatedAt:window.firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    } catch { /* Account login remains successful if the optional profile write fails. */ }
  }
  $('#signin-form').addEventListener('submit',event => {
    event.preventDefault();
    runAction(event.submitter,'Signing in…','#auth-status',async () => {
      await auth.signInWithEmailAndPassword($('#signin-email').value.trim(),$('#signin-password').value);
      $('#signin-form').reset();status('#auth-status','You’re signed in.','success');renderAccount();
    });
  });
  $('#signup-form').addEventListener('submit',event => {
    event.preventDefault();
    runAction(event.submitter,'Creating account…','#auth-status',async () => {
      const name=$('#signup-name').value.trim();
      if(!name){$('#signup-name').focus();status('#auth-status','Please enter your name.','error');return;}
      const result=await auth.createUserWithEmailAndPassword($('#signup-email').value.trim(),$('#signup-password').value);
      await result.user.updateProfile({displayName:name});currentUser=result.user;await saveUser(result.user);
      $('#signup-form').reset();status('#auth-status','Your account is ready.','success');renderAccount();
    });
  });
  $('#google-signin').addEventListener('click',event => {
    // SDK loading begins when the account dialog opens; the popup is still
    // initiated by this explicit user action.
    runAction(event.currentTarget,'Opening Google…','#auth-status',async () => {
      const provider=new window.firebase.auth.GoogleAuthProvider();
      const result=await auth.signInWithPopup(provider);currentUser=result.user;await saveUser(result.user);
      status('#auth-status','You’re signed in.','success');renderAccount();
    });
  });
  $('#reset-password').addEventListener('click',event => {
    const email=$('#signin-email');
    if(!email.value.trim() || !email.checkValidity()){email.reportValidity();email.focus();status('#auth-status','Enter your email above, then choose “Forgot password?”.','error');return;}
    runAction(event.currentTarget,'Sending…','#auth-status',async () => {await auth.sendPasswordResetEmail(email.value.trim());status('#auth-status','If an account uses this email, you’ll receive password reset instructions.','success');});
  });
  $('#signout-button').addEventListener('click',event => runAction(event.currentTarget,'Signing out…','#auth-status',async () => {await auth.signOut();status('#auth-status','You’re signed out.','success');}));
  $('#signin-tab').addEventListener('click',() => authTab(false));
  $('#signup-tab').addEventListener('click',() => authTab(true));
  document.addEventListener('click',event => {
    if(event.target.closest('[data-open-account]'))openAccount();
    if(event.target.closest('[data-open-support]'))openSupport();
  });
  function stopTickets(){if(ticketUnsubscribe){ticketUnsubscribe();ticketUnsubscribe=null;}}
  function stopThread(){activeTicketId=null;if(threadUnsubscribe){threadUnsubscribe();threadUnsubscribe=null;}}
  function dateText(timestamp){return timestamp?.toDate ? timestamp.toDate().toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}) : 'Just now';}
  function listenTickets(){
    stopTickets();if(!currentUser)return;
    const uid=currentUser.uid;
    $('#tickets-list').textContent='Loading your tickets…';
    ticketUnsubscribe=db.collection('supportTickets').where('uid','==',uid).onSnapshot(snapshot => {
      if(currentUser?.uid !== uid)return;
      tickets=snapshot.docs.map(doc => ({...doc.data(),id:doc.id}));
      tickets.sort((a,b) => ((b.lastMessageAt||b.createdAt)?.toMillis?.()||0)-((a.lastMessageAt||a.createdAt)?.toMillis?.()||0));
      $('#ticket-unread').hidden=!tickets.some(t=>t.unreadForUser);
      renderTickets();
    }, error => {$('#tickets-list').textContent='Your tickets couldn’t be loaded. Please try again or message us on WhatsApp.';status('#support-status',errorText(error),'error');});
  }
  function renderTickets(){
    if(!tickets.length){$('#tickets-list').innerHTML='<p>No tickets yet. Open a new ticket and we’ll help you here.</p>';return;}
    const fragment=document.createDocumentFragment();
    for(const ticket of tickets){
      const button=document.createElement('button');button.type='button';button.className='ticket-row';
      const title=document.createElement('strong');title.textContent=ticket.subject || 'Support ticket';
      const state=document.createElement('b');state.textContent=ticket.unreadForUser ? 'New reply' : ticket.status === 'resolved' ? 'Resolved' : 'Open';
      const top=document.createElement('span');top.append(title,state);
      const date=document.createElement('small');date.textContent=dateText(ticket.lastMessageAt||ticket.createdAt);
      button.append(top,date);button.addEventListener('click',()=>openThread(ticket.id));fragment.append(button);
    }
    $('#tickets-list').replaceChildren(fragment);
  }
  function setSupportView(view){
    stopThread();supportView=view;
    $('#support-form').hidden=view!=='new';$('#tickets-list').hidden=view!=='mine';$('#ticket-thread').hidden=true;
    $('#new-ticket-tab').classList.toggle('active',view==='new');$('#my-tickets-tab').classList.toggle('active',view==='mine');
    $('#new-ticket-tab').setAttribute('aria-pressed',String(view==='new'));$('#my-tickets-tab').setAttribute('aria-pressed',String(view==='mine'));
  }
  $('#new-ticket-tab').addEventListener('click',()=>{setSupportView('new');status('#support-status','');});
  $('#my-tickets-tab').addEventListener('click',()=>{setSupportView('mine');status('#support-status','');});
  $('#back-to-tickets').addEventListener('click',()=>{setSupportView('mine');$('#my-tickets-tab').focus();});
  $('#support-form').addEventListener('submit',event => {
    event.preventDefault();
    runAction(event.submitter,'Submitting…','#support-status',async () => {
      if(!auth.currentUser){renderSupportAccess();return;}
      const subject=$('#support-subject').value.trim(),message=$('#support-message').value.trim();
      if(!subject || !message){status('#support-status','Please enter both a subject and a message.','error');return;}
      const user=auth.currentUser;
      await db.collection('supportTickets').add({uid:user.uid,email:user.email,name:user.displayName,subject,message,status:'open',unreadForAdmin:true,unreadForUser:false,lastMessageAt:window.firebase.firestore.FieldValue.serverTimestamp(),createdAt:window.firebase.firestore.FieldValue.serverTimestamp()});
      $('#support-form').reset();setSupportView('mine');status('#support-status','Your ticket is in. Replies will appear in My tickets.','success');
    });
  });
  function openThread(id){
    const ticket=tickets.find(t=>t.id===id);
    if(!ticket || !currentUser || ticket.uid !== currentUser.uid)return;
    stopThread();activeTicketId=id;
    $('#support-form').hidden=true;$('#tickets-list').hidden=true;$('#ticket-thread').hidden=false;
    $('#thread-subject').textContent=ticket.subject || 'Support ticket';$('#reply-message').value='';
    $('#thread-messages').textContent='Loading conversation…';status('#support-status','');
    const ref=db.collection('supportTickets').doc(id);
    ref.update({unreadForUser:false}).catch(()=>{});
    threadUnsubscribe=ref.collection('replies').orderBy('createdAt','asc').onSnapshot(snapshot => {
      if(activeTicketId !== id)return;
      const messages=[{sender:'user',text:ticket.message,createdAt:ticket.createdAt},...snapshot.docs.map(doc=>doc.data())];
      const fragment=document.createDocumentFragment();
      for(const message of messages){
        const div=document.createElement('div');div.className=`message ${message.sender==='user'?'mine':''}`;div.textContent=message.text || '';
        const time=document.createElement('small');time.textContent=`${message.sender==='user'?'You':'Support team'} · ${dateText(message.createdAt)}`;
        div.append(time);fragment.append(div);
      }
      $('#thread-messages').replaceChildren(fragment);$('#thread-messages').scrollTop=$('#thread-messages').scrollHeight;
    },error=>{status('#support-status',errorText(error),'error');$('#thread-messages').textContent='Conversation unavailable. Please try again.';});
  }
  $('#reply-form').addEventListener('submit',event => {
    event.preventDefault();
    runAction(event.submitter,'Sending…','#support-status',async () => {
      const text=$('#reply-message').value.trim(),id=activeTicketId;
      if(!text || !id || !auth.currentUser)return;
      const ref=db.collection('supportTickets').doc(id);
      await ref.collection('replies').add({sender:'user',text,createdAt:window.firebase.firestore.FieldValue.serverTimestamp()});
      await ref.update({unreadForAdmin:true,unreadForUser:false,lastMessageAt:window.firebase.firestore.FieldValue.serverTimestamp()});
      if(activeTicketId === id)$('#reply-message').value='';
    });
  });
  $('#support-dialog').addEventListener('close',()=>{stopTickets();stopThread();});
  renderAccount();
})();
