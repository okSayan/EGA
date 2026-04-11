const card = document.getElementById('survey-card');
const tab = document.getElementById('survey-tab');
let shown = false;
let visitorId = null;
const SECRET = 'okWErijfiger83582900=%AAA';
const pageLoadTime = Date.now();

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

async function logVisit() {
  try {
    const res = await fetch('https://ega2.bharatyudhishthir-509.workers.dev/visit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Token': SECRET
      },
      body: JSON.stringify({
        query: window.location.search || 'Direct',
        device_type: getDeviceType(),
        resolution: `${window.screen.width}x${window.screen.height}`,
        timestamp: getLocalTimestamp()
      })
    });
    const data = await res.json();
    if (data.success) visitorId = data.visitor_id;
  } catch {
    console.log('Visit log failed');
  }
}

// logVisit();
//show card
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

setTimeout(showCard, 10000);
//switch stages
function goToStage(hideId, showId) {
  document.getElementById(hideId).classList.add('hidden');
  const next = document.getElementById(showId);
  next.classList.remove('hidden');
  next.classList.add('stage-enter');
}
//s1
async function handleInterest(choice) {
  if (choice === 'yes') {
    goToStage('stage-1', 'stage-2');
  } else if (choice === 'no') {
    await fetch('https://ega2.bharatyudhishthir-509.workers.dev/interest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Secret-Token': SECRET
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
        'X-Secret-Token': SECRET
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
//s3
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

document.getElementById('s-phone').addEventListener('input', (e) => {
  let val = e.target.value.replace(/\D/g, ""); // Digits only
  
  if (val.length>10 && val.startsWith("91")) {
    val = val.substring(2);
  }
  if (val.length>10 && val.startsWith("0")) {
    val = val.substring(1);
  }
  
  e.target.value = val.substring(0, 10); // Max 10 digits
});

//set listeners
function attachListeners() {
  document.getElementById('survey-close').addEventListener('click', () => {
    card.classList.remove('show');
    tab.style.display = 'block';
  });

  document.getElementById('survey-submit').addEventListener('click', async () => {
    const name = document.getElementById('s-name').value.trim();
    const institution = document.getElementById('i-name').value.trim();
    const course = document.getElementById('c-name').value.trim();
    const phone = document.getElementById('s-phone').value.trim();

    const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;

    if (!name) {
      alert('Please fill in your Name!');
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

  //no bg scroll on input focus
  document.getElementById('s-name').addEventListener('focus', () => {
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('s-phone').addEventListener('focus', () => {
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('i-name').addEventListener('focus', () => {
    document.body.style.overflow = 'hidden';
  });
  document.getElementById('c-name').addEventListener('focus', () => {
    document.body.style.overflow = 'hidden';
  });

  //restore scroll when done
  ['s-name', 's-phone', 'i-name', 'c-name'].forEach(id => {
    document.getElementById(id).addEventListener('blur', () => {
      document.body.style.overflow = '';
    });
  });

  ['s-name', 'i-name', 'c-name', 's-phone'].forEach(id => {
    document.getElementById(id).addEventListener('focus', () => {
      setTimeout(() => {
        document.getElementById(id).scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    });
  });

  setupEnterKey();

}

function setupEnterKey() {
  const fields = ['s-name', 'i-name', 'c-name', 's-phone'];
  fields.forEach((id, index) => {
    document.getElementById(id).addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (index < fields.length - 1) {
          document.getElementById(fields[index + 1]).focus();
        } else {
          document.getElementById('survey-submit').click();
        }
      }
    });
  });
}

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
      <input type="text" id="c-name" placeholder="Interested Subject/Course" />
      <input type="tel"  id="s-phone" placeholder="Phone Number" />
      <div class="cf-turnstile" data-sitekey="0x4AAAAAACuyO4itcnJ5LVcZ"></div>
      <button id="survey-submit">Get Callback →</button>
    </div>
    <div id="stage-3" class="hidden">
      <div id="thankyou-content"></div>
    </div>
  `;
  attachListeners();

  if (window.turnstile) {
    turnstile.render('#survey-card .cf-turnstile', {
      sitekey: '0x4AAAAAACuyOXqycnJ5LVcZ'
    });
  }
}
//enq tab
tab.addEventListener('click', () => {
  resetCard();
  card.classList.add('show');
  tab.style.display = 'none';
});

attachListeners();

// ── PDF Modal ──
const pdfOverlay = document.getElementById('pdf-modal-overlay');
const dlBtn = document.getElementById('dlBtn');
const btn_download_txt = document.getElementById('btn-download-txt');
const downloadIcon = document.getElementById('downloadIcon');
const successMsg = document.getElementById('successMsg');
const WORKER_URL = 'https://ega2.bharatyudhishthir-509.workers.dev/get-pdf';

let turnstileWidgetId = null;
let cfToken = null;

function openPdfModal() {
  pdfOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Reset state every time
  cfToken = null;
  dlBtn.disabled = true;
  dlBtn.setAttribute('aria-disabled', 'true');
  successMsg.style.display = 'none';

  // Wait for turnstile to be ready
  const initTurnstile = () => {
    if (window.turnstile) {
      if (turnstileWidgetId !== null) {
        turnstile.reset(turnstileWidgetId);
      } else {
        turnstileWidgetId = turnstile.render('#pdf-turnstile-container', {
          sitekey: '0x4AAAAAAC02SPNUmLlPZdUS',
          theme: 'light',
          callback: function (token) {
            // inline callback — no string, no timing issue
            cfToken = token;
            dlBtn.disabled = false;
            dlBtn.setAttribute('aria-disabled', 'false');
          },
          'expired-callback': function () {
            cfToken = null;
            dlBtn.disabled = true;
            dlBtn.setAttribute('aria-disabled', 'true');
          }
        });
      }
    } else {
      // Turnstile not loaded yet, try again in 200ms
      setTimeout(initTurnstile, 200);
    }
  };

  initTurnstile();
}

// Close button
document.getElementById('download-close').addEventListener('click', () => {
  pdfOverlay.classList.remove('open');
  document.body.style.overflow = '';
});

// Click outside to close
// pdfOverlay.addEventListener('click', (e) => {
//   if (e.target === pdfOverlay) {
//     pdfOverlay.classList.remove('open');
//     document.body.style.overflow = '';
//   }
// });

// Download button
dlBtn.addEventListener('click', async () => {
  if (!cfToken) return;

  dlBtn.disabled = true;
  btn_download_txt.textContent = 'Verifying...';
  downloadIcon.hidden = true;

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: cfToken })
    });

    if (!response.ok) throw new Error('Failed');

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    // if (/iphone|ipad|ipod|android/i.test(navigator.userAgent)) {
    //   window.open(blobUrl, '_blank');
    // } else {
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'EGA_Prospectus_' + new Date().toISOString().slice(0, 10) + '.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // }

    URL.revokeObjectURL(blobUrl);
    successMsg.style.display = 'block';

    fetch('https://ega2.bharatyudhishthir-509.workers.dev/log-download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_type: getDeviceType(),
        timestamp: getLocalTimestamp()
      })
    }).catch(() => { });
    //autoclose
    setTimeout(() => {
      pdfOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }, 7000);

  } catch (err) {
    alert('Something went wrong. Please try again.');
  } finally {
    btn_download_txt.textContent = 'Download';
    downloadIcon.hidden = false;
    if (!successMsg.style.display || successMsg.style.display === 'none') {
      dlBtn.disabled = false;
      dlBtn.setAttribute('aria-disabled', 'false');
    }
  }
});

/*enquire btn*/
const footer = document.querySelector('footer');

function checkFooterVisibility() {
  const footerTop = footer.getBoundingClientRect().top;
  const windowHeight = window.innerHeight;
  const tabHeight = tab.offsetHeight + 30;

  if (footerTop < windowHeight) {
    const overLap = windowHeight - footerTop;
    tab.style.bottom = (overLap + 10) + 'px';
  } else {
    tab.style.bottom = '30px';
  }
}
window.addEventListener('scroll', checkFooterVisibility);