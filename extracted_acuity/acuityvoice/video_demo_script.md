# AcuityVoice - 3-Minute Video Demo & Pitch Script

> **Target Duration**: 2 Minutes 45 Seconds  
> **Format**: Screen recording with camera inset or voiceover walkthrough.

---

### [0:00 - 0:30] The Hook: The Enterprise Hiring Bottleneck
* **Visual**: Show a recruiter's calendar packed with repetitive 15-minute phone screens, transitioning to the legacy Pearson Versant interface.
* **Speaker**:
  > *"Every year, global BPOs, contact centers, and tech support teams screen millions of applicants for spoken English fluency and customer service ability. 
  > But today, hiring teams face a dilemma: either pay human recruiters to conduct thousands of exhausting phone screens, or use 20-year-old automated tests like Pearson Versant. 
  > Legacy tests only ask candidates to 'repeat after me' or read scripted sentences aloud. Applicants easily memorize these tests, but freeze up when an actual angry customer yells on a live call.
  > Introducing **AcuityVoice**: the autonomous voice agent that conducts real-time, interactive roleplay interviews powered by AssemblyAI."*

---

### [0:30 - 1:45] The Live Demonstration (The "Aha!" Moment)
* **Visual**: Split-screen showing the **AcuityVoice Dashboard** on the right, and the applicant speaking into a headset on the left.
* **Action**: Recruiter selects *"Fintech Card Dispute"* and clicks **Start Assessment Call**.

* **AI Customer (AssemblyAI)**:
  > *"Hi! I just checked my mobile banking app and there's a 45-dollar charge from 'CloudStream Pro' that I never authorized! What is going on here?"*

* **Applicant**:
  > *"Hello Jordan, I completely understand how alarming an unexpected charge is, especially right before bills are due. My name is Alex, and I’m going to resolve this for you right now."*

* **Visual Highlight (Tool Calling in Action)**:
  * **Empathy Demonstrated** marker pops up in the right-hand event stream.
  * **Customer Temperament Bar** shifts from **Red (25%)** to **Amber (50%)**.
  * Radar chart expands on the *Empathy* and *Fluency* axes.

* **AI Customer (Testing Interruption / Barge-in)**:
  > *"My rent is due tomorrow morning and I really can't afford mysterious charges right—"*

* **Applicant (Interrupts calmly)**:
  > *"Jordan, I'm locking the card immediately so no further charges occur, and I am issuing a provisional credit right now."*

* **Visual Highlight**:
  * The AssemblyAI Voice Agent halts speech instantly upon detecting applicant speech (barge-in demonstration).
  * The customer temperament shifts to **Green (92% Satisfied)**:
  > *"Thank you so much, Alex. That solves my entire problem."*

---

### [1:45 - 2:15] Technical Architecture & AssemblyAI Integration
* **Visual**: Display the clean architecture diagram from the README.
* **Speaker**:
  > *"AcuityVoice is built on AssemblyAI's latest Voice Agent API over a single, ultra-low-latency WebSocket connection.
  > It uses Universal-3 Pro for accurate real-time speech-to-text, even with regional accents and rapid colloquial speech. 
  > AssemblyAI's server-side Voice Activity Detection handles natural turn-taking and conversational barge-in without lag.
  > Crucially, AcuityVoice leverages JSON-Schema tool calling to log linguistic markers, adjust simulated sentiment, and calculate CEFR metrics concurrently while speaking."*

---

### [2:15 - 2:45] Business Value & Market Opportunity
* **Visual**: Display market metrics and competitor comparison table.
* **Speaker**:
  > *"The global talent screening and recruitment market is a 12-billion-dollar industry, with over 3 million customer care agents hired annually across Southeast Asia, Latin America, and India.
  > A human recruiter screen costs $15 to $25. AcuityVoice costs less than $1.00 per completed 3-minute evaluation.
  > It eliminates hiring bottlenecks, reduces candidate drop-off, and provides objective, compliance-ready audio scorecards for every applicant."*

---

### [2:45 - 3:00] Closing & Call to Action
* **Visual**: Display the completed candidate scorecard modal, showing the C1 CEFR rating and "STRONG HIRE" badge.
* **Speaker**:
  > *"AcuityVoice transforms language assessment from a rigid test into an authentic conversation. 
  > Built for the AssemblyAI Voice Agent Hackathon on lablab.ai. Thank you!"*
