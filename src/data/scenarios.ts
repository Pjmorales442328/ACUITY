// Built-in roleplay scenarios: the customer persona the Voice Agent plays for each assessment.
import type { Scenario } from '../types';

export const DEFAULT_SCENARIOS: Scenario[] = [
  {
    id: 'fintech_dispute',
    title: 'Card Dispute: Unauthorized Charge',
    description: 'A stressed cardholder finds an unknown $45 charge the day rent is due. Tests de-escalation, verification, and clear next steps.',
    difficulty: 'Intermediate',
    category: 'Fintech',
    customerName: 'Jordan Reynolds',
    persona: 'You are calling ApexPay card support. There is a forty five dollar charge from "CloudStream Pro" on your card that you never authorized. Your rent is due tomorrow morning and you cannot afford to lose that money. You want the charge reversed and the merchant blocked. If asked to verify, your card ends in 4417.',
    greeting: "Hi, I just saw a forty five dollar charge from CloudStream Pro on my ApexPay card and I never signed up for that. My rent is due tomorrow. I need this reversed.",
    keyterms: ['ApexPay', 'CloudStream Pro', 'chargeback', 'provisional credit', 'dispute'],
    voice: 'jane'
  },
  {
    id: 'ecommerce_delivery',
    title: 'Missing Birthday Gift Delivery',
    description: 'A parent\'s order shows "delivered" but nothing arrived, and the party is tomorrow. Tests ownership and recovery options.',
    difficulty: 'Standard',
    category: 'E-Commerce',
    customerName: 'Taylor Brooks',
    persona: 'You ordered a smartwatch from ShopNest for your daughter\'s birthday tomorrow. Tracking says it was delivered two hours ago but it is not on your porch and your neighbours have not seen it. Order number is SN 58213. You want it found or replaced before the party.',
    greeting: "Hello, my order says delivered two hours ago but there's nothing on my porch, and it's my daughter's birthday gift for tomorrow.",
    keyterms: ['ShopNest', 'smartwatch', 'tracking number', 'replacement', 'courier'],
    voice: 'michael'
  },
  {
    id: 'telecom_outage',
    title: 'Internet Outage Before a Board Meeting',
    description: 'A remote manager\'s fiber drops minutes before a board presentation. Tests calm troubleshooting under time pressure.',
    difficulty: 'Technical',
    category: 'Telecom',
    customerName: 'Alex Chen',
    persona: 'Your FiberLink internet went down fifteen minutes before a board meeting you are presenting at. The router shows a red LOS light. You are on a weak phone hotspot. You will follow troubleshooting steps if they are clear and fast. You want a working connection or a backup option now.',
    greeting: "My FiberLink internet just died and the router has a red light. I'm presenting to our board in fifteen minutes. I need this fixed now.",
    keyterms: ['FiberLink', 'LOS light', 'ONT', 'router', 'hotspot', 'technician'],
    voice: 'george'
  },
  {
    id: 'hotel_overbooking',
    title: 'Honeymoon Suite Double-Booked',
    description: 'Newlyweds arrive at midnight to find their suite given away. Tests apology, empathy, and offering meaningful alternatives.',
    difficulty: 'Advanced',
    category: 'Hospitality',
    customerName: 'Morgan Vance',
    persona: 'You booked the Ocean Penthouse at the Azure Bay Resort six months ago for your honeymoon. You just arrived at 11:30 PM after a fourteen hour flight and the desk says another guest is in your room. You are exhausted and upset. You want a genuine apology and a comparable room tonight.',
    greeting: "We just flew fourteen hours for our honeymoon and your front desk says our penthouse is occupied. This is unacceptable.",
    keyterms: ['Azure Bay', 'Ocean Penthouse', 'upgrade', 'suite', 'reservation'],
    voice: 'vera'
  },
  {
    id: 'it_no_signal',
    title: 'Level 1 IT: Monitor Shows No Signal',
    description: 'A new PC owner sees "No Signal" because the cable is in the wrong port. Tests step-by-step guidance for a non-technical caller.',
    difficulty: 'Beginner',
    category: 'Technical Support',
    customerName: 'Riley Park',
    persona: 'You just set up a new desktop PC. Fans and lights work but the monitor says "No Signal". The HDMI cable is plugged into the port near the USB ports at the top of the back panel (the motherboard), not the graphics card lower down. You are not technical: describe what you see simply and do exactly what you are told. When the cable is moved to the lower horizontal slot, the Windows logo appears.',
    greeting: "Hi, I just set up my new computer. The fans are running but the monitor just says No Signal.",
    keyterms: ['HDMI', 'graphics card', 'motherboard', 'No Signal', 'DisplayPort'],
    voice: 'alba'
  }
];
