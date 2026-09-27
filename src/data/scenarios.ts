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
    greeting: "Yeah, hi. There's a forty five dollar charge on my ApexPay card from CloudStream Pro. I NEVER signed up for that! And my rent is due TOMORROW. I need it reversed. Today!",
    keyterms: ['ApexPay', 'CloudStream Pro', 'chargeback', 'provisional credit', 'dispute'],
    voice: 'jane',
    script: [
      'Thank the caller for calling ApexPay and give your name',
      'Verify identity: full name and the last four digits of the card',
      'Acknowledge the specific worry (the rent due tomorrow)',
      'Explain the dispute: provisional credit posts within two business days',
      'Block the merchant and offer a replacement card',
      'Give a dispute reference number',
      'Ask if there is anything else and close by thanking them for calling ApexPay'
    ]
  },
  {
    id: 'ecommerce_delivery',
    title: 'Missing Birthday Gift Delivery',
    description: 'A parent\'s order shows "delivered" but nothing arrived, and the party is tomorrow. Tests ownership and recovery options.',
    difficulty: 'Standard',
    category: 'E-Commerce',
    customerName: 'Taylor Brooks',
    persona: 'You ordered a smartwatch from ShopNest for your daughter\'s birthday tomorrow. Tracking says it was delivered two hours ago but it is not on your porch and your neighbours have not seen it. Order number is SN 58213. You want it found or replaced before the party.',
    greeting: "Your tracking says DELIVERED. Two hours ago! There is nothing on my porch. Nothing! That was my daughter's birthday gift, and the party is TOMORROW!",
    keyterms: ['ShopNest', 'smartwatch', 'tracking number', 'replacement', 'courier'],
    voice: 'jean',
    script: []
  },
  {
    id: 'telecom_outage',
    title: 'Internet Outage Before a Board Meeting',
    description: 'A remote manager\'s fiber drops minutes before a board presentation. Tests calm troubleshooting under time pressure.',
    difficulty: 'Technical',
    category: 'Telecom',
    customerName: 'Alex Chen',
    persona: 'Your FiberLink internet went down fifteen minutes before a board meeting you are presenting at. The router shows a red LOS light. You are on a weak phone hotspot. You will follow troubleshooting steps if they are clear and fast. You want a working connection or a backup option now.',
    greeting: "My FiberLink internet just DIED! Red light on the router. I'm presenting to our board in fifteen minutes. FIFTEEN! I need this fixed. Right now!",
    keyterms: ['FiberLink', 'LOS light', 'ONT', 'router', 'hotspot', 'technician'],
    voice: 'mary',
    script: []
  },
  {
    id: 'hotel_overbooking',
    title: 'Honeymoon Suite Double-Booked',
    description: 'Newlyweds arrive at midnight to find their suite given away. Tests apology, empathy, and offering meaningful alternatives.',
    difficulty: 'Advanced',
    category: 'Hospitality',
    customerName: 'Morgan Vance',
    persona: 'You booked the Ocean Penthouse at the Azure Bay Resort six months ago for your honeymoon. You just arrived at 11:30 PM after a fourteen hour flight and the desk says another guest is in your room. You are exhausted and upset. You want a genuine apology and a comparable room tonight.',
    greeting: "We just flew FOURTEEN hours for our honeymoon, and your front desk says our penthouse is taken? Taken! This is completely unacceptable!",
    keyterms: ['Azure Bay', 'Ocean Penthouse', 'upgrade', 'suite', 'reservation'],
    voice: 'vera',
    script: []
  },
  {
    id: 'it_no_signal',
    title: 'Level 1 IT: Monitor Shows No Signal',
    description: 'A new PC owner sees "No Signal" because the cable is in the wrong port. Tests step-by-step guidance for a non-technical caller.',
    difficulty: 'Beginner',
    category: 'Technical Support',
    customerName: 'Riley Park',
    persona: 'You just set up a new desktop PC. Fans and lights work but the monitor says "No Signal". The HDMI cable is plugged into the port near the USB ports at the top of the back panel (the motherboard), not the graphics card lower down. You are not technical: describe what you see simply and do exactly what you are told. When the cable is moved to the lower horizontal slot, the Windows logo appears.',
    greeting: "Okay, I just set up my new computer, the fans are running, and the monitor just says No Signal. Again! I've already lost an hour on this!",
    keyterms: ['HDMI', 'graphics card', 'motherboard', 'No Signal', 'DisplayPort'],
    voice: 'alba',
    script: []
  }
];
