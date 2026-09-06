import { Scenario } from '../types';

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'fintech_dispute',
    title: 'Fintech Card Dispute & Unauthorized Charge',
    description: 'Simulates a panicked customer who noticed an unexpected $45.00 recurring charge on their credit card right before their rent is due. Tests de-escalation, verification, and problem-solving under pressure.',
    difficulty: 'Intermediate / High Stakes',
    category: 'Fintech',
    customerPersona: "You are Jordan Reynolds, a busy and frustrated cardholder calling ApexPay customer care. You just noticed a strange $45.00 transaction on your statement from an unknown vendor called 'CloudStream Pro'. You suspect fraud and need immediate card protection and fee reversal.",
    initialSentiment: 25,
    initialTemperament: 'AGITATED_ANXIOUS',
    scriptedTurns: [
      {
        customerText: "Hi, yes! I just opened my ApexPay mobile app, and there's a $45.00 charge from 'CloudStream Pro' that I never authorized! What on earth is going on here?",
        expectedCandidateTopic: "Warm greeting, immediate empathy, asking for verification details or name",
        sentimentScore: 28,
        temperament: 'AGITATED_ANXIOUS',
        temperamentReason: "Customer initiated call agitated about unauthorized recurring charge.",
        sampleMarker: {
          markerType: 'EMPATHY_DEMONSTRATED',
          candidateQuote: "I completely understand how alarming an unexpected charge is, Jordan. Let me look into this right now for you.",
          impact: 'POSITIVE',
          coachingNote: "Superb immediate validation of customer distress before proceeding to verification."
        }
      },
      {
        customerText: "My name is Jordan Reynolds. Look, my rent is due tomorrow morning and I really cannot afford mysterious charges right now. Can you reverse this immediately?",
        expectedCandidateTopic: "Reassurance, explanation of provisional credit, confirming account or transaction timestamp",
        sentimentScore: 42,
        temperament: 'DEFENSIVE',
        temperamentReason: "Customer expressed financial anxiety; listening closely for practical resolution.",
        sampleMarker: {
          markerType: 'ACTIVE_LISTENING',
          candidateQuote: "I hear your urgency with rent due tomorrow. I will initiate a temporary dispute credit so those funds are back in your available balance.",
          impact: 'POSITIVE',
          coachingNote: "Directly addressed customer's specific timeline concern."
        }
      },
      {
        customerText: "Okay, thank you for checking that. Yes, I do see that it was processed 3 hours ago. Can you freeze that vendor so they don't bill me again next month?",
        expectedCandidateTopic: "Confirmation of merchant block, card replacement or token revocation",
        sentimentScore: 68,
        temperament: 'NEUTRAL_ATTENTIVE',
        temperamentReason: "Candidate verified transaction details and offered concrete merchant blocking.",
        sampleMarker: {
          markerType: 'ADVANCED_VOCABULARY',
          candidateQuote: "I have placed an active merchant token block on CloudStream Pro and initiated a formal fraud dispute.",
          impact: 'POSITIVE',
          coachingNote: "Accurate domain-specific banking terminology applied seamlessly."
        }
      },
      {
        customerText: "That would be fantastic. If you can issue the provisional credit and lock the card from that merchant, that solves everything. I really appreciate your quick help today!",
        expectedCandidateTopic: "Confirmation of dispute reference number, wrap-up compliance phrasing, offering further assistance",
        sentimentScore: 92,
        temperament: 'SATISFIED_GRATEFUL',
        temperamentReason: "Candidate provided end-to-end resolution and completely de-escalated customer.",
        sampleMarker: {
          markerType: 'PROFESSIONAL_DE_ESCALATION',
          candidateQuote: "Your reference number is APX-99421. The funds are credited, and no further charges will come through. Is there anything else I can assist you with today?",
          impact: 'POSITIVE',
          coachingNote: "Clean, compliant wrap-up protocol following complete de-escalation."
        }
      }
    ]
  },
  {
    id: 'ecommerce_delivery',
    title: 'E-Commerce Lost Birthday Gift Order',
    description: "A customer whose high-priority gift order was marked 'Delivered' but cannot be found on their porch. The birthday party is tomorrow. Tests active listening, reassurance, and solution-oriented recovery.",
    difficulty: 'Standard Customer Care',
    category: 'E-Commerce',
    customerPersona: "You are Taylor Brooks. You ordered a custom smartwatch as a birthday present for your daughter. Tracking shows 'Delivered' 2 hours ago, but you checked everywhere and nothing is there. You are distressed and need an immediate replacement or courier trace.",
    initialSentiment: 30,
    initialTemperament: 'AGITATED_ANXIOUS',
    scriptedTurns: [
      {
        customerText: "Hello, my name is Taylor Brooks. My daughter's birthday party is tomorrow evening, and your app says her gift was delivered two hours ago, but my porch is empty! Where is my package?",
        expectedCandidateTopic: "Empathy for birthday deadline, checking carrier GPS scan, order number lookup",
        sentimentScore: 32,
        temperament: 'AGITATED_ANXIOUS',
        temperamentReason: "Customer is anxious about missing birthday deadline.",
        sampleMarker: {
          markerType: 'EMPATHY_DEMONSTRATED',
          candidateQuote: "I'm so sorry to hear this, Taylor, especially with your daughter's birthday tomorrow. Let's track this down immediately.",
          impact: 'POSITIVE',
          coachingNote: "Strong emotional alignment with the customer's personal celebration deadline."
        }
      },
      {
        customerText: "Order number is 884-9102. I already checked with my neighbors on both sides, and nobody received it. Can you send another one via same-day courier?",
        expectedCandidateTopic: "Order lookup confirmation, checking local warehouse inventory for expedited re-shipment",
        sentimentScore: 52,
        temperament: 'DEFENSIVE',
        temperamentReason: "Customer provided order details and requested emergency same-day dispatch.",
        sampleMarker: {
          markerType: 'GRAMMATICAL_ACCURACY',
          candidateQuote: "I've pulled up order 884-9102, and I can authorize an emergency priority dispatch from our local regional fulfillment hub.",
          impact: 'POSITIVE',
          coachingNote: "Precise grammatical structure with clear modal verb usage."
        }
      },
      {
        customerText: "Wait, so you have one in stock locally that can arrive by tomorrow noon? Will I have to pay any extra shipping fee for that?",
        expectedCandidateTopic: "Waiving shipping fees, explaining priority courier guarantee",
        sentimentScore: 78,
        temperament: 'REASSURED_CALMED',
        temperamentReason: "Customer was relieved by local warehouse availability and fee waiver.",
        sampleMarker: {
          markerType: 'ACTIVE_LISTENING',
          candidateQuote: "We are waiving all priority shipping fees at no extra cost to you, with guaranteed delivery before 11:00 AM tomorrow.",
          impact: 'POSITIVE',
          coachingNote: "Proactively addressed fee concerns and solidified concrete delivery commitment."
        }
      },
      {
        customerText: "Oh, what a huge relief! You just saved my daughter's birthday. Thank you so much for taking care of this so quickly!",
        expectedCandidateTopic: "Tracking notification setup, polite wrap-up",
        sentimentScore: 95,
        temperament: 'SATISFIED_GRATEFUL',
        temperamentReason: "Customer delighted with instant same-day resolution.",
        sampleMarker: {
          markerType: 'PROFESSIONAL_DE_ESCALATION',
          candidateQuote: "You're very welcome, Taylor! I've sent the live courier tracking link directly to your phone. Have a wonderful birthday celebration!",
          impact: 'POSITIVE',
          coachingNote: "Warm, professional send-off maintaining high brand affinity."
        }
      }
    ]
  },
  {
    id: 'telecom_technical',
    title: 'Broadband Fiber Outage During Executive Meeting',
    description: "A remote-working engineering executive whose fiber internet dropped red optical alarm 15 minutes before an executive board presentation. Tests technical de-escalation, rapid triage, and composure under extreme time pressure.",
    difficulty: 'Technical Support',
    category: 'Telecom',
    customerPersona: "You are Alex Chen, a software engineering manager working remotely. Your fiber connection dropped red optical light right before an executive board presentation. You are using cell hotspot data and demand urgent triage.",
    initialSentiment: 20,
    initialTemperament: 'AGITATED_ANXIOUS',
    scriptedTurns: [
      {
        customerText: "This is Alex Chen. My fiber modem just flashed solid red optical loss, and I have a company board presentation in 12 minutes! Why is my network down?",
        expectedCandidateTopic: "Immediate urgency acknowledgment, ONT light diagnosis, rapid power-cycle or mobile hotspot bypass",
        sentimentScore: 24,
        temperament: 'AGITATED_ANXIOUS',
        temperamentReason: "Customer faces high-stakes executive meeting outage.",
        sampleMarker: {
          markerType: 'ACTIVE_LISTENING',
          candidateQuote: "Alex, I recognize the extreme urgency with your board meeting in 12 minutes. Let's do a rapid line check immediately.",
          impact: 'POSITIVE',
          coachingNote: "Rapid acknowledgment of time constraint without wasting conversational cycles."
        }
      },
      {
        customerText: "I already power-cycled the gateway. Is this a neighborhood node outage, or is it isolated to my fiber line?",
        expectedCandidateTopic: "Diagnostics check, line attenuation test, confirming automated 5G backup failover",
        sentimentScore: 48,
        temperament: 'DEFENSIVE',
        temperamentReason: "Customer tested basic steps; waiting for telemetry verification.",
        sampleMarker: {
          markerType: 'ADVANCED_VOCABULARY',
          candidateQuote: "I am querying the OLT terminal telemetry right now. While our line diagnostics ping, I have remotely activated your gateway's emergency 5G cellular failover eSIM.",
          impact: 'POSITIVE',
          coachingNote: "Demonstrated advanced technical lexicon and decisive proactive fallback activation."
        }
      },
      {
        customerText: "Hold on... the backup light on the router just turned green and my laptop reconnected to Wi-Fi. Am I getting full presentation bandwidth on this?",
        expectedCandidateTopic: "Confirming backup throughput, scheduling quiet line technician visit",
        sentimentScore: 80,
        temperament: 'REASSURED_CALMED',
        temperamentReason: "Customer reconnected to high-speed backup network in time for meeting.",
        sampleMarker: {
          markerType: 'GRAMMATICAL_ACCURACY',
          candidateQuote: "Yes, you have unthrottled 150 Mbps backup throughput active now, and I have scheduled our fiber technician to inspect the external node at 2:00 PM.",
          impact: 'POSITIVE',
          coachingNote: "Flawless sentence construction delivering speed, assurance, and follow-up plan."
        }
      },
      {
        customerText: "Incredible. You saved my board presentation with 5 minutes to spare. Thank you for acting so fast!",
        expectedCandidateTopic: "Polite support sign-off and ticketing confirmation",
        sentimentScore: 94,
        temperament: 'SATISFIED_GRATEFUL',
        temperamentReason: "Customer successfully connected to meeting with full confidence.",
        sampleMarker: {
          markerType: 'PROFESSIONAL_DE_ESCALATION',
          candidateQuote: "Best of luck on your board presentation, Alex! Ticket #NT-8041 is monitoring your connection. Have a great meeting!",
          impact: 'POSITIVE',
          coachingNote: "High energy, supportive closure cementing client trust."
        }
      }
    ]
  },
  {
    id: 'hospitality_booking',
    title: 'Boutique Hotel Double Booking Emergency',
    description: 'A honeymoon couple arrives at midnight after a 14-hour flight only to find their penthouse suite was double-booked. Tests extreme de-escalation, high-value compensation offering, and gracious oral composure.',
    difficulty: 'Executive Hospitality',
    category: 'Hospitality',
    customerPersona: "You are Morgan Vance. You booked the Grand Ocean Penthouse for your honeymoon 6 months in advance. You arrived at 11:30 PM exhausted, and the front desk says another guest is in your room.",
    initialSentiment: 15,
    initialTemperament: 'AGITATED_ANXIOUS',
    scriptedTurns: [
      {
        customerText: "Good evening. We just flew 14 hours for our honeymoon, and your night manager claims our booked Ocean Penthouse is occupied! This is completely unacceptable.",
        expectedCandidateTopic: "Sincere apology, immediate VIP lounge escort, beverage, instant executive suite alternative",
        sentimentScore: 22,
        temperament: 'AGITATED_ANXIOUS',
        temperamentReason: "Customer exhausted from international flight and distressed by double booking.",
        sampleMarker: {
          markerType: 'EMPATHY_DEMONSTRATED',
          candidateQuote: "Morgan, congratulations on your wedding, and I am deeply sorry for this exhausting arrival after your 14-hour flight.",
          impact: 'POSITIVE',
          coachingNote: "Personalized empathy acknowledging honeymoon occasion and travel fatigue."
        }
      },
      {
        customerText: "We specifically reserved the ocean terrace months ago. Where are you going to put us tonight?",
        expectedCandidateTopic: "Upgrading to Presidential Villa, complimentary champagne & spa package, full night credit",
        sentimentScore: 50,
        temperament: 'DEFENSIVE',
        temperamentReason: "Customer seeking concrete premium accommodation alternative.",
        sampleMarker: {
          markerType: 'ADVANCED_VOCABULARY',
          candidateQuote: "I have immediately upgraded your stay to our Private Presidential Beachfront Villa at zero additional charge, with complimentary room service and spa access for your entire honeymoon.",
          impact: 'POSITIVE',
          coachingNote: "Generous, decisive service recovery with clear articulation."
        }
      },
      {
        customerText: "The Beachfront Villa with the private plunge pool? And you'll have our luggage transferred immediately?",
        expectedCandidateTopic: "Immediate bellhop escort, private check-in, breakfast in bed setup",
        sentimentScore: 82,
        temperament: 'REASSURED_CALMED',
        temperamentReason: "Customer thrilled by presidential villa upgrade.",
        sampleMarker: {
          markerType: 'ACTIVE_LISTENING',
          candidateQuote: "Our private concierge is escorting your luggage right now, and chilled vintage champagne awaits you in the villa.",
          impact: 'POSITIVE',
          coachingNote: "Anticipated customer logistical needs smoothly."
        }
      },
      {
        customerText: "You turned a nightmare into an amazing start to our honeymoon. Thank you for your incredible hospitality and swift action!",
        expectedCandidateTopic: "Warm wishes for honeymoon and concierge contact handover",
        sentimentScore: 96,
        temperament: 'SATISFIED_GRATEFUL',
        temperamentReason: "Customer transformed from outraged to loyal brand champion.",
        sampleMarker: {
          markerType: 'PROFESSIONAL_DE_ESCALATION',
          candidateQuote: "It is our absolute pleasure, Morgan. May you and your partner have an unforgettable honeymoon stay with us!",
          impact: 'POSITIVE',
          coachingNote: "Exceptional grace and world-class customer experience delivery."
        }
      }
    ]
  },
  {
    id: 'it_helpdesk_level1',
    title: 'Level 1 IT Support: Monitor No Signal',
    description: "A highly predictable, narrow-focus scenario for a simple computer problem. A user just set up a new desktop PC but the monitor shows 'No Signal' because the HDMI cable is plugged into the motherboard instead of the dedicated graphics card. Follows a strict step-by-step diagnostic script.",
    difficulty: 'Beginner / Level 1',
    category: 'Technical Support',
    customerPersona: "You are Riley, an excited customer who just bought a new pre-built desktop PC. You turned it on and the lights work, but the monitor says 'No Signal'. You will answer questions directly and follow physical troubleshooting steps exactly as asked. Your tone is worried but cooperative.",
    initialSentiment: 50,
    initialTemperament: 'NEUTRAL_ATTENTIVE',
    scriptedTurns: [
      {
        customerText: "Hi, my name is Riley. I just bought a new desktop PC and set it all up. When I press the power button, the fans spin and the lights turn on, but my monitor just says 'No Signal'.",
        expectedCandidateTopic: "Greeting, empathy, asking to verify the cable connection between the PC and monitor.",
        sentimentScore: 50,
        temperament: 'NEUTRAL_ATTENTIVE',
        temperamentReason: "Customer stated the problem clearly and is waiting for troubleshooting guidance.",
        sampleMarker: {
          markerType: 'ACTIVE_LISTENING',
          candidateQuote: "Hi Riley. I can absolutely help you get your new PC displaying on the monitor. Let's start by checking the cable connecting the monitor to the computer.",
          impact: 'POSITIVE',
          coachingNote: "Excellent clear introduction to the first hardware troubleshooting step."
        }
      },
      {
        customerText: "Yes, I'm using the HDMI cable that came in the box. It's plugged into the back of the monitor, and the other end is plugged into the back of the computer near the top, right next to the USB ports.",
        expectedCandidateTopic: "Identifying the cable is in the motherboard I/O. Instructing the user to move it down to the horizontal slots of the graphics card.",
        sentimentScore: 60,
        temperament: 'NEUTRAL_ATTENTIVE',
        temperamentReason: "Customer provided specific physical location of the cable.",
        sampleMarker: {
          markerType: 'ADVANCED_VOCABULARY',
          candidateQuote: "Ah, it sounds like it's plugged into the motherboard. Since you have a dedicated graphics card, you'll want to plug it into the horizontal ports further down on the back of the case.",
          impact: 'POSITIVE',
          coachingNote: "Accurately diagnosed the hardware placement issue using clear, non-jargon spatial instructions."
        }
      },
      {
        customerText: "Oh, I see another group of ports further down, and they are horizontal. Let me unplug the HDMI from the top and plug it in down there... Okay, it's plugged in securely.",
        expectedCandidateTopic: "Asking the customer to wait a moment and check if the Windows logo or display appears.",
        sentimentScore: 80,
        temperament: 'REASSURED_CALMED',
        temperamentReason: "Customer found the correct ports and completed the physical change.",
        sampleMarker: {
          markerType: 'EMPATHY_DEMONSTRATED',
          candidateQuote: "Perfect, thank you for doing that Riley. It might take just a couple of seconds, let me know if you see the screen wake up.",
          impact: 'POSITIVE',
          coachingNote: "Encouraging tone that validates the customer's action and manages expectations on timing."
        }
      },
      {
        customerText: "Wow, the Windows logo just popped up! It's working perfectly now. Thank you so much, I didn't even notice those other ports down there.",
        expectedCandidateTopic: "Confirming resolution, polite wrap-up, offering further assistance.",
        sentimentScore: 95,
        temperament: 'SATISFIED_GRATEFUL',
        temperamentReason: "Customer's issue is fully resolved and they are happy with their new PC.",
        sampleMarker: {
          markerType: 'PROFESSIONAL_DE_ESCALATION',
          candidateQuote: "You're very welcome, Riley! That's a super common thing to overlook. Enjoy your new PC, and let me know if there's anything else you need help with.",
          impact: 'POSITIVE',
          coachingNote: "Perfectly executed standard helpdesk closing with excellent rapport building."
        }
      }
    ]
  }
];
