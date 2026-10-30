/**
 * ROMANTIC THEME CONFIGURATION
 * ----------------------------
 * Easily customize text, anniversary counters, and images here.
 * You can replace placeholder URLs with your personal photographs.
 */

export const romanticConfig = {
  // App Titles & Headers
  appTitle: 'Forever & Always',
  romanticSubtitle: 'Our Secret Sanctuary',

  // Relationship start date for the special day counter (YYYY-MM-DD or ISO string)
  // Default is set to 2023-06-15, change to your actual special day!
  relationshipStartDate: '2023-06-15T00:00:00Z',

  // Romantic header quote displayed under the top bar
  headerQuote: 'Somewhere between hello and forever, I found my favourite person.',

  // Romantic Welcome Message displayed in a private chat
  welcomeSection: {
    greeting: 'Hey, My Favourite Human! ❤️',
    message:
      'No matter how busy life gets, this little corner of the internet will always be ours.\n\nA place for random conversations, silly jokes, little fights, endless memories, and everything in between.\n\nI’m so glad it’s you.',
    signature: 'Forever Yours 🕊️'
  },

  // Romantic Quick Reactions
  reactions: ['❤️', '😂', '🥺', '😘', '🔥', '🌸', '✨'],

  // Romantic Avatars (presets that users can pick during registration or in profile)
  presetAvatars: [
    {
      id: 'rose-blush',
      name: 'Rose Blush',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'golden-hour',
      name: 'Golden Hour',
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'gentle-smile',
      name: 'Gentle Smile',
      url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'starry-eyes',
      name: 'Starry Eyes',
      url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'warm-glow',
      name: 'Warm Glow',
      url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80'
    }
  ],

  // Background romantic art / illustration placeholders
  backgrounds: {
    chatWallpaper:
      'radial-gradient(circle at 10% 20%, rgba(255, 238, 242, 0.7) 0%, rgba(254, 242, 244, 0.4) 50%, rgba(255, 255, 255, 0.8) 100%)'
  }
};
