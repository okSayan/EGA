const card = document.getElementById('survey-card');
const tab = document.getElementById('survey-tab');
let shown = false;
let visitorId = null;
const SECRET = 'okWErijfiger83582900=%AAA'; // ← make sure worker matches this exactly
const pageLoadTime = Date.now();

// --- Auto data collection ---
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function getTimeSpent() {
  return Math.floor((Date.now() - pageLoadTime) / 1000);
}

function getLocalTimestamp() {
  const now = new Date();
  return now.getFullYear() + '-' +
    String(now.getMonth() + 1).padStart(2, '0') + '-' +
    String(now.getDate()).padStart(2, '0') + ' ' +
    String(now.getHours()).padStart(2, '0') + ':' +
    String(now.getMinutes()).padStart(2, '0') + ':' +
    String(now.getSeconds()).padStart(2, '0');
}

// --- Log visitor on page load ---
async function logVisit() {
  try {
    const res = await fetch('https://ega2.bharatyudhishthir-509.workers.dev/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Token': SECRET  // ← added
      },
      body: JSON.stringify({
        query: window.location.search || 'Direct',
        device_type: getDeviceType(),
        resolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: getLocalTimestamp()  // ← added
      })
    });
    const data = await res.json();
    if (data.success) visitorId = data.visitor_id;
  } catch {
    console.log('Visit log failed');
  }
}

logVisit();

// --- Show card: 40% scroll OR 4 seconds ---
if (sessionStorage.getItem('survey-dismissed')) { shown = true; }

function showCard() {
  if (shown) return;
  card.classList.add('show');
  shown = true;
}

window.addEventListener('scroll', () => {
  const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  if (scrolled > 0.4) showCard();
});

setTimeout(showCard, 4000);

// --- Switch stages ---
function goToStage(hideId, showId) {
  document.getElementById(hideId).classList.add('hidden');
  const next = document.getElementById(showId);
  next.classList.remove('hidden');
  next.classList.add('stage-enter');
}

// --- Stage 1: Interest buttons ---
async function handleInterest(choice) {
  if (choice === 'yes') {
    goToStage('stage-1', 'stage-2');
  } else if (choice === 'no') {
    await fetch('https://ega2.bharatyudhishthir-509.workers.dev/interest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Token': SECRET  // ← added
      },
      body: JSON.stringify({
        visitor_id: visitorId,
        interest: 'no',
        time_spent: getTimeSpent()
      })
    });
    showThankYou("No worries!", "Thanks for stopping by!", "");
  } else if (choice === 'maybe') {
    await fetch('https://ega2.bharatyudhishthir-509.workers.dev/interest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Token': SECRET  // ← added
      },
      body: JSON.stringify({
        visitor_id: visitorId,
        interest: 'maybe',
        time_spent: getTimeSpent()
      })
    });
    showThankYou("Take your time!", "We're here whenever you're ready!", "");
  }
}

// --- Stage 3: Thank you ---
function showThankYou(emoji, heading, message) {
  document.getElementById('thankyou-content').innerHTML = `
    <div style="font-size:36px; margin-bottom:8px;">${emoji}</div>
    <strong>${heading}</strong><br>
    <span style="color:#666;">${message}</span>
  `;

  if (!document.getElementById('stage-1').classList.contains('hidden')) {
    goToStage('stage-1', 'stage-3');
  } else {
    goToStage('stage-2', 'stage-3');
  }

  setTimeout(() => {
    card.classList.remove('show');
    tab.style.display = 'block';
  }, 3000);
}

// --- Attach listeners ---
function attachListeners() {
  document.getElementById('survey-close').addEventListener('click', () => {
    card.classList.remove('show');
    tab.style.display = 'block';
  });

  document.getElementById('survey-submit').addEventListener('click', async () => {
    const name        = document.getElementById('s-name').value.trim();
    const institution = document.getElementById('i-name').value.trim();
    const course      = document.getElementById('c-name').value.trim();
    const phone       = document.getElementById('s-phone').value.trim();

    const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;

    if (!name || !phone) {
      alert('Please fill all fields!');
      return;
    }

    if (!turnstileToken) {
      alert('Please wait for security check to complete!');
      return;
    }

    try {
      const res = await fetch('https://ega2.bharatyudhishthir-509.workers.dev/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Secret-Token': SECRET
        },
        body: JSON.stringify({
          visitor_id: visitorId,
          name, institution, course, phone,
          time_spent: getTimeSpent(),
          timestamp: getLocalTimestamp(),
          turnstile_token: turnstileToken
        })
      });
      const data = await res.json();
      if (data.success) {
        showThankYou(`Thanks, ${name}!`, "We'll call you soon!", "");
      } else {
        alert(data.error || 'Something went wrong!');
      }
    } catch {
      alert('Something went wrong, please try again!');
    }
  });
}

// --- Reset card ---
function resetCard() {
  card.innerHTML = `
    <button id="survey-close">✕</button>
    <div id="stage-1">
      <h3>Interested in our courses?</h3>
      <div id="stage-1-buttons">
        <button class="choice-btn yes-btn" onclick="handleInterest('yes')">Yes!</button>
        <button class="choice-btn no-btn"  onclick="handleInterest('no')">No.</button>
        <button class="choice-btn may-btn" onclick="handleInterest('maybe')">Will Think...</button>
      </div>
    </div>
    <div id="stage-2" class="hidden">
      <h3>Great! Tell us about Yourself</h3>
      <input type="text" id="s-name" placeholder="Your Name" />
      <input type="text" id="i-name" placeholder="Your School/College name" />
      <input type="text" id="c-name" placeholder="Interested Course/Subject" />
      <input type="tel"  id="s-phone" placeholder="Phone Number" />
      <div class="cf-turnstile" data-sitekey="0x4AAAAAACuyO4itcnJ5LVcZ"></div>
      <button id="survey-submit">Get Callback →</button>
    </div>
    <div id="stage-3" class="hidden">
      <div id="thankyou-content"></div>
    </div>
  `;
  attachListeners();

  // Re-render Turnstile widget after resetCard
  if (window.turnstile) {
    turnstile.render('.cf-turnstile', {
      sitekey: '0x4AAAAAACuyOXqycnJ5LVcZ'
    });
  }
}

// --- Enquire tab ---
tab.addEventListener('click', () => {
  resetCard();
  card.classList.add('show');
  tab.style.display = 'none';
});

// --- Initial attach ---
attachListeners();
