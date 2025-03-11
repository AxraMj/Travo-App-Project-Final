require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const Profile = require('../models/Profile');

const locations = [
  {
    name: 'Santorini, Greece',
    coordinates: { latitude: 36.3932, longitude: 25.4615 },
    description: 'Stunning sunset views over the Aegean Sea. The white-washed buildings create the perfect backdrop for any photo.',
    tips: [
      'Visit Oia Castle for the best sunset views',
      'Try the local wine tasting experiences',
      'Best time to visit is May to September'
    ],
    weather: { temp: 25, description: 'Sunny', icon: 'sun' }
  },
  {
    name: 'Kyoto, Japan',
    coordinates: { latitude: 35.0116, longitude: 135.7681 },
    description: 'Ancient temples and beautiful cherry blossoms. The perfect blend of tradition and natural beauty.',
    tips: [
      'Visit during cherry blossom season (late March to early April)',
      'Rent a kimono for authentic photos',
      'Try the matcha tea ceremonies'
    ],
    weather: { temp: 22, description: 'Partly Cloudy', icon: 'cloud-sun' }
  },
  {
    name: 'Machu Picchu, Peru',
    coordinates: { latitude: -13.1631, longitude: -72.5450 },
    description: 'The ancient Incan citadel set against the dramatic Andes mountains. A truly breathtaking experience.',
    tips: [
      'Book tickets well in advance',
      'Arrive early to avoid crowds',
      'Hire a local guide for the best experience'
    ],
    weather: { temp: 20, description: 'Clear', icon: 'sun' }
  },
  {
    name: 'Banff National Park, Canada',
    coordinates: { latitude: 51.4968, longitude: -115.9281 },
    description: 'Pristine lakes and majestic mountains create a paradise for nature lovers and photographers.',
    tips: [
      'Visit Lake Louise at sunrise',
      'Take the Banff Gondola for mountain views',
      'Watch for wildlife early morning or late evening'
    ],
    weather: { temp: 15, description: 'Clear', icon: 'sun' }
  },
  {
    name: 'Amalfi Coast, Italy',
    coordinates: { latitude: 40.6333, longitude: 14.6029 },
    description: 'Colorful cliffside villages and crystal-clear Mediterranean waters. A dream destination for photographers.',
    tips: [
      'Take a boat tour along the coast',
      'Visit during shoulder season (May or September)',
      'Try the local limoncello'
    ],
    weather: { temp: 24, description: 'Sunny', icon: 'sun' }
  },
  {
    name: 'Bali, Indonesia',
    coordinates: { latitude: -8.4095, longitude: 115.1889 },
    description: 'Tropical paradise with stunning temples, rice terraces, and beaches. Perfect for both adventure and relaxation.',
    tips: [
      'Visit Tegalalang Rice Terrace early morning',
      'Book a private driver for temple tours',
      'Try local warungs for authentic food'
    ],
    weather: { temp: 29, description: 'Tropical', icon: 'sun' }
  },
  {
    name: 'Cappadocia, Turkey',
    coordinates: { latitude: 38.6431, longitude: 34.8307 },
    description: 'Magical landscape of fairy chimneys and hot air balloons. A photographer\'s paradise at sunrise.',
    tips: [
      'Book a hot air balloon ride in advance',
      'Stay in a cave hotel for unique experience',
      'Visit the underground cities'
    ],
    weather: { temp: 23, description: 'Clear', icon: 'sun' }
  },
  {
    name: 'Northern Lights, Iceland',
    coordinates: { latitude: 64.9631, longitude: -19.0208 },
    description: 'The mesmerizing aurora borealis dancing across the Arctic sky. Nature\'s most spectacular light show.',
    tips: [
      'Visit between September and March',
      'Check aurora forecast before heading out',
      'Bring warm clothes and tripod for photos'
    ],
    weather: { temp: -2, description: 'Clear Night', icon: 'moon' }
  },
  {
    name: 'Great Barrier Reef, Australia',
    coordinates: { latitude: -18.2871, longitude: 147.6992 },
    description: 'World\'s largest coral reef system. Vibrant marine life and crystal-clear waters.',
    tips: [
      'Best diving conditions from June to October',
      'Take an eco-friendly tour',
      'Visit the Whitsunday Islands'
    ],
    weather: { temp: 27, description: 'Sunny', icon: 'sun' }
  },
  {
    name: 'Sahara Desert, Morocco',
    coordinates: { latitude: 31.7917, longitude: -7.0926 },
    description: 'Endless golden dunes under starlit skies. Experience the magic of the desert.',
    tips: [
      'Take a camel trek to the camp',
      'Stay overnight in a desert camp',
      'Watch sunrise over the dunes'
    ],
    weather: { temp: 35, description: 'Clear', icon: 'sun' }
  },
  {
    name: 'Angkor Wat, Cambodia',
    coordinates: { latitude: 13.4125, longitude: 103.8670 },
    description: 'Ancient temple complex showcasing incredible Khmer architecture. Spiritual and mystical atmosphere.',
    tips: [
      'Start early for sunrise photos',
      'Hire a knowledgeable guide',
      'Buy a multi-day pass'
    ],
    weather: { temp: 30, description: 'Partly Cloudy', icon: 'cloud-sun' }
  },
  {
    name: 'Cinque Terre, Italy',
    coordinates: { latitude: 44.1461, longitude: 9.6439 },
    description: 'Five colorful coastal villages connected by scenic hiking trails. Mediterranean charm at its best.',
    tips: [
      'Take the hiking trail between villages',
      'Try the local seafood',
      'Buy a Cinque Terre Card for trains'
    ],
    weather: { temp: 24, description: 'Sunny', icon: 'sun' }
  },
  {
    name: 'Zhangjiajie, China',
    coordinates: { latitude: 29.1170, longitude: 110.4794 },
    description: 'Towering sandstone pillars that inspired Avatar\'s floating mountains. Breathtaking natural scenery.',
    tips: [
      'Take the glass elevator for amazing views',
      'Visit in off-peak season',
      'Allow at least 2-3 days to explore'
    ],
    weather: { temp: 20, description: 'Misty', icon: 'cloud' }
  }
];

const images = [
  'https://picsum.photos/id/1015/1000',
  'https://picsum.photos/id/1016/1000',
  'https://picsum.photos/id/1018/1000',
  'https://picsum.photos/id/1019/1000',
  'https://picsum.photos/id/1022/1000',
  'https://picsum.photos/id/1029/1000',
  'https://picsum.photos/id/1033/1000',
  'https://picsum.photos/id/1036/1000',
  'https://picsum.photos/id/1039/1000',
  'https://picsum.photos/id/1043/1000',
  'https://picsum.photos/id/1044/1000',
  'https://picsum.photos/id/1045/1000',
  'https://picsum.photos/id/1047/1000',
  'https://picsum.photos/id/1048/1000',
  'https://picsum.photos/id/1049/1000',
  'https://picsum.photos/id/1050/1000',
  'https://picsum.photos/id/1051/1000',
  'https://picsum.photos/id/1052/1000',
  'https://picsum.photos/id/1053/1000',
  'https://picsum.photos/id/1054/1000'
];

async function createPosts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all creators
    const creators = await User.find({ accountType: 'creator' });
    console.log(`Found ${creators.length} creators`);

    for (const creator of creators) {
      try {
        console.log(`Creating posts for ${creator.username}`);
        
        // Each creator gets 3-5 random posts
        const numPosts = Math.floor(Math.random() * 3) + 3; // 3-5 posts
        
        for (let i = 0; i < numPosts; i++) {
          // Get random location and image
          const location = locations[Math.floor(Math.random() * locations.length)];
          const image = images[Math.floor(Math.random() * images.length)];

          const post = new Post({
            userId: creator._id,
            image,
            description: `${location.description}\n\nExploring the beauty of ${location.name}. ${location.tips[0]}`,
            location: {
              name: location.name,
              coordinates: location.coordinates
            },
            weather: location.weather,
            travelTips: location.tips
          });

          await post.save();

          // Update creator's post count
          await Profile.findOneAndUpdate(
            { userId: creator._id },
            { $inc: { 'stats.totalPosts': 1 } }
          );

          console.log(`Created post for ${creator.username} at ${location.name}`);
        }
      } catch (error) {
        console.error(`Error creating posts for ${creator.username}:`, error.message);
      }
    }

    console.log('Finished creating posts');
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createPosts(); 