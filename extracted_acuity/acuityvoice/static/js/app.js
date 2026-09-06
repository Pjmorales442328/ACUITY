/**
 * AcuityVoice - Frontend Application Logic
 * Manages Web Audio mic capture (16kHz PCM), WebSocket bridge,
 * Chart.js Radar visualization, and dynamic tool updates.
 */

// Global State
let ws = null;
let audioContext = null;
let mediaStream = null;
let scriptProcessor = null;
let isCallActive = false;
let currentMode = 'MOCK'; // Default to MOCK to preserve credit
let callTimerInterval = null;
let callSecondsElapsed = 0;
let radarChart = null;

// Audio visualizer state
let analyser = null;
let visualizerAnimationId = null;

// Initial Radar Data
const initialScores = {
  fluency: 75,
  grammar: 75,
  lexical: 75,
  pronunciation: 80,
  empathy: 70
};

// Initialize Chart.js Radar
document.addEventListener('DOMContentLoaded', () => {
  initRadarChart(initialScores);
  initWaveformCanvas();
  
  // Handle scenario selector change
  const scenarioSelect = document.getElementById('scenario-selector');
  if (scenarioSelect) {
    scenarioSelect.addEventListener('change', async (e) => {
      const resp = await fetch('/api/scenarios');
      const scenarios = await resp.json();
      const selected = scenarios[e.target.value];
      if (selected) {
        document.getElementById('scenario-desc').textContent = selected.description;
      }
    });
  }
});

function setMode(mode) {
  currentMode = mode;
  const liveBtn = document.getElementById('mode-live-btn');
  const mockBtn = document.getElementById('mode-mock-btn');
  
  if (mode === 'LIVE') {
    liveBtn.className = 'px-2.5 py-1 rounded-md font-medium transition bg-slate-700 text-indigo-400 shadow';
    mockBtn.className = 'px-2.5 py-1 rounded-md font-medium transition text-slate-400 hover:text-white';
  } else {
    mockBtn.className = 'px-2.5 py-1 rounded-md font-medium transition bg-slate-700 text-emerald-400 shadow';
    liveBtn.className = 'px-2.5 py-1 rounded-md font-medium transition text-slate-400 hover:text-white';
  }
}

function initRadarChart(scores) {
  const ctx = document.getElementById('radarChart').getContext('2d');
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Fluency', 'Grammar', 'Vocabulary', 'Pronunciation', 'Empathy'],
      datasets: [{
        label: 'Candidate Competency',
        data: [scores.fluency, scores.grammar, scores.lexical, scores.pronunciation, scores.empathy],
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#818cf8',
        pointBorderColor: '#ffffff',
        pointHoverBackgroundColor: '#ffffff',
        pointHoverBorderColor: '#6366f1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 20,
            display: false
          },
          grid: {
            color: 'rgba(51, 65, 85, 0.4)'
          },
          angleLines: {
            color: 'rgba(51, 65, 85, 0.4)'
          },
          pointLabels: {
            color: '#94a3b8',
            font: {
              size: 11,
              weight: '500'
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function updateRadarScores(scores) {
  if (!radarChart) return;
  
  radarChart.data.datasets[0].data = [
    scores.fluency || 75,
    scores.grammar || 75,
    scores.lexical || 75,
    scores.pronunciation || 80,
    scores.empathy || 70
  ];
  radarChart.update();

  // Update pills
  document.getElementById('score-fluency').textContent = `${scores.fluency || '--'}%`;
  document.getElementById('score-grammar').textContent = `${scores.grammar || '--'}%`;
  document.getElementById('score-empathy').textContent = `${scores.empathy || '--'}%`;
}

// Waveform visualizer setup
function initWaveformCanvas() {
  const canvas = document.getElementById('waveform');
  const canvasCtx = canvas.getContext('2d');
  
  function drawPlaceholder() {
    canvasCtx.fillStyle = '#020617';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.strokeStyle = '#1e293b';
    canvasCtx.lineWidth = 2;
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, canvas.height / 2);
    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }
  drawPlaceholder();
}

function startVisualizer() {
  const canvas = document.getElementById('waveform');
  const canvasCtx = canvas.getContext('2d');
  if (!analyser) return;

  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    visualizerAnimationId = requestAnimationFrame(draw);
    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = '#020617';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = isCallActive ? '#818cf8' : '#334155';
    canvasCtx.beginPath();

    const sliceWidth = canvas.width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = v * canvas.height / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }

  draw();
}

function stopVisualizer() {
  if (visualizerAnimationId) {
    cancelAnimationFrame(visualizerAnimationId);
    visualizerAnimationId = null;
  }
  initWaveformCanvas();
}

// Start Interview Session
async function toggleInterview() {
  if (isCallActive) {
    stopInterview();
    return;
  }
  
  try {
    // 1. Request microphone access
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true
      }
    });

    // 2. Setup Web Audio pipeline
    audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(mediaStream);
    
    analyser = audioContext.createAnalyser();
    source.connect(analyser);

    // Audio capture processor (downsamples / formats to 16-bit PCM)
    scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    // 3. Connect WebSocket to backend gateway
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${window.location.host}/ws/interview`);

    ws.onopen = () => {
      console.log('[WS] Connected to backend gateway');
      const scenario = document.getElementById('scenario-selector').value;
      ws.send(JSON.stringify({
        type: 'start_interview',
        scenario: scenario,
        mock_mode: (currentMode === 'MOCK')
      }));

      onCallStarted();
    };

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        const data = JSON.parse(event.data);
        handleServerEvent(data);
      } else if (event.data instanceof Blob) {
        // Binary synthetic speech from AssemblyAI Voice Agent
        playRawPcmChunk(event.data);
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      if (isCallActive) stopInterview();
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
    };

    // Stream PCM audio chunks to WebSocket
    scriptProcessor.onaudioprocess = (e) => {
      if (!isCallActive || !ws || ws.readyState !== WebSocket.OPEN) return;
      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = floatTo16BitPCM(inputData);
      ws.send(pcm16);
    };

  } catch (err) {
    alert(`Could not access microphone: ${err.message}`);
    console.error(err);
  }
}

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return buffer;
}

// Play incoming audio chunks
async function playRawPcmChunk(blob) {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    // In live mode with WebSockets, incoming audio chunks play through audioContext
    // If browser supports audio/wav or raw PCM playback:
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (e) {
    // Silent fallback if partial PCM chunk decode is pending
  }
}

function onCallStarted() {
  isCallActive = true;
  document.getElementById('start-btn').classList.add('hidden');
  document.getElementById('hangup-btn').removeAttribute('disabled');
  document.getElementById('status-indicator').className = 'w-3 h-3 rounded-full bg-emerald-500 animate-ping';
  document.getElementById('call-status-text').textContent = 'Live Roleplay Call';
  document.getElementById('speaker-status').textContent = 'Call active • Speak naturally';
  
  // Reset transcript container
  document.getElementById('transcript-feed').innerHTML = '';
  document.getElementById('markers-feed').innerHTML = '';
  document.getElementById('marker-count').textContent = '0 events';

  // Start visualizer
  startVisualizer();

  // Start Call Timer
  callSecondsElapsed = 0;
  callTimerInterval = setInterval(() => {
    callSecondsElapsed++;
    const mins = String(Math.floor(callSecondsElapsed / 60)).padStart(2, '0');
    const secs = String(callSecondsElapsed % 60).padStart(2, '0');
    document.getElementById('call-timer').textContent = `${mins}:${secs}`;
    
    // In mock mode, advance turns periodically if candidate speaks
    if (currentMode === 'MOCK' && callSecondsElapsed % 12 === 0) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'candidate_spoke' }));
      }
    }
  }, 1000);
}

function stopInterview() {
  if (!isCallActive) return;
  isCallActive = false;

  // Cleanup Web Audio
  if (scriptProcessor) scriptProcessor.disconnect();
  if (mediaStream) mediaStream.getTracks().forEach(track => track.stop());
  if (audioContext) audioContext.close();
  stopVisualizer();

  // Close WebSocket safely
  if (ws) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'stop_interview' }));
      ws.close();
    }
  }

  // Reset UI
  clearInterval(callTimerInterval);
  document.getElementById('start-btn').classList.remove('hidden');
  document.getElementById('hangup-btn').setAttribute('disabled', 'true');
  document.getElementById('status-indicator').className = 'w-3 h-3 rounded-full bg-slate-600';
  document.getElementById('call-status-text').textContent = 'Call Ended';
  document.getElementById('speaker-status').textContent = 'Session concluded';
}

function handleServerEvent(data) {
  const type = data.type;

  if (type === 'transcript') {
    appendTranscript(data.speaker, data.text);
    
    // In mock mode, speak customer lines via Web Speech API so audio is heard
    if (currentMode === 'MOCK' && data.speaker.includes('Customer') && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(data.text);
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }

  } else if (type === 'tool_call') {
    const toolName = data.tool_name;
    const args = data.args;

    if (toolName === 'log_conversational_marker') {
      appendMarker(args);
    } else if (toolName === 'update_customer_temperament') {
      updateTemperament(args);
    } else if (toolName === 'generate_candidate_scorecard') {
      openScorecardModal(args);
    }

  } else if (type === 'score_update') {
    updateRadarScores(data.scores);

  } else if (type === 'interview_completed') {
    openScorecardModal(data.scorecard);
    stopInterview();

  } else if (type === 'safety_timeout') {
    alert(data.message);
    stopInterview();
  }
}

function appendTranscript(speaker, text) {
  const feed = document.getElementById('transcript-feed');
  const isCustomer = speaker.toLowerCase().includes('customer');
  
  const msgEl = document.createElement('div');
  msgEl.className = `flex gap-3 items-start animate-in fade-in duration-150 ${isCustomer ? 'flex-row' : 'flex-row-reverse'}`;

  const avatar = document.createElement('div');
  avatar.className = `w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
    isCustomer ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
  }`;
  avatar.textContent = isCustomer ? 'AI' : 'YOU';

  const bubble = document.createElement('div');
  bubble.className = `p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
    isCustomer 
      ? 'bg-slate-950 border border-slate-800 text-slate-200' 
      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
  }`;
  bubble.innerHTML = `<strong class="block text-[10px] opacity-75 mb-0.5">${speaker}</strong>${text}`;

  msgEl.appendChild(avatar);
  msgEl.appendChild(bubble);
  feed.appendChild(msgEl);
  feed.scrollTop = feed.scrollHeight;
}

function appendMarker(marker) {
  const feed = document.getElementById('markers-feed');
  const countEl = document.getElementById('marker-count');
  
  const isPositive = marker.impact === 'POSITIVE';
  const item = document.createElement('div');
  item.className = `p-2.5 rounded-xl border text-xs animate-in slide-in-from-right duration-200 ${
    isPositive 
      ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-200' 
      : 'bg-amber-950/40 border-amber-500/20 text-amber-200'
  }`;

  item.innerHTML = `
    <div class="flex items-center justify-between mb-1">
      <span class="font-bold text-[10px] tracking-wider uppercase">${marker.marker_type.replace(/_/g, ' ')}</span>
      <span class="text-[9px] px-1.5 py-0.5 rounded ${isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}">${marker.impact}</span>
    </div>
    <p class="text-[11px] italic opacity-90 mb-1">"${marker.candidate_quote}"</p>
    <p class="text-[10px] opacity-75">${marker.coaching_note}</p>
  `;

  feed.prepend(item);
  const currentCount = feed.children.length;
  countEl.textContent = `${currentCount} events`;
}

function updateTemperament(data) {
  const badge = document.getElementById('temperament-badge');
  const bar = document.getElementById('temperament-bar');
  const reason = document.getElementById('temperament-reason');

  badge.textContent = data.new_temperament;
  bar.style.width = `${data.sentiment_score}%`;
  reason.textContent = `"${data.trigger_reason}"`;

  if (data.sentiment_score >= 70) {
    badge.className = 'text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  } else if (data.sentiment_score >= 40) {
    badge.className = 'text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20';
  } else {
    badge.className = 'text-xs font-medium px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20';
  }
}

function openScorecardModal(scorecard) {
  document.getElementById('modal-cefr').textContent = scorecard.overall_cefr_level || 'C1';
  document.getElementById('modal-recommendation').textContent = scorecard.hiring_recommendation || 'STRONG_HIRE';
  
  // Progress bars
  setBar('fluency', scorecard.fluency_score || 85);
  setBar('grammar', scorecard.grammar_score || 88);
  setBar('lexical', scorecard.lexical_score || 82);
  setBar('pronunciation', scorecard.pronunciation_score || 90);
  setBar('empathy', scorecard.empathy_score || 92);

  // Strengths
  const strengthsList = document.getElementById('modal-strengths');
  strengthsList.innerHTML = '';
  (scorecard.key_strengths || []).forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    strengthsList.appendChild(li);
  });

  // Coaching
  const coachingList = document.getElementById('modal-coaching');
  coachingList.innerHTML = '';
  (scorecard.development_areas || []).forEach(c => {
    const li = document.createElement('li');
    li.textContent = c;
    coachingList.appendChild(li);
  });

  document.getElementById('modal-verdict').textContent = `"${scorecard.summary_verdict || 'Candidate demonstrates excellent communicative competence.'}"`;

  const modal = document.getElementById('scorecard-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function setBar(name, value) {
  document.getElementById(`bar-val-${name}`).textContent = `${value}%`;
  document.getElementById(`bar-${name}`).style.width = `${value}%`;
}

function closeModal() {
  const modal = document.getElementById('scorecard-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}
