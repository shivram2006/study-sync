/**
 * ROMANTIC THEME CONFIGURATION
 * ----------------------------
 * Personalized memories, anniversary counters, and romantic quotes.
 */

export const romanticConfig = {
  // App Titles & Headers
  appTitle: 'Forever & Always',
  romanticSubtitle: 'Our Secret Sanctuary',

  // Relationship start date for the special day counter
  relationshipStartDate: '2023-06-15T00:00:00Z',

  // Romantic header quote displayed under the top bar
  headerQuote: 'Not forever but always beautiful 🌸',

  // Curated personal memories
  memories: [
    {
      id: 'portrait',
      url: '/memories/memory-couple-portrait.jpg',
      title: 'Our Warmest Smiles',
      caption: 'Every moment with you is my favourite place to be.',
      tag: 'Us ✨'
    },
    {
      id: 'hearts',
      url: '/memories/memory-couple-hearts.jpg',
      title: 'Head on Shoulder',
      caption: 'Safe, warm, and peaceful right where I belong.',
      tag: 'Cozy 💖'
    },
    {
      id: 'hands-quote',
      url: '/memories/memory-hands-quote.jpg',
      title: 'Not Forever But Always Beautiful',
      caption: 'Cherishing every single heartbeat, laugh, and touch we share.',
      tag: 'Special 🌸'
    },
    {
      id: 'hands-interlocked',
      url: '/memories/memory-hands-interlocked.jpg',
      title: 'Holding Tight',
      caption: 'Hand in hand through whatever journey life brings.',
      tag: 'Promise 🤝'
    },
    {
      id: 'call-moment',
      url: '/memories/memory-call-moment.jpg',
      title: 'Midnight Calls & Sweet Kisses',
      caption: 'Distance fades away the second your face lights up my screen.',
      tag: 'Late Nights 🌙'
    }
  ],

  // Romantic Welcome Message displayed in private chatroom
  welcomeSection: {
    greeting: 'Hey, My Favourite Human! ❤️',
    message:
      'No matter how busy life gets, this little corner of the internet will always be ours.\n\nA place for random conversations, silly jokes, endless memories, and everything in between.\n\nI’m so glad it’s you.',
    signature: 'Forever Yours 🕊️',
    featuredPhoto: '/memories/memory-couple-portrait.jpg'
  },

  // Romantic Quick Reactions
  quickReactions: ['❤️', '😂', '🥺', '😘', '🔥', '🌸', '✨'],

  // Romantic Avatars (Users can pick these personalized memories in profile)
  presetAvatars: [
    {
      id: 'couple-portrait',
      name: 'Our Smile',
      url: '/memories/memory-couple-portrait.jpg'
    },
    {
      id: 'couple-hearts',
      name: 'Hearts & Warmth',
      url: '/memories/memory-couple-hearts.jpg'
    },
    {
      id: 'hands-quote',
      name: 'Always Beautiful',
      url: '/memories/memory-hands-quote.jpg'
    },
    {
      id: 'call-kiss',
      name: 'Sweet Kiss',
      url: '/memories/memory-call-moment.jpg'
    },
    {
      id: 'hands-interlocked',
      name: 'Holding Hands',
      url: '/memories/memory-hands-interlocked.jpg'
    }
  ],

  backgrounds: {
    chatWallpaper:
      'radial-gradient(circle at 10% 20%, rgba(255, 238, 242, 0.7) 0%, rgba(254, 242, 244, 0.4) 50%, rgba(255, 255, 255, 0.8) 100%)'
  }
};
